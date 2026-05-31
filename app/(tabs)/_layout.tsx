import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { emitOpenComposer } from '../../utils/composeBus';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import { auth } from '../../services/firebase';

export default function TabLayout() {
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.uid);
    }
  }, [currentUser, fetchNotifications]);

  if (!currentUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (currentUser && auth?.currentUser && !auth.currentUser.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6A2FF9',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',

          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: '',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => emitOpenComposer()}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#6A2FF9', alignItems: 'center', justifyContent: 'center', marginTop: -28, borderWidth: 4, borderColor: '#FFFFFF', elevation: 6 }}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
