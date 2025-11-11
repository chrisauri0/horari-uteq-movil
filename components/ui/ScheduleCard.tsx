import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { UTEQColors, BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { Card } from './Card';

export interface ScheduleCardProps {
  subject: string;
  professor: string;
  room: string;
  group?: string;
  style?: ViewStyle;
  variant?: 'default' | 'empty';
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  subject,
  professor,
  room,
  group,
  style,
  variant = 'default',
}) => {
  if (variant === 'empty') {
    return (
      <View style={[styles.emptyCell, style]}>
        <Text style={styles.emptyText}>–</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {group && (
        <Text style={styles.groupText} numberOfLines={1}>
          {group}
        </Text>
      )}
      <Text style={styles.subjectText} numberOfLines={1} ellipsizeMode="tail">
        {subject}
      </Text>
      <Text style={styles.professorText} numberOfLines={1} ellipsizeMode="tail">
        {professor}
      </Text>
      <Text style={styles.roomText} numberOfLines={1} ellipsizeMode="tail">
        {room}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: UTEQColors.blueLightest,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flex: 1, // Para ocupar todo el espacio disponible de la celda
    width: '100%', // Redundante, pero asegúrate que Stretch funcione
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UTEQColors.blueLighter,
    minHeight: 70, // Opcional
    maxHeight: 90, // Opcional
    overflow: 'hidden', // <-- limita cualquier texto extra
  },
  emptyCell: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  groupText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: UTEQColors.bluePrimary,
    marginBottom: 1,
    textAlign: 'center',
    flexShrink: 1,
  },
  subjectText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: UTEQColors.textPrimary,
    textAlign: 'center',
    marginBottom: 1,
    flexShrink: 1,
  },
  professorText: {
    fontSize: FontSizes.xs,
    color: UTEQColors.textSecondary,
    textAlign: 'center',
    flexShrink: 1,
  },
  roomText: {
    fontSize: FontSizes.xs - 1,
    color: UTEQColors.textTertiary,
    textAlign: 'center',
    flexShrink: 1,
  },
  emptyText: {
    color: UTEQColors.gray300,
    fontSize: FontSizes.base,
  },
});

