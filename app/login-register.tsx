import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import api, { api2 } from "@/services/api";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      native:
        Platform.OS === "ios"
          ? "431935309556-d49s155tlbt0hkjdln3jgdva3aqdfm60.apps.googleusercontent.com"
          : "431935309556-6034554jmim4opcamkr4gpqsu0tvkjhh.apps.googleusercontent.com",
      web: "431935309556-nphlheucqg6qejceusr6obu7uch8v8bv.apps.googleusercontent.com",
    }),
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
    ],
    extraParams: { hd: "uteq.edu.mx" }, // 🔐 SOLO UTEQ
  });

  useEffect(() => {
    const handleLogin = async () => {
      if (response?.type === "success") {
        const authentication = response.authentication;

        // Verificar que authentication y accessToken existan
        if (!authentication?.accessToken) {
          console.warn(
            "No authentication/accessToken returned from Google auth response.",
          );
          Alert.alert("Error", "No se recibió un token de acceso válido.");
          return;
        }

        // Guardar accessToken
        await AsyncStorage.setItem(
          "googleAccessToken",
          authentication.accessToken,
        );

        // Obtener info del usuario
        fetchUserInfo(authentication.accessToken);
      }
    };

    handleLogin();
  }, [response]);

  const fetchUserInfo = async (accessToken?: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const user = await res.json();
      console.log("User Google:", user);
      setUser(user);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      try {
        const schedulesRes = await api.get("/scheduler/allschedules");
        await AsyncStorage.setItem(
          "horarios",
          JSON.stringify(schedulesRes.data.schedules),
        );
      } catch (err) {
        console.log("Error fetching schedules:", err);
      }

      try {
        const psicologosRes = await api2.get("/psicologos");
        const psicologosData = Array.isArray(psicologosRes.data)
          ? psicologosRes.data
          : (psicologosRes.data?.psicologos ?? []);
        await AsyncStorage.setItem(
          "psicologos",
          JSON.stringify(psicologosData),
        );
      } catch (err) {
        console.log("Error fetching psicologos:", err);
      }

      try {
        const profesoresRes = await api.get("/profesores/movil");
        await AsyncStorage.setItem(
          "profesores",
          JSON.stringify(profesoresRes.data.profesores),
        );
      } catch (err) {
        console.log("Error fetching profesores :", err);
      }

      if (!user.email.endsWith("@uteq.edu.mx")) {
        Alert.alert("Error", "Debes usar un correo @uteq.edu.mx válido.");
        return;
      }

      Alert.alert("Bienvenido", `${user.name}`);

      // Guardar en tu global state, context, etc (si aplica)

      router.push("/"); // 🚀 Ir a Home
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "No se pudo iniciar sesión.");
    }
  };
  const bypass = async () => {
    // Usuario de prueba

    try {
      const schedulesRes = await api.get("/scheduler/allschedules");
      await AsyncStorage.setItem(
        "horarios",
        JSON.stringify(schedulesRes.data.schedules),
      );
    } catch (err) {
      console.log("Error fetching schedules:", err);
    }

    try {
      const psicologosRes = await api2.get("/psicologos");
      const psicologosData = Array.isArray(psicologosRes.data)
        ? psicologosRes.data
        : (psicologosRes.data?.psicologos ?? []);
      await AsyncStorage.setItem("psicologos", JSON.stringify(psicologosData));
      console.log("Psicologos fetched and stored successfully.");
      console.log("Psicologos data:", psicologosData);
    } catch (err) {
      console.log("Error fetching psicologos:", err);
    }

    router.push("/"); // 🚀 Ir a Home
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
          Gestiona tus horarios académicos de forma fácil y rápida. Accede con
          tu cuenta institucional.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Button
            title="Continuar con Google"
            onPress={() => promptAsync()}
            variant="primary"
            size="large"
            fullWidth
            style={styles.googleButton}
          />
          <Button
            title="Continuar con bypass"
            onPress={() => bypass()}
            variant="primary"
            size="large"
            fullWidth
            style={styles.bypassButton}
          />
        </View>

        {!request && <ActivityIndicator size="large" style={styles.loader} />}
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
  googleButton: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
