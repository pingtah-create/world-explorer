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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoOuter}>
            <View style={s.logoInner}>
              <Text style={s.logoEmoji}>🌍</Text>
            </View>
          </View>
          <Text style={s.appName}>World Explorer</Text>
          <Text style={s.tagline}>Reveal the map. Catch every animal.</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{mode === 'signin' ? 'Welcome back' : 'Get started'}</Text>

          <View style={s.form}>
            <View style={[s.inputWrap, focusedField === 'email' && s.inputWrapFocused]}>
              <Text style={s.inputIcon}>✉️</Text>
              <TextInput
                style={s.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={[s.inputWrap, focusedField === 'password' && s.inputWrapFocused]}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {error ? (
              <View style={s.errorWrap}>
                <Text style={s.errorIcon}>⚠️</Text>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submit} disabled={loading} activeOpacity={0.8}>
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={s.btnText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.toggleBtn} onPress={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); }} activeOpacity={0.7}>
          <Text style={s.toggleText}>
            {mode === 'signin' ? "New here? " : 'Have an account? '}
            <Text style={s.toggleLink}>{mode === 'signin' ? 'Create account' : 'Sign in'}</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20 },

  hero: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  logoOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(74,222,128,0.07)',
    borderWidth: 1, borderColor: COLORS.primaryStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 42 },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -0.8, marginTop: 4 },
  tagline: { fontSize: 14, color: COLORS.muted, letterSpacing: 0.2 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.border,
    gap: 18,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },

  form: { gap: 12 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, gap: 10,
  },
  inputWrapFocused: { borderColor: COLORS.primary },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 15 },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.dangerDim,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.dangerBorder,
  },
  errorIcon: { fontSize: 14 },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1 },

  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },

  toggleBtn: { alignItems: 'center', paddingVertical: 8 },
  toggleText: { color: COLORS.muted, fontSize: 14 },
  toggleLink: { color: COLORS.primary, fontWeight: '700' },
});
