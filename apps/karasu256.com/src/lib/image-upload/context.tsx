"use client";

import { createContext, useContext, type ReactNode } from "react";

const ImageUploadApiUrlContext = createContext<string | null>(null);

/**
 * Provides the image upload API base URL to `useImageUpload` for every
 * descendant, so consumers never read `NEXT_PUBLIC_IMAGE_API_URL` directly.
 */
export function ImageUploadProvider({ children }: { children: ReactNode }) {
  const apiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL ?? "";
  return (
    <ImageUploadApiUrlContext.Provider value={apiUrl}>
      {children}
    </ImageUploadApiUrlContext.Provider>
  );
}

/**
 * Returns the image upload API base URL supplied by the nearest
 * `ImageUploadProvider`. Throws when rendered outside one.
 */
export function useImageUploadApiUrl(): string {
  const apiUrl = useContext(ImageUploadApiUrlContext);
  if (apiUrl === null) {
    throw new Error("useImageUploadApiUrl must be used within an ImageUploadProvider");
  }
  return apiUrl;
}
