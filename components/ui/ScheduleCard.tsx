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
      <Text style={styles.subjectText} numberOfLines={2}>
        {subject}
      </Text>
      <Text style={styles.professorText} numberOfLines={1}>
        {professor}
      </Text>
      <Text style={styles.roomText} numberOfLines={1}>
        {room}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: UTEQColors.blueLightest,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UTEQColors.blueLighter,
  },
  emptyCell: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: UTEQColors.bluePrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  subjectText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: UTEQColors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  professorText: {
    fontSize: FontSizes.xs,
    color: UTEQColors.textSecondary,
    textAlign: 'center',
    marginBottom: 1,
  },
  roomText: {
    fontSize: FontSizes.xs - 1,
    color: UTEQColors.textTertiary,
    textAlign: 'center',
  },
  emptyText: {
    color: UTEQColors.gray300,
    fontSize: FontSizes.base,
  },
});

