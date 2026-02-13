export const APP_NAME = "Activity Notes";

export const DEFAULT_DOCUMENT = {
  title: "Sem título",
  content: null,
  plainText: "",
  icon: "",
  coverImage: "",
  isArchived: false,
  isPublished: false,
  position: 0,
  childCount: 0,
};

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_DEFAULT_WIDTH = 280;

export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const SEARCH_DEBOUNCE_MS = 300;
