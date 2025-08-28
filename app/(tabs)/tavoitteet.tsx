import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
   Modal,
  TextInput,
} from 'react-native';
import Colors from '../../constants/Colors';
import { getGoals, addGoal, updateGoal, deleteGoal, Goal } from '../../src/services/goals';
import { auth } from '../../src/api/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCategories, addCategory, updateCategory } from '../../src/services/categories';
import Svg, { Circle } from 'react-native-svg';

export default function TavoitteetScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;


 const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalStartDate, setNewGoalStartDate] = useState(new Date());
  const [newGoalDate, setNewGoalDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
   const [monthlyNeeded, setMonthlyNeeded] = useState(0);

  useEffect(() => {
    const target = parseFloat(newGoalAmount);
    if (!isNaN(target)) {
      const monthsRemaining =
        (newGoalDate.getFullYear() - newGoalStartDate.getFullYear()) * 12 +
        (newGoalDate.getMonth() - newGoalStartDate.getMonth()) +
        1;
      if (monthsRemaining > 0) {
        setMonthlyNeeded(target / monthsRemaining);
      } else {
        setMonthlyNeeded(0);
      }
    } else {
      setMonthlyNeeded(0);
    }
}, [newGoalAmount, newGoalDate, newGoalStartDate]);

   const getProgressColor = (percent: number) => {
    if (percent < 25) return Colors.danger;
    if (percent < 75) return Colors.warning;
    return Colors.success;
  };

  const getMotivationMessage = (percent: number) => {
    if (percent >= 100) return '🎉 Onneksi olkoon, tavoite saavutettu!';
    if (percent >= 75) return 'Melkein perillä, maali häämöttää!';
    if (percent >= 25) return 'Olet jo pitkällä, vielä vähän matkaa!';
    return 'Ensiaskeleet otettu, tästä se lähtee!';
  };

  const getGoalIconName = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('matka') || lower.includes('loma')) return 'airplane-outline';
    if (lower.includes('pel') || lower.includes('konsoli')) return 'game-controller-outline';
    if (lower.includes('tietokone') || lower.includes('pc') || lower.includes('laptop'))
      return 'laptop-outline';
    if (lower.includes('auto')) return 'car-outline';
    return 'flag-outline';
  };

  useEffect(() => {
    if (!userId) return;
    setLoadingGoals(true);
    getGoals(userId)
      .then((g) => {
        setGoals(g);
      })
      .catch((e) => {
        console.error('getGoals virhe:', e);
      })
      .finally(() => setLoadingGoals(false));
  }, [userId]);

  // Lisää tavoite
  const handleAddGoal = () => {
    setAddModalVisible(true);
  };

  const handleSaveNewGoal = async () => {
    if (!userId) return;
    const title = newGoalTitle.trim();
    const target = parseFloat(newGoalAmount);
    if (!title) {
      Alert.alert('Virhe', 'Anna otsikko');
      return;
    }
    if (isNaN(target) || target <= 0) {
      Alert.alert('Virhe', 'Anna kelvollinen summa');
      return;
      }
    if (newGoalStartDate > newGoalDate) {
      Alert.alert('Virhe', 'Aloituspäivä ei voi olla deadlinea myöhemmin');
      return;
    }
    
     const ensureSavingsCategory = async (
      goalTitle: string,
      monthlyAmount: number
    ) => {
      const categories = await getCategories(userId);
      let savingsMain = categories.find(
        (c) => c.parentId === null && c.title.toLowerCase() === 'säästäminen'
      );
      if (!savingsMain) {
        const mainId = await addCategory(userId, {
          title: 'Säästäminen',
          allocated: 0,
          parentId: null,
          type: 'main',
        });
        savingsMain = {
          id: mainId,
          title: 'Säästäminen',
          allocated: 0,
          parentId: null,
          type: 'main',
          createdAt: null,
        } as any;
      }
      const existing = categories.find(
        (c) => c.parentId === savingsMain!.id && c.title.toLowerCase() === goalTitle.toLowerCase()
      );
      if (existing) {
        await updateCategory(userId, existing.id, {
          title: existing.title,
          allocated: monthlyAmount,
        });
      } else {
        await addCategory(userId, {
          title: goalTitle,
          allocated: monthlyAmount,
          parentId: savingsMain!.id,
          type: 'sub',
        });
      }
    };

    try {
      await addGoal(userId, {
        title,
        targetAmount: target,
        startDate: newGoalStartDate,
        deadline: newGoalDate,
      });
      await ensureSavingsCategory(title, monthlyNeeded);
      const updated = await getGoals(userId);
      setGoals(updated);
      setAddModalVisible(false);
      setNewGoalTitle('');
      setNewGoalAmount('');
      setNewGoalStartDate(new Date());
      setNewGoalDate(new Date());
    } catch (e) {
      console.error('addGoal virhe:', e);
    }
  };

  // Muokkaa tavoitetta
  const handleEditGoal = (goal: Goal) => {
    Alert.prompt(
      'Muokkaa tavoitetta',
      `Syötä uusi otsikko ja summa muodossa “${goal.title}, ${goal.targetAmount}”:`,
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Tallenna',
          onPress: async (input) => {
            if (!input || !userId) return;
            const parts = input.split(',');
            if (parts.length !== 2) {
              Alert.alert('Virhe', 'Muoto: “Otsikko, 1000”');
              return;
            }
            const title = parts[0].trim();
            const target = parseFloat(parts[1].trim());
            if (isNaN(target) || target <= 0) {
              Alert.alert('Virhe', 'Anna kelvollinen summa');
              return;
            }
            // Päivitä deadline oletuksena yllä
            const now = new Date();
            const deadline = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
              const startDate = goal.startDate?.toDate
              ? goal.startDate.toDate()
              : new Date(goal.startDate);
            await updateGoal(userId, goal.id, {
              title,
              targetAmount: target,
               startDate,
              deadline,
              currentSaved: goal.currentSaved,
            });
            const updated = await getGoals(userId);
            setGoals(updated);
          },
        },
      ],
      'plain-text',
      `${goal.title}, ${goal.targetAmount}`
    );
  };

  // Poista tavoite
  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Poista tavoite',
      'Haluatko varmasti poistaa tämän tavoitteen?',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Poista',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            await deleteGoal(userId, goalId);
            const updated = await getGoals(userId);
            setGoals(updated);
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={{ color: Colors.textPrimary }}>Kirjaudu sisään, kiitos.</Text>
      </SafeAreaView>
    );
  }

  if (loadingGoals) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </SafeAreaView>
    );
  }

   const totalGoals = goals.length;
  const averageProgress =
    totalGoals > 0
      ? Math.round(
          goals.reduce(
            (sum, g) => sum + (g.currentSaved / g.targetAmount) * 100,
            0
          ) / totalGoals
        )
      : 0;

  return (
    <SafeAreaView style={styles.safeContainer}>
     <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Uusi tavoite</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Otsikko"
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Tavoitesumma €"
              value={newGoalAmount}
              onChangeText={setNewGoalAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                Aloitus: {newGoalStartDate.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={newGoalStartDate}
                mode="date"
                display="default"
                locale="fi-FI"
                onChange={(e, d) => {
                  setShowStartPicker(false);
                  if (d) setNewGoalStartDate(d);
                }}
              />
            )}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                Deadline: {newGoalDate.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
             {monthlyNeeded > 0 && (
              <Text style={styles.monthlyNeededText}>
                Tarvittava säästö: {monthlyNeeded.toFixed(2)} €/kk
              </Text>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={newGoalDate}
                mode="date"
                display="default"
                locale="fi-FI"
                onChange={(e, d) => {
                  setShowDatePicker(false);
                  if (d) setNewGoalDate(d);
                }}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Peruuta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewGoal}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Tallenna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.pageContent}>
        <View style={styles.headerRow}>
           <Text style={styles.title}>Tavoitteet</Text>
          <TouchableOpacity onPress={handleAddGoal} style={styles.iconButton}>
            <Ionicons name="add-circle-outline" size={26} color={Colors.moss} />
          </TouchableOpacity>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Sinulla on {totalGoals} tavoitetta, keskimäärin {averageProgress}% saavutettu.
          </Text>
        </View>

       <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
          const percent = Math.min((item.currentSaved / item.targetAmount) * 100, 100);
          const deadlineDate =
            item.deadline?.toDate ? item.deadline.toDate() : new Date(item.deadline);
          const daysRemaining = Math.max(
            0,
            Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );
           const startDate =
            item.startDate?.toDate ? item.startDate.toDate() : new Date(item.startDate);
         const monthsTotal =
            (deadlineDate.getFullYear() - startDate.getFullYear()) * 12 +
            (deadlineDate.getMonth() - startDate.getMonth()) +
            1;
          const completedMonths = Math.floor(
            (item.currentSaved / item.targetAmount) * monthsTotal
          );
          const motivation = getMotivationMessage(percent);

          return (
            <View style={styles.goalCard}>
              <View style={styles.goalRow}>
               <View style={styles.goalTitleRow}>
                  <Ionicons
                    name={getGoalIconName(item.title) as any}
                    size={20}
                    color={Colors.moss}
                    style={styles.goalIcon}
                  />
                  <Text style={styles.goalTitle}>{item.title}</Text>
                </View>
                <View style={styles.goalIcons}>
                  <TouchableOpacity
                    onPress={() => handleEditGoal(item)}
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(item.id)}
                    style={styles.iconButtonSmall}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.evergreen} />
                  </TouchableOpacity>
                </View>
              </View>
               <View style={styles.goalContentRow}>
                <View style={styles.circleWrapper}>
                  {(() => {
                    const size = 80;
                    const strokeWidth = 8;
                    const radius = (size - strokeWidth) / 2;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (percent / 100) * circumference;
                    return (
                      <Svg width={size} height={size}>
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={Colors.sageHint}
                          strokeWidth={strokeWidth}
                          fill="none"
                        />
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={getProgressColor(percent)}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </Svg>
                    );
                  })()}
                  <View style={styles.circleLabelContainer}>
                    <Text style={styles.circleLabel}>{percent.toFixed(0)}%</Text>
                    <Text style={styles.circleSubLabel}>
                      {item.currentSaved}€ / {item.targetAmount}€
                    </Text>
                  </View>
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.monthlyAmount}>
                    Säästä {item.monthlyAmount.toFixed(2)} €/kk
                  </Text>
                  <View style={styles.timelineContainer}>
                    {Array.from({ length: monthsTotal }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.timelineSegment,
                          i < completedMonths && {
                            backgroundColor: getProgressColor(percent),
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.daysRemaining}>{daysRemaining} päivää jäljellä</Text>
                  <Text style={styles.motivationText}>{motivation}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
      alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
   pageContent: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 24,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  iconButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
   summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: 24,
  },
  goalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    marginRight: 6,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  goalIcons: {
    flexDirection: 'row',
  },
  iconButtonSmall: {
    marginLeft: 8,
  },
  monthlyAmount: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
 goalContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  circleWrapper: {
    width: 80,
    height: 80,
    marginRight: 12,
    position: 'relative',
  },
  circleLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  circleSubLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timelineSegment: {
    flex: 1,
    height: 4,
    marginHorizontal: 1,
    backgroundColor: Colors.sageHint,
  },
  daysRemaining: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
    },
  motivationText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textPrimary,
  },
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    backgroundColor: Colors.background,
  },
  dateButtonText: {
    color: Colors.textPrimary,
  },
  monthlyNeededText: {
    marginBottom: 12,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  modalCancelText: {
    color: Colors.textPrimary,
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 4,
  },
  modalSaveText: {
    color: Colors.buttonPrimaryText,
  },
});
