import { createContext, useContext } from "@gensx/core";

import { Namespace, SearchStorage } from "./types.js";

/**
 * Create the search context
 */
export const SearchContext = createContext<SearchStorage | null>(null);

/**
 * Hook to access the search instance
 * @returns The search instance
 * @throws Error if used outside of a SearchProvider
 */
export function useSearchStorage(): SearchStorage {
  const search = useContext(SearchContext);

  if (!search) {
    throw new Error(
      "useSearchStorage must be used within a SearchProvider. Wrap your component tree with a SearchProvider.",
    );
  }

  return search;
}

/**
 * Hook to access a search namespace
 * @param name The name of the namespace to access
 * @returns A namespace object for the given name
 * @throws Error if used outside of a SearchProvider
 */
export async function useSearch(name: string): Promise<Namespace> {
  const search = useSearchStorage();
  // Only ensure the database if it hasn't been ensured before
  if (!search.hasEnsuredNamespace(name)) {
    await search.ensureNamespace(name);
  }
  return search.getNamespace(name);
}
