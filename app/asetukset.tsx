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
   ScrollView,
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
       <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={Colors.evergreen}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Asetukset</Text>
        </View>

     <View style={styles.section}>
          <Text style={styles.sectionTitle}>Palkkapäivä</Text>
          <View style={styles.row}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.evergreen}
              style={styles.icon}
            />
            <TextInput
              style={styles.rowInput}
              placeholder="Esim. 15"
              keyboardType="number-pad"
              value={payday}
              onChangeText={setPaydayState}
            />
          </View>
        </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muistutukset</Text>
          <View style={styles.row}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={Colors.evergreen}
              style={styles.icon}
            />
            <Text style={styles.rowLabel}>Palkkapäivämuistutus</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
            />
          </View>
          {reminderEnabled && (
            <View style={styles.row}>
              <Ionicons
                name="time-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <Text style={styles.rowLabel}>Muistuta päiviä ennen</Text>
              <Picker
                selectedValue={daysBefore}
                onValueChange={setDaysBefore}
                style={styles.rowPicker}
                mode="dropdown"
              >
                <Picker.Item label="0" value={0} />
                <Picker.Item label="1" value={1} />
                <Picker.Item label="2" value={2} />
                <Picker.Item label="3" value={3} />
              </Picker>
            </View>
          )}
        </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Tallenna</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
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
  icon: {
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
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
 rowPicker: {
    flex: 1,
    height: 40,
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