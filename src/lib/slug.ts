export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function makeCoproSlug(
  adresse: string | null,
  codePostal: string | null
): string {
  const parts = ["score-copropriete"];
  if (adresse) {
    // adresseReference already contains postal code + city
    parts.push(slugify(adresse));
  } else if (codePostal) {
    parts.push(codePostal);
  }
  return parts.join("-");
}

export function makeVilleSlug(
  nomCommune: string,
  codeCommune: string
): string {
  return `${slugify(nomCommune)}-${codeCommune}`;
}

export function parseVilleSlug(slug: string): string | null {
  const match = slug.match(/-((?:2[AB])?\d{2,5})$/);
  return match ? match[1] : null;
}

export function makeDeptSlug(
  nomDept: string,
  codeDept: string
): string {
  return `${slugify(nomDept)}-${codeDept}`;
}

export function parseDeptSlug(slug: string): string | null {
  const match = slug.match(/-(\d{2,3})$/);
  return match ? match[1] : null;
}
