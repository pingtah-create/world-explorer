import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../hooks/useLocation';
import { useVisitedTiles } from '../../hooks/useVisitedTiles';
import { tileKeyToHole } from '../../lib/tiles';
import { COLORS } from '../../constants';

// CCW winding (left-hand rule) fills the interior — holes punch through with CW winding
const WORLD_COORDS = [
  { latitude: -85, longitude: -180 },
  { latitude: -85, longitude: 180 },
  { latitude: 85, longitude: 180 },
  { latitude: 85, longitude: -180 },
];

export default function MapScreen() {
  const { coords, error } = useLocation();
  const { tiles } = useVisitedTiles(coords);
  const insets = useSafeAreaInsets();

  const holes = Array.from(tiles).map(tileKeyToHole);
  const kmSquared = (tiles.size * 1.1).toFixed(0);

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
        initialRegion={
          coords
            ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : { latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 }
        }
      >
        <Polygon
          coordinates={WORLD_COORDS}
          holes={holes}
          fillColor={COLORS.fogColor}
          strokeWidth={0}
        />
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
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.primaryGlow,
  },
  stat: { alignItems: 'center', paddingHorizontal: 12 },
  statValue: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
});
