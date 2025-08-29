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
              <View style={styles.iconCircle}>
              <Ionicons
                name={item.icon}
                size={26}
               color={Colors.background}
              />
            </View>
           <Text style={styles.menuText}>{item.label}</Text>
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
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 16
  },
  menuContainer: {
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  menuItem: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.evergreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
