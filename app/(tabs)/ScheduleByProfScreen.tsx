import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Modal, ScrollView, StyleSheet, View } from 'react-native';

const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
const HOURS = [17, 18, 19, 20, 21];

export default function ScheduleByProfScreen() {
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedHour, setSelectedHour] = useState('');

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
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText>Cargando...</ThemedText>
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
    <ScrollView style={{ padding: 10 }}>
      <ThemedView style={{ padding: 10, alignItems: 'center' }}>
        <ThemedText type="title" style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          Apartado de Profesores
        </ThemedText>
      </ThemedView>
      {Object.keys(profs)
        .sort()
        .map((prof) => {
          const clases = profs[prof];

          // Crear matriz [dia][hora]
          const matrix: Record<string, Record<number, any | null>> = {};
          DAYS.forEach((d) => {
            matrix[d] = {};
            HOURS.forEach((h) => (matrix[d][h] = null));
          });

          clases.forEach((c) => {
            const dia = c.start.slice(0, 3);
            const hora = parseInt(c.start.slice(3));
            matrix[dia][hora] = c;
          });

          return (
            <ThemedView key={prof} style={{ marginBottom: 30 }}>
              <ThemedText type="title">{prof}</ThemedText>

              {/* Tabla */}
              <ThemedView style={styles.tableContainer}>
                {/* Header */}
                <ThemedView style={[styles.row, styles.headerRow]}>
                  <ThemedText style={[styles.cell, styles.headerCell]}>Hora</ThemedText>
                  {DAYS.map((d) => (
                    <ThemedText key={d} style={[styles.cell, styles.headerCell]}>
                      {d}
                    </ThemedText>
                  ))}
                </ThemedView>

                {/* Filas */}
                {HOURS.map((h) => (
                  <ThemedView key={h} style={styles.row}>
                    <ThemedText style={[styles.cell, styles.hourCell]}>{h}:00</ThemedText>
                    {DAYS.map((d) => {
                      const c = matrix[d][h];
                      return (
                        <ThemedView key={d} style={[styles.cell, styles.subjectCell]}>
                          {c ? (
                            <>
                              <ThemedText style={styles.subjText}>{c.group}</ThemedText>
                              <ThemedText style={styles.profText}>{c.subj}</ThemedText>
                              <ThemedText style={styles.roomText}>{c.room}</ThemedText>
                            </>
                          ) : (
                            <ThemedText style={styles.emptyText}>–</ThemedText>
                          )}
                        </ThemedView>
                      );
                    })}
                  </ThemedView>
                ))}
              </ThemedView>

              {/* Botón para agendar asesoría */}
              <Button title={`Agendar asesoría con ${prof}`} onPress={() => openModal(prof)} />
            </ThemedView>
          );
        })}

      {/* Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={[styles.modalText, { color: '#000' }]}>Agendar asesoría con {selectedProf}</ThemedText>

            {/* Selector de día */}
            <Picker
              selectedValue={selectedDay}
              onValueChange={(itemValue) => setSelectedDay(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione un día" value="" />
              {DAYS.map((day) => (
                <Picker.Item key={day} label={day} value={day} />
              ))}
            </Picker>

            {/* Selector de hora */}
            <Picker
              selectedValue={selectedHour}
              onValueChange={(itemValue) => setSelectedHour(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione una hora" value="" />
              {HOURS.map((hour) => (
                <Picker.Item key={hour} label={`${hour}:00`} value={hour} />
              ))}
            </Picker>

            <Button title="Cerrar" onPress={closeModal} />
          </ThemedView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: { backgroundColor: '#4CAF50' },
  headerCell: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
  },
  hourCell: {
    backgroundColor: '#32c725ff',
    width: 60,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subjectCell: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  subjText: { fontWeight: 'bold', textAlign: 'center', fontSize: 12 },
  profText: { fontSize: 12, color: '#555', textAlign: 'center' },
  roomText: { fontSize: 11, color: '#888', textAlign: 'center' },
  emptyText: { color: '#ccc', fontSize: 12 },
  picker: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: '#d1d1d1ff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
});
