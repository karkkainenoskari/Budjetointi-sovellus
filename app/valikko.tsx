import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import Colors from '../constants/Colors';

export default function ValikkoScreen() {
  const router = useRouter();

  const menuItems: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    route: Href;
  }[] = [
    { icon: 'person-outline', label: 'Profiili', route: '/profiili' },
    { icon: 'settings-outline', label: 'Asetukset', route: '/asetukset' },
    { icon: 'airplane-outline', label: 'Lomajaksot', route: '/vacations' },
    { icon: 'repeat-outline', label: 'Toistuvat menot', route: '/recurringExpenses' },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Text style={styles.title}>Valikko</Text>
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route)}
            style={styles.menuItem}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={item.icon}
                size={26}
                color={Colors.evergreen}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
 title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: Colors.textPrimary,
     alignSelf: 'center',
  },
 menuContainer: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
     justifyContent: 'space-between',
    paddingVertical: 16,
     paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
});
