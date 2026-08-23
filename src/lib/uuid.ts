/** Un identifiant d'audit vient du navigateur : il finit dans une requête et
 * dans une URL de retour, donc il est vérifié avant tout usage. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
