import { useCallback } from 'react';
import { SectionList, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { COLORS } from '../../constants';
import type { AnimalSighting } from '../../lib/supabase';

const GROUP_ICONS: Record<string, string> = {
  Mammal: '🦁', Bird: '🦅', Reptile: '🦎', Amphibian: '🐸',
  Fish: '🐟', Insect: '🐛', Arachnid: '🕷️', Mollusk: '🐚',
  Plant: '🌿', Fungus: '🍄', Animal: '🐾', Organism: '🔮', Other: '❓',
};

const GROUP_ORDER = ['Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Insect', 'Arachnid', 'Mollusk', 'Plant', 'Fungus', 'Animal', 'Organism'];

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
    <TouchableOpacity style={s.card} onPress={() => router.push(`/animal/${item.id}`)} activeOpacity={0.85}>
      <Image source={{ uri: imgUri }} style={s.img} />
      {/* Gradient simulation: stacked views */}
      <View style={s.imgShadowTop} />
      <View style={s.imgShadowBottom} />
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
  const { sightings, loading, refresh } = useAnimalCollection();
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  if (sightings.length === 0) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <View style={s.emptyRing}>
          <Text style={s.emptyIcon}>🐾</Text>
        </View>
        <Text style={s.emptyTitle}>No animals yet</Text>
        <Text style={s.emptyBody}>Use the Scan tab to photograph{'\n'}and identify animals</Text>
      </View>
    );
  }

  const uniqueSpecies = new Set(sightings.map(x => x.scientific_name)).size;

  const groupMap = new Map<string, AnimalSighting[]>();
  for (const item of sightings) {
    const key = item.group?.trim() || 'Other';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(item);
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
      {/* Header */}
      <View style={s.headerRow}>
        <View>
          <Text style={s.header}>Pokédex</Text>
          <Text style={s.headerSub}>{sections.length} {sections.length === 1 ? 'category' : 'categories'}</Text>
        </View>
        <View style={s.pills}>
          <View style={s.pill}><Text style={s.pillText}>{sightings.length} caught</Text></View>
          <View style={[s.pill, s.pillGreen]}><Text style={[s.pillText, { color: COLORS.primary }]}>{uniqueSpecies} species</Text></View>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(row, i) => row[0].id + i}
        renderItem={({ item }) => <AnimalRow row={item} />}
        renderSectionHeader={({ section: { title, count } }) => (
          <View style={s.sectionHeader}>
            <View style={s.sectionLeft}>
              <View style={s.sectionIconBubble}>
                <Text style={s.sectionIcon}>{GROUP_ICONS[title] ?? '🔮'}</Text>
              </View>
              <View>
                <Text style={s.sectionTitle}>{title}</Text>
                <Text style={s.sectionSubtitle}>{count} {count === 1 ? 'animal' : 'animals'}</Text>
              </View>
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
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },

  headerRow: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  header: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: COLORS.muted, fontWeight: '600', marginTop: 1 },
  pills: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  pill: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pillGreen: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryGlow },
  pillText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },

  list: { paddingHorizontal: 10, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBubble: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 11, color: COLORS.muted, fontWeight: '600', marginTop: 1 },

  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cardPlaceholder: { flex: 1 },
  img: { width: '100%', aspectRatio: 1, backgroundColor: '#141414' },
  imgShadowTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 40,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  imgShadowBottom: {
    position: 'absolute', bottom: 42, left: 0, right: 0, height: 40,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(8,8,8,0.82)',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  commonName: { color: COLORS.text, fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },
  sciName: { color: COLORS.muted, fontSize: 10, fontStyle: 'italic', marginTop: 1 },

  emptyRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  emptyBody: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 21 },
});
