// app/(tabs)/index.tsx

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/api/firebaseConfig';
import Colors from '../../constants/Colors';

import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  Category,
} from '../../src/services/categories';
import {
  getExpensesByPeriod,
  addExpense,
  Expense,
} from '../../src/services/expenses';
import {
  getCurrentBudgetPeriod,
  setCurrentBudgetPeriod,
} from '../../src/services/budget';

export default function BudjettiScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // ─── States ─────────────────────────────────────────────────────────
  // Kategoriat ja lataustila
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Kulut summattuna kategoriakohtaisesti
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});
  const [loadingExpenses, setLoadingExpenses] = useState<boolean>(false);

  // Budjettijakso ja lataustila
  const [budgetPeriod, setBudgetPeriod] = useState<{ startDate: Date; endDate: Date; totalAmount: number } | null>(null);
  const [loadingPeriod, setLoadingPeriod] = useState<boolean>(true);

  // Valittu välilehti: 'plan' | 'spent' | 'left'
  const [selectedTab, setSelectedTab] = useState<'plan' | 'spent' | 'left'>('plan');

   // Laske paljonko budjetista on vielä varaamatta pääkategorioihin
  const totalAllocated = categories
    .filter((cat) => cat.parentId === null)
    .reduce((sum, cat) => sum + cat.allocated, 0);
  const unallocated = budgetPeriod
    ? Math.max(budgetPeriod.totalAmount - totalAllocated, 0)
    : 0;

  // ─── Fetch current budget period ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    setLoadingPeriod(true);
    getCurrentBudgetPeriod(userId)
      .then((bp) => {
        if (bp) {
          setBudgetPeriod({
            startDate: bp.startDate.toDate(),
            endDate: bp.endDate.toDate(),
            totalAmount: bp.totalAmount,
          });
        } else {
          // Jos ei ole tallennettua jaksoa, aseta oletukseksi nykyinen kalenterikuukausi ja totalAmount = 0
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          setBudgetPeriod({ startDate: start, endDate: end, totalAmount: 0 });
          // Kirjoita Firestoreen oletusjaksoksi
          return setCurrentBudgetPeriod(userId, {
            startDate: start,
            endDate: end,
            totalAmount: 0,
          });
        }
      })
      .catch((e) => {
        console.error('getCurrentBudgetPeriod virhe:', e);
      })
      .finally(() => {
        setLoadingPeriod(false);
      });
  }, [userId]);

  // ─── Fetch categories whenever userId or budgetPeriod changes ────────
  useEffect(() => {
    if (!userId || !budgetPeriod) return;

    let isActive = true;
    setLoadingCategories(true);

    getCategories(userId)
      .then((cats) => {
        if (isActive) {
          setCategories(cats);
        }
      })
      .catch((e) => {
        console.error('getCategories virhe:', e);
      })
      .finally(() => {
        if (isActive) setLoadingCategories(false);
      });

    return () => {
      isActive = false;
    };
  }, [userId, budgetPeriod]);

  // ─── Fetch expenses and sum by category when budgetPeriod changes ────
  useEffect(() => {
    if (!userId || !budgetPeriod) return;

    setLoadingExpenses(true);
    getExpensesByPeriod(userId, budgetPeriod.startDate, budgetPeriod.endDate)
      .then((expenses) => {
        const sums: Record<string, number> = {};
        expenses.forEach((exp: Expense) => {
          const catId = exp.categoryId;
          sums[catId] = (sums[catId] || 0) + exp.amount;
        });
        setExpensesByCategory(sums);
      })
      .catch((e) => {
        console.error('getExpensesByPeriod virhe:', e);
      })
      .finally(() => {
        setLoadingExpenses(false);
      });
  }, [userId, budgetPeriod]);

  // ─── Logout handler ────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!userId) return;
    try {
      await signOut(auth);
      // RootLayout ohjaa takaisin /login
    } catch (err) {
      console.log('Kirjaudu ulos -virhe:', err);
    }
  };

  // ─── Add main category ──────────────────────────────────────────────
  const handleAddMainCategory = () => {
    if (!userId) return;
    Alert.prompt(
      'Uusi pääkategoria',
      'Anna pääkategorian nimi:',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Luo',
          onPress: async (title) => {
            if (!title) return;
            try {
              await addCategory(userId, {
                title: title.trim(),
                allocated: 0,
                parentId: null,
                type: 'main',
              });
              const updatedCats = await getCategories(userId);
              setCategories(updatedCats);
            } catch (e) {
              console.error('addCategory virhe:', e);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // ─── Edit category (title & allocated) ─────────────────────────────
  const handleEditCategory = (categoryId: string, oldTitle: string, oldAllocated: number) => {
    if (!userId || !budgetPeriod) return;
    const totalBudget = budgetPeriod.totalAmount;

    Alert.prompt(
      'Muokkaa kategoriaa',
      `Syötä uusi nimi ja määrä muodossa “Nimi, summa” (vanha: ${oldAllocated} €). Kokonaisbudjetti: ${totalBudget} €`,
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Tallenna',
          onPress: async (input) => {
            if (!input) return;
            const parts = input.split(',');
            if (parts.length !== 2) {
              Alert.alert('Virhe', 'Muoto: “Nimi, 300”');
              return;
            }
            const newTitle = parts[0].trim();
            const newAlloc = parseFloat(parts[1].trim());
            if (isNaN(newAlloc) || newAlloc < 0) {
              Alert.alert('Virhe', 'Anna kelvollinen summa');
              return;
            }
            // Laske muiden pääkategorioiden varaukset
            const mainCats = categories.filter((c) => c.parentId === null);
            let sumOthers = 0;
            mainCats.forEach((cat) => {
              if (cat.id !== categoryId) {
                sumOthers += cat.allocated;
              }
            });
            if (sumOthers + newAlloc > totalBudget) {
              Alert.alert(
                'Virhe',
                `Et voi varata enempää kuin budjetti. Jo varattuna: ${sumOthers} €. `
                  + `Yritit varata: ${newAlloc} €. Ylittää budjetin (${totalBudget} €).`
              );
              return;
            }
            try {
              await updateCategory(userId, categoryId, {
                title: newTitle,
                allocated: newAlloc,
              });
              const updatedCats = await getCategories(userId);
              setCategories(updatedCats);
            } catch (e) {
              console.error('updateCategory virhe:', e);
            }
          },
        },
      ],
      'plain-text',
      `${oldTitle}, ${oldAllocated}`
    );
  };

  // ─── Delete category (and its subcategories) ───────────────────────
  const handleDeleteCategory = (categoryId: string) => {
    if (!userId) return;
    Alert.alert(
      'Poista kategoria',
      'Haluatko varmasti poistaa tämän kategorian ja sen alakategoriat?',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Poista',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(userId, categoryId);
              const updatedCats = await getCategories(userId);
              setCategories(updatedCats);
            } catch (e) {
              console.error('deleteCategory virhe:', e);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // ─── Edit budget period ─────────────────────────────────────────────
  const handleEditPeriod = () => {
    if (!budgetPeriod || !userId) return;
    // Tämän esimerkin tarkoitus on demo, joten kysytään vain totalAmount
    Alert.prompt(
      'Muokkaa budjettijaksoa',
      `Anna uusi budjetin loppusumma tiedonny: nykyinen ${budgetPeriod.totalAmount} €`,
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'OK',
          onPress: async (input) => {
            const newTotal = parseFloat(input || '');
            if (isNaN(newTotal) || newTotal < 0) {
              Alert.alert('Virhe', 'Anna kelvollinen luku.');
              return;
            }
            // Esimerkkinä jätetään päivämäärä samaksi, päivitetään totalAmount
            try {
              await setCurrentBudgetPeriod(userId, {
                startDate: budgetPeriod.startDate,
                endDate: budgetPeriod.endDate,
                totalAmount: newTotal,
              });
              setBudgetPeriod({
                startDate: budgetPeriod.startDate,
                endDate: budgetPeriod.endDate,
                totalAmount: newTotal,
              });
            } catch (e) {
              console.error('setCurrentBudgetPeriod virhe:', e);
            }
          },
        },
      ],
      'plain-text',
      `${budgetPeriod.totalAmount}`
    );
  };

  // ─── Render category item (shows main categories and option to add sub) ─
  const renderCategoryItem = ({ item }: { item: Category }) => {
    if (item.parentId !== null) return null;

    // Laske pääkategorian yhteiset kulut (myös alakategoriat)
    let totalSpentForMain = 0;
    categories.forEach((cat) => {
      if (cat.parentId === item.id) {
        totalSpentForMain += expensesByCategory[cat.id] || 0;
      }
    });
    totalSpentForMain += expensesByCategory[item.id] || 0;

    const spent = totalSpentForMain;
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

    const subCategories = categories.filter((c) => c.parentId === item.id);

    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryLeft}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
            <TouchableOpacity
              onPress={() => handleEditCategory(item.id, item.title, item.allocated)}
              style={styles.iconButtonSmall}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteCategory(item.id)}
              style={styles.iconButtonSmall}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.evergreen} />
            </TouchableOpacity>
          </View>


{subCategories.map((sub) => {
            const subSpent = expensesByCategory[sub.id] || 0;
            const subLeft = sub.allocated - subSpent;
            let subValue: number;
            if (selectedTab === 'plan') {
              subValue = sub.allocated;
            } else if (selectedTab === 'spent') {
              subValue = subSpent;
            } else {
              subValue = subLeft;
            }
            return (
              <View key={sub.id} style={styles.subCategoryRow}>
                <View style={styles.subCategoryLeft}>
                  <Text style={styles.subCategoryTitle}>{sub.title}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleEditCategory(sub.id, sub.title, sub.allocated)
                    }
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(sub.id)}
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={Colors.evergreen}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.subCategoryValue}>{subValue} €</Text>
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Uusi alakategoria',
                'Syötä alakategoria ja mahdollinen jo käytetty summa muodossa "Nimi, 50"',
                [
                  { text: 'Peruuta', style: 'cancel' },
                  {
                    text: 'Luo',
                    onPress: async (input) => {
                      if (!input || !userId) return;
                      const parts = input.split(',');
                      const subTitle = parts[0].trim();
                      const spentPart = parts[1] ? parts[1].trim() : '0';
                      const spentAmount = parseFloat(spentPart);
                      if (isNaN(spentAmount) || spentAmount < 0) {
                        Alert.alert('Virhe', 'Anna kelvollinen summa');
                        return;
                      }
                      try {
                         const newId = await addCategory(userId, {
                          title: subTitle,
                          allocated: 0,
                          parentId: item.id,
                          type: 'sub',
                        });
                        if (spentAmount > 0) {
                          await addExpense(userId, {
                            categoryId: newId,
                            amount: spentAmount,
                            date: new Date(),
                            description: 'Alkukulutus',
                          });
                          setExpensesByCategory((prev) => ({
                            ...prev,
                            [newId]: (prev[newId] || 0) + spentAmount,
                          }));
                        }
                        const updatedCats = await getCategories(userId);
                        setCategories(updatedCats);
                      } catch (e) {
                        console.error('addCategory (sub) virhe:', e);
                      }
                    },
                  },
                ],
                'plain-text'
              );
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

  // ─── Render loading if needed ────────────────────────────────────────
  if (!userId) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: Colors.textPrimary }}>Kirjaudu sisään, kiitos.</Text>
      </View>
    );
  }
  if (loadingPeriod || loadingCategories || loadingExpenses) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </View>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* ─── Budjetti‐header ──────────────────────────────────────────── */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push('/valikko')}
          style={styles.hamburgerButton}
        >
          <Ionicons name="menu-outline" size={26} color={Colors.evergreen} />
        </TouchableOpacity>
        <View style={styles.budgetPeriodContainer}>
          <Text style={styles.budgetPeriodText}>
            {budgetPeriod
              ? `Budjettijakso: ${budgetPeriod.startDate.getDate()}.${budgetPeriod.startDate.getMonth() + 1} – ${budgetPeriod.endDate.getDate()}.${budgetPeriod.endDate.getMonth() + 1} (Total: ${budgetPeriod.totalAmount} €)`
              : 'Budjettijakso: latautuu…'}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleEditPeriod} style={styles.iconButton}>
            <Ionicons name="pencil" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color={Colors.evergreen} />
          </TouchableOpacity>
        </View>
      </View>

       {/* Näytä jäljellä budjetoitava määrä */}
      <View style={styles.unallocatedContainer}>
        <Text style={styles.unallocatedText}>Budjetoimatta: {unallocated} €</Text>
      </View>

      {/* ─── Tilannevälilehdet ────────────────────────────────────────── */}
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

      {/* ─── Pääkategoriat‐otsikko + Lisää ──────────────────────────────── */}
      <View style={styles.mainCategoryHeader}>
        <Text style={styles.mainCategoryTitle}>Pääkategoriat</Text>
        <TouchableOpacity style={styles.addMainCategoryButton} onPress={handleAddMainCategory}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
          <Text style={styles.addMainCategoryText}>Lisää kategoria</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Kategoriat FlatListillä ─────────────────────────────────── */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

   unallocatedContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  unallocatedText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
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

  /* ── Pääkategoriat otsikko ja Lisää painike ── */
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
  subCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    marginTop: 4,
  },
  subCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subCategoryTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  subCategoryValue: {
    fontSize: 16,
    color: Colors.textPrimary,
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
