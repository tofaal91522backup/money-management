import type { QueryClient } from "@tanstack/react-query"

export function refreshAppData(queryClient: QueryClient) {
  return queryClient.invalidateQueries()
}
