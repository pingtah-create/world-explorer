import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { useVisitedTiles } from '../../hooks/useVisitedTiles';
import { COLORS } from '../../constants';

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { sightings } = useAnimalCollection();
  const { tiles } = useVisitedTiles(null);
  const tileCount = tiles.size;
  const kmSquared = (tileCount * 1.1).toFixed(0); // ~1.1 km² per tile at equator

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={s.root}>
      <Text style={s.title}>Profile</Text>

      <View style={s.statsRow}>
        <Stat value={tileCount} label="Tiles explored" />
        <Stat value={`~${kmSquared}`} label="km² revealed" />
        <Stat value={sightings.length} label="Animals caught" />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Unique Species</Text>
        <Text style={s.sectionValue}>
          {new Set(sightings.map(s => s.scientific_name)).size}
        </Text>
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  section: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  sectionValue: { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
  signOutBtn: { marginTop: 'auto', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, alignItems: 'center' },
  signOutText: { color: COLORS.danger, fontWeight: '600', fontSize: 15 },
});
