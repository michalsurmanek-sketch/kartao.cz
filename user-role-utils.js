console.log('USER-ROLE-UTILS MODULE LOADED');
// user-role-utils.js
// Centrální utilita pro detekci role a profilu uživatele

/**
 * Načte profil uživatele z creators i firms a vrátí preferovanou roli a profil.
 * Preferuje firemní profil, pokud existuje. Pokud existují oba, lze přidat přepínání.
 * @param {string} userId - ID přihlášeného uživatele
 * @param {object} supabaseClient - instance supabase klienta
 * @returns {Promise<{role: 'company'|'creator'|null, profile: object|null, allProfiles: {creator: object|null, company: object|null}}>} 
 */
export async function getUserRoleAndProfile(userId, supabaseClient) {
  if (!userId || !supabaseClient) return { role: null, profile: null, allProfiles: { creator: null, company: null } };

  const [creatorResult, firmResult] = await Promise.all([
    supabaseClient
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseClient
      .from('firms')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  const creator = creatorResult.data || null;
  const company = firmResult.data || null;

  console.log('USER-ROLE-UTILS DEBUG:', {
    userId,
    creatorResult,
    firmResult,
    creator,
    company
  });

  let role = null;
  let profile = null;

  if (company) {
    role = 'company';
    profile = { ...company, is_company: true };
  } else if (creator) {
    role = 'creator';
    profile = { ...creator, is_company: false };
  }

  return {
    role,
    profile,
    allProfiles: { creator, company }
  };
}

/**
 * Pomocná funkce pro robustní detekci role z profilu
 * @param {object} profile
 * @returns {'company'|'creator'|null}
 */
export function detectRoleFromProfile(profile) {
  if (!profile) return null;
  if (
    profile.is_company === true ||
    profile.is_company === 1 ||
    profile.is_company === 'true' ||
    profile.is_company === '1'
  ) return 'company';
  return 'creator';
}
