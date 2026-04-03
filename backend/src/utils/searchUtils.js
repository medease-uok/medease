/**
 * Escape LIKE/ILIKE wildcard characters (%, _, \) in a search term.
 */
function escapeLikeWildcards(str) {
  return str.replace(/[%_\\]/g, '\\$&')
}

/**
 * Build a patient search WHERE clause for ILIKE filtering.
 * Searches by full name, email, and patient ID.
 *
 * @param {string|undefined} search - raw search term from query param
 * @param {any[]} params - existing parameterised query params (mutated in place)
 * @returns {string} SQL fragment to append (empty string if no search)
 */
function buildPatientSearchClause(search, params) {
  // Prevent type confusion attacks - query params can be arrays or objects
  if (typeof search !== 'string') return ''
  if (!search || !search.trim()) return ''
  if (search.length > 100) return ''

  const escaped = escapeLikeWildcards(search.trim())
  const searchTerm = `%${escaped}%`
  params.push(searchTerm)
  const idx = params.length

  return ` AND (
    (u.first_name || ' ' || u.last_name) ILIKE $${idx} ESCAPE '\\'
    OR u.email ILIKE $${idx} ESCAPE '\\'
    OR p.id::text ILIKE $${idx} ESCAPE '\\'
  )`
}

module.exports = { escapeLikeWildcards, buildPatientSearchClause }
