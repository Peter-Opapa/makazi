import { Controller, Get, Put, Query, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { createReadStream } from "fs";
import { LocalDiskStorageService } from "./local-disk-storage.service";

/**
 * Backs LocalDiskStorageService's presigned-upload/public-read URLs when no
 * real S3-compatible provider is configured (see IntegrationsModule). No
 * JwtAuthGuard: uploads are authorized by the signed token from
 * createPresignedUploadUrl instead (mirrors how a real S3 presigned PUT
 * needs no app-level session), and reads are meant to be public, same as a
 * public S3 bucket would be.
 */
@Controller("storage")
export class LocalStorageController {
  constructor(private readonly storage: LocalDiskStorageService) {}

  @Put("uploads")
  async upload(
    @Query("key") key: string,
    @Query("contentType") contentType: string,
    @Query("expires") expires: string,
    @Query("token") token: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    if (!key || !contentType || !expires || !token) throw new UnauthorizedException("Missing upload parameters");
    if (!this.storage.verifyUploadToken(key, contentType, Number(expires), token)) {
      throw new UnauthorizedException("Invalid or expired upload URL");
    }
    await this.storage.writeStreamToKey(key, contentType, req);
    return { ok: true };
  }

  @Get("files")
  async read(@Query("key") key: string, @Res() res: Response): Promise<void> {
    const file = await this.storage.readByKey(key);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    createReadStream(file.path).pipe(res);
  }
}
