import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { useVisitedTiles } from '../../hooks/useVisitedTiles';
import { COLORS } from '../../constants';

function StatCard({ value, label, icon }: { value: number | string; label: string; icon: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { sightings } = useAnimalCollection();
  const { tiles } = useVisitedTiles(null);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const tileCount = tiles.size;
  const kmSquared = (tileCount * 1.1).toFixed(0);
  const uniqueSpecies = new Set(sightings.map(s => s.scientific_name)).size;
  const initials = email ? email[0].toUpperCase() : '?';

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.email} numberOfLines={1}>{email}</Text>
      </View>

      <Text style={s.sectionTitle}>Exploration</Text>
      <View style={s.statsRow}>
        <StatCard value={tileCount} label="Tiles" icon="🗺️" />
        <StatCard value={`~${kmSquared}`} label="km²" icon="📐" />
        <StatCard value={sightings.length} label="Caught" icon="🐾" />
        <StatCard value={uniqueSpecies} label="Species" icon="🔬" />
      </View>

      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Total sightings</Text>
          <Text style={s.sectionValue}>{sightings.length}</Text>
        </View>
      </View>
      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Unique species</Text>
          <Text style={s.sectionValue}>{uniqueSpecies}</Text>
        </View>
      </View>
      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Area explored</Text>
          <Text style={s.sectionValue}>~{kmSquared} km²</Text>
        </View>
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 2, borderColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.primary },
  email: { color: COLORS.muted, fontSize: 13 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.muted, textAlign: 'center', fontWeight: '600' },
  section: { backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: COLORS.muted, fontSize: 14 },
  sectionValue: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  signOutBtn: { marginTop: 'auto', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', padding: 16, alignItems: 'center', backgroundColor: 'rgba(248,113,113,0.06)' },
  signOutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
});
