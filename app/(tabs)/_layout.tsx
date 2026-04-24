import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

function Icon({ symbol }: { symbol: string }) {
  // Simple emoji icons — replace with a proper icon library when ready
  return <View style={s.iconWrap}><View><Text>{symbol}</Text></View></View>;
}

// Minimal text-based tab icons to avoid adding icon deps at scaffold stage
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺</Text> }}
      />
      <Tabs.Screen
        name="animals"
        options={{ title: 'Pokédex', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🐾</Text> }}
      />
      <Tabs.Screen
        name="camera"
        options={{ title: 'Scan', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 26 }}>📷</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
