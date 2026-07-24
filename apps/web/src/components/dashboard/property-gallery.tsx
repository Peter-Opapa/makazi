"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { confirmPropertyPhoto, deletePropertyPhoto, presignPropertyPhoto, uploadFileDirect, type PropertyPhoto } from "@/lib/properties";
import { InlineError } from "@/components/shared/inline-error";

export function PropertyGallery({
  propertyId,
  photos,
  onChange,
}: {
  propertyId: string;
  photos: PropertyPhoto[];
  onChange: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const { uploadUrl, key } = await presignPropertyPhoto(propertyId, file.type);
      await uploadFileDirect(uploadUrl, file);
      await confirmPropertyPhoto(propertyId, key);
      toast("Photo added.");
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: PropertyPhoto) {
    try {
      await deletePropertyPhoto(propertyId, photo.id);
      toast("Photo removed.");
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that photo. Please try again.");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-sm">Gallery ({photos.length})</span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-[1.5px] border-[var(--line-2)] rounded-[9px] px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Add photo"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelected} className="hidden" />
      </div>

      {error && <InlineError icon={false}>{error}</InlineError>}

      {photos.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-14 px-5 text-center">
          <p className="text-sm text-[var(--stone)]">No photos yet.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-[12px] overflow-hidden border border-[var(--line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Property" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(photo)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
