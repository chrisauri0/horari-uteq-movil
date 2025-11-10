import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';




const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
const HOURS = [17, 18, 19, 20, 21];

const ScheduleTable = ({ data }: { data: any[] }) => {
  // Crear matriz vacía
  const matrix: any = {};
  HOURS.forEach((h) => {
    matrix[h] = {};
    DAYS.forEach((d) => (matrix[h][d] = null));
  });

  // Llenar la matriz con las materias
  data.forEach((c) => {
    const slot = c.start; // Ejemplo: "Lun18"
    const dia = slot.slice(0, 3);
    const hora = parseInt(slot.slice(3));
    if (matrix[hora] && matrix[hora][dia] !== undefined) {
      matrix[hora][dia] = c;
    }
  });

  return (
    <ThemedView style={styles.tableContainer}>
      {/* Encabezado */}
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
          <ThemedText style={[styles.cell, styles.hourCell]}>
            {h}:00
          </ThemedText>
          {DAYS.map((d) => {
            const c = matrix[h][d];
            return (
              <ThemedView key={d} style={[styles.cell, styles.subjectCell]}>
                {c ? (
                  <>
                    <ThemedText style={styles.subjText}>{c.subj}</ThemedText>
                    <ThemedText style={styles.profText}>{c.prof}</ThemedText>
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
  );
};


export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    const fetchUserAndHorarios = async () => {
      console.log('Fetching user from AsyncStorage...');
      const storedUser = await AsyncStorage.getItem('user');
      const storedHorarios = await AsyncStorage.getItem('horarios');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log('User set in state:', JSON.parse(storedUser));
      }

      if (storedHorarios) {
        setHorarios(JSON.parse(storedHorarios));
        console.log('Horarios set in state:', JSON.parse(storedHorarios));
      }

      setLoading(false);
      console.log('Loading state set to false');
    };

    fetchUserAndHorarios();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.titleContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bienvenido, {user?.full_name || 'Invitado'}!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Selecciona un grupo:</ThemedText>
        <Picker
          selectedValue={selectedGroup}
          onValueChange={(itemValue: string) => setSelectedGroup(itemValue)}
          style={{ color: '#000', backgroundColor: '#fff' }}>
          {horarios.map((horario) => (
            <Picker.Item key={horario.id} label={horario.nombregrupo} value={horario.id} />
          ))}
        </Picker>
      </ThemedView>

      {selectedGroup && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Datos del grupo seleccionado:</ThemedText>
{selectedGroup && (
  <ThemedView style={styles.stepContainer}>
    <ThemedText type="subtitle">Horario del grupo seleccionado:</ThemedText>
    <ScheduleTable
      data={horarios.find((h) => h.id === selectedGroup)?.data || []}
    />
  </ThemedView>
)}

        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },

  tableContainer: {
  borderWidth: 1,
  borderColor: '#aaa',
  borderRadius: 8,
  overflow: 'hidden',
  marginTop: 10,
},
row: {
  flexDirection: 'row',
},
cell: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 6,
  alignItems: 'center',
  justifyContent: 'center',
},
headerRow: {
  backgroundColor: '#eee',
},
headerCell: {
  fontWeight: 'bold',
  textAlign: 'center',
},
hourCell: {
  backgroundColor: '#f9f9f9',
  width: 60,
},
subjectCell: {
  flex: 1,
  minHeight: 60,
  alignItems: 'center',
  justifyContent: 'center',
},
subjText: {
  fontWeight: 'bold',
  textAlign: 'center',
},
profText: {
  fontSize: 12,
  color: '#555',
  textAlign: 'center',
},
roomText: {
  fontSize: 11,
  color: '#888',
  textAlign: 'center',
},
emptyText: {
  color: '#ccc',
},

});
