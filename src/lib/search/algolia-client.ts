import { liteClient as algoliasearch } from "algoliasearch/lite";

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";

if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
  console.warn("Algolia credentials missing in environment variables.");
}

export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

export const INDEX_NAME = "activity_notes_unified";
