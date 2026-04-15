import { COLORS, TEXT_STYLES } from '@/constants/fonts';
import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowIcon: false,
        tabBarIcon: () => null,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.dark,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontFamily: TEXT_STYLES.title.fontFamily,
          fontSize: TEXT_STYLES.title.fontSize,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '🏠 Home',
          headerTitle: 'BlackBunny',
          headerTitleAlign: 'center',
          headerRight: () => (
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 32, height: 32, marginRight: 16 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '🔍 Search',
          headerTitle: 'Search',
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '✍️ Create',
          headerTitle: 'Create Post',
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: '💬 Friends',
          headerTitle: 'Friends',
          headerTitleAlign: 'center',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '👤 Profile',
          headerTitle: 'Profile',
          headerTitleAlign: 'center',
        }}
      />
    </Tabs>
  );
}