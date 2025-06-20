import { useEffect, useRef, useState } from "react";
import { fetchMicroCMSWithAPIKey } from "@/utils/microcmsUtils";
import { BlogPost } from "@/types/microcms";

interface UseBlogParams {
  contentId: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

export const useBlog = ({
  contentId,
  onLoadStart,
  onLoadComplete,
}: UseBlogParams) => {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const apiKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!contentId) return;

    const controller = new AbortController();
    let isMounted = true;

    const fetchBlog = async () => {
      setIsLoading(true);
      if (onLoadStart) {
        onLoadStart();
      }
      setError(null);
      try {
        const response = await fetchMicroCMSWithAPIKey<BlogPost>(
          `/api/microcms/blogs/${contentId}`,
          {},
          apiKeyRef,
          controller.signal,
        );

        if (isMounted) {
          setBlog(response);
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
          if (onLoadComplete) {
            onLoadComplete();
          }
        }
      }
    };

    fetchBlog();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [contentId, onLoadStart, onLoadComplete]);

  return {
    blog,
    isLoading,
    error,
  };
};
