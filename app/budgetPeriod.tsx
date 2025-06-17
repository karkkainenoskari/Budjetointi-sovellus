import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
   Modal,
  TouchableWithoutFeedback,

} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';
import { createBudgetPeriod } from '../src/services/budget';
import { getCategories } from '../src/services/categories';
import Colors from '../constants/Colors';

export default function BudgetPeriodScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [income, setIncome] = useState<string>('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [allocated, setAllocated] = useState(0);
  const [error, setError] = useState('');

  const openStartPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: startDate,
        mode: 'date',
        display: 'calendar',
        onChange: (_, d) => {
          if (d) setStartDate(d);
        },
      });
    } else {
      setShowStartPicker(true);
    }
  };

  const openEndPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: endDate,
        mode: 'date',
        display: 'calendar',
        onChange: (_, d) => {
          if (d) setEndDate(d);
        },
      });
    } else {
      setShowEndPicker(true);
    }
  };

  useEffect(() => {
    if (!userId) return;
    getCategories(userId)
      .then((cats) => {
        const sum = cats
          .filter((c) => c.parentId === null)
          .reduce((tot, c) => tot + c.allocated, 0);
        setAllocated(sum);
      })
      .catch((e) => console.error('getCategories error:', e));
  }, [userId]);

  const remaining = (parseFloat(income.replace(',', '.')) || 0) - allocated;

  const handleSave = async () => {
    if (!userId) return;
    const total = parseFloat(income.replace(',', '.'));
    if (isNaN(total)) {
      setError('Anna kelvollinen tulosumma');
      return;
    }
    if (startDate > endDate) {
      setError('Alkupäivä ei voi olla loppupäivän jälkeen');
      return;
    }
    try {
      await createBudgetPeriod(userId, {
        startDate,
        endDate,
        totalAmount: total,
      });
      router.back();
    } catch (e) {
      console.error('createBudgetPeriod error:', e);
      setError('Tallennus epäonnistui');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.evergreen} />
        </TouchableOpacity>
        <Text style={styles.title}>Budjettijakso</Text>
      </View>
       <Text style={styles.label}>Aloitus ajankohta</Text>
      <TouchableOpacity
        style={styles.dateButton}
         onPress={openStartPicker}
      >
        <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
        <Text style={styles.dateButtonText}>
          {startDate.toLocaleDateString('fi-FI')}
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
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPressOut={() => setShowStartPicker(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  locale="fi-FI"
                  style={Platform.OS === 'ios' ? styles.inlinePicker : undefined}
                  onChange={(_, d) => {
                    setShowStartPicker(false);
                    if (d) setStartDate(d);
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      )}
      <Text style={styles.label}>Päättymis ajankohta</Text>
      <TouchableOpacity
        style={styles.dateButton}
         onPress={openEndPicker}
      >
        <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
        <Text style={styles.dateButtonText}>
          {endDate.toLocaleDateString('fi-FI')}
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
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPressOut={() => setShowEndPicker(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  locale="fi-FI"
                  style={Platform.OS === 'ios' ? styles.inlinePicker : undefined}
                  onChange={(_, d) => {
                    setShowEndPicker(false);
                    if (d) setEndDate(d);
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      )}
       <Text style={styles.label}>Kokonais budjetti (€)</Text>
      <TextInput
        style={styles.input}
         placeholder="Kokonais budjetti (€)"
        placeholderTextColor="#888"
        keyboardType="numeric"
        value={income}
        onChangeText={setIncome}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.remainingText}>
        Jäljellä budjetoitavaa: {remaining} €
      </Text>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Tallenna jakso</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  input: {
    height: 48,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
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
  saveButton: {
    height: 48,
    backgroundColor: Colors.moss,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#B00020',
    marginBottom: 8,
    fontSize: 14,
  },
  remainingText: {
    backgroundColor: '#FFF3B0',
    padding: 6,
    borderRadius: 4,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  inlinePicker: {
    alignSelf: 'center',
  },
   pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
  },
});