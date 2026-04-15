import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button, Card, Input, ScheduleTable } from "@/components/ui";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
  UTEQColors,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

const DAY_TO_ABBR: Record<string, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miercoles: "Mie",
  Miércoles: "Mie",
  Jueves: "Jue",
  Viernes: "Vie",
  Sabado: "Sab",
  Sábado: "Sab",
  Domingo: "Dom",
};

function getClassProfessor(clase: any) {
  return clase?.profesor || clase?.prof || "Sin profesor";
}

function getClassStart(clase: any) {
  if (clase?.start) return clase.start;

  const dayAbbr = DAY_TO_ABBR[clase?.dia];
  const hourMatch =
    typeof clase?.hora === "string" ? clase.hora.match(/^(\d{1,2}):/) : null;

  if (!dayAbbr || !hourMatch) return null;
  return `${dayAbbr}${parseInt(hourMatch[1], 10)}`;
}

export default function ScheduleByProfScreen() {
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProf, setSelectedProf] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchHorarios = async () => {
      const storedHorarios = await AsyncStorage.getItem("horarios");
      const storedProfesores = await AsyncStorage.getItem("profesores");
      if (storedHorarios) setHorarios(JSON.parse(storedHorarios));
      if (storedProfesores) setProfesores(JSON.parse(storedProfesores));

      setLoading(false);
    };
    fetchHorarios();
  }, []);

  const openModal = (prof: string) => {
    setSelectedProf(prof);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProf("");
    setSelectedDay("");
    setSelectedHour("");
  };

  async function createGoogleEvent(prof: string, day: string, hour: string) {
    try {
      const token = await AsyncStorage.getItem("googleAccessToken");
      if (!token) {
        Alert.alert("Error", "No se encontró tu sesión de Google.");
        return;
      }

      // Buscar profesor en AsyncStorage
      const profData = profesores.find(
        (p) =>
          `${p.nombre} ${p.apellidos}`.trim().toLowerCase() ===
          prof.trim().toLowerCase(),
      );

      if (!profData) {
        Alert.alert("Error", "No se encontró el correo del profesor.");

        return;
      } else {
        console.log("Profesor encontrado:", profData);
      }

      if (profData) {
        Alert.alert("Correo del profesor:", profData.email);
      }

      const profEmail = profData.email;

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
        summary: `Asesoría con ${prof} — Alumno: ${alumnoNombre}`,
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
          { email: profEmail }, // correo del profe
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
      Alert.alert("Correo del profesor:", profData.email);

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
        <ActivityIndicator size="large" color={UTEQColors.bluePrimary} />
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  // Agrupar por profesor
  const profs: Record<string, any[]> = {};
  horarios.forEach((grupo) => {
    (grupo?.data || []).forEach((c: any) => {
      const profName = getClassProfessor(c);
      const start = getClassStart(c);

      if (!profs[profName]) profs[profName] = [];
      profs[profName].push({
        ...c,
        prof: profName,
        subj: c?.materia || c?.subj,
        room: c?.salon || c?.room,
        start,
        group: c?.grupo || grupo?.nombregrupo,
      });
    });
  });

  // Calcular espacios ocupados para el profesor seleccionado
  let busySlots = new Set<string>();
  if (selectedProf && profs[selectedProf]) {
    profs[selectedProf].forEach((c) => {
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

  // Filtrar profesores
  const filteredProfs = Object.keys(profs).filter((prof) =>
    prof.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          Horarios por Profesor
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Consulta los horarios de tus profesores y agenda asesorías
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Buscar profesor..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInputContainer}
          inputStyle={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProfs.sort().map((prof) => {
          const clases = profs[prof];

          // Preparar datos para ScheduleTable - validar que tengan estructura correcta
          const scheduleData = clases
            .filter((c: any) => c && c.start) // Filtrar items undefined o sin start
            .map((c: any) => ({
              start: c.start,
              subj: c.subj || "Sin asignar",
              prof: c.prof || prof,
              room: c.room || "Sin salón",
              group: c.group,
            }));

          return (
            <Card key={prof} variant="elevated" style={styles.professorCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarText}>
                    {prof.charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.professorName}>{prof}</ThemedText>
              </View>

              <ScheduleTable data={scheduleData} showGroup={true} />

              <Button
                title={`Agendar asesoría`}
                onPress={() => openModal(prof)}
                variant="secondary"
                fullWidth
                style={styles.scheduleButton}
              />
            </Card>
          );
        })}

        {filteredProfs.length === 0 && (
          <Card variant="outlined" style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? "No se encontraron profesores"
                : "No hay profesores disponibles"}
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
            <ThemedText style={styles.modalProfName}>{selectedProf}</ThemedText>

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
                  dropdownIconColor={UTEQColors.bluePrimary}
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
                  dropdownIconColor={UTEQColors.bluePrimary}
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
                style={styles.modalButton}
              />
              <Button
                title="Confirmar"
                onPress={() => {
                  createGoogleEvent(selectedProf, selectedDay, selectedHour);
                  closeModal();
                }}
                variant="primary"
                style={styles.modalButton}
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
    backgroundColor: UTEQColors.gray50,
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
    backgroundColor: UTEQColors.bluePrimary,
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
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: UTEQColors.gray50,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: UTEQColors.white,
    borderWidth: 0,
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
  professorCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: UTEQColors.white,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UTEQColors.blueLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: UTEQColors.bluePrimary,
  },
  professorName: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: UTEQColors.textPrimary,
    flex: 1,
  },
  scheduleButton: {
    marginTop: Spacing.md,
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
  modalProfName: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: UTEQColors.bluePrimary,
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
    borderColor: UTEQColors.gray300,
    backgroundColor: UTEQColors.gray50,
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
});
