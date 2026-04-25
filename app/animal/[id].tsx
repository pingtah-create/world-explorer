import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { supabase, type AnimalSighting } from '../../lib/supabase';
import { getTaxon, type Taxon } from '../../lib/inaturalist';
import { COLORS } from '../../constants';

const GROUP_ICONS: Record<string, string> = {
  Mammal: '🦁', Bird: '🦅', Reptile: '🦎', Amphibian: '🐸',
  Fish: '🐟', Insect: '🐛', Arachnid: '🕷️', Plant: '🌿', Fungus: '🍄',
};

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
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  if (!sighting) {
    return <View style={s.center}><Text style={s.muted}>Sighting not found.</Text></View>;
  }

  const spottedDate = new Date(sighting.spotted_at).toLocaleDateString(undefined, { dateStyle: 'long' });
  const hasCoords = (sighting.lat !== 0 || sighting.lng !== 0);
  const group = sighting.group || (taxon?.iconic_taxon_name ?? '');
  const groupIcon = GROUP_ICONS[group] ?? '🐾';

  const description = taxon?.wikipedia_summary
    ? (() => {
        const clean = taxon.wikipedia_summary
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ').trim();
        const parts = clean.split(/[.!?]\s+/);
        const text = parts.slice(0, 5).join('. ').trim();
        return text && !text.match(/[.!?]$/) ? text + '.' : text;
      })()
    : '';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: sighting.photo_url || sighting.inaturalist_photo }} style={s.hero} />

      <View style={s.heroOverlay}>
        <Text style={s.heroCommonName}>{sighting.common_name}</Text>
        <Text style={s.heroSciName}>{sighting.scientific_name}</Text>
      </View>

      <View style={s.body}>
        {taxon?.conservation_status && (
          <View style={s.statusBadge}>
            <Text style={s.statusText}>🛡  {taxon.conservation_status.status_name}</Text>
          </View>
        )}

        {/* Meta cards */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaIcon}>📅</Text>
            <Text style={s.metaLabel}>Spotted</Text>
            <Text style={s.metaValue}>{spottedDate}</Text>
          </View>
          {group ? (
            <View style={s.metaItem}>
              <Text style={s.metaIcon}>{groupIcon}</Text>
              <Text style={s.metaLabel}>Type</Text>
              <Text style={s.metaValue}>{group}</Text>
            </View>
          ) : null}
          {hasCoords && (
            <View style={s.metaItem}>
              <Text style={s.metaIcon}>📍</Text>
              <Text style={s.metaLabel}>Coords</Text>
              <Text style={s.metaValue}>{sighting.lat.toFixed(3)}, {sighting.lng.toFixed(3)}</Text>
            </View>
          )}
        </View>

        {/* Map */}
        {hasCoords && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Found here</Text>
            <View style={s.mapCard}>
              <MapView
                style={s.miniMap}
                mapType="standard"
                initialRegion={{
                  latitude: sighting.lat,
                  longitude: sighting.lng,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: sighting.lat, longitude: sighting.lng }}
                  pinColor={COLORS.primary}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* About */}
        {description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.bodyText}>{description}</Text>
          </View>
        ) : null}

        {/* Reference photo */}
        {sighting.inaturalist_photo ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reference Photo</Text>
            <Image source={{ uri: sighting.inaturalist_photo }} style={s.refPhoto} />
            <Text style={s.photoCredit}>Photo via iNaturalist</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingBottom: 60 },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 320, backgroundColor: '#1a1a1a' },
  heroOverlay: {
    position: 'absolute', top: 260, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12,
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  heroCommonName: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  heroSciName: { fontSize: 14, color: COLORS.muted, fontStyle: 'italic', marginTop: 2 },
  body: { padding: 20, gap: 16, marginTop: 4 },
  statusBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primaryDim,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
  },
  statusText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: {
    flex: 1, minWidth: 90,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, gap: 3,
  },
  metaIcon: { fontSize: 16 },
  metaLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  mapCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  miniMap: { width: '100%', height: 200 },
  bodyText: { fontSize: 14, color: COLORS.text, lineHeight: 22, opacity: 0.85 },
  refPhoto: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#1a1a1a' },
  photoCredit: { fontSize: 11, color: COLORS.muted, textAlign: 'right' },
  muted: { color: COLORS.muted },
});
