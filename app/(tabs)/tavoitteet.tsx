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
} from 'react-native';
import Colors from '../../constants/Colors';
import { getGoals, addGoal, updateGoal, deleteGoal, Goal } from '../../src/services/goals';
import { auth } from '../../src/api/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TavoitteetScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true);

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
    // Placeholder‐lomake: pyydetään otsikko, summa, deadline
    Alert.prompt(
      'Uusi tavoite',
      'Syötä otsikko ja tavoitesumma muodossa “Otsikko, 1000”:',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Seuraava',
          onPress: (input) => {
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
            // Valitse deadline päivämääräpainikkeella
            Alert.alert(
              'Lisää deadline manuaalisesti koodiin', // placeholder
              'Toteuta DatePicker UI kun haluat kovalla todennäköisyydellä hahmottaa parannuksia.',
            );
            // Oletetaan, että deadline = kuuden kuukauden päästä (demo)
            const now = new Date();
            const deadline = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
            addGoal(userId, { title, targetAmount: target, deadline })
              .then(async () => {
                const updated = await getGoals(userId);
                setGoals(updated);
              })
              .catch((e) => console.error('addGoal virhe:', e));
          },
        },
      ],
      'plain-text'
    );
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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Tavoitteet</Text>
        <TouchableOpacity onPress={handleAddGoal} style={styles.iconButton}>
          <Ionicons name="add-circle-outline" size={26} color={Colors.moss} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const percent = Math.min((item.currentSaved / item.targetAmount) * 100, 100);
          return (
            <View style={styles.goalCard}>
              <View style={styles.goalRow}>
                <Text style={styles.goalTitle}>{item.title}</Text>
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
                {item.currentSaved}€ / {item.targetAmount}€
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${percent}%`, backgroundColor: getProgressColor(percent) },
                  ]}
                />
              </View>
            </View>
          );
        }}
      />
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  iconButton: {
    marginLeft: 12,
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
});
