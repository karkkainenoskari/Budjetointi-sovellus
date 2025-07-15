import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { auth } from '../src/api/firebaseConfig';
import {
  getPayday,
  setPayday,
  getNotificationSettings,
  setNotificationSettings,
} from '../src/services/userSettings';
import { registerPaydayReminder } from '../src/services/notifications';


export default function AsetuksetScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [payday, setPaydayState] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [daysBefore, setDaysBefore] = useState(2);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const d = await getPayday(userId);
        if (d) setPaydayState(String(d));
        const n = await getNotificationSettings(userId);
        if (n) {
          setReminderEnabled(n.paydayReminderEnabled);
          setDaysBefore(n.paydayReminderDaysBefore);
        }
      } catch (e) {
        console.error('Asetusten haku epäonnistui:', e);
      }
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    const dayNum = parseInt(payday, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      Alert.alert('Virhe', 'Syötä kelvollinen palkkapäivä (1-31).');
      return;
    }
    try {
      await setPayday(userId, dayNum);
      await setNotificationSettings(userId, {
        paydayReminderEnabled: reminderEnabled,
        paydayReminderDaysBefore: daysBefore,
      });
      await registerPaydayReminder(userId);
      Alert.alert('Tallennettu', 'Asetukset tallennettu.');
    } catch (e) {
      console.error('Asetusten tallennus epäonnistui:', e);
      Alert.alert('Virhe', 'Asetusten tallentaminen epäonnistui.');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.evergreen} />
        </TouchableOpacity>
        <Text style={styles.title}>Asetukset</Text>
      </View>

       <Text style={styles.label}>Palkkapäivä</Text>
      <TextInput
        style={styles.input}
        placeholder="Esim. 15"
        keyboardType="number-pad"
        value={payday}
        onChangeText={setPaydayState}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Palkkapäivämuistutus</Text>
        <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
      </View>

      <Text style={styles.label}>Muistuta päiviä ennen</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={daysBefore}
          onValueChange={(v) => setDaysBefore(v)}
          style={styles.picker}
          mode="dropdown"
        >
          <Picker.Item label="0" value={0} />
          <Picker.Item label="1" value={1} />
          <Picker.Item label="2" value={2} />
          <Picker.Item label="3" value={3} />
        </Picker>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Tallenna</Text>
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    fontSize: 16,
    color: Colors.textPrimary,
     backgroundColor: Colors.cardBackground,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pickerContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    backgroundColor: Colors.cardBackground,
  },
  picker: {
    height: 50,
    width: '100%',
    color: Colors.textPrimary,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: Colors.moss,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});