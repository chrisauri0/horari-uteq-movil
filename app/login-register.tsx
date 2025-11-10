import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card } from '@/components/ui';
import { UTEQColors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

const LoginRegisterScreen = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [user, setUser] = useState<any>(null); // <-- almacena usuario si quieres

  const API_BASE_URL = process.env.API_BASE_URL || 'http://10.61.154.136:3000';

  const handleAuth = async () => {
    try {
      const url = `${API_BASE_URL}${isLogin ? '/users/login' : '/users/register'}`;
      const payload = isLogin
        ? { email, password }
        : { email, passwordHash: password, fullName };

      const response = await axios.post(url, payload);

      console.log('Response data:', response.data);

      if (response.data.error) {
        Alert.alert('Error', response.data.error);
      } else {
        // Guarda el usuario en AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Saving user to AsyncStorage:', response.data.user);
        console.log('User saved to AsyncStorage');

        Alert.alert(
          'Success',
          isLogin ? 'Login successful!' : 'Registration successful!'
        );

        // Redirige al index
        router.push('/');

        // Fetch horarios data from the API
        console.log('Fetching horarios from API...');
const horariosResponse = await axios.get(`${API_BASE_URL}/horarios`);
        console.log('Horarios fetched:', horariosResponse.data);
        console.log('Horarios fetched:', JSON.stringify(horariosResponse.data, null, 2));
        await AsyncStorage.setItem('horarios', JSON.stringify(horariosResponse.data));
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error(error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</ThemedText>
            <ThemedText style={styles.subtitle}>
              {isLogin
                ? 'Ingresa a tu cuenta UTEQ'
                : 'Crea una nueva cuenta UTEQ'}
            </ThemedText>
          </View>

          {/* Card con formulario */}
          <Card variant="elevated" style={styles.card}>
            <ThemedText style={styles.infoText}>
              Solo se aceptan correos con terminación @uteq.edu.mx
            </ThemedText>

            <Input
              label="Correo electrónico"
              placeholder="tu.correo@uteq.edu.mx"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {!isLogin && (
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}

            <Button
              title={isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              onPress={handleAuth}
              variant="primary"
              fullWidth
              style={styles.primaryButton}
            />

            <Button
              title={isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              onPress={() => setIsLogin(!isLogin)}
              variant="ghost"
              fullWidth
              style={styles.switchButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UTEQColors.gray50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  title: {
    fontSize: FontSizes['4xl'],
    fontWeight: '700',
    color: UTEQColors.bluePrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: UTEQColors.textSecondary,
    textAlign: 'center',
  },
  card: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: UTEQColors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    padding: Spacing.sm,
    backgroundColor: UTEQColors.blueLightest,
    borderRadius: BorderRadius.md,
  },
  primaryButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  switchButton: {
    marginTop: Spacing.sm,
  },
});

export default LoginRegisterScreen;
