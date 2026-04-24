import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { useLocation } from '../../hooks/useLocation';
import { useVisitedTiles } from '../../hooks/useVisitedTiles';
import { tileKeyToHole } from '../../lib/tiles';
import { COLORS } from '../../constants';

// World polygon corners (covers the entire globe)
const WORLD_COORDS = [
  { latitude: -90, longitude: -180 },
  { latitude: -90, longitude: 180 },
  { latitude: 90, longitude: 180 },
  { latitude: 90, longitude: -180 },
];

export default function MapScreen() {
  const { coords, error } = useLocation();
  const { tiles } = useVisitedTiles(coords);

  const holes = Array.from(tiles).map(tileKeyToHole);

  if (error) {
    return (
      <View style={s.center}>
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

      <View style={s.badge}>
        <Text style={s.badgeText}>{tiles.size} tile{tiles.size !== 1 ? 's' : ''} explored</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.danger },
  badge: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  badgeText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});
