export type Theme = 'light' | 'dark' | 'high-contrast';

export interface ThemeConfig {
  name: string;
  value: Theme;
  description: string;
  icon: string;
}

export const themes: ThemeConfig[] = [
  {
    name: 'Light',
    value: 'light',
    description: 'Clean and bright interface',
    icon: 'sun',
  },
  {
    name: 'Dark',
    value: 'dark',
    description: 'Easy on the eyes in low light',
    icon: 'moon',
  },
  {
    name: 'High Contrast',
    value: 'high-contrast',
    description: 'Enhanced visibility and accessibility',
    icon: 'contrast',
  },
];

export const defaultTheme: Theme = 'dark';
