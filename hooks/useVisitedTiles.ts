import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { addTileToCache, getCachedTiles, latLngToTileKey } from '../lib/tiles';
import type { Coords } from './useLocation';

export function useVisitedTiles(coords: Coords | null) {
  const [tiles, setTiles] = useState<Set<string>>(new Set());
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    getCachedTiles().then(cached => {
      if (cached.size > 0) setTiles(cached);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('visited_tiles')
        .select('tile_key')
        .eq('user_id', user.id);

      if (data) {
        setTiles(prev => {
          const merged = new Set(prev);
          data.forEach(r => merged.add(r.tile_key));
          return merged;
        });
      }
    })();
  }, []);

  const markTile = useCallback(async (key: string) => {
    const updated = await addTileToCache(key);
    setTiles(new Set(updated));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('visited_tiles')
      .upsert({ user_id: user.id, tile_key: key, visited_at: new Date().toISOString() }, { onConflict: 'user_id,tile_key' });
  }, []);

  useEffect(() => {
    if (!coords) return;
    const key = latLngToTileKey(coords.latitude, coords.longitude);
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    if (!tiles.has(key)) markTile(key);
  }, [coords, tiles, markTile]);

  return { tiles };
}
