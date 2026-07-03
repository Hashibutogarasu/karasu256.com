"use client";

import { useCallback, useState } from "react";
import { useImageUploadApiUrl } from "./context";

export interface UseImageUploadResult {
  uploading: boolean;
  /**
   * Resolves with the uploaded file's public URL, or `null` if the upload
   * failed for any reason, including a network or CORS error.
   *
   * @param _path - Explicit storage key (e.g. `users/{uid}/avatar.png`). When
   * omitted, the server generates one under the caller's own namespace.
   */
  upload: (_file: File, _path?: string) => Promise<string | null>;
}

/**
 * Uploads a file to the image API and resolves with its public URL, tracking
 * an `uploading` flag scoped to this hook instance for the duration of the
 * request.
 */
export function useImageUpload(): UseImageUploadResult {
  const apiUrl = useImageUploadApiUrl();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File, path?: string): Promise<string | null> => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        if (path) form.append("path", path);
        const res = await fetch(`${apiUrl}/upload`, {
          method: "POST",
          body: form,
          credentials: "include",
        });
        if (!res.ok) return null;
        const { url } = (await res.json()) as { url: string };
        return url;
      } catch {
        return null;
      } finally {
        setUploading(false);
      }
    },
    [apiUrl],
  );

  return { uploading, upload };
}
