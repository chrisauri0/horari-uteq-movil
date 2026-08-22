import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button, Card, Input, ScheduleTable } from "@/components/ui";
import {
  BorderRadius,
  FontSizes,
  Spacing,
  UTEQColors,
} from "@/constants/theme";
import { api2 } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie"];
const HOURS = [17, 18, 19, 20, 21];
const PSYCHOLOGY_THEME = {
  primary: "#0F766E",
  primarySoft: "#0D9488",
  light: "#CCFBF1",
  lightest: "#F0FDFA",
  border: "#99F6E4",
  textStrong: "#115E59",
};

const DAY_ALIASES: Record<string, string> = {
  lun: "Lun",
  lunes: "Lun",
  mar: "Mar",
  martes: "Mar",
  mie: "Mie",
  miercoles: "Mie",
  miércoles: "Mie",
  jue: "Jue",
  jueves: "Jue",
  vie: "Vie",
  viernes: "Vie",
};

const normalizeDay = (value: string) => {
  if (!value) return "";
  return DAY_ALIASES[value.trim().toLowerCase()] ?? "";
};

const getHour = (value?: string) => {
  if (!value) return null;
  const hour = Number(value.split(":")[0]);
  return Number.isFinite(hour) ? hour : null;
};

const getPsicologoName = (psicologo: any) =>
  `${psicologo?.nombre ?? ""} ${psicologo?.apellidos ?? ""}`.trim();

const toArrayDisponibilidad = (disponibilidad: any): any[] => {
  if (!disponibilidad) return [];
  return Array.isArray(disponibilidad) ? disponibilidad : [disponibilidad];
};

const buildScheduleData = (psicologo: any) => {
  const fullName = getPsicologoName(psicologo);
  const disponibilidadItems = toArrayDisponibilidad(psicologo?.disponibilidad);
  const scheduleData: any[] = [];

  disponibilidadItems.forEach((item) => {
    const diasRaw = Array.isArray(item?.dias)
      ? item.dias
      : item?.dia
        ? [item.dia]
        : [];
    const dias = diasRaw
      .map((d: string) => normalizeDay(d))
      .filter((d: string) => DAYS.includes(d));

    const horaInicio = getHour(item?.hora_inicio);
    const horaFin = getHour(item?.hora_fin);

    if (!dias.length || horaInicio === null || horaFin === null) {
      return;
    }

    dias.forEach((dia: string) => {
      HOURS.forEach((hour) => {
        if (hour >= horaInicio && hour < horaFin) {
          scheduleData.push({
            start: `${dia}${hour}`,
            subj: "Asesoria Psicologica",
            prof: fullName,
            room: psicologo?.email ?? "Sin correo",
            group: "Psicologia",
          });
        }
      });
    });
  });

  return scheduleData;
};

export default function PsicologosScreen() {
  const [loading, setLoading] = useState(true);
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPsicologoNombre, setSelectedPsicologoNombre] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPsicologos = async () => {
      const storedPsicologos = await AsyncStorage.getItem("psicologos");
      if (storedPsicologos) setPsicologos(JSON.parse(storedPsicologos));

      setLoading(false);
    };
    fetchPsicologos();
  }, []);

  const openModal = (psicologoNombre: string) => {
    setSelectedPsicologoNombre(psicologoNombre);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPsicologoNombre("");
    setSelectedDay("");
    setSelectedHour("");
  };

  const handleManualFetchPsicologos = async () => {
    try {
      const res = await api2.get("/psicologos");
      const payload = Array.isArray(res.data)
        ? res.data
        : (res.data?.psicologos ?? []);
      await AsyncStorage.setItem("psicologos", JSON.stringify(payload));
      setPsicologos(payload);
      Alert.alert("Sincronizado", `Psicologos cargados: ${payload.length}`);
    } catch (err: any) {
      console.log("Error manual GET /psicologos:", err);
      Alert.alert("Error", err?.message || "Error desconocido");
    }
  };

  async function createGoogleEvent(
    psicologoNombre: string,
    day: string,
    hour: string,
  ) {
    try {
      const token = await AsyncStorage.getItem("googleAccessToken");
      if (!token) {
        Alert.alert("Error", "No se encontró tu sesión de Google.");
        return;
      }

      // Buscar psicologo en AsyncStorage
      const psicologoData = psicologos.find(
        (p) =>
          `${p.nombre} ${p.apellidos}`.trim().toLowerCase() ===
          psicologoNombre.trim().toLowerCase(),
      );

      if (!psicologoData) {
        Alert.alert("Error", "No se encontró el correo del psicólogo.");

        return;
      } else {
        console.log("Psicólogo encontrado:", psicologoData);
      }

      if (psicologoData) {
        Alert.alert("Correo del psicólogo:", psicologoData.email);
      }

      const psicologoEmail = psicologoData.email;

      // Obtener alumno
      const userString = await AsyncStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;
      const alumnoNombre = user?.name || "Alumno";

      // Mapeo días
      const dayMap: any = { Lun: 1, Mar: 2, Mie: 3, Jue: 4, Vie: 5 };

      // Día de la semana actual (0 = domingo, 1 = lunes, ...)
      const today = new Date();
      const currentWeekDay = today.getDay();

      // targetDay: 1=Lun ... 5=Vie
      const targetDay = dayMap[day];

      // Calcular diferencia de días hasta el siguiente targetDay
      let diff = targetDay - currentWeekDay;
      if (diff <= 0) {
        // si el día ya pasó (o es hoy antes de la hora), sumar 7 para que sea la próxima semana
        diff += 7;
      }

      const eventDate = new Date();
      eventDate.setDate(today.getDate() + diff);

      // Establecer hora
      const start = new Date(eventDate);
      start.setHours(Number(hour), 0, 0, 0); // minutos, segundos y ms en 0
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      // // Construir evento
      const newEvent = {
        summary: `Asesoría con ${psicologoNombre} — Alumno: ${alumnoNombre}`,
        description: `Asesoría académica solicitada por ${alumnoNombre}.`,
        start: {
          dateTime: start.toISOString(),
          timeZone: "America/Mexico_City",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "America/Mexico_City",
        },
        attendees: [
          { email: psicologoEmail }, // correo del psicologo
          { email: user?.email }, // correo del alumno
        ],
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEvent),
        },
      );

      const data = await response.json();
      console.log("Evento creado:", data);
      Alert.alert("Correo del psicólogo:", psicologoData.email);

      Alert.alert(
        "Asesoría agendada",
        "Se agregó correctamente a tu Google Calendar 📅",
      );
    } catch (error) {
      console.log(error);
      console.log();
      Alert.alert("Error", "Hubo un problema al crear el evento.");
    }
  }

  // vista de carga

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PSYCHOLOGY_THEME.primary} />
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  const psicologosConNombre = psicologos
    .map((p) => ({
      ...p,
      fullName: getPsicologoName(p),
      scheduleData: buildScheduleData(p),
    }))
    .filter((p) => !!p.fullName);

  const selectedPsicologo = psicologosConNombre.find(
    (p) => p.fullName === selectedPsicologoNombre,
  );
  const busySlots = new Set<string>();
  if (selectedPsicologo) {
    selectedPsicologo.scheduleData.forEach((c: any) => {
      busySlots.add(c.start);
    });
  }

  // Generar espacios libres (día, hora)
  const freeSlots: { day: string; hour: number }[] = [];
  DAYS.forEach((day) => {
    HOURS.forEach((hour) => {
      const slot = `${day}${hour}`;
      if (!busySlots.has(slot)) {
        freeSlots.push({ day, hour });
      }
    });
  });

  // Días y horas libres para los pickers
  const freeDays = Array.from(new Set(freeSlots.map((s) => s.day)));
  const freeHours = Array.from(
    new Set(
      freeSlots
        .filter((s) => s.day === selectedDay || !selectedDay)
        .map((s) => s.hour),
    ),
  );

  // Filtrar psicologos
  const filteredPsicologos = psicologosConNombre.filter((psico) =>
    psico.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalBloquesDisponibles = filteredPsicologos.reduce(
    (acc, psico) => acc + psico.scheduleData.length,
    0,
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          Horarios por Psicólogo
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Consulta los horarios de tus psicologos y agenda asesorías
        </ThemedText>
        <View style={styles.headerStatsRow}>
          <View style={styles.statPill}>
            <ThemedText style={styles.statPillText}>
              {filteredPsicologos.length} psicologos
            </ThemedText>
          </View>
          <View style={styles.statPill}>
            <ThemedText style={styles.statPillText}>
              {totalBloquesDisponibles} horas disponibles
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar psicólogo..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInputContainer}
          inputStyle={styles.searchInput}
        />
        <Button
          title="Actualizar psicologos"
          onPress={handleManualFetchPsicologos}
          variant="outline"
          style={styles.refreshButton}
          textStyle={styles.refreshButtonText}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPsicologos
          .sort((a, b) => a.fullName.localeCompare(b.fullName))
          .map((psico) => {
            const psicologoNombre = psico.fullName;
            const scheduleData = psico.scheduleData;

            return (
              <Card
                key={psicologoNombre}
                variant="elevated"
                style={styles.psicologoCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarText}>
                      {psicologoNombre.charAt(0)}
                    </ThemedText>
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <ThemedText style={styles.psicologoName}>
                      {psicologoNombre}
                    </ThemedText>
                    <ThemedText style={styles.psicologoMeta}>
                      {scheduleData.length} bloques de disponibilidad
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.tableHint}>
                  Desliza horizontalmente para ver todos los dias
                </ThemedText>
                <ScheduleTable
                  data={scheduleData}
                  showGroup={true}
                  colorVariant="psicologos"
                />

                <Button
                  title={`Agendar asesoría`}
                  onPress={() => openModal(psicologoNombre)}
                  variant="secondary"
                  fullWidth
                  style={styles.scheduleButton}
                  textStyle={styles.scheduleButtonText}
                />
              </Card>
            );
          })}

        {filteredPsicologos.length === 0 && (
          <Card variant="outlined" style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? "No se encontraron psicologos"
                : "No hay psicologos disponibles"}
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      {/* Modal para agendar asesoría */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBackdrop} />
          <Card variant="elevated" style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Agendar Asesoría</ThemedText>
            <ThemedText style={styles.modalPsicologoName}>
              {selectedPsicologoNombre}
            </ThemedText>

            <ThemedText style={styles.modalSubtitle}>
              Selecciona el día y la hora para tu asesoría
            </ThemedText>

            {/* Selector de día */}
            <View style={styles.pickerContainer}>
              <ThemedText style={styles.pickerLabel}>Día</ThemedText>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedDay}
                  onValueChange={(itemValue) => {
                    setSelectedDay(itemValue);
                    setSelectedHour(""); // reset hour when day changes
                  }}
                  style={[styles.picker, { color: UTEQColors.textPrimary }]}
                  dropdownIconColor={PSYCHOLOGY_THEME.primary}
                >
                  <Picker.Item
                    label="Seleccione un día"
                    value=""
                    color={UTEQColors.textSecondary}
                  />
                  {freeDays.map((day) => (
                    <Picker.Item
                      key={day}
                      label={day}
                      value={day}
                      color={UTEQColors.textPrimary}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Selector de hora */}
            <View style={styles.pickerContainer}>
              <ThemedText style={styles.pickerLabel}>Hora</ThemedText>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedHour}
                  onValueChange={(itemValue) => setSelectedHour(itemValue)}
                  style={[styles.picker, { color: UTEQColors.textPrimary }]}
                  dropdownIconColor={PSYCHOLOGY_THEME.primary}
                >
                  <Picker.Item
                    label="Seleccione una hora"
                    value=""
                    color={UTEQColors.textSecondary}
                  />
                  {freeHours.map((hour) => (
                    <Picker.Item
                      key={hour}
                      label={`${hour}:00`}
                      value={hour.toString()}
                      color={UTEQColors.textPrimary}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={closeModal}
                variant="outline"
                style={{ ...styles.modalButton, ...styles.cancelButton }}
                textStyle={styles.cancelButtonText}
              />
              <Button
                title="Confirmar"
                onPress={() => {
                  createGoogleEvent(
                    selectedPsicologoNombre,
                    selectedDay,
                    selectedHour,
                  );
                  closeModal();
                }}
                variant="primary"
                style={{ ...styles.modalButton, ...styles.confirmButton }}
                textStyle={styles.confirmButtonText}
                disabled={!selectedDay || !selectedHour}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PSYCHOLOGY_THEME.lightest,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UTEQColors.white,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    color: UTEQColors.textSecondary,
  },
  header: {
    backgroundColor: PSYCHOLOGY_THEME.primary,
    paddingTop: Spacing.xl + 24,
    paddingBottom: Spacing.xl + 10,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: FontSizes["2xl"],
    fontWeight: "800",
    color: UTEQColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  headerStatsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statPill: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  statPillText: {
    color: UTEQColors.white,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: PSYCHOLOGY_THEME.lightest,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  refreshButton: {
    marginTop: Spacing.sm,
    borderColor: PSYCHOLOGY_THEME.primary,
    backgroundColor: UTEQColors.white,
  },
  refreshButtonText: {
    color: PSYCHOLOGY_THEME.primary,
  },
  searchInput: {
    backgroundColor: UTEQColors.white,
    borderWidth: 1,
    borderColor: PSYCHOLOGY_THEME.border,
    color: UTEQColors.textPrimary,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  psicologoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: UTEQColors.white,
    borderWidth: 1,
    borderColor: PSYCHOLOGY_THEME.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PSYCHOLOGY_THEME.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: PSYCHOLOGY_THEME.primary,
  },
  psicologoName: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: UTEQColors.textPrimary,
  },
  psicologoMeta: {
    fontSize: FontSizes.xs,
    color: PSYCHOLOGY_THEME.textStrong,
    marginTop: 2,
  },
  tableHint: {
    fontSize: FontSizes.xs,
    color: UTEQColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  scheduleButton: {
    marginTop: Spacing.md,
    backgroundColor: PSYCHOLOGY_THEME.primarySoft,
  },
  scheduleButtonText: {
    color: UTEQColors.white,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: UTEQColors.gray300,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: UTEQColors.textSecondary,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: UTEQColors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    elevation: 10,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: UTEQColors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  modalPsicologoName: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: PSYCHOLOGY_THEME.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: UTEQColors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  pickerContainer: {
    marginBottom: Spacing.md,
  },
  pickerLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: UTEQColors.textPrimary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  pickerWrapper: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: PSYCHOLOGY_THEME.border,
    backgroundColor: PSYCHOLOGY_THEME.lightest,
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    borderColor: PSYCHOLOGY_THEME.primary,
    backgroundColor: UTEQColors.white,
  },
  cancelButtonText: {
    color: PSYCHOLOGY_THEME.primary,
  },
  confirmButton: {
    backgroundColor: PSYCHOLOGY_THEME.primary,
  },
  confirmButtonText: {
    color: UTEQColors.white,
  },
});
