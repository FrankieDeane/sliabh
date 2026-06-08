import { useThemeStore } from '../store/themeStore';
import { colors } from '../theme/colors';

export function useTheme() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;
  return { theme, isDark, toggle, c, colors };
}
