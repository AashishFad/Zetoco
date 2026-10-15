/**
 * FlowSync Organization Utilities (Client)
 * Enforces consistent organization naming rules and automatic slug generation on the frontend.
 */

export const MIN_ORG_NAME_LENGTH = 2;
export const MAX_ORG_NAME_LENGTH = 50;

/**
 * Normalizes an organization name:
 * 1. Trims leading and trailing whitespace.
 * 2. Collapses consecutive whitespace characters into a single space.
 * 3. Preserves original casing format for display.
 * 
 * @param {string} rawName 
 * @returns {string}
 */
export const normalizeOrgName = (rawName) => {
  if (typeof rawName !== 'string') return '';
  return rawName.trim().replace(/\s+/g, ' ');
};

/**
 * Generates a clean URL-friendly slug from an organization name:
 * 1. Converts to lowercase.
 * 2. Replaces all unsupported characters and whitespace with hyphens.
 * 3. Strips consecutive and edge hyphens.
 * 
 * @param {string} name 
 * @returns {string}
 */
export const generateOrgSlug = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Validates organization name input before submission.
 * 
 * @param {string} name 
 * @returns {{ isValid: boolean, error?: string, normalizedName: string, slug: string }}
 */
export const validateOrgName = (name) => {
  const normalizedName = normalizeOrgName(name);

  if (!normalizedName) {
    return {
      isValid: false,
      error: 'Organization name is required.',
      normalizedName: '',
      slug: '',
    };
  }

  if (normalizedName.length < MIN_ORG_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Organization name must be at least ${MIN_ORG_NAME_LENGTH} characters long.`,
      normalizedName,
      slug: '',
    };
  }

  if (normalizedName.length > MAX_ORG_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Organization name cannot exceed ${MAX_ORG_NAME_LENGTH} characters.`,
      normalizedName,
      slug: '',
    };
  }

  const slug = generateOrgSlug(normalizedName);
  if (!slug) {
    return {
      isValid: false,
      error: 'Organization name must contain at least one alphanumeric character.',
      normalizedName,
      slug: '',
    };
  }

  return {
    isValid: true,
    normalizedName,
    slug,
  };
};
