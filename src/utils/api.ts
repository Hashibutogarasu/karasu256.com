export async function fetchAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} - ${
          errorData.message || response.statusText
        }`,
      );
    }

    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    console.error("Fetch API Error:", error);
    throw error;
  }
}

export async function getAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  return fetchAPI<T>(url, {
    method: "GET",
    ...options,
  });
}

export async function postAPI<T, D = Record<string, unknown>>(
  url: string,
  data: D,
  options?: RequestInit,
): Promise<T> {
  return fetchAPI<T>(url, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
}

export async function putAPI<T>(
  url: string,
  data: any,
  options?: RequestInit,
): Promise<T> {
  return fetchAPI<T>(url, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
}

export async function deleteAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  return fetchAPI<T>(url, {
    method: "DELETE",
    ...options,
  });
}
