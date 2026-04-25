import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identifyAnimal } from '../../lib/claude';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { useLocation } from '../../hooks/useLocation';
import { COLORS } from '../../constants';

type Stage = 'idle' | 'identifying' | 'result' | 'saving';

const CONF_COLOR = { high: COLORS.primary, medium: COLORS.warn, low: COLORS.danger };
const CONF_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' };
const CONF_DOT = { high: '🟢', medium: '🟡', low: '🔴' };

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function CameraScreen() {
  const [stage, setStage] = useState<Stage>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<{
    common: string; scientific: string; photo?: string;
    taxonId?: number; confidence?: string; group?: string;
    description?: string; fun_fact?: string;
    conservation_status?: string; observations_count?: number;
  } | null>(null);
  const { addSighting } = useAnimalCollection();
  const { coords } = useLocation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function pickImage(fromCamera: boolean) {
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
    if (res.canceled || !res.assets[0]) return;
    setImageUri(res.assets[0].uri);
    await runIdentification(res.assets[0].uri);
  }

  async function runIdentification(uri: string) {
    setStage('identifying');
    try {
      const animal = await identifyAnimal(uri);
      if (!animal) {
        Alert.alert('No animal found', 'Could not identify an animal in this photo. Try a clearer, closer shot.');
        setStage('idle');
        return;
      }
      setResult({
        common: animal.common_name, scientific: animal.scientific_name,
        photo: animal.photo_url, taxonId: animal.taxon_id,
        confidence: animal.confidence, group: animal.group,
        description: animal.description, fun_fact: animal.fun_fact,
        conservation_status: animal.conservation_status,
        observations_count: animal.observations_count,
      });
      setStage('result');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong.');
      setStage('idle');
    }
  }

  async function save() {
    if (!result) return;
    setStage('saving');
    try {
      await addSighting({
        taxon_id: result.taxonId ?? 0,
        common_name: result.common,
        scientific_name: result.scientific,
        group: result.group ?? '',
        photo_url: result.photo ?? '',
        inaturalist_photo: result.photo ?? '',
        spotted_at: new Date().toISOString(),
        lat: coords?.latitude ?? 0,
        lng: coords?.longitude ?? 0,
      });
      setStage('idle'); setImageUri(null); setResult(null);
      router.push('/(tabs)/animals');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again.');
      setStage('result');
    }
  }

  function reset() { setStage('idle'); setImageUri(null); setResult(null); }

  // ── Result card ──────────────────────────────────────────────────────────
  if (stage === 'result' && result) {
    const conf = (result.confidence as keyof typeof CONF_COLOR) ?? 'low';
    const confColor = CONF_COLOR[conf];
    const confLabel = CONF_LABEL[conf];
    const confDot = CONF_DOT[conf];

    return (
      <ScrollView style={s.root} contentContainerStyle={[s.resultScroll, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>

        {/* User photo */}
        {imageUri && (
          <View style={s.photoWrap}>
            <Image source={{ uri: imageUri }} style={s.userPhoto} />
            <View style={s.photoShade} />
          </View>
        )}

        {/* Identity card */}
        <View style={s.identityCard}>
          {/* Badges */}
          <View style={s.badgeRow}>
            <View style={[s.badge, { borderColor: confColor + '55', backgroundColor: confColor + '15' }]}>
              <Text style={{ fontSize: 10 }}>{confDot}</Text>
              <Text style={[s.badgeText, { color: confColor }]}>{confLabel}</Text>
            </View>
            {result.group ? (
              <View style={s.badge}><Text style={s.badgeText}>{result.group}</Text></View>
            ) : null}
            {result.conservation_status ? (
              <View style={[s.badge, s.badgeGreen]}>
                <Text style={[s.badgeText, { color: COLORS.primary }]}>🛡 {result.conservation_status}</Text>
              </View>
            ) : null}
          </View>

          {/* Name */}
          <Text style={s.commonName}>{result.common}</Text>
          <Text style={s.sciName}>{result.scientific}</Text>

          {/* Divider */}
          <View style={s.divider} />

          {/* Stats */}
          {(result.observations_count ?? 0) > 0 && (
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{formatCount(result.observations_count!)}</Text>
                <Text style={s.statLabel}>iNat sightings</Text>
              </View>
              {result.group ? (
                <View style={s.statBox}>
                  <Text style={s.statValue}>{result.group}</Text>
                  <Text style={s.statLabel}>Animal type</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Reference photo */}
          {result.photo ? (
            <View style={s.refPhotoWrap}>
              <Image source={{ uri: result.photo }} style={s.refPhoto} />
              <View style={s.refPhotoLabel}><Text style={s.refPhotoLabelText}>Reference · iNaturalist</Text></View>
            </View>
          ) : null}

          {/* About */}
          {result.description ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ABOUT</Text>
              <Text style={s.sectionText}>{result.description}</Text>
            </View>
          ) : null}

          {/* Fun fact */}
          {result.fun_fact ? (
            <View style={s.funFactBox}>
              <Text style={s.funFactHeader}>💡  Fun Fact</Text>
              <Text style={s.funFactText}>{result.fun_fact}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <TouchableOpacity style={s.primaryBtn} onPress={save} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Add to Pokédex  🐾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={reset} activeOpacity={0.7}>
          <Text style={s.ghostBtnText}>Discard</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (stage === 'identifying' || stage === 'saving') {
    return (
      <View style={[s.root, s.center]}>
        <View style={s.spinnerRing}>
          <View style={s.spinnerInner}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
        <Text style={s.loadingTitle}>{stage === 'saving' ? 'Saving…' : 'Identifying…'}</Text>
        <Text style={s.loadingSubtitle}>
          {stage === 'saving' ? 'Adding to your Pokédex' : 'Asking iNaturalist AI…'}
        </Text>
      </View>
    );
  }

  // ── Idle scanner ─────────────────────────────────────────────────────────
  return (
    <View style={[s.root, s.center, { paddingTop: insets.top }]}>
      {/* Viewfinder */}
      <View style={s.viewfinderContainer}>
        <View style={s.viewfinder}>
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />
          <View style={s.vfCenter}>
            <Text style={s.vfIcon}>📷</Text>
          </View>
          {/* Scan line decoration */}
          <View style={s.scanLine} />
        </View>
        <View style={s.vfDotRow}>
          {[...Array(3)].map((_, i) => <View key={i} style={s.vfDot} />)}
        </View>
      </View>

      <Text style={s.scanTitle}>Identify an Animal</Text>
      <Text style={s.scanSub}>Point your camera at any animal{'\n'}and let AI identify it instantly</Text>

      <View style={s.btnGroup}>
        <TouchableOpacity style={s.primaryBtn} onPress={() => pickImage(true)} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>📷  Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
          <Text style={s.ghostBtnText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICK = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center', padding: 28, gap: 18 },

  // Viewfinder
  viewfinderContainer: { alignItems: 'center', gap: 12 },
  viewfinder: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: COLORS.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderBottomRightRadius: 8 },
  vfCenter: { alignItems: 'center', justifyContent: 'center' },
  vfIcon: { fontSize: 64 },
  scanLine: {
    position: 'absolute', left: 18, right: 18, height: 1,
    backgroundColor: COLORS.primaryGlow, top: '45%',
  },
  vfDotRow: { flexDirection: 'row', gap: 6 },
  vfDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.primaryGlow },

  scanTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, textAlign: 'center' },
  scanSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },

  btnGroup: { width: '100%', gap: 10, marginTop: 8 },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', width: '100%',
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  ghostBtn: {
    borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: COLORS.borderBright, backgroundColor: COLORS.surface,
  },
  ghostBtnText: { color: COLORS.textDim, fontWeight: '600', fontSize: 15 },

  // Loading
  spinnerRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  spinnerInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.primaryStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  loadingSubtitle: { color: COLORS.muted, fontSize: 13 },

  // Result
  resultScroll: { padding: 16, gap: 12, alignItems: 'center' },
  photoWrap: { width: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative' },
  userPhoto: { width: '100%', height: 280, backgroundColor: '#1a1a1a' },
  photoShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(8,8,8,0.6)' },

  identityCard: {
    width: '100%', backgroundColor: COLORS.surface,
    borderRadius: 20, padding: 20, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface2, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeGreen: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryGlow },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },

  commonName: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  sciName: { fontSize: 14, color: COLORS.muted, fontStyle: 'italic', marginTop: -6 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface2, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: COLORS.border, gap: 2,
  },
  statValue: { color: COLORS.primary, fontSize: 17, fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },

  refPhotoWrap: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  refPhoto: { width: '100%', height: 200, backgroundColor: '#1a1a1a' },
  refPhotoLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6,
  },
  refPhotoLabelText: { color: COLORS.muted, fontSize: 11, fontWeight: '500' },

  section: { gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.muted, letterSpacing: 1.2 },
  sectionText: { color: COLORS.textDim, fontSize: 13, lineHeight: 21 },

  funFactBox: {
    backgroundColor: COLORS.primaryDim, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.primaryGlow, gap: 6,
  },
  funFactHeader: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  funFactText: { color: COLORS.text, fontSize: 13, lineHeight: 20, opacity: 0.9 },
});
