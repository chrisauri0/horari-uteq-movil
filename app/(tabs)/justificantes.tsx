// app/(tabs)/justificantes.tsx  (o donde te convenga)
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import api from "@/services/api";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    View,
} from "react-native";

type EstadoJustificante = "pendiente" | "aceptado" | "rechazado";

interface Justificante {
  id: string;
  motivo: string;
  fecha: string;
  driveUrl: string;
  estado: EstadoJustificante;
  comentarioAdmin?: string;
}

const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
const DRIVE_PERMISSIONS_URL = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
const DRIVE_FILE_URL = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`;

export default function JustificantesScreen() {
  const [justificantes, setJustificantes] = useState<Justificante[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchJustificantes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/justificantes/mios");
      setJustificantes(res.data.justificantes ?? []);
    } catch (err) {
      console.log("Error fetching justificantes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJustificantes();
  }, [fetchJustificantes]);

  const getAccessToken = async () => {
    const token = await AsyncStorage.getItem("googleAccessToken");
    if (!token) {
      Alert.alert(
        "Sesión expirada",
        "Vuelve a iniciar sesión con Google para subir tu justificante.",
      );
      return null;
    }
    return token;
  };

  // Sube el archivo a Drive usando multipart (metadata + binario en un solo request)
  const uploadToDrive = async (
    accessToken: string,
    file: DocumentPicker.DocumentPickerAsset,
  ): Promise<string> => {
    const metadata = {
      name: file.name,
      mimeType: file.mimeType ?? "application/octet-stream",
    };

    // Leemos el archivo como blob usando fetch (funciona en RN con uri local)
    const fileResponse = await fetch(file.uri);
    const fileBlob = await fileResponse.blob();

    const boundary = "foo_bar_baz_" + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    // Convertimos el blob a base64 para meterlo en el multipart manualmente
    const base64Data = await blobToBase64(fileBlob);

    const multipartBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${metadata.mimeType}\r\n` +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      base64Data +
      closeDelim;

    const uploadRes = await fetch(DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.log("Drive upload error:", errText);
      throw new Error("No se pudo subir el archivo a Drive");
    }

    const uploadJson = await uploadRes.json();
    const fileId = uploadJson.id as string;

    // Damos permiso de lectura a "cualquiera con el link" para que tu backend/admin lo pueda abrir
    await fetch(DRIVE_PERMISSIONS_URL(fileId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });

    const fileInfoRes = await fetch(DRIVE_FILE_URL(fileId), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const fileInfo = await fileInfoRes.json();

    return fileInfo.webViewLink as string;
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // quitamos el prefijo "data:...;base64,"
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handlePickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setUploading(true);
    try {
      const driveUrl = await uploadToDrive(accessToken, file);

      // Aquí podrías abrir un modal para pedir motivo/fecha antes del POST,
      // de momento un ejemplo simple:
      await api.post("/justificantes", {
        driveUrl,
        motivo: "Justificante subido desde la app",
        fecha: new Date().toISOString(),
      });

      Alert.alert("Listo", "Tu justificante se subió correctamente.");
      fetchJustificantes();
    } catch (err) {
      console.log("Error subiendo justificante:", err);
      Alert.alert("Error", "No se pudo subir el justificante.");
    } finally {
      setUploading(false);
    }
  };

  const renderEstado = (estado: EstadoJustificante) => {
    const colores: Record<EstadoJustificante, string> = {
      pendiente: "#f0ad4e",
      aceptado: "#5cb85c",
      rechazado: "#d9534f",
    };
    return (
      <View style={[styles.badge, { backgroundColor: colores[estado] }]}>
        <ThemedText style={styles.badgeText}>{estado}</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Mis justificantes
      </ThemedText>

      <Button
        title={uploading ? "Subiendo..." : "Subir justificante"}
        onPress={handlePickAndUpload}
        variant="primary"
        size="large"
        fullWidth
        disabled={uploading}
        style={styles.uploadButton}
      />

      {uploading && <ActivityIndicator size="small" style={styles.loader} />}

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={justificantes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardMotivo}>{item.motivo}</ThemedText>
                {renderEstado(item.estado)}
              </View>
              <ThemedText style={styles.cardFecha}>
                {new Date(item.fecha).toLocaleDateString()}
              </ThemedText>
              {item.comentarioAdmin && (
                <ThemedText style={styles.comentario}>
                  Comentario: {item.comentarioAdmin}
                </ThemedText>
              )}
            </View>
          )}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              Aún no has subido justificantes.
            </ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  uploadButton: { marginBottom: 12 },
  loader: { marginVertical: 12 },
  list: { paddingBottom: 40 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMotivo: { fontSize: 16, fontWeight: "600" },
  cardFecha: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  comentario: { fontSize: 13, marginTop: 6, fontStyle: "italic" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { textAlign: "center", opacity: 0.6, marginTop: 40 },
});
