// app/(tabs)/index.tsx

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/api/firebaseConfig';
import Colors from '../../constants/Colors';

// Esimerkkikategoriadata (kovakoodattu)
const EXAMPLE_CATEGORIES = [
  { id: '1', title: 'Lainat', allocated: 1500 },
  { id: '2', title: 'Ruoka', allocated: 400 },
  { id: '3', title: 'Vakuutukset', allocated: 150 },
  { id: '4', title: 'Liikenne', allocated: 200 },
];

export default function BudjettiScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'plan' | 'spent' | 'left'>('plan');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // RootLayout ohjaa /login tarjolle
    } catch (err) {
      console.log('Kirjaudu ulos -virhe:', err);
    }
  };

  const handleEditCategory = (categoryId: string) => {
    Alert.alert('Muokkaa kategoriaa', `KategoriaId: ${categoryId}`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Poista kategoria',
      'Haluatko varmasti poistaa tämän kategorian?',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Poista',
          style: 'destructive',
          onPress: () => {
            console.log('Poistetaan kategoria:', categoryId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderCategoryItem = ({ item }: { item: typeof EXAMPLE_CATEGORIES[0] }) => {
    const spent = 0;
    const left = item.allocated - spent;
    let mainValue: number;
    let mainLabel: string;

    if (selectedTab === 'plan') {
      mainValue = item.allocated;
      mainLabel = 'Suunniteltu';
    } else if (selectedTab === 'spent') {
      mainValue = spent;
      mainLabel = 'Käytetty';
    } else {
      mainValue = left;
      mainLabel = 'Jäljellä';
    }

    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryLeft}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
            {/* Muokkaa‐ikoni */}
            <TouchableOpacity
              onPress={() => handleEditCategory(item.id)}
              style={styles.iconButtonSmall}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            {/* Poista‐ikoni */}
            <TouchableOpacity
              onPress={() => handleDeleteCategory(item.id)}
              style={styles.iconButtonSmall}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.evergreen} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              Alert.alert('Lisää alakategoria', 'Toiminto puuttuu vielä');
            }}
          >
            <Text style={styles.addSubcatText}>+ Lisää alakategoria</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRight}>
          <Text style={styles.categoryValueLabel}>{mainLabel}</Text>
          <Text style={styles.categoryValue}>{mainValue} €</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* ─── Budjetti‐header ─── */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => Alert.alert('Menu', 'Tämä voisi avata drawer‐valikon')}
          style={styles.hamburgerButton}
        >
          <Ionicons name="menu-outline" size={26} color={Colors.evergreen} />
        </TouchableOpacity>
        <View style={styles.budgetPeriodContainer}>
          <Text style={styles.budgetPeriodText}>Budjettijakso: 13.4 – 12.5</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => Alert.alert('Muokkaa', 'Jakson muokkaus puuttuu')}
            style={styles.iconButton}
          >
            <Ionicons name="pencil" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color={Colors.evergreen} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Tilannevälilehdet ─── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'plan' && styles.tabButtonSelected,
          ]}
          onPress={() => setSelectedTab('plan')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'plan' && styles.tabTextSelected,
            ]}
          >
            Suunnitelma
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'spent' && styles.tabButtonSelected,
          ]}
          onPress={() => setSelectedTab('spent')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'spent' && styles.tabTextSelected,
            ]}
          >
            Käytetty
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'left' && styles.tabButtonSelected,
          ]}
          onPress={() => setSelectedTab('left')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'left' && styles.tabTextSelected,
            ]}
          >
            Jäljellä
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Pääkategoriat‐otsikko ja Lisää kategoria ─── */}
      <View style={styles.mainCategoryHeader}>
        <Text style={styles.mainCategoryTitle}>Pääkategoriat</Text>
        <TouchableOpacity
          style={styles.addMainCategoryButton}
          onPress={() => {
            Alert.alert('Lisää pääkategoria', 'Toiminto puuttuu vielä');
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
          <Text style={styles.addMainCategoryText}>Lisää kategoria</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Kategoriat listattuna FlatListillä ─── */}
      <FlatList
        data={EXAMPLE_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  /* ── Header ── */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  hamburgerButton: {
    marginRight: 12,
  },
  budgetPeriodContainer: {
    flex: 1,
  },
  budgetPeriodText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 12,
  },

  /* ── Tilannevälilehdet ── */
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: Colors.tabInactiveBg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonSelected: {
    backgroundColor: Colors.moss,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tabTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },

  /* ── Pääkategoriat otsikko ja lisää painike ── */
  mainCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  mainCategoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addMainCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMainCategoryText: {
    marginLeft: 6,
    fontSize: 16,
    color: Colors.moss,
    fontWeight: '600',
  },

  /* ── Kategoriakortin tyylit ── */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryLeft: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  iconButtonSmall: {
    marginLeft: 8,
  },
  addSubcatText: {
    marginTop: 6,
    color: Colors.moss,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  categoryValueLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
