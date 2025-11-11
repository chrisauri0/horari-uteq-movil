import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { UTEQColors, BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { ScheduleCard } from './ScheduleCard';

export interface ScheduleData {
  start: string; // Ejemplo: "Lun18"
  subj: string;
  prof: string;
  room: string;
  group?: string;
}

export interface ScheduleTableProps {
  data: ScheduleData[];
  days?: string[];
  hours?: number[];
  showGroup?: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  data,
  days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'],
  hours = [17, 18, 19, 20, 21],
  showGroup = false,
}) => {
  // Crear matriz vacía
  const matrix: Record<number, Record<string, ScheduleData | null>> = {};
  hours.forEach((h) => {
    matrix[h] = {};
    days.forEach((d) => (matrix[h][d] = null));
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
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Encabezado */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, styles.hourHeaderCell]}>
              <Text style={styles.headerText}>Hora</Text>
            </View>
            {days.map((d) => (
              <View key={d} style={styles.headerCell}>
                <Text style={styles.headerText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Filas */}
          {hours.map((h) => (
            <View key={h} style={styles.row}>
              <View style={[styles.hourCell, styles.cell]}>
                <Text style={styles.hourText}>{h}:00</Text>
              </View>
              {days.map((d) => {
                const c = matrix[h][d];
                return (
                  <View key={d} style={styles.cell}>
                    {c ? (
                      <ScheduleCard
                        subject={c.subj}
                        professor={c.prof}
                        room={c.room}
                        group={showGroup ? c.group : undefined}
                      />
                    ) : (
                      <ScheduleCard variant="empty" subject="" professor="" room="" />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: UTEQColors.white,
    ...Shadows.md,
    marginVertical: Spacing.md,
    flex: 1, // Asegura el growth de la tabla
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: UTEQColors.bluePrimary,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: UTEQColors.gray200,
    alignItems: 'stretch',
    flexWrap: 'nowrap',   // Importante: línea única
    minHeight: 90,
    height: 90,
    maxHeight: 90,
    overflow: 'hidden',
  },
  headerCell: {
    flex: 1,
    minWidth: 100,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: UTEQColors.blueSecondary,
  },
  hourHeaderCell: {
    minWidth: 60,
    backgroundColor: UTEQColors.blueSecondary,
  },
  headerText: {
    fontWeight: '700',
    fontSize: FontSizes.sm,
    color: UTEQColors.white,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    minWidth: 100,
    height: '100%',
    maxHeight: 90,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: UTEQColors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hourCell: {
    minWidth: 60,
    backgroundColor: UTEQColors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourText: {
    fontWeight: '600',
    fontSize: FontSizes.sm,
    color: UTEQColors.textPrimary,
  },
});

