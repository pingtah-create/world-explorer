import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type VisitedTile = {
  id: string;
  user_id: string;
  tile_key: string;
  visited_at: string;
};

export type AnimalSighting = {
  id: string;
  user_id: string;
  taxon_id: number;
  common_name: string;
  scientific_name: string;
  photo_url: string;
  inaturalist_photo: string;
  spotted_at: string;
  lat: number;
  lng: number;
};
