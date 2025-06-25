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
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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
   seedDefaultCategories,
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
import { formatMonthRange } from '@/src/utils';
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

   const formatBudgetText = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const decimals = (cleaned.split(/[,.]/)[1] || '').length;
    const num = parseFloat(cleaned.replace(',', '.'));
    if (isNaN(num)) return '';
    return num
      .toLocaleString('fi-FI', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      .replace(/\u00A0/g, ' ');
  };

  const handleNewPeriodTotalChange = (value: string) => {
    setNewPeriodTotal(formatBudgetText(value));
  };

     const openStartPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: newPeriodStart,
        mode: 'date',
        display: 'calendar',
        onChange: (_, d) => {
          if (d) setNewPeriodStart(d);
        },
      });
    } else {
      setShowStartPicker(true);
    }
  };

  const openEndPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: newPeriodEnd,
        mode: 'date',
        display: 'calendar',
        onChange: (_, d) => {
          if (d) setNewPeriodEnd(d);
        },
      });
    } else {
      setShowEndPicker(true);
    }
  };
  // Jaksojen valinta
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [viewPeriodId, setViewPeriodId] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');

   const loadCurrentPeriod = async (active: { current: boolean }) => {
    if (!userId) return;
    try {
      const bp = await getCurrentBudgetPeriod(userId);
      if (!active.current) return;
      if (!bp) {
        setBudgetPeriod(null);
        setViewPeriodId(null);
        setCurrentPeriodId('');
        setCategories([]);
        setExpensesByCategory({});
        setLoadingCategories(false);
        setLoadingExpenses(false);
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
    } catch (e) {
      console.error('getCurrentBudgetPeriod virhe:', e);
    }
  };

 // Kokonaissummat
  const totalAllocated = categories
     .filter((cat) => !cat.title.toLowerCase().includes('yhteensä'))
    .reduce((sum, cat) => sum + cat.allocated, 0);
    
  const budgetUnallocated = budgetPeriod
    ? budgetPeriod.totalAmount - totalAllocated
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

    const active = { current: true };

    setLoadingPeriod(true);
    
    loadCurrentPeriod(active).finally(() => {
      if (active.current) setLoadingPeriod(false);
    });
    return () => {
      active.current = false;
    };
  }, [userId]);

   useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      const active = { current: true };
      setLoadingPeriod(true);
      loadCurrentPeriod(active).finally(() => {
        if (active.current) setLoadingPeriod(false);
      });
      
      return () => {
        active.current = false;
      };
   }, [userId])
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
              // Laske kaikkien muiden kategorioiden varaukset (paitsi "yhteensä"-rivien)
            const sumOthers = categories
              .filter(
                (c) =>
                  c.id !== categoryId &&
                  !c.title.toLowerCase().includes('yhteensä')
              )
              .reduce((sum, c) => sum + c.allocated, 0);
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
      `Anna uusi budjetin loppusumma. Nykyinen budjettisi on: ${budgetPeriod.totalAmount} €`,
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
      setNewPeriodTotal(formatBudgetText(String(budgetPeriod.totalAmount)));
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
    const total = parseFloat(newPeriodTotal.replace(/\s/g, '').replace(',', '.'));
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
       let updatedCats = await getCategories(userId);
      if (updatedCats.length === 0) {
        await seedDefaultCategories(userId);
        updatedCats = await getCategories(userId);
      }
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

     // Laske pääkategorian varatut ja käytetyt summat alakategoriat huomioiden
    let totalAllocatedForMain = item.allocated;
    let totalSpentForMain = 0;
    categories.forEach((cat) => {
      if (cat.parentId === item.id) {
        // Älä lisää "yhteensä"-riviä varattuihin summiin
        if (!cat.title.toLowerCase().includes('yhteensä')) {
          totalAllocatedForMain += cat.allocated;
        }
        totalSpentForMain += expensesByCategory[cat.id] || 0;
      }
    });
    totalSpentForMain += expensesByCategory[item.id] || 0;

    const spent = totalSpentForMain;
     const left = totalAllocatedForMain - spent;
    let mainValue: number;
    let mainLabel: string;

    if (selectedTab === 'plan') {
      mainValue = totalAllocatedForMain;
    } else if (selectedTab === 'spent') {
      mainValue = spent;

    } else {
      mainValue = left;

    }

    const subCategories = categories.filter((c) => c.parentId === item.id);

    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryLeft}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
           
          {!readOnly && (
            <>
              
              {selectedTab === 'plan' && (
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(item.id)}
                  style={styles.iconButtonSmall}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.evergreen} />
                </TouchableOpacity>
              )}
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

            const isTotalRow = sub.title.toLowerCase().includes('yhteensä');
            const displayValue = isTotalRow ? mainValue : subValue;

            let subTitle = sub.title;
            if (isTotalRow) {
              if (selectedTab === 'plan') {
                subTitle = 'Lainat yhteensä';
              } else if (selectedTab === 'spent') {
                subTitle = 'Käytetty yhteensä';
              } else {
                subTitle = 'Jäljellä yhteensä';
              }
            }

            return (
              <View key={sub.id} style={styles.subCategoryRow}>
                <View style={styles.subCategoryLeft}>
                   <Text
                    style={[
                      styles.subCategoryTitle,
                      isTotalRow && styles.subCategoryTotalTitle,
                    ]}
                  >
                    {subTitle}
                  </Text>
                   {!readOnly && (
                    <>
                      {selectedTab === 'plan' && (
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
                        </>
                      )}
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
              <Text
                style={[
                  styles.subCategoryValue,
                  isTotalRow && styles.subCategoryTotalValue,
                ]}
              >
                {displayValue} €
              </Text>
            </View>
            );
          })}

        {!readOnly && (
            <TouchableOpacity onPress={() => handleOpenAddSubcategory(item.id)}>
              <Text style={styles.addSubcatText}>+ Lisää alakategoria</Text>
            </TouchableOpacity>
          )}
        </View>

         {/* Kokonaissumma näytetään vain alakategorioiden "Yhteensä"-rivillä */}
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
                  <Text style={styles.periodItemText}>{formatMonthRange(item)}</Text>
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
            <Text style={styles.label}>Aloitus ajankohta</Text>
            <TouchableOpacity
              onPress={openStartPicker}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.dateButtonText}>
                {newPeriodStart.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
             {Platform.OS !== 'android' && showStartPicker && (
              <Modal
                transparent
                animationType="fade"
                visible={showStartPicker}
                onRequestClose={() => setShowStartPicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPressOut={() => setShowStartPicker(false)}
                >
                  <TouchableWithoutFeedback>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={newPeriodStart}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        locale="fi-FI"
                        style={Platform.OS === 'ios' ? styles.inlinePicker : undefined}
                        onChange={(_, d) => {
                          setShowStartPicker(false);
                          if (d) setNewPeriodStart(d);
                        }}
                      />
                    </View>
                  </TouchableWithoutFeedback>
                </TouchableOpacity>
              </Modal>
            )}
            <Text style={styles.label}>Päättymis ajankohta</Text>
            <TouchableOpacity
              onPress={openEndPicker}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.dateButtonText}>
                {newPeriodEnd.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
            {Platform.OS !== 'android' && showEndPicker && (
               <Modal
                transparent
                animationType="fade"
                visible={showEndPicker}
                onRequestClose={() => setShowEndPicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPressOut={() => setShowEndPicker(false)}
                >
                  <TouchableWithoutFeedback>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={newPeriodEnd}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        locale="fi-FI"
                        style={Platform.OS === 'ios' ? styles.inlinePicker : undefined}
                        onChange={(_, d) => {
                          setShowEndPicker(false);
                          if (d) setNewPeriodEnd(d);
                        }}
                      />
                    </View>
                  </TouchableWithoutFeedback>
                </TouchableOpacity>
              </Modal>
            )}
             <Text style={styles.label}>Kokonais budjetti (€)</Text>
            <TextInput
              style={styles.modalInput}
               placeholder="Kokonais budjetti (€)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={newPeriodTotal}
               onChangeText={handleNewPeriodTotalChange}
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
           <Image
            source={require('@/assets/images/budjettikoutsi_logo.png')}
            style={styles.noPeriodLogo}
          />
          <Text style={styles.noPeriodText}>
            Sinulla ei ole vielä yhtään luotua budjettijaksoa.
          </Text>
          <TouchableOpacity onPress={handleOpenNewPeriod} style={styles.noPeriodButton}>
            <Text style={styles.noPeriodButtonText}>
              Klikkaa tästä luodaksesi budjettijakson
            </Text>
          </TouchableOpacity>

          
               </View>
      ) : (
        <>
          {/* ─── Budjetti‐header ──────────────────────────────────────────── */}
          <View style={styles.headerContainer}>
            <View style={styles.budgetPeriodContainer}>
              <Text style={styles.budgetPeriodText}>
                {`Budjettijakso: ${
                  viewPeriodId
                    ? formatMonthRange(viewPeriodId)
                    : `${budgetPeriod.startDate.getDate()}.${
                        budgetPeriod.startDate.getMonth() + 1
                      } – ${budgetPeriod.endDate.getDate()}.${
                        budgetPeriod.endDate.getMonth() + 1
                      }`
                }`}
                {readOnly && ' (arkisto)'}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity onPress={() => setShowPeriodModal(true)} style={styles.iconButton}>
                <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>


               <TouchableOpacity onPress={handleEditPeriod} style={styles.iconButton}>
                <Ionicons name="pencil" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenNewPeriod} style={styles.iconButton}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.moss} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                <Ionicons name="log-out-outline" size={22} color={Colors.evergreen} />
              </TouchableOpacity>

             </View> 
          </View>
           {/* Kokonaissummat */}
          <View style={styles.unallocatedContainer}>
            {selectedTab === 'plan' && (
              <>
                <>
                <Text style={styles.unallocatedText}>
                  Lainat yhteensä: {totalAllocated} €
                </Text>
                <Text style={[styles.unallocatedText, styles.remainingHighlight]}>
                  Budjetoitavaa jäljellä: {budgetUnallocated} €
                </Text>
              </>
              </>
            )}
            {selectedTab === 'spent' && (
              <Text style={styles.unallocatedText}>
                Käytetty yhteensä: {totalSpentAll} €
              </Text>
            )}
            {selectedTab === 'left' && (
              <Text style={styles.unallocatedText}>
                Jäljellä yhteensä: {budgetLeftOverall} €
              </Text>
            )}
          </View>

         
        
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
           <View style={styles.categoryHeaderButtons}>
              <TouchableOpacity
                style={[styles.addExpenseButton, styles.headerButtonSpacing]}
                onPress={() => router.push('/addExpense')}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
                <Text style={styles.addExpenseText}>Lisää kulu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMainCategoryButton} onPress={handleAddMainCategory}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
                <Text style={styles.addMainCategoryText}>Lisää kategoria</Text>
              </TouchableOpacity>
            </View>
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
   remainingHighlight: {
    backgroundColor: '#FFF3B0',
    borderRadius: 4,
    paddingHorizontal: 4,
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

categoryHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonSpacing: {
    marginRight: 12,
  },

  /* ── Lisää kulu -painike ── */
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addExpenseText: {
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
  subCategoryTotalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subCategoryValue: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
   subCategoryTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
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
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalInput: {
     width: '100%',
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  dateButton: {
     width: '100%',
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
    inlinePicker: {
    alignSelf: 'center',
  },
   pickerContainer: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
  },
  noPeriodContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  noPeriodText: {
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  noPeriodLogo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 18,
  },
  noPeriodButton: {
    backgroundColor: Colors.moss,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  noPeriodButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodItem: {
    paddingVertical: 8,
  },
  periodItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
