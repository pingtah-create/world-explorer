import { SectionList, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { COLORS } from '../../constants';
import type { AnimalSighting } from '../../lib/supabase';

const GROUP_ICONS: Record<string, string> = {
  Mammal: '🦁', Bird: '🦅', Reptile: '🦎', Amphibian: '🐸',
  Fish: '🐟', Insect: '🐛', Arachnid: '🕷️', Mollusk: '🐚',
  Plant: '🌿', Fungus: '🍄', Animal: '🐾', Organism: '🔮', Other: '❓',
};

const GROUP_ORDER = ['Mammal','Bird','Reptile','Amphibian','Fish','Insect','Arachnid','Mollusk','Plant','Fungus','Animal','Organism'];

type Row = [AnimalSighting, AnimalSighting | undefined];

function chunkRows(items: AnimalSighting[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < items.length; i += 2) rows.push([items[i], items[i + 1]]);
  return rows;
}

function AnimalCard({ item }: { item: AnimalSighting }) {
  const router = useRouter();
  const imgUri = item.photo_url || item.inaturalist_photo;
  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/animal/${item.id}`)}>
      <Image source={{ uri: imgUri }} style={s.img} />
      <View style={s.overlay}>
        <Text style={s.commonName} numberOfLines={1}>{item.common_name}</Text>
        <Text style={s.sciName} numberOfLines={1}>{item.scientific_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

function AnimalRow({ row }: { row: Row }) {
  return (
    <View style={s.gridRow}>
      <AnimalCard item={row[0]} />
      {row[1] ? <AnimalCard item={row[1]} /> : <View style={s.cardPlaceholder} />}
    </View>
  );
}

export default function AnimalsScreen() {
  const { sightings, loading } = useAnimalCollection();
  const insets = useSafeAreaInsets();

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  if (sightings.length === 0) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <View style={s.emptyIconWrap}><Text style={s.emptyIcon}>🐾</Text></View>
        <Text style={s.emptyTitle}>No animals yet</Text>
        <Text style={s.emptyBody}>Use the Scan tab to photograph{'\n'}and identify animals</Text>
      </View>
    );
  }

  const uniqueSpecies = new Set(sightings.map(x => x.scientific_name)).size;

  const groupMap = new Map<string, AnimalSighting[]>();
  for (const s of sightings) {
    const key = s.group?.trim() || 'Other';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(s);
  }

  const sections = [...groupMap.entries()]
    .sort(([a], [b]) => {
      const ai = GROUP_ORDER.indexOf(a);
      const bi = GROUP_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([title, items]) => ({ title, count: items.length, data: chunkRows(items) }));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.headerRow}>
        <Text style={s.header}>Pokédex</Text>
        <View style={s.pills}>
          <View style={s.pill}><Text style={s.pillText}>{sightings.length} caught</Text></View>
          <View style={[s.pill, s.pillAlt]}><Text style={[s.pillText, s.pillTextAlt]}>{uniqueSpecies} species</Text></View>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(row, i) => row[0].id + i}
        renderItem={({ item }) => <AnimalRow row={item} />}
        renderSectionHeader={({ section: { title, count } }) => (
          <View style={s.sectionHeader}>
            <View style={s.sectionLeft}>
              <Text style={s.sectionIcon}>{GROUP_ICONS[title] ?? '🔮'}</Text>
              <Text style={s.sectionTitle}>{title}</Text>
            </View>
            <View style={s.sectionBadge}>
              <Text style={s.sectionCount}>{count}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  headerRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  header: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  pillAlt: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryGlow },
  pillText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  pillTextAlt: { color: COLORS.primary },
  list: { paddingHorizontal: 8, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingTop: 20, paddingBottom: 10,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
  sectionBadge: {
    backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionCount: { fontSize: 11, color: COLORS.muted, fontWeight: '700' },
  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  cardPlaceholder: { flex: 1 },
  img: { width: '100%', aspectRatio: 1, backgroundColor: '#1a1a1a' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 8, paddingVertical: 7,
  },
  commonName: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  sciName: { color: COLORS.muted, fontSize: 10, fontStyle: 'italic', marginTop: 1 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyIcon: { fontSize: 38 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyBody: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
