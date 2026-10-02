import { Tabs } from 'expo-router';

import { Icon } from '@/components/ui/icon';
import { colors, fonts } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 0, height: 80, paddingTop: 10 },
        tabBarLabelStyle: { fontFamily: fonts.bodyExtraBold, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <Icon name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Card',
          tabBarIcon: ({ color }) => <Icon name="card" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Icon name="profile" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
