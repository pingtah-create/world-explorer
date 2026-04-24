import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { identifyAnimal } from '../../lib/claude';
import { supabase } from '../../lib/supabase';
import { useAnimalCollection } from '../../hooks/useAnimalCollection';
import { useLocation } from '../../hooks/useLocation';
import { COLORS } from '../../constants';

type Stage = 'idle' | 'identifying' | 'result' | 'saving';

export default function CameraScreen() {
  const [stage, setStage] = useState<Stage>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<{ common: string; scientific: string; photo?: string; taxonId?: number } | null>(null);
  const { addSighting } = useAnimalCollection();
  const { coords } = useLocation();
  const router = useRouter();

  async function pickImage(fromCamera: boolean) {
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, base64: false });

    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    setImageUri(uri);
    await runIdentification(uri);
  }

  async function runIdentification(uri: string) {
    setStage('identifying');
    try {
      const animal = await identifyAnimal(uri);

      if (!animal) {
        Alert.alert('No animal found', 'Could not identify an animal in this photo. Try a clearer shot.');
        setStage('idle');
        return;
      }

      setResult({
        common: animal.common_name,
        scientific: animal.scientific_name,
        photo: animal.photo_url,
        taxonId: animal.taxon_id,
      });
      setStage('result');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Check your iNaturalist token and try again.');
      setStage('idle');
    }
  }

  async function save() {
    if (!result || !imageUri) return;
    setStage('saving');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStage('result'); return; }

    // Upload photo to Supabase Storage
    const ext = imageUri.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

    const { data: uploadData } = await supabase.storage
      .from('animal-photos')
      .upload(path, decode(base64), { contentType: `image/${ext}` });

    const publicUrl = uploadData
      ? supabase.storage.from('animal-photos').getPublicUrl(path).data.publicUrl
      : imageUri;

    await addSighting({
      taxon_id: result.taxonId ?? 0,
      common_name: result.common,
      scientific_name: result.scientific,
      photo_url: publicUrl,
      inaturalist_photo: result.photo ?? '',
      spotted_at: new Date().toISOString(),
      lat: coords?.latitude ?? 0,
      lng: coords?.longitude ?? 0,
    });

    setStage('idle');
    setImageUri(null);
    setResult(null);
    router.push('/(tabs)/animals');
  }

  function reset() { setStage('idle'); setImageUri(null); setResult(null); }

  if (stage === 'result' && result) {
    return (
      <ScrollView style={s.root} contentContainerStyle={s.resultContainer}>
        {imageUri && <Image source={{ uri: imageUri }} style={s.previewLarge} />}
        <View style={s.resultCard}>
          <Text style={s.commonName}>{result.common}</Text>
          <Text style={s.sciName}>{result.scientific}</Text>
          {result.photo && <Image source={{ uri: result.photo }} style={s.refPhoto} />}
        </View>
        <TouchableOpacity style={s.btn} onPress={save}>
          <Text style={s.btnText}>Add to Pokédex</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={reset}>
          <Text style={s.btnSecondaryText}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={s.root}>
      {stage === 'identifying' || stage === 'saving' ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>{stage === 'saving' ? 'Saving…' : 'Identifying…'}</Text>
        </View>
      ) : (
        <View style={s.center}>
          <Text style={s.scanTitle}>Scan an Animal</Text>
          <Text style={s.scanSub}>Take a photo or choose from your library</Text>
          <TouchableOpacity style={s.btn} onPress={() => pickImage(true)}>
            <Text style={s.btnText}>📷  Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => pickImage(false)}>
            <Text style={s.btnSecondaryText}>🖼  Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  scanTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  scanSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  btnSecondary: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.text, fontWeight: '600', fontSize: 16 },
  loadingText: { color: COLORS.muted, marginTop: 12 },
  resultContainer: { padding: 16, gap: 16, alignItems: 'center' },
  previewLarge: { width: '100%', height: 280, borderRadius: 16, backgroundColor: '#222' },
  resultCard: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  commonName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  sciName: { fontSize: 14, color: COLORS.muted, fontStyle: 'italic' },
  refPhoto: { width: '100%', height: 180, borderRadius: 12, marginTop: 8, backgroundColor: '#222' },
});
