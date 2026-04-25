const INAT_TOKEN = process.env.EXPO_PUBLIC_INAT_TOKEN ?? '';

const GROUP_LABELS: Record<string, string> = {
  Mammalia: 'Mammal', Aves: 'Bird', Reptilia: 'Reptile',
  Amphibia: 'Amphibian', Actinopterygii: 'Fish', Insecta: 'Insect',
  Arachnida: 'Arachnid', Mollusca: 'Mollusk', Plantae: 'Plant',
  Fungi: 'Fungus', Animalia: 'Animal',
};

export type AnimalIDResult = {
  common_name: string;
  scientific_name: string;
  confidence: 'high' | 'medium' | 'low';
  taxon_id: number;
  photo_url: string;
  group: string;
  description: string;
  fun_fact: string;
  conservation_status: string;
  observations_count: number;
} | null;

export async function identifyAnimal(imageUri: string): Promise<AnimalIDResult> {
  const formData = new FormData();
  formData.append('image', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);

  const headers: Record<string, string> = {};
  if (INAT_TOKEN) headers['Authorization'] = `Bearer ${INAT_TOKEN}`;

  const res = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`iNaturalist API ${res.status}: ${body.slice(0, 120)}`);
  }

  const json = await res.json();
  const top = json.results?.[0];
  if (!top || top.combined_score < 0.05) return null;

  const taxon = top.taxon;
  const score: number = top.combined_score;

  // Fetch full taxon details
  let description = '';
  let fun_fact = '';
  let conservation_status = '';
  let observations_count = 0;
  try {
    const detailRes = await fetch(`https://api.inaturalist.org/v1/taxa/${taxon.id}`);
    if (detailRes.ok) {
      const detail = await detailRes.json();
      const full = detail.results?.[0];
      observations_count = full?.observations_count ?? 0;
      if (full?.wikipedia_summary) {
        // Clean HTML entities and split sentences without lookbehind
        const clean = full.wikipedia_summary
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ').trim();
        // Split on ". " or "! " or "? " followed by capital letter
        const parts = clean.split(/[.!?]\s+/);
        description = parts.slice(0, 4).join('. ').trim();
        if (description && !description.match(/[.!?]$/)) description += '.';
        fun_fact = parts.slice(0, 2).join('. ').trim();
        if (fun_fact && !fun_fact.match(/[.!?]$/)) fun_fact += '.';
      }
      conservation_status = full?.conservation_status?.status_name ?? '';
    }
  } catch {}

  return {
    common_name: taxon.preferred_common_name ?? taxon.name,
    scientific_name: taxon.name,
    confidence: score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low',
    taxon_id: taxon.id,
    photo_url: taxon.default_photo?.medium_url ?? '',
    group: GROUP_LABELS[taxon.iconic_taxon_name ?? ''] ?? taxon.iconic_taxon_name ?? 'Organism',
    description,
    fun_fact,
    conservation_status,
    observations_count,
  };
}
