import { useMicroCMSAPIKey } from "@/hooks/useServerEnv";
import { getAPI } from "./api";

export async function fetchMicroCMSWithAPIKey<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  apiKeyRef: { current: string | null } | null = null,
  signal?: AbortSignal,
): Promise<T> {
  let apiKey = apiKeyRef?.current;

  if (!apiKey) {
    apiKey = await useMicroCMSAPIKey();
    if (apiKeyRef) {
      apiKeyRef.current = apiKey;
    }
  }

  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlParams.append(key, String(value));
    }
  });

  const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";
  const url = `${endpoint}${queryString}`;

  return await getAPI<T>(url, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
    },
    signal,
  });
}
