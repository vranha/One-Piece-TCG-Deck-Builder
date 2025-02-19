// useThemeColor.ts
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/hooks/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { theme } = useTheme();
  const themeKey = theme as 'light' | 'dark'; // 🔥 Esto evita que TypeScript se queje
  const colorFromProps = props[themeKey];

  return colorFromProps || Colors[themeKey][colorName];
}
