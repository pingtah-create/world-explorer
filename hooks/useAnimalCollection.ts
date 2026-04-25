import { useCallback, useEffect, useState } from 'react';
import { supabase, type AnimalSighting } from '../lib/supabase';

export function useAnimalCollection() {
  const [sightings, setSightings] = useState<AnimalSighting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('animal_sightings')
      .select('*')
      .eq('user_id', user.id)
      .order('spotted_at', { ascending: false });

    if (data) setSightings(data as AnimalSighting[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addSighting = useCallback(async (sighting: Omit<AnimalSighting, 'id' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await supabase
      .from('animal_sightings')
      .insert({ ...sighting, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (data) setSightings(prev => [data as AnimalSighting, ...prev]);
  }, []);

  return { sightings, loading, addSighting, refresh: fetchAll };
}
