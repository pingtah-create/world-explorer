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

  const res = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${INAT_TOKEN}` },
    body: formData,
  });

  if (!res.ok) return null;

  const json = await res.json();
  const top = json.results?.[0];
  if (!top || top.combined_score < 0.1) return null;

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
