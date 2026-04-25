import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../hooks/useLocation';
import { useVisitedTiles } from '../../hooks/useVisitedTiles';
import { tileKeyToRect } from '../../lib/tiles';
import { COLORS, TILE_SIZE } from '../../constants';

const FOG_COLOR = 'rgba(20,20,30,0.82)';
const MAX_FOG_TILES = 300;

function tilePolygon(key: string) {
  const { minLat, maxLat, minLng, maxLng } = tileKeyToRect(key);
  return [
    { latitude: minLat, longitude: minLng },
    { latitude: minLat, longitude: maxLng },
    { latitude: maxLat, longitude: maxLng },
    { latitude: maxLat, longitude: minLng },
  ];
}

export default function MapScreen() {
  const { coords, error } = useLocation();
  const { tiles } = useVisitedTiles(coords);
  const insets = useSafeAreaInsets();

  const initialRegion = {
    latitude: coords?.latitude ?? 20,
    longitude: coords?.longitude ?? 0,
    latitudeDelta: coords ? 0.05 : 60,
    longitudeDelta: coords ? 0.05 : 60,
  };

  const [region, setRegion] = useState<Region>(initialRegion);
  const kmSquared = (tiles.size * 1.1).toFixed(0);

  const fogTiles = useMemo(() => {
    if (region.latitudeDelta > 0.15) return [];

    const buf = TILE_SIZE * 2;
    const minLat = region.latitude - region.latitudeDelta - buf;
    const maxLat = region.latitude + region.latitudeDelta + buf;
    const minLng = region.longitude - region.longitudeDelta - buf;
    const maxLng = region.longitude + region.longitudeDelta + buf;

    const startX = Math.floor(minLng / TILE_SIZE);
    const endX = Math.ceil(maxLng / TILE_SIZE);
    const startY = Math.floor(minLat / TILE_SIZE);
    const endY = Math.ceil(maxLat / TILE_SIZE);

    const result: string[] = [];
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x}_${y}`;
        if (!tiles.has(key)) result.push(key);
        if (result.length >= MAX_FOG_TILES) return result;
      }
    }
    return result;
  }, [region, tiles]);

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorIcon}>📍</Text>
        <Text style={s.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapType="standard"
        showsUserLocation
        followsUserLocation={!!coords}
        initialRegion={initialRegion}
        onRegionChangeComplete={setRegion}
      >
        {fogTiles.map(key => (
          <Polygon
            key={key}
            coordinates={tilePolygon(key)}
            fillColor={FOG_COLOR}
            strokeColor="rgba(0,0,0,0)"
            strokeWidth={0}
            tappable={false}
          />
        ))}
      </MapView>

      <View style={[s.topBadge, { top: insets.top + 12 }]}>
        <Text style={s.appName}>🌍 World Explorer</Text>
      </View>

      <View style={s.bottomBadge}>
        <View style={s.stat}>
          <Text style={s.statValue}>{tiles.size}</Text>
          <Text style={s.statLabel}>tiles</Text>
        </View>
        <View style={s.divider} />
        <View style={s.stat}>
          <Text style={s.statValue}>~{kmSquared}</Text>
          <Text style={s.statLabel}>km²</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorIcon: { fontSize: 36 },
  errorText: { color: COLORS.danger, fontSize: 14 },
  topBadge: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: 'rgba(10,10,10,0.75)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  appName: { color: COLORS.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  bottomBadge: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
  },
  stat: { alignItems: 'center', paddingHorizontal: 12 },
  statValue: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
});
