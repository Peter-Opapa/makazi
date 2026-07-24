export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/** Implemented against any S3-compatible object store today (see S3StorageService); swap the implementation for a non-S3-compatible provider (GCS, Azure Blob) without touching callers. */
export interface StorageGateway {
  createPresignedUploadUrl(keyPrefix: string, contentType: string): Promise<PresignedUpload>;
  publicUrlFor(key: string): string;
  /** For content the server generates itself (e.g. move-out reports, CSV exports) — no presigning needed. */
  putObject(keyPrefix: string, body: string, contentType: string): Promise<string>;
  deleteObjectByUrl(url: string): Promise<void>;
}
export const STORAGE_GATEWAY = Symbol("STORAGE_GATEWAY");
