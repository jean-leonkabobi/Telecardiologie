import type {} from '@mui/x-data-grid/themeAugmentation';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';

declare module '@mui/material/styles' {
  interface Palette {
    /** Fond discret : en-têtes de tableau, blocs d'information, zones inertes. */
    surfaceMuted: string;
  }
  interface PaletteOptions {
    surfaceMuted?: string;
  }
}

export {};
