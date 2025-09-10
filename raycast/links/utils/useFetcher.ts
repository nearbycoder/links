import { getPreferenceValues } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { BASE_URL } from "../constants";

export const useFetcher = <T = unknown>(endpoint: string, options: object = {}) => {
  const preferences = getPreferenceValues<{ apiKey: string }>();

  return useFetch<T>(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "x-api-key": preferences.apiKey,
      ...(options as any)?.headers,
    },
  });
};
