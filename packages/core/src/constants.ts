export const USER_ROLES = [
  "student",
  "instructor",
  "owner",
  "superadmin",
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024,
} as const;
