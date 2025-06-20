"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Category } from "@/types/microcms";
import { fetchMicroCMSWithAPIKey } from "@/utils/microcmsUtils";
import { useCircularProgress } from "./useCircularProgress";

export function useCategory(categoryId: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { startLoading, stopLoading } = useCircularProgress(false);

  const apiKeyRef = useRef<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return () => {};

    let isMounted = true;
    const controller = new AbortController();

    setIsLoading(true);
    startLoading();
    setError(null);

    try {
      const response = await fetchMicroCMSWithAPIKey<Category>(
        `/api/microcms/categories/${categoryId}`,
        {},
        apiKeyRef,
        controller.signal,
      );

      if (isMounted) {
        setCategory(response);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError" && isMounted) {
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred"),
        );
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
        stopLoading();
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [categoryId, startLoading, stopLoading]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    fetchCategory().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [fetchCategory]);

  return {
    category,
    isLoading,
    error,
  };
}

export default useCategory;
