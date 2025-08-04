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
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  Image,
  LayoutAnimation,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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
  getIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  Income,
} from '@/src/services/incomes';
import {
  getCurrentBudgetPeriod,
  startNewBudgetPeriod,
  getBudgetPeriodFromHistory,
} from '../../src/services/budget';
import { formatMonthRange } from '@/src/utils';
import {
  getHistoryMonths,
  getHistoryCategories,
  copyPreviousMonthPlan,
} from '../../src/services/history';

export default function BudjettiScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // ─── States ─────────────────────────────────────────────────────────
  // Kategoriat ja lataustila
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState<boolean>(true);
  const [showAddIncome, setShowAddIncome] = useState<boolean>(false);
  const [newIncomeTitle, setNewIncomeTitle] = useState<string>('');
  const [newIncomeAmount, setNewIncomeAmount] = useState<string>('');

  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editIncomeTitle, setEditIncomeTitle] = useState<string>('');
  const [editIncomeAmount, setEditIncomeAmount] = useState<string>('');

  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubTitle, setNewSubTitle] = useState<string>('');
  const [newSubAmount, setNewSubAmount] = useState<string>('');

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryTitle, setEditCategoryTitle] = useState<string>('');
  const [editCategoryAmount, setEditCategoryAmount] = useState<string>('');


  // Kulut summattuna kategoriakohtaisesti
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});
    const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [loadingExpenses, setLoadingExpenses] = useState<boolean>(false);

  // Budjettijakso ja lataustila
  const [budgetPeriod, setBudgetPeriod] = useState<{ startDate: Date; endDate: Date; totalAmount: number } | null>(null);
  const [loadingPeriod, setLoadingPeriod] = useState<boolean>(true);

  // Valittu välilehti: 'plan' | 'spent' | 'left'
  const [selectedTab, setSelectedTab] = useState<'plan' | 'spent' | 'left'>('plan');

  // Uuden budjettijakson modalin tilat
  const [showNewPeriodModal, setShowNewPeriodModal] = useState<boolean>(false);
  const [newPeriodStart, setNewPeriodStart] = useState<Date>(new Date());
  const [newPeriodEnd, setNewPeriodEnd] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
   const [copyPreviousPlanChecked, setCopyPreviousPlanChecked] =
    useState<boolean>(false);

  const formatCurrency = (value: number) =>
    value.toLocaleString('fi-FI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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

     const loadIncomes = async () => {
    if (!userId) return;
    let active = true;
    setLoadingIncomes(true);
    getIncomes(userId)
      .then((incs) => {
        if (active) setIncomes(incs);
      })
      .catch((e) => console.error('getIncomes virhe:', e))
      .finally(() => {
        if (active) setLoadingIncomes(false);
      });
    return () => {
      active = false;
    };
  };

    const loadExpenses = async () => {
    if (!userId || !budgetPeriod) {
      setTotalExpenses(0);
      return;
    }
    setLoadingExpenses(true);
    try {
      const expenses = await getExpensesByPeriod(
        userId,
        budgetPeriod.startDate,
        budgetPeriod.endDate,
      );
      const sums: Record<string, number> = {};
       let total = 0;
      expenses.forEach((exp: Expense) => {
        const catId = exp.categoryId;
        sums[catId] = (sums[catId] || 0) + exp.amount;
        total += exp.amount;
      });
      setExpensesByCategory(sums);
      setTotalExpenses(total);
    } catch (e) {
      console.error('getExpensesByPeriod virhe:', e);
       setTotalExpenses(0);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Kokonaissummat
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  const totalAllocated = categories
    .filter((cat) => !cat.title.toLowerCase().includes('yhteensä'))
    .reduce((sum, cat) => sum + cat.allocated, 0);

   const budgetedPercent = totalIncome > 0 ? totalAllocated / totalIncome : 0;

   const totalSpentAll = totalExpenses;

  const budgetLeftOverall = totalIncome - totalExpenses;
   const unallocatedBudget = totalIncome - totalAllocated;

   const spentPercent = totalIncome > 0 ? totalSpentAll / totalIncome : 0;

     const leftPercent = totalIncome > 0 ? budgetLeftOverall / totalIncome : 0;

 // progress bar removed for simplicity

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
    loadExpenses();
  }, [userId, budgetPeriod]);

  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [userId, budgetPeriod])
  );

   // ─── Fetch incomes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    loadIncomes();
  }, [userId]);


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
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

    const toggleAddSubCategory = (parentId: string) => {
    if (addingSubFor === parentId) {
      setAddingSubFor(null);
      setNewSubTitle('');
      setNewSubAmount('');
    } else {
      setAddingSubFor(parentId);
      setNewSubTitle('');
      setNewSubAmount('');
    }
  };

 const handleAddSubCategory = async (parentId: string) => {
    if (!userId || !budgetPeriod) return;
    if (!newSubTitle.trim()) {
      Alert.alert('Virhe', 'Syötä nimi ja summa');
      return;
    }
    const amt = parseFloat(newSubAmount.replace(',', '.'));
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Virhe', 'Anna kelvollinen summa');
      return;
    }

   const totalBudget = totalIncome;
    const sumOthers = categories
      .filter((c) => !c.title.toLowerCase().includes('yhteensä'))
      .reduce((sum, c) => sum + c.allocated, 0);

    if (sumOthers + amt > totalBudget) {
      Alert.alert('Virhe', 'Budjetti ylittyy');
      return;
    }

    try {
      await addCategory(userId, {
        title: newSubTitle.trim(),
        allocated: amt,
        parentId,
        type: 'sub',
      });
      const updatedCats = await getCategories(userId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCategories(updatedCats);
    } catch (e) {
      console.error('addCategory virhe:', e);
    } finally {
      setAddingSubFor(null);
      setNewSubTitle('');
      setNewSubAmount('');
    }
  };

 const handleAddIncome = () => {
    if (!userId) return;
    if (!newIncomeTitle.trim()) {
      Alert.alert('Virhe', 'Syötä tulo ja summa');
      return;
    }
    const amt = parseFloat(newIncomeAmount.replace(',', '.'));
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Virhe', 'Anna kelvollinen summa');
      return;
    }
    addIncome(userId, { title: newIncomeTitle.trim(), amount: amt })
      .then(loadIncomes)
      .catch((e) => console.error('addIncome virhe:', e));
    setNewIncomeTitle('');
    setNewIncomeAmount('');
     setShowAddIncome(false);
};

  const handleEditIncome = (
    incomeId: string,
    oldTitle: string,
    oldAmount: number
  ) => {
    if (!userId) return;
    setEditingIncomeId(incomeId);
    setEditIncomeTitle(oldTitle);
    setEditIncomeAmount(String(oldAmount));
  };

  const saveIncomeEdit = async (incomeId: string) => {
    if (!userId) return;
    if (!editIncomeTitle.trim()) {
      Alert.alert('Virhe', 'Anna nimi');
      return;
    }
    const amt = parseFloat(editIncomeAmount.replace(',', '.'));
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Virhe', 'Anna kelvollinen summa');
      return;
    }
    try {
      await updateIncome(userId, incomeId, {
        title: editIncomeTitle.trim(),
        amount: amt,
      });
      loadIncomes();
    } catch (e) {
      console.error('updateIncome virhe:', e);
    } finally {
      setEditingIncomeId(null);
      setEditIncomeTitle('');
      setEditIncomeAmount('');
    }
  };

  const cancelIncomeEdit = () => {
    setEditingIncomeId(null);
    setEditIncomeTitle('');
    setEditIncomeAmount('');
  };

  const handleDeleteIncome = (incomeId: string) => {
    if (!userId) return;
    Alert.alert('Poista tulo', 'Haluatko varmasti poistaa tämän tulon?', [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIncome(userId, incomeId);
            loadIncomes();
          } catch (e) {
            console.error('deleteIncome virhe:', e);
          }
        },
      },
    ]);
  };




   const handleEditCategory = (
  categoryId: string,
  oldTitle: string,
  oldAllocated: number
) => {
  if (!userId || !budgetPeriod) return;
  setEditingCategoryId(categoryId);
  setEditCategoryTitle(oldTitle);
  setEditCategoryAmount(String(oldAllocated));
};

 const saveCategoryEdit = async (categoryId: string) => {
  if (!userId || !budgetPeriod) return;
  const totalBudget = totalIncome;
  if (!editCategoryTitle.trim()) {
    Alert.alert('Virhe', 'Anna nimi');
    return;
  }
  const newAlloc = parseFloat(editCategoryAmount.replace(',', '.'));
  if (isNaN(newAlloc) || newAlloc < 0) {
    Alert.alert('Virhe', 'Anna kelvollinen summa');
    return;
  }
  const sumOthers = categories
    .filter((c) => c.id !== categoryId && !c.title.toLowerCase().includes('yhteensä'))
    .reduce((sum, c) => sum + c.allocated, 0);
  if (sumOthers + newAlloc > totalBudget) {
    Alert.alert(
    'Virhe',
      `Et voi varata enempää kuin budjetti. Jo varattuna: ${sumOthers} €. ` +
        `Yritit varata: ${newAlloc} €. Ylittää budjetin (${totalBudget} €).`
    );
 return;
  }
  try {
    await updateCategory(userId, categoryId, {
      title: editCategoryTitle.trim(),
      allocated: newAlloc,
    });
    const updatedCats = await getCategories(userId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategories(updatedCats);
  } catch (e) {
    console.error('updateCategory virhe:', e);
  } finally {
    setEditingCategoryId(null);
    setEditCategoryTitle('');
    setEditCategoryAmount('');
  }
};

const cancelCategoryEdit = () => {
  setEditingCategoryId(null);
  setEditCategoryTitle('');
  setEditCategoryAmount('');
};

const handleDeleteCategory = (categoryId: string) => {
  if (!userId) return;
  Alert.alert(
    'Poista kategoria',
    'Haluatko varmasti poistaa tämän kategorian?',
    [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(userId, categoryId);
            const updatedCats = await getCategories(userId);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
  

  // ─── Start new budget period ───────────────────────────────────────
  const handleOpenNewPeriod = () => {
    if (budgetPeriod) {
      setNewPeriodStart(budgetPeriod.startDate);
      setNewPeriodEnd(budgetPeriod.endDate);
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setNewPeriodStart(start);
      setNewPeriodEnd(end);
    }
    setCopyPreviousPlanChecked(false);
    setShowNewPeriodModal(true);
  };

  const handleCreateNewPeriod = async () => {
    if (!userId) return;
    try {
      await startNewBudgetPeriod(userId, {
        startDate: newPeriodStart,
        endDate: newPeriodEnd,
        totalAmount: 0,
      });
       if (copyPreviousPlanChecked) {
        await copyPreviousMonthPlan(userId);
      }
      setBudgetPeriod({
        startDate: newPeriodStart,
        endDate: newPeriodEnd,
        totalAmount: 0,
      });
      let updatedCats = await getCategories(userId);
      if (updatedCats.length === 0) {
        await seedDefaultCategories(userId);
        updatedCats = await getCategories(userId);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

    const subCategories = categories
      .filter((c) => c.parentId === item.id)
      .sort((a, b) => {
        const aTotal = a.title.toLowerCase().includes('yhteensä');
        const bTotal = b.title.toLowerCase().includes('yhteensä');
        if (aTotal && !bTotal) return 1;
        if (!aTotal && bTotal) return -1;
        return 0;
      });


    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryLeft}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle}>{item.title}</Text>

            <View style={styles.categoryIcons}>
              {!readOnly && selectedTab === 'plan' && (
                 <>
                  <TouchableOpacity
                     onPress={() => toggleAddSubCategory(item.id)}
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={Colors.moss} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(item.id)}
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.iconMuted} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

             {selectedTab === 'plan' && addingSubFor === item.id && (
            <View style={styles.addSubInlineRow}>
              <TextInput
                 style={styles.expenseCategoryInput}
                placeholder="Meno"
                placeholderTextColor="#888"
                value={newSubTitle}
                onChangeText={setNewSubTitle}
              />
              <TextInput
                 style={styles.expenseAmountInput}
                placeholder="Summa"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newSubAmount}
                onChangeText={setNewSubAmount}
              />
              <TouchableOpacity
                onPress={() => handleAddSubCategory(item.id)}
                style={styles.iconButtonSmall}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.moss} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleAddSubCategory(item.id)}
                style={styles.iconButtonSmall}
              >
                <Ionicons name="close-circle-outline" size={20} color={Colors.iconMuted} />
              </TouchableOpacity>
            </View>
          )}


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
                subTitle = 'Yhteensä:';
              } else if (selectedTab === 'spent') {
                subTitle = 'Yhteensä:';
              } else {
                subTitle = 'Yhteensä';
              }
            }

            function startAddSubCategory(id: string): void {
              throw new Error('Function not implemented.');
            }

           return editingCategoryId === sub.id ? (
              <View style={styles.addSubInlineRow} key={sub.id}>
                <TextInput
                  style={styles.expenseCategoryInput}
                  placeholder="Nimi"
                  placeholderTextColor="#888"
                  value={editCategoryTitle}
                  onChangeText={setEditCategoryTitle}
                />
                <TextInput
                   style={styles.expenseAmountInput}
                  placeholder="Summa"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={editCategoryAmount}
                  onChangeText={setEditCategoryAmount}
                />
                <TouchableOpacity
                  onPress={() => saveCategoryEdit(sub.id)}
                  style={styles.iconButtonSmall}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.moss} />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelCategoryEdit} style={styles.iconButtonSmall}>
                  <Ionicons name="close-circle-outline" size={20} color={Colors.iconMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View
                key={sub.id}
                style={[styles.subCategoryRow, isTotalRow && styles.subCategoryTotalRow]}
              >
               {isTotalRow ? (
                  <View style={styles.categoryField}>
                    <Text
                      style={[
                        styles.subCategoryTitle,
                        isTotalRow && styles.subCategoryTotalTitle,
                      ]}
                    >
                      {subTitle}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    disabled={readOnly || selectedTab !== 'plan'}
                    onPress={() =>
                      handleEditCategory(sub.id, sub.title, sub.allocated)
                    }
                     style={[
                      styles.categoryField,
                      selectedTab === 'plan' && styles.editableField,
                    ]}
                  >
                    <Text style={styles.subCategoryTitle}>{subTitle}</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.subCategoryRight}>
                  <TouchableOpacity
                    disabled={readOnly || selectedTab !== 'plan' || isTotalRow}
                    onPress={() =>
                      handleEditCategory(sub.id, sub.title, sub.allocated)
                    }
                    style={[
                      styles.amountField,
                      selectedTab === 'plan' && !isTotalRow && styles.editableField,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subCategoryValue,
                        isTotalRow && styles.subCategoryTotalValue,
                      ]}
                    >
                        {formatCurrency(displayValue)} €
                    </Text>
                  </TouchableOpacity>
                  {!readOnly && !isTotalRow && (
                    <>
                      {selectedTab === 'plan' && (
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(sub.id)}
                          style={styles.iconButtonSmall}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={Colors.iconMuted}
                          />
                        </TouchableOpacity>
                      )}

                       {selectedTab === 'plan' && (
                        <TouchableOpacity
                          onPress={() => startAddSubCategory(sub.id)}
                          style={styles.iconButtonSmall}
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={14}
                            color={Colors.moss}
                          />
                        </TouchableOpacity>
                      )}
                    
                    </>
                  )}
                </View>
              </View>
            );
          })}

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
            <Text style={styles.label}>Alku</Text>
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
            <Text style={styles.label}>Loppu</Text>
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
             <TouchableOpacity
              style={styles.copyPrevRow}
              onPress={() =>
                setCopyPreviousPlanChecked((prev) => !prev)
              }
            >
              <Ionicons
                name={copyPreviousPlanChecked ? 'checkbox-outline' : 'square-outline'}
                size={20}
                color={Colors.textPrimary}
              />
              <Text style={styles.copyPrevText}>Kopioi edellisen kuukauden suunnitelma</Text>
            </TouchableOpacity>
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
          <View style={styles.budgetPeriodRow}>
            <Text style={styles.budgetPeriodText}>
              {`Budjettijakso: ${viewPeriodId
                  ? formatMonthRange(viewPeriodId)
                  : `${budgetPeriod.startDate.getDate()}.${budgetPeriod.startDate.getMonth() + 1
                  } – ${budgetPeriod.endDate.getDate()}.${budgetPeriod.endDate.getMonth() + 1
                  }`
                }`}
              {readOnly && ' (arkisto)'}
            </Text>
            <TouchableOpacity onPress={() => setShowPeriodModal(true)} style={styles.iconButton}>
              <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenNewPeriod} style={styles.iconButton}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.moss} />
            </TouchableOpacity>
            
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

          {/* Kokonaissummat */}
          <View style={styles.unallocatedContainer}>
            <View style={styles.budgetSummaryContainer}>
              {selectedTab === 'plan' && (
                  <Text
                  style={[
                    styles.unallocatedText,
                     unallocatedBudget === 0 && styles.unallocatedZero,
                  ]}
                >
                  Budjetoitavaa jäljellä{' '}
                  <Text
                    style={[
                      styles.unallocatedValue,
                      unallocatedBudget < 0 && styles.unallocatedNegative,
                      unallocatedBudget === 0 && styles.unallocatedZero,
                    ]}
                  >
                       {incomes.length > 0 || totalAllocated > 0
                      ? `${formatCurrency(unallocatedBudget)} €`
                      : '-'}
                  </Text>{' '}
                </Text>
              )}
              {selectedTab === 'spent' && (
                <Text style={styles.unallocatedText}>
                  Käytetty yhteensä:{' '}
                   <Text style={styles.unallocatedValue}>{formatCurrency(totalSpentAll)} €</Text>
                </Text>
              )}
              {selectedTab === 'left' && (
                <Text style={styles.unallocatedText}>
                    Jäljellä Yhteensä{' '}
                    <Text style={styles.unallocatedValue}>{formatCurrency(budgetLeftOverall)} €</Text>
                </Text>
              )}
             <View style={styles.separator} />
            </View>
          </View>

           <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>

          {/* ─── Tulot ─────────────────────────────────────────────────── */}
          <View style={styles.incomeHeader}>
            <Text style={styles.incomeTitle}>Tulot</Text>
             {selectedTab === 'plan' ? (
              <View style={styles.categoryHeaderButtons}>
                <TouchableOpacity
                  style={styles.addMainCategoryButton}
                  onPress={() => setShowAddIncome(!showAddIncome)}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
                  <Text style={styles.addMainCategoryText}>Lisää tulo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.categoryHeaderButtons}>
                <Text style={styles.addMainCategoryText}>Saadut tulot</Text>
              </View>
            )}
          </View>

          {selectedTab === 'plan' && showAddIncome && (
           <View style={styles.addIncomeRow}>
              <TextInput
                style={styles.inlineInput}
                placeholder="Tulo"
                placeholderTextColor="#888"
                value={newIncomeTitle}
                onChangeText={setNewIncomeTitle}
              />
              <TextInput
                style={styles.inlineInput}
                placeholder="Summa"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newIncomeAmount}
                onChangeText={setNewIncomeAmount}
              />
              <TouchableOpacity onPress={handleAddIncome} style={styles.iconButtonSmall}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.moss} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddIncome(false)} style={styles.iconButtonSmall}>
                <Ionicons name="close-circle-outline" size={20} color={Colors.iconMuted} />
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={incomes}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
             editingIncomeId === item.id ? (
                <View style={styles.categoryCard}>
                  <TextInput
                    style={styles.inlineInput}
                    value={editIncomeTitle}
                    onChangeText={setEditIncomeTitle}
                    placeholder="Nimi"
                    placeholderTextColor="#888"
                  />
                  <TextInput
                    style={styles.inlineInput}
                    value={editIncomeAmount}
                    onChangeText={setEditIncomeAmount}
                    placeholder="Summa"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => saveIncomeEdit(item.id)}
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.moss} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelIncomeEdit} style={styles.iconButtonSmall}>
                    <Ionicons name="close-circle-outline" size={20} color={Colors.iconMuted} />
                  </TouchableOpacity>
                    </View>
              ) : (
                <View style={styles.categoryCard}>
                  <Text style={styles.categoryTitle}>{item.title}</Text>
                  <View style={styles.categoryRight}>
                    <TouchableOpacity
                       disabled={readOnly}
                      onPress={() =>
                        handleEditIncome(item.id, item.title, item.amount)
                      }
                       style={selectedTab === 'plan' ? styles.editableField : undefined}
                    >
                      <Text style={styles.categoryValue}>
                        {formatCurrency(item.amount)} €
                      </Text>
                    </TouchableOpacity>
  
                    {!readOnly && selectedTab === 'plan' && (
                      <TouchableOpacity
                        onPress={() => handleDeleteIncome(item.id)}
                        style={styles.iconButtonSmall}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color={Colors.iconMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                )
            )}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.incomeTotalRow}>
            <Text style={styles.subCategoryTotalTitle}>Saadut tulot yhteensä:</Text>
            <Text style={styles.subCategoryTotalValue}>{formatCurrency(totalIncome)} €</Text>
          </View>

          {/* ─── Menot ───────────────────────────────────────────────────── */}
          <View style={styles.mainCategoryHeader}>
            <Text style={styles.mainCategoryTitle}>Menot</Text>
            {selectedTab === 'plan' ? (
              <View style={styles.categoryHeaderButtons}>
                <TouchableOpacity
                  style={styles.addMainCategoryButton}
                  onPress={handleAddMainCategory}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
                  <Text style={styles.addMainCategoryText}>Lisää meno</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.categoryHeaderButtons} />
            )}
          </View>

          {/* ─── Kategoriat FlatListillä ─────────────────────────────────── */}
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={renderCategoryItem}
            contentContainerStyle={styles.listContent}
          />
           </ScrollView>
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

  budgetPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.tabInactiveBg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,

  },
  budgetPeriodText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },

  unallocatedContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },


  budgetSummaryContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  unallocatedText: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  unallocatedValue: {
    fontWeight: '700',
    fontSize: 18,
  },
  unallocatedNegative: {
    color: Colors.danger,
  },
  unallocatedZero: {
    color: Colors.success,
  },
  remainingHighlight: {
    backgroundColor: '#FFF3B0',
    borderRadius: 4,
    paddingHorizontal: 1,
    paddingVertical: 2,
  },
   separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
  },


  /* ── Tilannevälilehdet ── */
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.tabInactiveBg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
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
    textDecorationLine: 'none',
  },



  /* ── Pääkategoriat otsikko ja Lisää painike ── */
  mainCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20, // aiemmin 12
    marginBottom: 12, // aiemmin 8
  },
  mainCategoryTitle: {
    fontSize: 24, // aiemmin 20
    fontWeight: '700', // vahvempi korostus

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
   incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  incomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  incomeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },


  categoryHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 12, // aiemmin 8
    padding: 16,      // aiemmin 12
    marginBottom: 16, // enemmän tilaa
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2, // Android
  },

  categoryLeft: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  iconButtonSmall: {
    marginLeft: 12,
  },
  addSubInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
      marginBottom: 6,
    paddingHorizontal: 16,
  },
    addIncomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  inlineInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
  },
    expenseCategoryInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
  },
  expenseAmountInput: {
    flex: 1.2,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
     backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  editableField: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
  },
  categoryField: {
    flex: 1,
     height: 40,
    justifyContent: 'center',
    marginRight: 8,
  },
  amountField: {
    flex: 1.2,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
     marginRight: 8,
  },
  subCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    marginTop: 4,
  },
  subCategoryTotalRow: {
    marginTop: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  subCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subCategoryRight: {
     flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',

  },
  subCategoryTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  subCategoryTotalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subCategoryValue: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  subCategoryTotalValue: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryRight: {
      flexDirection: 'row',
    alignItems: 'center',
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
  copyPrevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  copyPrevText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textPrimary,
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
    fontSize: 20,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    maxWidth: 300,
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
