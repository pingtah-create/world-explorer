import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading
    const inAuth = segments[0] === 'auth';
    if (!session && !inAuth) router.replace('/auth');
    if (session && inAuth) router.replace('/(tabs)/map');
  }, [session, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="animal/[id]" options={{ presentation: 'modal', headerShown: true, headerTitle: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#f0f0f0' }} />
    </Stack>
  );
}
