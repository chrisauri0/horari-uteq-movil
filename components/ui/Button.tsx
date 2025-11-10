import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { UTEQColors, BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.md,
      paddingVertical: size === 'small' ? Spacing.sm : size === 'large' ? Spacing.md : Spacing.sm + 2,
      paddingHorizontal: size === 'small' ? Spacing.md : size === 'large' ? Spacing.xl : Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: size === 'small' ? 36 : size === 'large' ? 52 : 44,
      ...(fullWidth && { width: '100%' }),
      ...Shadows.sm,
    };

    if (disabled || loading) {
      return {
        ...baseStyle,
        backgroundColor: UTEQColors.gray300,
        opacity: 0.6,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: UTEQColors.bluePrimary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: UTEQColors.blueLight,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: UTEQColors.bluePrimary,
          shadowOpacity: 0,
          elevation: 0,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: size === 'small' ? FontSizes.sm : size === 'large' ? FontSizes.lg : FontSizes.base,
      fontWeight: '600',
    };

    if (disabled || loading) {
      return {
        ...baseStyle,
        color: UTEQColors.gray600,
      };
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
        return {
          ...baseStyle,
          color: UTEQColors.white,
        };
      case 'outline':
      case 'ghost':
        return {
          ...baseStyle,
          color: UTEQColors.bluePrimary,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? UTEQColors.bluePrimary : UTEQColors.white}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
  },
});

