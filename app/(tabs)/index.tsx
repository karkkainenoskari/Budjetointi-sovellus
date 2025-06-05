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

// Esimerkkikategoriadata (kovakoodattu):
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
      // RootLayout (app/_layout.tsx) huolehtii uudelleenohjauksesta /login
    } catch (err) {
      console.log('Kirjaudu ulos -virhe:', err);
    }
  };

  const handleEditCategory = (categoryId: string) => {
    // Tähän voit laittaa navigoinnin muokkaus‐lomakkeelle, esim.:
    // router.push(`/categories/${categoryId}/edit`);
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
            // Tähän kutsu Firebasen tai muun backendin poisto‐funktio
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
              <Ionicons name="pencil-outline" size={16} color="#555" />
            </TouchableOpacity>
            {/* Poista‐ikoni */}
            <TouchableOpacity
              onPress={() => handleDeleteCategory(item.id)}
              style={styles.iconButtonSmall}
            >
              <Ionicons name="trash-outline" size={16} color="#c0392b" />
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
          <Ionicons name="menu-outline" size={26} color="#333" />
        </TouchableOpacity>
        <View style={styles.budgetPeriodContainer}>
          <Text style={styles.budgetPeriodText}>Budjettijakso: 13.4 – 12.5</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => Alert.alert('Muokkaa', 'Jakson muokkaus puuttuu')}
            style={styles.iconButton}
          >
            <Ionicons name="pencil" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color="#c0392b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Tilannevälilehdet ─── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'plan' && styles.tabButtonSelected]}
          onPress={() => setSelectedTab('plan')}
        >
          <Text style={[styles.tabText, selectedTab === 'plan' && styles.tabTextSelected]}>
            Suunnitelma
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'spent' && styles.tabButtonSelected]}
          onPress={() => setSelectedTab('spent')}
        >
          <Text style={[styles.tabText, selectedTab === 'spent' && styles.tabTextSelected]}>
            Käytetty
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'left' && styles.tabButtonSelected]}
          onPress={() => setSelectedTab('left')}
        >
          <Text style={[styles.tabText, selectedTab === 'left' && styles.tabTextSelected]}>
            Jäljellä
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Pääkategoriat‐otsikko ja Lisää kategoriapainike ─── */}
      <View style={styles.mainCategoryHeader}>
        <Text style={styles.mainCategoryTitle}>Pääkategoriat</Text>
        <TouchableOpacity
          style={styles.addMainCategoryButton}
          onPress={() => {
            Alert.alert('Lisää pääkategoria', 'Toiminto puuttuu vielä');
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#f1c40f" />
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
    backgroundColor: '#fff',
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
    color: '#333',
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
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonSelected: {
    backgroundColor: '#f1c40f',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  tabTextSelected: {
    color: '#000',
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
    color: '#333',
  },
  addMainCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMainCategoryText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#f1c40f',
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
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
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
    color: '#333',
  },
  iconButtonSmall: {
    marginLeft: 8,
  },
  addSubcatText: {
    marginTop: 6,
    color: '#f1c40f',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  categoryValueLabel: {
    fontSize: 12,
    color: '#777',
  },
  categoryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
});
