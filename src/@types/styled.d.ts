import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    name: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      gray: string;
      onPrimary: string;
      onSecondary: string;
      onBackground: string;
      onSurface: string;
      onGray: string;
    };
  }
}
