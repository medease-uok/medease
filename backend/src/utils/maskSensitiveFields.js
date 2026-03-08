/**
 * Field-level data masking for sensitive patient and staff data.
 * Applies role-based redaction so viewers only see what they need.
 */

/** Mask a phone number: show last 4 digits only. e.g. "+94771234567" → "•••••••4567" */
function maskPhone(val) {
  if (!val || val.length < 4) return '••••';
  return '•'.repeat(val.length - 4) + val.slice(-4);
}

/** Mask an email: show first 2 chars of local part + domain. e.g. "john.doe@x.com" → "jo***@x.com" */
function maskEmailField(val) {
  if (!val) return '••••';
  const at = val.lastIndexOf('@');
  if (at < 1) return '***@***';
  const local = val.slice(0, at);
  const domain = val.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** Mask a string partially: show first 2 and last 2 chars. e.g. "SLIC-HI-2024-08932" → "SL••••••••••••32" */
function maskPartial(val) {
  if (!val) return '••••';
  const s = String(val);
  if (s.length <= 4) return '••••';
  return s.slice(0, 2) + '•'.repeat(s.length - 4) + s.slice(-2);
}

/** Fully redact a field */
function redact() {
  return '[REDACTED]';
}

/**
 * Masking rules for sensitive fields.
 *
 * fullAccessRoles: roles that see the unmasked value.
 * ownerCanSeeAll:  if true, the resource owner always sees the full value.
 * mask:            masking function to apply when access is restricted.
 */
const MASKING_RULES = {
  phone:                 { mask: maskPhone,      fullAccessRoles: ['admin'],           ownerCanSeeAll: true },
  email:                 { mask: maskEmailField,  fullAccessRoles: ['admin'],           ownerCanSeeAll: true },
  emergencyContact:      { mask: maskPartial,    fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
  emergencyPhone:        { mask: maskPhone,      fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
  emergencyRelationship: { mask: redact,         fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
  address:               { mask: redact,         fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
  insurancePolicyNumber: { mask: maskPartial,    fullAccessRoles: ['admin'],           ownerCanSeeAll: true },
  insuranceProvider:     { mask: null,           fullAccessRoles: ['admin', 'doctor', 'nurse'], ownerCanSeeAll: true },
  insurancePlanType:     { mask: null,           fullAccessRoles: ['admin', 'doctor', 'nurse'], ownerCanSeeAll: true },
  insuranceExpiryDate:   { mask: null,           fullAccessRoles: ['admin', 'doctor', 'nurse'], ownerCanSeeAll: true },
  organDonorCardNo:      { mask: maskPartial,    fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
  licenseNumber:         { mask: maskPartial,    fullAccessRoles: ['admin'],           ownerCanSeeAll: true },
};

/**
 * Apply masking rules to a data object (or array of objects).
 *
 * @param {Object|Array} data     - The mapped data to mask.
 * @param {string}       viewerRole  - The role of the user viewing the data.
 * @param {boolean}      isOwner     - Whether the viewer owns this resource.
 * @returns {Object|Array} A new copy with sensitive fields masked as appropriate.
 */
function maskSensitiveFields(data, viewerRole, isOwner = false) {
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveFields(item, viewerRole, isOwner));
  }

  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };

  for (const [field, rule] of Object.entries(MASKING_RULES)) {
    if (!(field in masked) || masked[field] == null) continue;

    // Owner always sees their own data
    if (rule.ownerCanSeeAll && isOwner) continue;

    // Full-access roles see unmasked
    if (rule.fullAccessRoles.includes(viewerRole)) continue;

    // Apply masking
    if (rule.mask) {
      masked[field] = rule.mask(masked[field]);
    } else {
      // null mask means hide entirely for non-authorized roles
      masked[field] = null;
    }
  }

  return masked;
}

module.exports = { maskSensitiveFields, MASKING_RULES };
