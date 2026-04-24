const BASE = 'https://api.inaturalist.org/v1';

export type Taxon = {
  id: number;
  name: string;
  preferred_common_name?: string;
  default_photo?: { medium_url: string };
  wikipedia_summary?: string;
  conservation_status?: { status_name: string };
  iconic_taxon_name?: string;
};

export async function searchTaxon(scientificName: string): Promise<Taxon | null> {
  const url = `${BASE}/taxa?q=${encodeURIComponent(scientificName)}&per_page=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.results?.[0] ?? null;
}

export async function getTaxon(taxonId: number): Promise<Taxon | null> {
  const res = await fetch(`${BASE}/taxa/${taxonId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.results?.[0] ?? null;
}
