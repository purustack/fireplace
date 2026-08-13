export function normalizeCompany(name: string) {
  return name
    .toLowerCase()
    .replace(
      /\b(pvt|private|ltd|limited|inc|llc|llp|corp|corporation|technologies|technology|tech|india|usa)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
