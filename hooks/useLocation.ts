import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setCoords({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });

      subRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 20 },
        (loc) => {
          if (active) setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      );
    })();

    return () => {
      active = false;
      subRef.current?.remove();
    };
  }, []);

  return { coords, error };
}
