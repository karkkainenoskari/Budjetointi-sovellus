import React, { useEffect, useState } from 'react';
import {
SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';
import { addVacation, getVacations, deleteVacation, Vacation } from '../src/services/vacations';
import { getExpensesByPeriod } from '../src/services/expenses';
import Colors from '../constants/Colors';

export default function VacationsScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadVacations = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const vacs = await getVacations(userId);
      setVacations(vacs);
    } catch (e) {
      console.error('load vacations error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacations();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addVacation(userId, { title: title.trim(), startDate, endDate });
      setTitle('');
      setStartDate(new Date());
      setEndDate(new Date());
      setShowAdd(false);
      loadVacations();
    } catch (e) {
      console.error('addVacation error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    await deleteVacation(userId, id);
    loadVacations();
  };

  const [vacationsWithTotals, setVacationsWithTotals] = useState<(Vacation & { total: number })[]>([]);

  useEffect(() => {
    const fetchTotals = async () => {
      if (!userId) return;
      const arr: (Vacation & { total: number })[] = [];
      for (const v of vacations) {
        const expenses = await getExpensesByPeriod(userId, v.startDate, v.endDate);
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        arr.push({ ...v, total });
      }
      setVacationsWithTotals(arr);
    };
    fetchTotals();
  }, [vacations, userId]);

  const renderVacationRow = (item: Vacation & { total: number }) => (
    <View key={item.id} style={styles.row}>
      <Ionicons
        name="airplane-outline"
        size={20}
        color={Colors.evergreen}
        style={styles.icon}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{item.title}</Text>
        <Text style={styles.rowSub}>
          {item.startDate.toDate().toLocaleDateString('fi-FI')} -{' '}
          {item.endDate.toDate().toLocaleDateString('fi-FI')} •{' '}
          {item.total.toFixed(2)} €
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color={Colors.iconMuted} />
      </TouchableOpacity>
    </View>
  );

  const openStartPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: startDate,
        mode: 'date',
        display: 'calendar',
        onChange: (_, d) => { if (d) setStartDate(d); },
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
        onChange: (_, d) => { if (d) setEndDate(d); },
      });
    } else {
      setShowEndPicker(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </SafeAreaView>
    );
  }

  return (
     <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.evergreen} />
          </TouchableOpacity>
         <Text style={styles.title}>Lomajaksot</Text>
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
            <Ionicons
              name={showAdd ? 'close' : 'add'}
              size={24}
              color={Colors.evergreen}
            />
          </TouchableOpacity>
          </View>

        {showAdd && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uusi lomajakso</Text>
            <View style={styles.row}>
              <Ionicons
                name="create-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <TextInput
                style={styles.rowInput}
                placeholder="Nimi"
                value={title}
                onChangeText={setTitle}
              />
            </View>
            <View style={styles.row}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <Text style={styles.rowLabel}>Alkaa</Text>
              <TouchableOpacity style={styles.rowButton} onPress={openStartPicker}>
                <Text style={styles.rowButtonText}>
                  {startDate.toLocaleDateString('fi-FI')}
                </Text>
              </TouchableOpacity>
            </View>
            {Platform.OS !== 'android' && showStartPicker && (
              <Modal
                transparent
                animationType="fade"
                visible
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
            <View style={styles.row}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <Text style={styles.rowLabel}>Loppuu</Text>
              <TouchableOpacity style={styles.rowButton} onPress={openEndPicker}>
                <Text style={styles.rowButtonText}>
                  {endDate.toLocaleDateString('fi-FI')}
                </Text>
              </TouchableOpacity>
            </View>
            {Platform.OS !== 'android' && showEndPicker && (
              <Modal
                transparent
                animationType="fade"
                visible
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
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>Tallenna</Text>
            </TouchableOpacity>
          </View>
        )}


      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lomajaksot</Text>
          {vacationsWithTotals.map(renderVacationRow)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { marginRight: 12 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  icon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  rowSub: { fontSize: 14, color: Colors.textSecondary },
  rowInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  rowButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  rowButtonText: { fontSize: 16, color: Colors.textPrimary },
  saveButton: {
    marginTop: 16,
    backgroundColor: Colors.moss,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: Colors.background, fontSize: 18, fontWeight: '600' },
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