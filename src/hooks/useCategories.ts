"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Category } from "@/types/microcms";
import { fetchMicroCMSWithAPIKey } from "@/utils/microcmsUtils";
import useCircularProgress from "./useCircularProgress";

interface CategoriesResponse {
  contents: Category[];
  totalCount: number;
  offset: number;
  limit: number;
}

interface UseCategoriesOptions {
  limit?: number;
  offset?: number;
}

export function useCategories(options?: UseCategoriesOptions) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { startLoading, stopLoading } = useCircularProgress(false);

  const apiKeyRef = useRef<string | null>(null);

  const fetchCategories = useCallback(async () => {
    let isMounted = true;
    const controller = new AbortController();

    setIsLoading(true);
    startLoading();
    setError(null);

    try {
      const response = await fetchMicroCMSWithAPIKey<CategoriesResponse>(
        "/api/microcms/categories",
        {
          limit: options?.limit,
          offset: options?.offset,
        },
        apiKeyRef,
        controller.signal,
      );

      if (isMounted) {
        setCategories(response.contents);
        setTotalCount(response.totalCount);
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
  }, [options?.limit, options?.offset, startLoading, stopLoading]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    fetchCategories().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    totalCount,
  };
}

export default useCategories;
