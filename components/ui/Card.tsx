import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { UTEQColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return Spacing.sm;
      case 'medium':
        return Spacing.md;
      case 'large':
        return Spacing.lg;
      default:
        return Spacing.md;
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: getPadding(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...Shadows.lg,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
          ...Shadows.sm,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          ...Shadows.md,
        };
    }
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

