import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { COLORS } from '../../constants';
import type { AnimalSighting } from '../../lib/supabase';

function AnimalCard({ item }: { item: AnimalSighting }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/animal/${item.id}`)}>
      <Image source={{ uri: item.photo_url || item.inaturalist_photo }} style={s.img} />
      <View style={s.cardBody}>
        <Text style={s.commonName} numberOfLines={1}>{item.common_name}</Text>
        <Text style={s.sciName} numberOfLines={1}>{item.scientific_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AnimalsScreen() {
  const { sightings, loading } = useAnimalCollection();

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (sightings.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.emptyIcon}>🐾</Text>
        <Text style={s.emptyTitle}>No animals yet</Text>
        <Text style={s.emptyBody}>Use the Scan tab to photograph and identify animals</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Text style={s.header}>Pokédex  <Text style={s.count}>{sightings.length} found</Text></Text>
      <FlatList
        data={sightings}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={({ item }) => <AnimalCard item={item} />}
        contentContainerStyle={s.list}
        columnWrapperStyle={s.row}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 32 },
  header: { fontSize: 22, fontWeight: '700', color: COLORS.text, padding: 16 },
  count: { fontSize: 14, color: COLORS.muted, fontWeight: '400' },
  list: { padding: 8 },
  row: { gap: 8, marginBottom: 8 },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  img: { width: '100%', aspectRatio: 1, backgroundColor: '#222' },
  cardBody: { padding: 8, gap: 2 },
  commonName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  sciName: { color: COLORS.muted, fontSize: 11, fontStyle: 'italic' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyBody: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
});
