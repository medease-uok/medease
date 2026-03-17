function maskPhone(val) {
  if (!val || val.length < 4) return '••••';
  return '•'.repeat(val.length - 4) + val.slice(-4);
}

function maskEmailField(val) {
  if (!val) return '••••';
  const at = val.lastIndexOf('@');
  if (at < 1) return '***@***';
  const local = val.slice(0, at);
  const domain = val.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function maskPartial(val) {
  if (!val) return '••••';
  const s = String(val);
  if (s.length <= 4) return '••••';
  return s.slice(0, 2) + '•'.repeat(s.length - 4) + s.slice(-2);
}

function redact() {
  return '[REDACTED]';
}

const MASKING_RULES = {
  phone:                 { mask: maskPhone,      fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
  email:                 { mask: maskEmailField,  fullAccessRoles: ['admin', 'doctor'], ownerCanSeeAll: true },
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

function maskSensitiveFields(data, viewerRole, isOwner = false) {
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveFields(item, viewerRole, isOwner));
  }

  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };

  for (const [field, rule] of Object.entries(MASKING_RULES)) {
    if (!(field in masked) || masked[field] == null) continue;
    if (rule.ownerCanSeeAll && isOwner) continue;
    if (rule.fullAccessRoles.includes(viewerRole)) continue;

    if (rule.mask) {
      masked[field] = rule.mask(masked[field]);
    } else {
      masked[field] = null;
    }
  }

  return masked;
}

module.exports = { maskSensitiveFields, MASKING_RULES };
