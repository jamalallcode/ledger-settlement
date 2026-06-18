/**
 * Utility functions for handling branch types (SFI and Non-SFI)
 */

export const isSFI = (type: string | null | undefined): boolean => {
  if (!type) return false;
  const t = type.trim();
  const upper = t.toUpperCase();
  return (
    t === 'এসএফআই' || 
    upper === 'SFI' || 
    t === 'এস-এফ-আই' || 
    t === 'এস এফ আই' || 
    upper === 'S-F-I' || 
    upper === 'S F I' ||
    t.includes('SFI') ||
    t.includes('এসএফআই')
  );
};

export const isNonSFI = (type: string | null | undefined): boolean => {
  if (!type) return false;
  const t = type.trim();
  const upper = t.toUpperCase();
  return (
    t.includes('নন') || 
    upper.includes('NON-SFI') || 
    upper.includes('NON SFI') || 
    upper.includes('NON_SFI') ||
    t.includes('নন এসএফআই')
  );
};

export const isAdminBranch = (type: string | null | undefined): boolean => {
  if (!type) return false;
  const t = type.trim();
  const upper = t.toUpperCase();
  return (
    t === 'প্রশাসন' || 
    t === 'প্রশাসন শাখা' ||
    upper === 'ADMIN' ||
    upper === 'ADMINISTRATION' ||
    t.includes('প্রশাসন')
  );
};

/**
 * Returns all common variations for a given branch type to help with database queries
 */
export const getBranchVariations = (type: string): string[] => {
  if (!type) return [];
  
  const variations = [type, type.replace(' ', '-'), type.replace('-', ' ')];
  
  if (isSFI(type)) {
    variations.push('এসএফআই', 'SFI', 'sfi', 'এস-এফ-আই', 'এস এফ আই', 'S-F-I', 'S F I', 'SFI branch', 'SFI Branch', 'এসএফআই শাখা');
  } else if (isNonSFI(type)) {
    variations.push('নন এসএফআই', 'নন-এসএফআই', 'NON-SFI', 'non-sfi', 'Non-SFI', 'নন-এস-এফ-আই', 'নন এস এফ আই', 'NON SFI', 'NON_SFI', 'Non-SFI branch', 'Non SFI Branch', 'নন এসএফআই শাখা');
  } else if (isAdminBranch(type)) {
    variations.push('প্রশাসন', 'প্রশাসন শাখা', 'ADMIN', 'admin', 'Administration', 'Admin Branch', 'Administration Branch');
  }
  
  return Array.from(new Set(variations.map(v => v.trim())));
};
