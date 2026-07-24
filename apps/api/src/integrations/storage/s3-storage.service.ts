import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import type { PresignedUpload, StorageGateway } from "./storage-gateway.types";

/**
 * Thin wrapper around any S3-compatible object store (AWS S3, Cloudflare R2,
 * MinIO, DigitalOcean Spaces) — swapping between them is a config change,
 * not a code change, since they all speak the same S3 API. Uploads go
 * directly from the browser to the bucket via a presigned PUT URL — this
 * service never sees file bytes.
 */
@Injectable()
export class S3StorageService implements StorageGateway {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.publicUrlBase = this.config.getOrThrow<string>("S3_PUBLIC_URL_BASE").replace(/\/+$/, "");
    this.client = new S3Client({
      region: this.config.get<string>("S3_REGION", "auto"),
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      forcePathStyle: this.config.get<string>("S3_FORCE_PATH_STYLE") === "true",
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("S3_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  async createPresignedUploadUrl(keyPrefix: string, contentType: string): Promise<PresignedUpload> {
    const key = `${keyPrefix}/${randomUUID()}`;
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return { uploadUrl, key, publicUrl: this.publicUrlFor(key) };
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrlBase}/${key}`;
  }

  async putObject(keyPrefix: string, body: string, contentType: string): Promise<string> {
    const key = `${keyPrefix}/${randomUUID()}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    return this.publicUrlFor(key);
  }

  async deleteObjectByUrl(url: string): Promise<void> {
    if (!url.startsWith(this.publicUrlBase)) return;
    const key = url.slice(this.publicUrlBase.length + 1);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
