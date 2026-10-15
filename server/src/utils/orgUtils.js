/**
 * Organization Name & Slug Normalization Utilities
 * Enforces consistent organization naming rules and deterministic slug generation across FlowSync.
 */

const MIN_ORG_NAME_LENGTH = 2;
const MAX_ORG_NAME_LENGTH = 50;

/**
 * Normalizes an organization name:
 * 1. Trims leading and trailing whitespace.
 * 2. Collapses consecutive whitespace characters into a single space.
 * 3. Preserves display casing.
 * 
 * @param {string} rawName 
 * @returns {string}
 */
const normalizeOrgName = (rawName) => {
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
const generateOrgSlug = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Validates and normalizes organization input.
 * 
 * @param {string} name 
 * @returns {{ isValid: boolean, error?: string, normalizedName: string, slug: string }}
 */
const validateOrgName = (name) => {
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

module.exports = {
  MIN_ORG_NAME_LENGTH,
  MAX_ORG_NAME_LENGTH,
  normalizeOrgName,
  generateOrgSlug,
  validateOrgName,
};
