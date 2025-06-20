"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BlogPost, BlogsResponse, UseBlogsOptions } from "@/types/microcms";
import { fetchMicroCMSWithAPIKey } from "@/utils/microcmsUtils";

export function useBlogs(options?: UseBlogsOptions) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const apiKeyRef = useRef<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    let isMounted = true;
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchMicroCMSWithAPIKey<BlogsResponse>(
        "/api/microcms/blogs",
        {
          limit: options?.limit,
          offset: options?.offset,
          filters: options?.filters,
        },
        apiKeyRef,
        controller.signal,
      );

      if (isMounted) {
        setBlogs(response.contents);
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
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [options?.limit, options?.offset, options?.filters]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    fetchBlogs().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [fetchBlogs]);

  return {
    blogs,
    isLoading,
    error,
    totalCount,
  };
}
