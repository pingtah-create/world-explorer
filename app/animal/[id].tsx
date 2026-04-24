import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase, type AnimalSighting } from '../../lib/supabase';
import { getTaxon, type Taxon } from '../../lib/inaturalist';
import { COLORS } from '../../constants';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sighting, setSighting] = useState<AnimalSighting | null>(null);
  const [taxon, setTaxon] = useState<Taxon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from('animal_sightings').select('*').eq('id', id).single();
      if (!data) { setLoading(false); return; }
      setSighting(data as AnimalSighting);

      if (data.taxon_id) {
        const t = await getTaxon(data.taxon_id);
        setTaxon(t);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  if (!sighting) {
    return <View style={s.center}><Text style={s.muted}>Sighting not found.</Text></View>;
  }

  const spottedDate = new Date(sighting.spotted_at).toLocaleDateString(undefined, { dateStyle: 'long' });
  const hasCoords = sighting.lat !== 0 || sighting.lng !== 0;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <Image source={{ uri: sighting.photo_url || sighting.inaturalist_photo }} style={s.hero} />

      <View style={s.body}>
        <Text style={s.commonName}>{sighting.common_name}</Text>
        <Text style={s.sciName}>{sighting.scientific_name}</Text>

        {taxon?.conservation_status && (
          <View style={s.badge}>
            <Text style={s.badgeText}>🛡 {taxon.conservation_status.status_name}</Text>
          </View>
        )}

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Spotted</Text>
            <Text style={s.metaValue}>{spottedDate}</Text>
          </View>
          {hasCoords && (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Location</Text>
              <Text style={s.metaValue}>{sighting.lat.toFixed(4)}, {sighting.lng.toFixed(4)}</Text>
            </View>
          )}
          {taxon?.iconic_taxon_name && (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Group</Text>
              <Text style={s.metaValue}>{taxon.iconic_taxon_name}</Text>
            </View>
          )}
        </View>

        {taxon?.wikipedia_summary && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.body2}>{taxon.wikipedia_summary}</Text>
          </View>
        )}

        {sighting.inaturalist_photo ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reference Photo</Text>
            <Image source={{ uri: sighting.inaturalist_photo }} style={s.refPhoto} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingBottom: 48 },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 300, backgroundColor: '#1a1a1a' },
  body: { padding: 20, gap: 12 },
  commonName: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  sciName: { fontSize: 15, color: COLORS.muted, fontStyle: 'italic' },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border },
  badgeText: { color: COLORS.text, fontSize: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, minWidth: 100, borderWidth: 1, borderColor: COLORS.border },
  metaLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  body2: { fontSize: 14, color: COLORS.muted, lineHeight: 21 },
  refPhoto: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#1a1a1a' },
  muted: { color: COLORS.muted },
});
