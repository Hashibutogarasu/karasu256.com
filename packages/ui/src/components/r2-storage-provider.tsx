'use client';

import * as React from 'react';
import { uploadImage } from '@Hashibutogarasu/utils/client';

interface R2StorageContextValue {
  imageApiUrl: string;
}

const R2StorageContext = React.createContext<R2StorageContextValue | null>(null);

export interface R2StorageProviderProps {
  /** Base URL of the image API Worker backing R2 storage, e.g. `https://cdn.karasu256.com`. */
  imageApiUrl: string;
  children: React.ReactNode;
}

/** Supplies the image API base URL to `useR2Storage` for every descendant. */
export function R2StorageProvider({ imageApiUrl, children }: R2StorageProviderProps) {
  const value = React.useMemo(() => ({ imageApiUrl }), [imageApiUrl]);
  return <R2StorageContext.Provider value={value}>{children}</R2StorageContext.Provider>;
}

export interface UseR2StorageResult {
  imageApiUrl: string;
  uploading: boolean;
  /**
   * Resolves with the uploaded file's public URL, or `null` if the upload
   * failed for any reason, including a network or CORS error.
   *
   * @param path - Explicit storage key (e.g. `users/{uid}/avatar.png`). When
   * omitted, the server generates one under the caller's own namespace.
   */
  upload: (file: File, path?: string) => Promise<string | null>;
}

/**
 * Returns the R2-backed image API base URL supplied by the nearest
 * `R2StorageProvider`, along with an `upload` action. Throws when rendered
 * outside one.
 */
export function useR2Storage(): UseR2StorageResult {
  const ctx = React.useContext(R2StorageContext);
  if (!ctx) throw new Error('useR2Storage must be used within an R2StorageProvider');
  const [uploading, setUploading] = React.useState(false);

  const upload = React.useCallback(
    async (file: File, path?: string): Promise<string | null> => {
      setUploading(true);
      try {
        return await uploadImage(file, { apiUrl: ctx.imageApiUrl, path });
      } finally {
        setUploading(false);
      }
    },
    [ctx.imageApiUrl]
  );

  return { imageApiUrl: ctx.imageApiUrl, uploading, upload };
}
