// app/(tabs)/tavoitteet.tsx

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

export default function TavoitteetScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;


  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true);

   const [addModalVisible, setAddModalVisible] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

   const getProgressColor = (percent: number) => {
    if (percent < 25) return Colors.danger;
    if (percent < 75) return Colors.warning;
    return Colors.success;
  };

  // Hae tavoitteet Firestoresta
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
    try {
      await addGoal(userId, { title, targetAmount: target, deadline: newGoalDate });
      const updated = await getGoals(userId);
      setGoals(updated);
      setAddModalVisible(false);
      setNewGoalTitle('');
      setNewGoalAmount('');
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
            await updateGoal(userId, goal.id, {
              title,
              targetAmount: target,
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
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                Deadline: {newGoalDate.toLocaleDateString('fi-FI')}
              </Text>
            </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Tavoitteet</Text>
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
          const createdDate =
            item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          const totalDuration = Math.max(1, deadlineDate.getTime() - createdDate.getTime());
          const elapsed = Date.now() - createdDate.getTime();
          const expectedPercent = Math.min((elapsed / totalDuration) * 100, 100);
          const statusMessage =
            percent >= expectedPercent ? 'Olet aikataulussa' : 'Pientä kiriä tarvitaan';

          return (
            <View style={styles.goalCard}>
              <View style={styles.goalRow}>
               <View style={styles.goalTitleRow}>
                  <Ionicons
                    name="flag-outline"
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
              <Text style={styles.goalAmount}>
                 {item.currentSaved}€ / {item.targetAmount}€ ({percent.toFixed(0)}%)
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${percent}%`, backgroundColor: getProgressColor(percent) },
                  ]}
                />
              </View>
               <Text style={styles.daysRemaining}>
                {daysRemaining} päivää jäljellä – {statusMessage}
              </Text>
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
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  marginTop: 15, 
},
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  iconButton: {
    marginLeft: 12,
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
  goalAmount: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.sageHint,
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  daysRemaining: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
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
