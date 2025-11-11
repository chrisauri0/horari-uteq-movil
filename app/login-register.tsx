import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card } from '@/components/ui';
import { UTEQColors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import api, { API_BASE_URL } from '@/services/api';

const LoginRegisterScreen = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async () => {
    try {
      const url = isLogin ? '/users/login' : '/users/register';
      const payload = isLogin
        ? { email, password }
        : { email, passwordHash: password, fullName };

      const response = await api.post(url, payload);

      console.log('Response data:', response.data);

      if (response.data.error) {
        Alert.alert('Error', response.data.error);
        return;
      }

      // Guarda el access_token en AsyncStorage
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        console.log('Token saved to AsyncStorage');

        // Obtener información del usuario después del login usando el servicio API
        try {
          // El token JWT contiene el email en el payload, pero obtenemos el usuario completo del backend
          const userResponse = await api.get(`/users/email/${email}`);
          if (userResponse.data && !userResponse.data.error) {
            // No guardamos el password_hash
            const { password_hash, ...userInfo } = userResponse.data;
            await AsyncStorage.setItem('user', JSON.stringify(userInfo));
            console.log('User info saved to AsyncStorage:', userInfo);
          } else {
            // Si no se puede obtener el usuario, guardamos información básica
            const userInfo = { email: email };
            await AsyncStorage.setItem('user', JSON.stringify(userInfo));
            console.log('Basic user info saved to AsyncStorage');
          }
        } catch (userError: any) {
          console.error('Error fetching user info:', userError);
          // Si falla, guardamos información básica
          const userInfo = { email: email };
          await AsyncStorage.setItem('user', JSON.stringify(userInfo));
          console.log('Basic user info saved to AsyncStorage (fallback)');
        }

        Alert.alert(
          'Success',
          isLogin ? 'Login successful!' : 'Registration successful!'
        );

        // Fetch horarios data from the API usando el servicio API (que incluye el token)
        try {
          console.log('Fetching horarios from API...');
          const horariosResponse = await api.get('/horarios');
          console.log('Horarios fetched:', horariosResponse.data);
          await AsyncStorage.setItem('horarios', JSON.stringify(horariosResponse.data));
        } catch (horariosError: any) {
          console.error('Error fetching horarios:', horariosError);
          // No mostramos error al usuario si falla la carga de horarios
          // Los horarios se pueden cargar después
        }

        // Redirige al index
        router.push('/');
      } else {
        Alert.alert('Error', 'No se recibió el token de acceso');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
      } else if (error.response?.data?.error) {
        Alert.alert('Error', error.response.data.error);
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
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
