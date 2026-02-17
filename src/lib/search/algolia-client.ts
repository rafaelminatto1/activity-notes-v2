import { liteClient as algoliasearch } from "algoliasearch/lite";

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export const isAlgoliaConfigured = Boolean(ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY);

if (!isAlgoliaConfigured) {
  console.warn("Algolia credentials missing in environment variables.");
}

export const searchClient = isAlgoliaConfigured
  ? algoliasearch(ALGOLIA_APP_ID!, ALGOLIA_SEARCH_KEY!)
  : null;

export const INDEX_NAME = "activity_notes_unified";
