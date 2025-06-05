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
import { auth } from '../../src/api/firebaseConfig'; // Huom: polku on pari hakemistoa ylöspäin

// Esimerkkikategoriadata (kovakoodattu). Myöhemmin korvaa Firebasen datalla.
const EXAMPLE_CATEGORIES = [
  { id: '1', title: 'Lainat', allocated: 1500 },
  { id: '2', title: 'Ruoka', allocated: 400 },
  { id: '3', title: 'Vakuutukset', allocated: 150 },
  { id: '4', title: 'Liikenne', allocated: 200 },
];

export default function BudjettiScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'plan' | 'spent' | 'left'>('plan');

  // Jos haluat oikean logout‐toiminnallisuuden, käytä:
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // RootLayout ohjaa tämän jälkeen automaattisesti takaisin /login
    } catch (err) {
      console.log('Kirjaudu ulos -virhe:', err);
    }
  };

  // Kategorianäkymän renderöitsijä
  const renderCategoryItem = ({ item }: { item: typeof EXAMPLE_CATEGORIES[0] }) => {
    const spent = 0; // Esimerkkiä varten nolla; korvaa todellisella luvulla Firebasesta
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
          <Text style={styles.categoryTitle}>{item.title}</Text>
          <TouchableOpacity
            onPress={() => {
              // Navigoi esim. alikategoria‐ruudulle:
              // router.push(`/categories/${item.id}/subcategories/new`);
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
      {/* ──────────── Header: Hamburger + “Budjettijakso” + Kynä + Logout ──────────── */}
      <View style={styles.headerContainer}>
        {/* Hambuger‐painike otsikon vasemmalla puolella */}
        <TouchableOpacity
          onPress={() => {
            // TODO: avaa drawer tai muu sivuvalikko
            Alert.alert('Menu', 'Tämä voisi avata drawer‐valikon.');
          }}
          style={styles.hamburgerButton}
        >
          <Ionicons name="menu-outline" size={26} color="#333" />
        </TouchableOpacity>

        {/* Budjettijakson teksti */}
        <View style={styles.budgetPeriodContainer}>
          <Text style={styles.budgetPeriodText}>Budjettijakso: 13.4 – 12.5</Text>
        </View>

        {/* Kynä (muokkaa jaksoa) ja uloskirjautuminen */}
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => {
              // router.push('/settings/budget-period');
              Alert.alert('Muokkaa', 'Tähän voisi siirtyä jakson muokkausruudulle.');
            }}
            style={styles.iconButton}
          >
            <Ionicons name="pencil" size={22} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color="#c0392b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ──────────── Alavalikko: Suunnitelma / Käytetty / Jäljellä ──────────── */}
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

      {/* ──────────── Kategoriat FlatListillä ──────────── */}
      <FlatList
        data={EXAMPLE_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => {
              // router.push('/categories/new');
              Alert.alert('Lisää Kategoria', 'Tähän voisi avautua uusi lomake.');
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#f1c40f" />
            <Text style={styles.addCategoryText}>Lisää pääkategoria</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
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

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  categoryTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
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
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingVertical: 10,
  },
  addCategoryText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#f1c40f',
    fontWeight: '600',
  },
});
