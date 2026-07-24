import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { createWriteStream } from "fs";
import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import { dirname, join, normalize, resolve, sep } from "path";
import type { PresignedUpload, StorageGateway } from "./storage-gateway.types";

const UPLOAD_TTL_MS = 5 * 60 * 1000;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * Fallback for when no real S3-compatible provider is configured (see
 * IntegrationsModule) — writes to a local disk directory instead, meant to
 * sit on a Railway Volume mounted at LOCAL_STORAGE_DIR. There's no AWS
 * SigV4 to lean on for a "presigned" upload URL here, so uploads are
 * authorized with an HMAC over key+contentType+expiry (signed with
 * JWT_SECRET) instead — verified by LocalStorageController before it
 * accepts the PUT.
 */
@Injectable()
export class LocalDiskStorageService implements StorageGateway {
  constructor(private readonly config: ConfigService) {}

  private get rootDir(): string {
    return resolve(this.config.get<string>("LOCAL_STORAGE_DIR", "./uploads"));
  }

  private get publicUrlBase(): string {
    const base = this.config.get<string>("LOCAL_STORAGE_PUBLIC_URL", `http://localhost:${this.config.get<number>("PORT", 4000)}`);
    return `${base.replace(/\/+$/, "")}/api/storage`;
  }

  private sign(key: string, contentType: string, expires: number): string {
    return createHmac("sha256", this.config.getOrThrow<string>("JWT_SECRET"))
      .update(`${key}:${contentType}:${expires}`)
      .digest("hex");
  }

  /** Rejects any key that would resolve outside rootDir (path traversal). */
  private absolutePathFor(key: string): string {
    if (!key || key.includes("\0")) throw new BadRequestException("Invalid storage key");
    const root = this.rootDir;
    const target = normalize(join(root, key));
    if (target !== root && !target.startsWith(root + sep)) {
      throw new BadRequestException("Invalid storage key");
    }
    return target;
  }

  async createPresignedUploadUrl(keyPrefix: string, contentType: string): Promise<PresignedUpload> {
    const key = `${keyPrefix}/${randomUUID()}`;
    const expires = Date.now() + UPLOAD_TTL_MS;
    const token = this.sign(key, contentType, expires);
    const query = new URLSearchParams({ key, contentType, expires: String(expires), token });
    return { uploadUrl: `${this.publicUrlBase}/uploads?${query.toString()}`, key, publicUrl: this.publicUrlFor(key) };
  }

  /** Used by LocalStorageController to authorize an incoming PUT before writing it to disk. */
  verifyUploadToken(key: string, contentType: string, expires: number, token: string): boolean {
    if (!Number.isFinite(expires) || Date.now() > expires) return false;
    const expected = Buffer.from(this.sign(key, contentType, expires), "utf-8");
    const actual = Buffer.from(token, "utf-8");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  /** Streams the incoming request body to disk, enforcing a size cap. Used by LocalStorageController. */
  async writeStreamToKey(key: string, contentType: string, source: NodeJS.ReadableStream): Promise<void> {
    const path = this.absolutePathFor(key);
    await mkdir(dirname(path), { recursive: true });
    const dest = createWriteStream(path);
    let total = 0;
    try {
      await new Promise<void>((resolvePromise, reject) => {
        source.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_UPLOAD_BYTES) {
            source.removeAllListeners();
            dest.destroy();
            reject(new PayloadTooLargeException(`File exceeds ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit`));
          }
        });
        source.on("error", reject);
        dest.on("error", reject);
        dest.on("finish", () => resolvePromise());
        source.pipe(dest);
      });
    } catch (err) {
      await rm(path, { force: true }).catch(() => undefined);
      throw err;
    }
    await writeFile(`${path}.meta.json`, JSON.stringify({ contentType }));
  }

  /** Used by LocalStorageController to serve a GET request. */
  async readByKey(key: string): Promise<{ path: string; contentType: string }> {
    const path = this.absolutePathFor(key);
    try {
      await stat(path);
    } catch {
      throw new NotFoundException("File not found");
    }
    let contentType = "application/octet-stream";
    try {
      const meta = JSON.parse(await readFile(`${path}.meta.json`, "utf-8"));
      if (typeof meta.contentType === "string") contentType = meta.contentType;
    } catch {
      // No sidecar (e.g. an older object) — serve as a generic binary.
    }
    return { path, contentType };
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrlBase}/files?key=${encodeURIComponent(key)}`;
  }

  async putObject(keyPrefix: string, body: string, contentType: string): Promise<string> {
    const key = `${keyPrefix}/${randomUUID()}`;
    const path = this.absolutePathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body, "utf-8");
    await writeFile(`${path}.meta.json`, JSON.stringify({ contentType }));
    return this.publicUrlFor(key);
  }

  async deleteObjectByUrl(url: string): Promise<void> {
    let key: string | null;
    try {
      key = new URL(url).searchParams.get("key");
    } catch {
      return;
    }
    if (!key) return;
    const path = this.absolutePathFor(key);
    await rm(path, { force: true }).catch(() => undefined);
    await rm(`${path}.meta.json`, { force: true }).catch(() => undefined);
  }
}
