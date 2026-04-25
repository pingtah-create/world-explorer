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

const CONFIDENCE_COLORS = { high: COLORS.primary, medium: COLORS.warn, low: COLORS.danger };
const CONFIDENCE_LABELS = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' };

function formatObservations(n: number): string {
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
        common: animal.common_name,
        scientific: animal.scientific_name,
        photo: animal.photo_url,
        taxonId: animal.taxon_id,
        confidence: animal.confidence,
        group: animal.group,
        description: animal.description,
        fun_fact: animal.fun_fact,
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
        photo_url: result.photo ?? '',
        inaturalist_photo: result.photo ?? '',
        spotted_at: new Date().toISOString(),
        lat: coords?.latitude ?? 0,
        lng: coords?.longitude ?? 0,
      });
      setStage('idle');
      setImageUri(null);
      setResult(null);
      router.push('/(tabs)/animals');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again.');
      setStage('result');
    }
  }

  function reset() { setStage('idle'); setImageUri(null); setResult(null); }

  if (stage === 'result' && result) {
    const confColor = CONFIDENCE_COLORS[(result.confidence as keyof typeof CONFIDENCE_COLORS) ?? 'low'];
    const confLabel = CONFIDENCE_LABELS[(result.confidence as keyof typeof CONFIDENCE_LABELS) ?? 'low'];

    return (
      <ScrollView style={s.root} contentContainerStyle={[s.resultContainer, { paddingTop: insets.top + 16 }]}>
        {imageUri && <Image source={{ uri: imageUri }} style={s.previewLarge} />}

        <View style={s.resultCard}>
          {/* Badges row */}
          <View style={s.badgeRow}>
            <View style={s.confBadge}>
              <View style={[s.dot, { backgroundColor: confColor }]} />
              <Text style={[s.badgeText, { color: confColor }]}>{confLabel}</Text>
            </View>
            {result.group ? (
              <View style={s.badge}><Text style={s.badgeText}>{result.group}</Text></View>
            ) : null}
            {result.conservation_status ? (
              <View style={[s.badge, s.badgeGreen]}><Text style={[s.badgeText, { color: COLORS.primary }]}>🛡 {result.conservation_status}</Text></View>
            ) : null}
          </View>

          {/* Name */}
          <Text style={s.commonName}>{result.common}</Text>
          <Text style={s.sciName}>{result.scientific}</Text>

          {/* Stats row */}
          {(result.observations_count ?? 0) > 0 && (
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statValue}>{formatObservations(result.observations_count!)}</Text>
                <Text style={s.statLabel}>iNat observations</Text>
              </View>
              {result.group ? (
                <View style={s.statItem}>
                  <Text style={s.statValue}>{result.group}</Text>
                  <Text style={s.statLabel}>Animal type</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Reference photo */}
          {result.photo ? <Image source={{ uri: result.photo }} style={s.refPhoto} /> : null}

          {/* Description */}
          {result.description ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>About</Text>
              <Text style={s.sectionText}>{result.description}</Text>
            </View>
          ) : null}

          {/* Fun fact */}
          {result.fun_fact ? (
            <View style={[s.section, s.funFactBox]}>
              <Text style={s.funFactLabel}>💡 Fun Fact</Text>
              <Text style={s.funFactText}>{result.fun_fact}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={s.btn} onPress={save}>
          <Text style={s.btnText}>Add to Pokédex  🐾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={reset}>
          <Text style={s.btnSecondaryText}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {stage === 'identifying' || stage === 'saving' ? (
        <View style={s.center}>
          <View style={s.spinnerWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={s.loadingTitle}>{stage === 'saving' ? 'Saving…' : 'Identifying…'}</Text>
          <Text style={s.loadingSubtitle}>{stage === 'saving' ? 'Adding to your Pokédex' : 'Asking iNaturalist…'}</Text>
        </View>
      ) : (
        <View style={s.center}>
          <View style={s.viewfinder}>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
            <Text style={s.cameraIcon}>📷</Text>
          </View>
          <Text style={s.scanTitle}>Identify an Animal</Text>
          <Text style={s.scanSub}>Point your camera at any animal and let{'\n'}iNaturalist identify it for you</Text>
          <View style={s.btnGroup}>
            <TouchableOpacity style={s.btn} onPress={() => pickImage(true)}>
              <Text style={s.btnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => pickImage(false)}>
              <Text style={s.btnSecondaryText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const CORNER = 20;
const CORNER_THICK = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 20 },
  viewfinder: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: COLORS.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderBottomRightRadius: 6 },
  cameraIcon: { fontSize: 64 },
  scanTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  scanSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  btnGroup: { width: '100%', gap: 10, marginTop: 4 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', width: '100%' },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  btnSecondary: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
  spinnerWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  loadingSubtitle: { color: COLORS.muted, fontSize: 13 },
  resultContainer: { padding: 16, gap: 14, alignItems: 'center', paddingBottom: 48 },
  previewLarge: { width: '100%', height: 260, borderRadius: 18, backgroundColor: '#1a1a1a' },
  resultCard: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  confBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.surface2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  badge: { backgroundColor: COLORS.surface2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  badgeGreen: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryGlow },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  commonName: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  sciName: { fontSize: 14, color: COLORS.muted, fontStyle: 'italic', marginTop: -4 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  statItem: { flex: 1, backgroundColor: COLORS.surface2, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: COLORS.border, gap: 2 },
  statValue: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  refPhoto: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#1a1a1a' },
  section: { gap: 6, paddingTop: 4 },
  sectionLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionText: { color: COLORS.text, fontSize: 13, lineHeight: 20, opacity: 0.85 },
  funFactBox: { backgroundColor: COLORS.surface2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 2 },
  funFactLabel: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  funFactText: { color: COLORS.text, fontSize: 13, lineHeight: 19, opacity: 0.85 },
});
