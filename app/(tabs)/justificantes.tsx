// app/(tabs)/justificantes.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui";
import api from "@/services/api";

import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
  const router = useRouter();
  const [justificantes, setJustificantes] = useState<Justificante[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Modal de motivo/fecha antes de elegir archivo ──────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchJustificantes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/justificantes/mios");
      // 👈 fix: el backend regresa el arreglo directo, no { justificantes: [...] }
      setJustificantes(res.data ?? []);
    } catch (err: any) {
      console.log("Error fetching justificantes:", err);
      if (err?.response?.status === 401) {
        router.replace("/login-register");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const uploadToDrive = async (
    accessToken: string,
    file: DocumentPicker.DocumentPickerAsset,
  ): Promise<string> => {
    const metadata = {
      name: file.name,
      mimeType: file.mimeType ?? "application/octet-stream",
    };

    const fileResponse = await fetch(file.uri);
    const fileBlob = await fileResponse.blob();

    const boundary = "foo_bar_baz_" + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

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
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const abrirModal = () => {
    setMotivo("");
    setFecha(new Date());
    setModalVisible(true);
  };

  const handleConfirmarYSubir = async () => {
    if (!motivo.trim()) {
      Alert.alert("Campo requerido", "Escribe el motivo del justificante.");
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setModalVisible(false);
    setUploading(true);
    try {
      const driveUrl = await uploadToDrive(accessToken, file);

      await api.post("/justificantes", {
        driveUrl,
        motivo: motivo.trim(),
        fecha: fecha.toISOString(),
      });

      Alert.alert("Listo", "Tu justificante se subió correctamente.");
      fetchJustificantes();
    } catch (err: any) {
      console.log("Error subiendo justificante:", err);
      if (err?.response?.status === 401) {
        router.replace("/login-register");
        return;
      }
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
        onPress={abrirModal}
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
          refreshing={loading}
          onRefresh={fetchJustificantes}
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

      {/* Modal: motivo + fecha antes de elegir el archivo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Nuevo justificante
            </ThemedText>

            <ThemedText style={styles.fieldLabel}>Motivo</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ej. Cita médica, trámite familiar..."
              placeholderTextColor="#9CA3AF"
              value={motivo}
              onChangeText={setMotivo}
              multiline
            />

            <ThemedText style={styles.fieldLabel}>Fecha de la falta</ThemedText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>{fecha.toLocaleDateString()}</ThemedText>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setFecha(selectedDate);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Continuar"
                onPress={handleConfirmarYSubir}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  dateButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
});
