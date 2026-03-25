import {
  BorderRadius,
  FontSizes,
  Shadows,
  Spacing,
  UTEQColors,
} from "@/constants/theme";
import React, { useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScheduleCard } from "./ScheduleCard";

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
  colorVariant?: "default" | "psicologos";
}

const CELL_WIDTH = 150;
const HOUR_CELL_WIDTH = 68;
const ROW_HEIGHT = 90;

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  data,
  days = ["Lun", "Mar", "Mie", "Jue", "Vie"],
  hours = [17, 18, 19, 20, 21],
  showGroup = false,
  colorVariant = "default",
}) => {
  const isPsicologos = colorVariant === "psicologos";
  const palette = {
    headerBg: isPsicologos ? "#0F766E" : UTEQColors.bluePrimary,
    headerBorder: isPsicologos ? "#14B8A6" : UTEQColors.blueSecondary,
    hourHeaderBg: isPsicologos ? "#0D9488" : UTEQColors.blueSecondary,
    hourColumnBg: isPsicologos ? "#F0FDFA" : UTEQColors.gray50,
    cardBg: isPsicologos ? "#CCFBF1" : UTEQColors.blueLightest,
    cardBorder: isPsicologos ? "#5EEAD4" : UTEQColors.blueLighter,
    hourText: isPsicologos ? "#115E59" : UTEQColors.textPrimary,
  };

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

  // Referencias para sincronizar scroll vertical
  const hourScrollRef = useRef<ScrollView>(null);
  const tableScrollRef = useRef<ScrollView>(null);
  const isSyncing = useRef(false);

  const onHourScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    tableScrollRef.current?.scrollTo({
      y: e.nativeEvent.contentOffset.y,
      animated: false,
    });
    setTimeout(() => {
      isSyncing.current = false;
    }, 10);
  };
  const onTableScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    hourScrollRef.current?.scrollTo({
      y: e.nativeEvent.contentOffset.y,
      animated: false,
    });
    setTimeout(() => {
      isSyncing.current = false;
    }, 10);
  };

  return (
    <View style={styles.stickyContainer}>
      {/* Columna fija de horas */}
      <View
        style={[
          styles.stickyHourColumn,
          { backgroundColor: palette.hourColumnBg },
        ]}
      >
        {/* Header hora */}
        <View
          style={[
            styles.headerCell,
            styles.hourHeaderCell,
            {
              height: 40,
              backgroundColor: palette.hourHeaderBg,
              borderRightColor: palette.headerBorder,
            },
          ]}
        >
          <Text style={styles.headerText}>Hora</Text>
        </View>
        <ScrollView
          ref={hourScrollRef}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          onScroll={onHourScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {hours.map((h) => (
            <View
              key={h}
              style={[
                styles.hourCell,
                { height: ROW_HEIGHT, backgroundColor: palette.hourColumnBg },
              ]}
            >
              <Text style={[styles.hourText, { color: palette.hourText }]}>
                {h}:00
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
      {/* Tabla scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View>
          {/* Encabezado */}
          <View
            style={[styles.headerRow, { backgroundColor: palette.headerBg }]}
          >
            {days.map((d) => (
              <View
                key={d}
                style={[
                  styles.headerCell,
                  { borderRightColor: palette.headerBorder },
                ]}
              >
                <Text style={styles.headerText}>{d}</Text>
              </View>
            ))}
          </View>
          {/* Filas */}
          <ScrollView
            ref={tableScrollRef}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            onScroll={onTableScroll}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            {hours.map((h) => (
              <View key={h} style={styles.row}>
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
                          style={{
                            backgroundColor: palette.cardBg,
                            borderColor: palette.cardBorder,
                          }}
                        />
                      ) : (
                        <ScheduleCard
                          variant="empty"
                          subject=""
                          professor=""
                          room=""
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    flexDirection: "row",
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: UTEQColors.white,
    ...Shadows.md,
    marginVertical: Spacing.sm,
    minWidth: "100%",
  },
  stickyHourColumn: {
    width: HOUR_CELL_WIDTH,
    backgroundColor: UTEQColors.gray50,
    zIndex: 2,
    borderRightWidth: 1,
    borderRightColor: UTEQColors.gray200,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: UTEQColors.bluePrimary,
    height: 40,
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: UTEQColors.gray200,
    alignItems: "stretch",
    flexWrap: "nowrap",
    minHeight: ROW_HEIGHT,
    height: ROW_HEIGHT,
    maxHeight: ROW_HEIGHT,
    overflow: "hidden",
  },
  headerCell: {
    flex: 1,
    minWidth: CELL_WIDTH,
    maxWidth: CELL_WIDTH,
    width: CELL_WIDTH,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: UTEQColors.blueSecondary,
  },
  hourHeaderCell: {
    minWidth: HOUR_CELL_WIDTH,
    maxWidth: HOUR_CELL_WIDTH,
    width: HOUR_CELL_WIDTH,
    backgroundColor: UTEQColors.blueSecondary,
  },
  headerText: {
    fontWeight: "700",
    fontSize: FontSizes.sm,
    color: UTEQColors.white,
    textAlign: "center",
  },
  cell: {
    flex: 1,
    minWidth: CELL_WIDTH,
    maxWidth: CELL_WIDTH,
    width: CELL_WIDTH,
    height: "100%",
    maxHeight: 120,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: UTEQColors.gray200,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  hourCell: {
    minWidth: HOUR_CELL_WIDTH,
    maxWidth: HOUR_CELL_WIDTH,
    width: HOUR_CELL_WIDTH,
    backgroundColor: UTEQColors.gray50,
    justifyContent: "center",
    alignItems: "center",
  },
  hourText: {
    fontWeight: "600",
    fontSize: FontSizes.sm,
    color: UTEQColors.textPrimary,
  },
});
