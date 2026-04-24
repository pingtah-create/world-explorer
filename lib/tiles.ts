import AsyncStorage from '@react-native-async-storage/async-storage';
import { TILE_SIZE } from '../constants';

const CACHE_KEY = 'visited_tile_keys';

export function latLngToTileKey(lat: number, lng: number): string {
  const x = Math.floor(lng / TILE_SIZE);
  const y = Math.floor(lat / TILE_SIZE);
  return `${x}_${y}`;
}

export function tileKeyToRect(key: string): {
  minLat: number; maxLat: number; minLng: number; maxLng: number;
} {
  const [x, y] = key.split('_').map(Number);
  return {
    minLng: x * TILE_SIZE,
    maxLng: (x + 1) * TILE_SIZE,
    minLat: y * TILE_SIZE,
    maxLat: (y + 1) * TILE_SIZE,
  };
}

export function tileKeyToHole(key: string): { latitude: number; longitude: number }[] {
  const { minLat, maxLat, minLng, maxLng } = tileKeyToRect(key);
  // Holes must be clockwise (right-hand rule) per react-native-maps spec
  return [
    { latitude: minLat, longitude: minLng }, // SW
    { latitude: maxLat, longitude: minLng }, // NW
    { latitude: maxLat, longitude: maxLng }, // NE
    { latitude: minLat, longitude: maxLng }, // SE
  ];
}

export async function getCachedTiles(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return new Set();
  return new Set(JSON.parse(raw) as string[]);
}

export async function cacheTiles(keys: Set<string>): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(keys)));
}

export async function addTileToCache(key: string): Promise<Set<string>> {
  const tiles = await getCachedTiles();
  tiles.add(key);
  await cacheTiles(tiles);
  return tiles;
}
