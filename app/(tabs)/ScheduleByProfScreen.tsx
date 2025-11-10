import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { ScheduleTable } from '@/components/ui';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { UTEQColors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
const HOURS = [17, 18, 19, 20, 21];

export default function ScheduleByProfScreen() {
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchHorarios = async () => {
      const storedHorarios = await AsyncStorage.getItem('horarios');
      if (storedHorarios) setHorarios(JSON.parse(storedHorarios));
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
    setSelectedProf('');
    setSelectedDay('');
    setSelectedHour('');
  };

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
    grupo.data.forEach((c: any) => {
      if (!profs[c.prof]) profs[c.prof] = [];
      profs[c.prof].push({ ...c, group: grupo.nombregrupo });
    });
  });

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Horarios por Profesor</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Consulta los horarios de tus profesores y agenda asesorías
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {Object.keys(profs)
          .sort()
          .map((prof) => {
            const clases = profs[prof];
            
            // Preparar datos para ScheduleTable
            const scheduleData = clases.map((c: any) => ({
              start: c.start,
              subj: c.subj,
              prof: c.prof,
              room: c.room,
              group: c.group,
            }));

            return (
              <Card key={prof} variant="elevated" style={styles.professorCard}>
                <ThemedText style={styles.professorName}>{prof}</ThemedText>
                
                <ScheduleTable
                  data={scheduleData}
                  showGroup={true}
                />

                <Button
                  title={`Agendar asesoría con ${prof}`}
                  onPress={() => openModal(prof)}
                  variant="secondary"
                  fullWidth
                  style={styles.scheduleButton}
                />
              </Card>
            );
          })}

        {Object.keys(profs).length === 0 && (
          <Card variant="outlined" style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              No hay profesores disponibles
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      {/* Modal para agendar asesoría */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBackdrop} />
          <Card variant="elevated" style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              Agendar asesoría con {selectedProf}
            </ThemedText>

            <ThemedText style={styles.modalSubtitle}>
              Selecciona el día y la hora para tu asesoría
            </ThemedText>

            {/* Selector de día */}
            <View style={styles.pickerContainer}>
              <ThemedText style={styles.pickerLabel}>Día</ThemedText>
              <Picker
                selectedValue={selectedDay}
                onValueChange={(itemValue) => setSelectedDay(itemValue)}
                style={[
                  styles.picker,
                  { color: colors.text, backgroundColor: colors.background }
                ]}
                dropdownIconColor={UTEQColors.bluePrimary}>
                <Picker.Item label="Seleccione un día" value="" />
                {DAYS.map((day) => (
                  <Picker.Item key={day} label={day} value={day} />
                ))}
              </Picker>
            </View>

            {/* Selector de hora */}
            <View style={styles.pickerContainer}>
              <ThemedText style={styles.pickerLabel}>Hora</ThemedText>
              <Picker
                selectedValue={selectedHour}
                onValueChange={(itemValue) => setSelectedHour(itemValue)}
                style={[
                  styles.picker,
                  { color: colors.text, backgroundColor: colors.background }
                ]}
                dropdownIconColor={UTEQColors.bluePrimary}>
                <Picker.Item label="Seleccione una hora" value="" />
                {HOURS.map((hour) => (
                  <Picker.Item key={hour} label={`${hour}:00`} value={hour.toString()} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={closeModal}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Agendar"
                onPress={() => {
                  // Aquí iría la lógica para agendar
                  Alert.alert(
                    'Asesoría agendada',
                    `Asesoría con ${selectedProf} agendada para ${selectedDay} a las ${selectedHour}:00`
                  );
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UTEQColors.white,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    color: UTEQColors.textSecondary,
  },
  header: {
    backgroundColor: UTEQColors.bluePrimary,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: UTEQColors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: UTEQColors.blueLightest,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  professorCard: {
    marginBottom: Spacing.lg,
  },
  professorName: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: UTEQColors.bluePrimary,
    marginBottom: Spacing.md,
  },
  scheduleButton: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: UTEQColors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: UTEQColors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: UTEQColors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: Spacing.md,
  },
  pickerLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: UTEQColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  picker: {
    height: 50,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UTEQColors.gray300,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
