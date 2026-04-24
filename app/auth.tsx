import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.card} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>🌍</Text>
        </View>

        <Text style={s.title}>World Explorer</Text>
        <Text style={s.subtitle}>Reveal the map. Catch every animal.</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && (
            <View style={s.errorWrap}>
              <Text style={s.error}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.btnText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); }}>
          <Text style={s.toggle}>
            {mode === 'signin' ? "Don't have an account?  Sign up" : 'Already have an account?  Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: 28 },
  card: { gap: 14, paddingVertical: 16 },
  logoWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1.5, borderColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 8,
  },
  logoEmoji: { fontSize: 44 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 8 },
  form: { gap: 10 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 15,
    color: COLORS.text, fontSize: 15,
  },
  errorWrap: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  error: { color: COLORS.danger, fontSize: 13 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  toggle: { color: COLORS.muted, textAlign: 'center', fontSize: 13, marginTop: 4 },
});
