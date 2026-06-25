import { DEV_CONFIG } from "@/constants/devConfig";
import { scheduleClassNotifications } from "@/utils/scheduleNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card, ScheduleTable } from "@/components/ui";
import api from "@/services/api";

import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
  UTEQColors,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";

// Carga condicional de expo-notifications (no disponible en Expo Go SDK 53+)
let Notifications: any = null;
let BackgroundFetch: any = null;
let NOTIFY_CLASSES_TASK: string | null = null;

// if (!DEV_CONFIG.SKIP_BACKGROUND_NOTIFICATIONS) {
//   try {
//     Notifications = require("expo-notifications");
//     BackgroundFetch = require("expo-background-fetch");
//     NOTIFY_CLASSES_TASK =
//       require("@/background/notify-task").NOTIFY_CLASSES_TASK;
//   } catch (e) {
//     console.log(
//       "[DEV] Background features not available in Expo Go - that's OK!",
//     );
//   }
// } else {
//   console.log("[DEV] ✓ Background notifications disabled by DEV_CONFIG");
// }

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const pickerTextColor =
    colorScheme === "dark" ? UTEQColors.gray100 : UTEQColors.textPrimary;
  const pickerBackgroundColor =
    colorScheme === "dark" ? UTEQColors.gray800 : UTEQColors.white;

  useEffect(() => {
    const registerBgTask = async () => {
      // Las notificaciones solo se registran si están disponibles
      if (!Notifications || !BackgroundFetch || !NOTIFY_CLASSES_TASK) {
        if (DEV_CONFIG.SKIP_BACKGROUND_NOTIFICATIONS) {
          console.log(
            "[DEV] ✓ Background notifications disabled by DEV_CONFIG.SKIP_BACKGROUND_NOTIFICATIONS",
          );
        } else {
          console.log(
            "[DEV] Background notifications not available - normal in Expo Go, but will work in production!",
          );
        }
        return;
      }

      try {
        await Notifications.requestPermissionsAsync();

        try {
          await BackgroundFetch.registerTaskAsync(NOTIFY_CLASSES_TASK, {
            minimumInterval: 60 * 5, // cada 5 minutos revisa
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log("✅ Background task registered successfully");
        } catch (err) {
          console.log("Error registering background task:", err);
        }
      } catch (err) {
        console.log("[DEV] Background setup skipped:", err);
      }
    };

    registerBgTask();
  }, []);

  useEffect(() => {
    const fetchUserAndHorarios = async () => {
      console.log("Fetching user from AsyncStorage...");
      const storedUser = await AsyncStorage.getItem("user");
      const storedHorarios = await AsyncStorage.getItem("horarios");
      const storedProfesores = await AsyncStorage.getItem("profesores");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log("User set in state:", JSON.parse(storedUser));
      } else {
        console.log("No user found in AsyncStorage.");
        // router.push("/login-register");
      }

      const schedulesRes = await api.get("/scheduler/allschedules");
      await AsyncStorage.setItem(
        "horarios",
        JSON.stringify(schedulesRes.data.schedules),
      );

      const parsed = schedulesRes.data.schedules;
      setHorarios(parsed);

      // ⬅️ PROGRAMAR NOTIFICACIONES
      await scheduleClassNotifications(parsed);

      if (storedProfesores) {
        console.log("Profesores found in AsyncStorage.");
        console.log(JSON.parse(storedProfesores));
      } else {
        console.log("No profesores found in AsyncStorage.");
        const profesoresRes = await api.get("/profesores/movil");
        await AsyncStorage.setItem(
          "profesores",
          JSON.stringify(profesoresRes.data),
        );
        console.log("Profesores fetched from API and stored in AsyncStorage.");
      }

      setLoading(false);
      console.log("Loading state set to false");
    };

    fetchUserAndHorarios();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UTEQColors.bluePrimary} />
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  const selectedHorario = horarios.find((h) => h.id === selectedGroup);

  return (
    <ThemedView style={styles.container}>
      {/* Header con diseño mejorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.welcomeLabel}>Bienvenido,</ThemedText>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {user?.full_name || user?.fullName || user?.email || "Estudiante"}
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de selección de grupo */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Tu Grupo
          </ThemedText>
          <Card variant="elevated" style={styles.pickerCard}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(itemValue: string) =>
                  setSelectedGroup(itemValue)
                }
                style={[
                  styles.picker,
                  {
                    color: pickerTextColor,
                    backgroundColor: pickerBackgroundColor,
                  },
                ]}
                itemStyle={{
                  color: pickerTextColor,
                  fontSize: FontSizes.base,
                }}
                dropdownIconColor={UTEQColors.bluePrimary}
                mode="dropdown"
              >
                <Picker.Item
                  label="Selecciona un grupo..."
                  value=""
                  color={UTEQColors.textSecondary}
                />
                {horarios.map((horario) => (
                  <Picker.Item
                    key={horario.id}
                    label={horario.nombregrupo}
                    value={horario.id}
                    color={UTEQColors.textPrimary}
                  />
                ))}
              </Picker>
            </View>
          </Card>
        </View>

        {/* Horario del grupo seleccionado */}
        {selectedGroup && selectedHorario ? (
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Horario de Clases
            </ThemedText>
            <Card variant="elevated" style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <ThemedText style={styles.scheduleTitle}>
                  {selectedHorario.nombregrupo}
                </ThemedText>
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>Activo</ThemedText>
                </View>
              </View>
              <ScheduleTable data={selectedHorario.data || []} />
            </Card>
          </View>
        ) : (
          !selectedGroup && (
            <View style={styles.emptyStateContainer}>
              <Card variant="outlined" style={styles.emptyCard}>
                <ThemedText style={styles.emptyText}>
                  👈 Selecciona un grupo arriba para visualizar tu horario de
                  clases.
                </ThemedText>
              </Card>
            </View>
          )
        )}
      </ScrollView>
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
    paddingTop: Spacing.xl + 24, // Status bar padding
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeLabel: {
    fontSize: FontSizes.sm,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 26,
    color: UTEQColors.white,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
    marginTop: -20, // Pull up content to overlap header slightly if desired, or just 0
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: UTEQColors.textPrimary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  pickerCard: {
    padding: 0, // Remove default padding to let picker fill
    borderRadius: BorderRadius.lg,
    overflow: Platform.OS === "ios" ? "visible" : "hidden",
    backgroundColor: UTEQColors.white,
  },
  pickerWrapper: {
    paddingHorizontal: Spacing.xs,
    backgroundColor: UTEQColors.white,
    minHeight: Platform.OS === "ios" ? 160 : 56,
    justifyContent: "center",
  },
  picker: {
    height: Platform.OS === "ios" ? 160 : 56,
  },
  scheduleCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: UTEQColors.white,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UTEQColors.gray200,
  },
  scheduleTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: UTEQColors.bluePrimary,
  },
  badge: {
    backgroundColor: UTEQColors.blueLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    color: UTEQColors.bluePrimary,
    fontWeight: "700",
  },
  emptyStateContainer: {
    marginTop: Spacing.xl,
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
    lineHeight: 24,
  },
});
