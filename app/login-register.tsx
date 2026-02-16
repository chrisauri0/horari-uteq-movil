import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import api from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import { ActivityIndicator, Alert, Image, StyleSheet, TextInput, View } from "react-native";

export default function LoginScreen() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa email y contraseña");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { access_token, token, user: backendUser } = response.data;
      const authToken = access_token || token;

      if (authToken) {
        await AsyncStorage.setItem('access_token', authToken);
      }

      let userRecord: any = null;
      try {
        const userRes = await api.get(`/users/email/${email}`);
        userRecord = userRes.data;
      } catch (userError) {
        console.log('Error fetching user record:', userError);
      }

      const userData = {
        id: userRecord?.id,
        email: userRecord?.email || email,
        name: backendUser?.nombre || userRecord?.full_name || email,
        role: userRecord?.role || backendUser?.role || 'estudiante',
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      try {
        const schedulesRes = await api.get('/scheduler/allschedules');
        await AsyncStorage.setItem('horarios', JSON.stringify(schedulesRes.data.schedules));
      } catch (err) {
        console.log("Error fetching schedules:", err);
      }

      try {
        const profesoresRes = await api.get('/profesores/movil');
        await AsyncStorage.setItem('profesores', JSON.stringify(profesoresRes.data.profesores));
      } catch (err) {
        console.log("Error fetching profesores:", err);
      }

      Alert.alert("¡Éxito!", `Bienvenido ${userData.email}`);
      router.push("/");

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Email o contraseña incorrectos';
      Alert.alert("Error de login", errorMsg);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/logo-horari-uteq.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>
          Bienvenido a Horari UTEQ
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Gestiona tus horarios académicos de forma fácil y rápida. Accede con tu cuenta institucional.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <Button
            title={loading ? "Iniciando..." : "Iniciar Sesión"}
            onPress={handleLogin}
            variant="primary"
            size="large"
            fullWidth
            style={styles.googleButton}
            disabled={loading}
          />
        </View>

        {loading && (
          <ActivityIndicator size="large" style={styles.loader} />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  bypassButton: {
    marginTop: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 40,
  },
  contentContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    color: '#000',
    backgroundColor: '#fff',
  },
  googleButton: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
