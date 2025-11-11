import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScheduleTable } from '@/components/ui';
import { Card } from '@/components/ui';
import { UTEQColors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';


export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UTEQColors.bluePrimary} />
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  const selectedHorario = horarios.find((h) => h.id === selectedGroup);

  return (
    <ThemedView style={styles.container}>
      {/* Header con color azul */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.welcomeText}>¡Bienvenido!</ThemedText>
          <ThemedText style={styles.userName}>{user?.full_name || user?.fullName || user?.email || 'Invitado'}</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Card de selección de grupo */}
        <Card variant="elevated" style={styles.card}>
          <ThemedText style={styles.cardTitle}>Selecciona un grupo</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(itemValue: string) => setSelectedGroup(itemValue)}
              style={[
                styles.picker,
                { color: colors.text, backgroundColor: colors.background }
              ]}
              dropdownIconColor={UTEQColors.bluePrimary}>
              <Picker.Item label="Seleccione un grupo" value="" />
              {horarios.map((horario) => (
                <Picker.Item
                  key={horario.id}
                  label={horario.nombregrupo}
                  value={horario.id}
                />
              ))}
            </Picker>
          </View>
        </Card>

        {/* Horario del grupo seleccionado */}
        {selectedGroup && selectedHorario && (
          <Card variant="elevated" style={styles.scheduleCard}>
            <ThemedText style={styles.cardTitle}>
              Horario - {selectedHorario.nombregrupo}
            </ThemedText>
            <ScheduleTable data={selectedHorario.data || []} />
          </Card>
        )}

        {!selectedGroup && (
          <Card variant="outlined" style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Selecciona un grupo para ver su horario
            </ThemedText>
          </Card>
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
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    backgroundColor: UTEQColors.bluePrimary,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: FontSizes.xl,
    color: UTEQColors.white,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  userName: {
    fontSize: FontSizes['2xl'],
    color: UTEQColors.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: UTEQColors.white,
    marginBottom: Spacing.md,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: UTEQColors.gray300,
  },
  picker: {
    height: 50,
  },
  scheduleCard: {
    marginBottom: Spacing.md,
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
});
