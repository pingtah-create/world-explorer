import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { useVisitedTiles } from '../../hooks/useVisitedTiles';
import { COLORS } from '../../constants';

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <View style={s.statCard}>
      <View style={s.statIconWrap}><Text style={s.statIcon}>{icon}</Text></View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
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

  // Group counts
  const groupCounts = sightings.reduce<Record<string, number>>((acc, s) => {
    const g = s.group?.trim() || 'Other';
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});
  const topGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0];

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <ScrollView style={[s.root, { paddingTop: insets.top }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Hero card */}
      <View style={s.heroCard}>
        <View style={s.heroGlow} />
        <View style={s.avatarOuter}>
          <View style={s.avatarInner}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={s.heroEmail} numberOfLines={1}>{email || '—'}</Text>
        <View style={s.explorerBadge}>
          <Text style={s.explorerBadgeText}>🌿  Explorer</Text>
        </View>
      </View>

      {/* Stats grid */}
      <Text style={s.sectionHeader}>Your Journey</Text>
      <View style={s.statsGrid}>
        <StatCard value={tileCount} label="Tiles explored" icon="🗺️" />
        <StatCard value={`~${kmSquared} km²`} label="Area covered" icon="📐" />
        <StatCard value={sightings.length} label="Animals caught" icon="🐾" />
        <StatCard value={uniqueSpecies} label="Species found" icon="🔬" />
      </View>

      {/* Details */}
      <Text style={s.sectionHeader}>Details</Text>
      <View style={s.infoCard}>
        <InfoRow icon="📍" label="Tiles visited" value={String(tileCount)} />
        <View style={s.separator} />
        <InfoRow icon="🦁" label="Most caught type" value={topGroup ? `${topGroup[0]} (${topGroup[1]})` : '—'} />
        <View style={s.separator} />
        <InfoRow icon="🔬" label="Unique species" value={String(uniqueSpecies)} />
        <View style={s.separator} />
        <InfoRow icon="🌍" label="Area explored" value={`~${kmSquared} km²`} />
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.8}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 48, gap: 14 },

  heroCard: {
    backgroundColor: COLORS.surface, borderRadius: 24,
    padding: 28, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', position: 'relative',
  },
  heroGlow: {
    position: 'absolute', top: -40, left: '25%', right: '25%',
    height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryDim,
  },
  avatarOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1.5, borderColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.primaryStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  heroEmail: { color: COLORS.textDim, fontSize: 14, letterSpacing: 0.2 },
  explorerBadge: {
    backgroundColor: COLORS.primaryDim, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
  },
  explorerBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  sectionHeader: { fontSize: 12, fontWeight: '700', color: COLORS.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '47.5%', backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 16, gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'flex-start',
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },

  infoCard: {
    backgroundColor: COLORS.surface, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 15,
  },
  infoIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  infoLabel: { flex: 1, color: COLORS.textDim, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  separator: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },

  signOutBtn: {
    marginTop: 8, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.dangerBorder, padding: 16,
    alignItems: 'center', backgroundColor: COLORS.dangerDim,
  },
  signOutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
});
