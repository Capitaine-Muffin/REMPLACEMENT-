/** Identifiant unique, avec repli pour les navigateurs sans crypto.randomUUID. */
export function nouvelId(prefixe = ''): string {
  const base =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefixe ? `${prefixe}-${base}` : base
}
