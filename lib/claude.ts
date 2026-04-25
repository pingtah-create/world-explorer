const INAT_TOKEN = process.env.EXPO_PUBLIC_INAT_TOKEN ?? '';

export type AnimalIDResult = {
  common_name: string;
  scientific_name: string;
  confidence: 'high' | 'medium' | 'low';
  taxon_id: number;
  photo_url: string;
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
  if (!top) throw new Error('iNat returned 0 results');
  throw new Error(`Top: ${top.taxon?.name} score=${top.combined_score?.toFixed(3)}`);

  const taxon = top.taxon;
  const score: number = top.combined_score;

  return {
    common_name: taxon.preferred_common_name ?? taxon.name,
    scientific_name: taxon.name,
    confidence: score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low',
    taxon_id: taxon.id,
    photo_url: taxon.default_photo?.medium_url ?? '',
  };
}
