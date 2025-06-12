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
  Modal,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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
  startNewBudgetPeriod,
   getBudgetPeriodFromHistory,
} from '../../src/services/budget';
import { getHistoryMonths, getHistoryCategories } from '../../src/services/history';

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

 // Alakategorian lisäys -modalin tilat
  const [showAddSubModal, setShowAddSubModal] = useState<boolean>(false);
  const [newSubTitle, setNewSubTitle] = useState<string>('');
  const [newSubAmount, setNewSubAmount] = useState<string>('');
  const [parentForSub, setParentForSub] = useState<string | null>(null);

  // Uuden budjettijakson modalin tilat
  const [showNewPeriodModal, setShowNewPeriodModal] = useState<boolean>(false);
  const [newPeriodStart, setNewPeriodStart] = useState<Date>(new Date());
  const [newPeriodEnd, setNewPeriodEnd] = useState<Date>(new Date());
  const [newPeriodTotal, setNewPeriodTotal] = useState<string>('');
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  // Jaksojen valinta
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [viewPeriodId, setViewPeriodId] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');

  // Laske paljonko budjetista on vielä varaamatta pääkategorioihin
  const totalAllocated = categories
    .filter((cat) => cat.parentId === null)
    .reduce((sum, cat) => sum + cat.allocated, 0);
  const unallocated = budgetPeriod
    ? Math.max(budgetPeriod.totalAmount - totalAllocated, 0)
    : 0;

      // Kokonaisbudjetista jäljellä / käytetty
  const totalSpentAll = Object.values(expensesByCategory).reduce(
    (sum, val) => sum + val,
    0
  );
  const budgetLeftOverall = budgetPeriod
    ? budgetPeriod.totalAmount - totalSpentAll
    : 0;

    const readOnly = viewPeriodId !== currentPeriodId;
  // ─── Fetch current budget period ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    setLoadingPeriod(true);
    getCurrentBudgetPeriod(userId)

     .then(async (bp) => {
        if (!bp) {
          setBudgetPeriod(null);
          setViewPeriodId(null);
          setCurrentPeriodId('');
          const months = await getHistoryMonths(userId);
          months.sort();
          months.reverse();
          setAvailablePeriods(months);
          return;
      

        }
        const period = {
          startDate: bp.startDate.toDate(),
          endDate: bp.endDate.toDate(),
          totalAmount: bp.totalAmount,
        };
        setBudgetPeriod(period);
        const id = `${period.startDate.getFullYear()}-${String(
          period.startDate.getMonth() + 1
        ).padStart(2, '0')}`;
        setViewPeriodId(id);
        setCurrentPeriodId(id);
        const months = await getHistoryMonths(userId);
        if (!months.includes(id)) months.push(id);
        months.sort();
        months.reverse();
        setAvailablePeriods(months);
      })
      .catch((e) => {
        console.error('getCurrentBudgetPeriod virhe:', e);
      })
      .finally(() => {
        setLoadingPeriod(false);
      });
  }, [userId]);

   useFocusEffect(
    React.useCallback(() => {
      if (!userId || !currentPeriodId) return;
      let isActive = true;
      const fetchMonths = async () => {
        try {
          const months = await getHistoryMonths(userId);
          if (!months.includes(currentPeriodId)) months.push(currentPeriodId);
          months.sort();
          months.reverse();
          if (isActive) setAvailablePeriods(months);
        } catch (e) {
          console.error('getHistoryMonths virhe:', e);
        }
      };
      fetchMonths();
      return () => {
        isActive = false;
      };
    }, [userId, currentPeriodId])
  );

  // ─── Fetch categories whenever userId or budgetPeriod changes ────────
  useEffect(() => {
     if (!userId || !budgetPeriod || !viewPeriodId) return;

    let isActive = true;
    setLoadingCategories(true);

    const fetcher =
      viewPeriodId === currentPeriodId
        ? getCategories(userId)
        : getHistoryCategories(userId, viewPeriodId);

    fetcher
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
  }, [userId, budgetPeriod, viewPeriodId]);

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

   // ─── Open add subcategory modal ────────────────────────────────────
  const handleOpenAddSubcategory = (parentId: string) => {
    setParentForSub(parentId);
    setNewSubTitle('');
    setNewSubAmount('');
    setShowAddSubModal(true);
  };

  // ─── Create subcategory from modal ──────────────────────────────────
  const handleCreateSubcategory = async () => {
    if (!userId || !parentForSub) return;
    const title = newSubTitle.trim();
    const amountNum = parseFloat(newSubAmount.replace(',', '.')) || 0;
    if (!title) {
      Alert.alert('Virhe', 'Anna nimi');
      return;
    }
    if (isNaN(amountNum) || amountNum < 0) {
      Alert.alert('Virhe', 'Anna kelvollinen summa');
      return;
    }
    try {
      const newId = await addCategory(userId, {
        title,
        allocated: 0,
        parentId: parentForSub,
        type: 'sub',
      });
      if (amountNum > 0) {
        await addExpense(userId, {
          categoryId: newId,
          amount: amountNum,
          date: new Date(),
          description: 'Alkukulutus',
        });
        setExpensesByCategory((prev) => ({
          ...prev,
          [newId]: (prev[newId] || 0) + amountNum,
        }));
      }
      const updatedCats = await getCategories(userId);
      setCategories(updatedCats);
      setShowAddSubModal(false);
      setParentForSub(null);
    } catch (e) {
      console.error('addCategory (sub) virhe:', e);
    }
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

   // ─── Add expense to category ────────────────────────────────────────
  const handleAddExpenseToCategory = (categoryId: string) => {
    if (!userId) return;
    Alert.prompt(
      'Lisää kulu',
      'Syötä summa (€):',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Tallenna',
          onPress: async (input) => {
            const amount = parseFloat((input || '').replace(',', '.'));
            if (isNaN(amount) || amount <= 0) {
              Alert.alert('Virhe', 'Anna kelvollinen summa');
              return;
            }
            try {
              await addExpense(userId, {
                categoryId,
                amount,
                date: new Date(),
                description: '',
              });
              setExpensesByCategory((prev) => ({
                ...prev,
                [categoryId]: (prev[categoryId] || 0) + amount,
              }));
            } catch (e) {
              console.error('addExpense virhe:', e);
              Alert.alert('Virhe', 'Kulun lisääminen epäonnistui');
            }
          },
        },
      ],
      'plain-text'
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

 // ─── Start new budget period ───────────────────────────────────────
  const handleOpenNewPeriod = () => {
    if (budgetPeriod) {
      setNewPeriodStart(budgetPeriod.startDate);
      setNewPeriodEnd(budgetPeriod.endDate);
      setNewPeriodTotal(String(budgetPeriod.totalAmount));
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setNewPeriodStart(start);
      setNewPeriodEnd(end);
      setNewPeriodTotal('0');
    }
    setShowNewPeriodModal(true);
  };

  const handleCreateNewPeriod = async () => {
    if (!userId) return;
    const total = parseFloat(newPeriodTotal.replace(',', '.'));
    if (isNaN(total) || total < 0) {
      Alert.alert('Virhe', 'Anna kelvollinen summa');
      return;
    }
    try {
      await startNewBudgetPeriod(userId, {
        startDate: newPeriodStart,
        endDate: newPeriodEnd,
        totalAmount: total,
      });
      setBudgetPeriod({
        startDate: newPeriodStart,
        endDate: newPeriodEnd,
        totalAmount: total,
      });
      const updatedCats = await getCategories(userId);
      setCategories(updatedCats);
       const id = `${newPeriodStart.getFullYear()}-${String(
        newPeriodStart.getMonth() + 1
      ).padStart(2, '0')}`;
      setCurrentPeriodId(id);
      setViewPeriodId(id);
      setAvailablePeriods((prev) => {
        const arr = prev.includes(id) ? prev : [id, ...prev];
        arr.sort();
        arr.reverse();
        return arr;
      });
      setShowNewPeriodModal(false);
    } catch (e) {
      console.error('startNewBudgetPeriod virhe:', e);
      Alert.alert('Virhe', 'Uuden jakson aloitus epäonnistui');
    }
  };

  const handleSelectPeriod = async (pid: string) => {
    if (!userId || !pid) return;
    setShowPeriodModal(false);
    setLoadingPeriod(true);
    if (pid === currentPeriodId) {
      setViewPeriodId(pid);
      setLoadingPeriod(false);
      return;
    }
    const hist = await getBudgetPeriodFromHistory(userId, pid);
    if (hist) {
      setBudgetPeriod({
        startDate: hist.startDate.toDate(),
        endDate: hist.endDate.toDate(),
        totalAmount: hist.totalAmount,
      });
    } else {
      const [y, m] = pid.split('-').map((n) => parseInt(n, 10));
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      setBudgetPeriod({ startDate: start, endDate: end, totalAmount: 0 });
    }
    setViewPeriodId(pid);
    setLoadingPeriod(false);
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
           
          {!readOnly && (
            <>
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
              {selectedTab === 'spent' && (
                <TouchableOpacity
                  onPress={() => handleAddExpenseToCategory(item.id)}
                  style={styles.iconButtonSmall}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={Colors.moss}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
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
                   {!readOnly && (
                    <>
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
                      {selectedTab === 'spent' && (
                        <TouchableOpacity
                          onPress={() => handleAddExpenseToCategory(sub.id)}
                          style={styles.iconButtonSmall}
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={16}
                            color={Colors.moss}
                          />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                 
              </View>
              <Text style={styles.subCategoryValue}>{subValue} €</Text>
            </View>
            );
          })}

        {!readOnly && (
            <TouchableOpacity onPress={() => handleOpenAddSubcategory(item.id)}>
              <Text style={styles.addSubcatText}>+ Lisää alakategoria</Text>
            </TouchableOpacity>
          )}
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

       {/* Jakson valinta */}
      <Modal
        transparent
        visible={showPeriodModal}
        animationType="slide"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Valitse jakso</Text>
            <FlatList
              data={availablePeriods}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPeriod(item)}
                  style={styles.periodItem}
                >
                  <Text style={styles.periodItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setShowPeriodModal(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Sulje</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


       {/* Uuden budjettijakson modal */}
      <Modal
        transparent
        visible={showNewPeriodModal}
        animationType="slide"
        onRequestClose={() => setShowNewPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Aloita uusi jakso</Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.dateButtonText}>
                {newPeriodStart.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={newPeriodStart}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  setShowStartPicker(false);
                  if (d) setNewPeriodStart(d);
                }}
              />
            )}
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.dateButtonText}>
                {newPeriodEnd.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={newPeriodEnd}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  setShowEndPicker(false);
                  if (d) setNewPeriodEnd(d);
                }}
              />
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Kokonaisbudjetti (€)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={newPeriodTotal}
              onChangeText={setNewPeriodTotal}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowNewPeriodModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Peruuta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateNewPeriod}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Luo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


         {/* Alakategorian lisäysmodal */}
      <Modal
        transparent
        visible={showAddSubModal}
        animationType="slide"
        onRequestClose={() => {
          setShowAddSubModal(false);
          setParentForSub(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Uusi alakategoria</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nimi"
              placeholderTextColor="#888"
              value={newSubTitle}
              onChangeText={setNewSubTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Jo käytetty summa"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={newSubAmount}
              onChangeText={setNewSubAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddSubModal(false);
                  setParentForSub(null);
                }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Peruuta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSubcategory}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Luo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    {!budgetPeriod ? (
        <View style={styles.noPeriodContainer}>
          <Text style={styles.noPeriodText}>Ei budjettijaksoa</Text>
          <TouchableOpacity onPress={handleOpenNewPeriod} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Luo budjettijakso</Text>
          </TouchableOpacity>
          
               </View>
      ) : (
        <>
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
                {`Budjettijakso: ${budgetPeriod.startDate.getDate()}.${
                  budgetPeriod.startDate.getMonth() + 1
                } – ${budgetPeriod.endDate.getDate()}.${
                  budgetPeriod.endDate.getMonth() + 1
                } (Total: ${budgetPeriod.totalAmount} €)`}
                {readOnly && ' (arkisto)'}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={() => setShowPeriodModal(true)} style={styles.iconButton}>
                <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>


              {!readOnly && (
                <>
                  <TouchableOpacity onPress={handleEditPeriod} style={styles.iconButton}>
                    <Ionicons name="pencil" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOpenNewPeriod} style={styles.iconButton}>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.moss} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                <Ionicons name="log-out-outline" size={22} color={Colors.evergreen} />
              </TouchableOpacity>

             </View> 
          </View>
          {/* Näytä jäljellä budjetoitava määrä */}
          <View style={styles.unallocatedContainer}>
            <Text style={styles.unallocatedText}>Budjetoimatta: {unallocated} €</Text>
          </View>

          {selectedTab === 'left' && (
            <View style={styles.unallocatedContainer}>
              <Text style={styles.unallocatedText}>Jäljellä yhteensä: {budgetLeftOverall} €</Text>
            </View>
          )}

          {/* ─── Tilannevälilehdet ────────────────────────────────────────── */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'plan' && styles.tabButtonSelected]}
              onPress={() => setSelectedTab('plan')}
            >
              <Text style={[styles.tabText, selectedTab === 'plan' && styles.tabTextSelected]}>Suunnitelma</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'spent' && styles.tabButtonSelected]}
              onPress={() => setSelectedTab('spent')}
            >
              <Text style={[styles.tabText, selectedTab === 'spent' && styles.tabTextSelected]}>Käytetty</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'left' && styles.tabButtonSelected]}
              onPress={() => setSelectedTab('left')}
            >
              <Text style={[styles.tabText, selectedTab === 'left' && styles.tabTextSelected]}>Jäljellä</Text>
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
        </>
      )}
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
  /* ── Modal tyylit ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalInput: {
    height: 44,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: Colors.cardBackground,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: Colors.moss,
    fontWeight: '600',
  },
    noPeriodContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  noPeriodText: {
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  periodItem: {
    paddingVertical: 8,
  },
  periodItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
