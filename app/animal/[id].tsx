import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, type AnimalSighting } from '../../lib/supabase';
import { getTaxon, type Taxon } from '../../lib/inaturalist';
import { COLORS } from '../../constants';

const GROUP_ICONS: Record<string, string> = {
  Mammal: '🦁', Bird: '🦅', Reptile: '🦎', Amphibian: '🐸',
  Fish: '🐟', Insect: '🐛', Arachnid: '🕷️', Plant: '🌿', Fungus: '🍄',
};

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const hasCoords = sighting.lat !== 0 || sighting.lng !== 0;
  const group = sighting.group?.trim() || (taxon?.iconic_taxon_name ?? '');
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

      {/* Back button */}
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 10 }]} onPress={() => router.back()} activeOpacity={0.8}>
        <Text style={s.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Hero image */}
      <Image source={{ uri: sighting.photo_url || sighting.inaturalist_photo }} style={s.hero} />
      <View style={s.heroOverlay}>
        {group ? (
          <View style={s.groupBadge}>
            <Text style={s.groupBadgeText}>{groupIcon} {group}</Text>
          </View>
        ) : null}
        <Text style={s.heroCommonName}>{sighting.common_name}</Text>
        <Text style={s.heroSciName}>{sighting.scientific_name}</Text>
      </View>

      <View style={s.body}>

        {/* Conservation status */}
        {taxon?.conservation_status && (
          <View style={s.statusBadge}>
            <Text style={s.statusText}>🛡  {taxon.conservation_status.status_name}</Text>
          </View>
        )}

        {/* Meta row */}
        <View style={s.metaRow}>
          <View style={s.metaCard}>
            <Text style={s.metaIcon}>📅</Text>
            <Text style={s.metaLabel}>Spotted</Text>
            <Text style={s.metaValue}>{spottedDate}</Text>
          </View>
          {group ? (
            <View style={s.metaCard}>
              <Text style={s.metaIcon}>{groupIcon}</Text>
              <Text style={s.metaLabel}>Type</Text>
              <Text style={s.metaValue}>{group}</Text>
            </View>
          ) : null}
          {hasCoords && (
            <View style={s.metaCard}>
              <Text style={s.metaIcon}>📍</Text>
              <Text style={s.metaLabel}>Location</Text>
              <Text style={s.metaValue}>{sighting.lat.toFixed(3)},  {sighting.lng.toFixed(3)}</Text>
            </View>
          )}
        </View>

        {/* Found here map */}
        {hasCoords && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>FOUND HERE</Text>
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
                <Marker coordinate={{ latitude: sighting.lat, longitude: sighting.lng }} pinColor={COLORS.primary} />
              </MapView>
              <View style={s.mapCoordPill}>
                <Text style={s.mapCoordText}>📍 {sighting.lat.toFixed(4)}, {sighting.lng.toFixed(4)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* About */}
        {description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>ABOUT</Text>
            <View style={s.textCard}>
              <Text style={s.bodyText}>{description}</Text>
            </View>
          </View>
        ) : null}

        {/* Reference photo */}
        {sighting.inaturalist_photo ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>REFERENCE PHOTO</Text>
            <View style={s.refPhotoWrap}>
              <Image source={{ uri: sighting.inaturalist_photo }} style={s.refPhoto} />
              <View style={s.refPhotoLabel}>
                <Text style={s.refPhotoLabelText}>via iNaturalist</Text>
              </View>
            </View>
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
  muted: { color: COLORS.muted },

  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(8,8,8,0.7)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: COLORS.text, fontSize: 18, fontWeight: '600' },

  hero: { width: '100%', height: 340, backgroundColor: '#141414' },
  heroOverlay: {
    position: 'absolute', top: 270, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 18, paddingTop: 14,
    backgroundColor: 'rgba(8,8,8,0.88)', gap: 4,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryDim, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
    marginBottom: 2,
  },
  groupBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  heroCommonName: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  heroSciName: { fontSize: 14, color: COLORS.muted, fontStyle: 'italic' },

  body: { padding: 18, gap: 18, marginTop: 6 },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryDim, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
  },
  statusText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaCard: {
    flex: 1, minWidth: 90,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  metaIcon: { fontSize: 18 },
  metaLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: '700' },

  section: { gap: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.muted, letterSpacing: 1.4 },

  mapCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  miniMap: { width: '100%', height: 210 },
  mapCoordPill: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(8,8,8,0.78)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  mapCoordText: { color: COLORS.textDim, fontSize: 11, fontWeight: '600' },

  textCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  bodyText: { fontSize: 14, color: COLORS.textDim, lineHeight: 23 },

  refPhotoWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  refPhoto: { width: '100%', height: 220, backgroundColor: '#141414' },
  refPhotoLabel: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderTopLeftRadius: 10,
  },
  refPhotoLabelText: { color: COLORS.muted, fontSize: 11, fontWeight: '500' },
});
