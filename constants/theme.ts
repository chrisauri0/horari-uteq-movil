/**
 * Sistema de Diseño UTEQ
 * Paleta de colores basada en el logo institucional con gradientes azules
 */

import { Platform, StyleSheet } from 'react-native';

// Paleta de colores azules (basada en el gradiente del logo)
export const UTEQColors = {
  // Azules principales (gradiente del logo)
  bluePrimary: '#1E40AF',      // Azul oscuro/rico
  blueSecondary: '#3B82F6',    // Azul medio
  blueLight: '#60A5FA',        // Azul claro
  blueLighter: '#93C5FD',      // Azul muy claro
  blueLightest: '#DBEAFE',     // Azul casi blanco
  
  // Gradientes
  gradientStart: '#1E3A8A',    // Inicio del gradiente (más oscuro)
  gradientEnd: '#60A5FA',      // Fin del gradiente (más claro)
  
  // Colores de acento
  accent: '#2563EB',           // Azul de acento
  accentDark: '#1E40AF',       // Azul de acento oscuro
  
  // Colores neutros
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Estados
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Texto
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLight: '#FFFFFF',
};

// Colores para modo claro y oscuro
export const Colors = {
  light: {
    text: UTEQColors.textPrimary,
    textSecondary: UTEQColors.textSecondary,
    background: UTEQColors.white,
    backgroundSecondary: UTEQColors.gray50,
    tint: UTEQColors.bluePrimary,
    icon: UTEQColors.gray600,
    tabIconDefault: UTEQColors.gray400,
    tabIconSelected: UTEQColors.bluePrimary,
    border: UTEQColors.gray200,
    card: UTEQColors.white,
    cardBorder: UTEQColors.gray200,
    primary: UTEQColors.bluePrimary,
    primaryLight: UTEQColors.blueLight,
    secondary: UTEQColors.blueSecondary,
    accent: UTEQColors.accent,
    success: UTEQColors.success,
    error: UTEQColors.error,
    warning: UTEQColors.warning,
    info: UTEQColors.info,
  },
  dark: {
    text: UTEQColors.gray100,
    textSecondary: UTEQColors.gray400,
    background: UTEQColors.gray900,
    backgroundSecondary: UTEQColors.gray800,
    tint: UTEQColors.blueLight,
    icon: UTEQColors.gray400,
    tabIconDefault: UTEQColors.gray600,
    tabIconSelected: UTEQColors.blueLight,
    border: UTEQColors.gray700,
    card: UTEQColors.gray800,
    cardBorder: UTEQColors.gray700,
    primary: UTEQColors.blueLight,
    primaryLight: UTEQColors.blueLighter,
    secondary: UTEQColors.blueSecondary,
    accent: UTEQColors.blueLight,
    success: UTEQColors.success,
    error: UTEQColors.error,
    warning: UTEQColors.warning,
    info: UTEQColors.info,
  },
};

// Tipografía
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Tamaños de fuente
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Espaciado
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Bordes
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Sombras
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Estilos comunes reutilizables
export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: UTEQColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  input: {
    borderWidth: 1,
    borderColor: UTEQColors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    backgroundColor: UTEQColors.white,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: UTEQColors.bluePrimary,
  },
  buttonSecondary: {
    backgroundColor: UTEQColors.blueLight,
  },
  textButton: {
    color: UTEQColors.white,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
});
