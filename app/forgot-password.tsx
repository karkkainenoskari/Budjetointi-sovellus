// app/forgot-password.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleReset = async () => {
        if (!email.trim()) {
            Alert.alert('Virhe', 'Syötä sähköpostiosoite.');
            return;
        }

        setLoading(true);
        try {
            auth.languageCode = 'fi';
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert('Viesti lähetetty', 'Salasanan palautusviesti lähetetty.', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/login'),
                },
            ]);
        } catch (error: any) {
            console.error('sendPasswordResetEmail-virhe:', error);
            let message = 'Sähköpostin lähetys epäonnistui. Yritä uudelleen.';
            if (error.code === 'auth/invalid-email') {
                message = 'Sähköpostiosoite on virheellinen.';
            } else if (error.code === 'auth/user-not-found') {
                message = 'Tiliä ei löydy tällä sähköpostilla.';
            }
            Alert.alert('Virhe', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.innerContainer}>
                <Image
                    source={require('@/assets/images/budjettikoutsi_logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Salasana unohtunut</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Sähköpostiosoite"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                />
                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    onPress={handleReset}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Odotetaan...' : 'Lähetä palautusviesti'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.replace('/login')}
                    style={styles.backLink}
                >
                    <Text style={styles.backText}>Takaisin kirjautumiseen</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 32,
        alignSelf: 'center',
    },
    input: {
        height: 48,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        fontSize: 16,
        color: Colors.textPrimary,
        backgroundColor: Colors.cardBackground,
    },
    button: {
        height: 48,
        backgroundColor: Colors.moss,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: Colors.background,
        fontSize: 18,
        fontWeight: '600',
    },
    backLink: {
        marginTop: 16,
        alignSelf: 'center',
    },
    backText: {
        color: Colors.moss,
        fontWeight: '500',
    },
});