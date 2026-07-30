import { createTheme } from '@mui/material/styles';
import { frFR as coreFrFR } from '@mui/material/locale';
import { frFR as gridFrFR } from '@mui/x-data-grid/locales';
import { frFR as pickersFrFR } from '@mui/x-date-pickers/locales';

/**
 * Identité « rouge médical & blanc ».
 *
 * Le rouge est la couleur de marque : boutons principaux, éléments actifs,
 * en-têtes. Le blanc porte les surfaces.
 *
 * Difficulté propre à une marque rouge : le rouge est aussi la convention pour
 * l'erreur. Trois écarts les séparent — l'erreur est nettement plus sombre et
 * moins saturée (#841521 contre #b51e26), elle est toujours accompagnée d'une
 * icône, et l'avertissement passe en ambre. Un bouton principal et un message
 * d'erreur ne se confondent donc pas.
 */
export const brandRed = {
  50: '#fdf2f2',
  100: '#fee4e3',
  200: '#facac9',
  300: '#f5a5a2',
  400: '#e86c68',
  500: '#d4393b',
  600: '#b51e26', // primaire en mode clair
  700: '#94151d',
  800: '#721118',
  900: '#551113',
} as const;

const neutral = {
  ink: '#1b1414',
  inkMuted: '#6c6060',
  border: '#e8e3e3',
  surface: '#faf5f5',
  nightBg: '#110c0b',
  nightPaper: '#1f1717',
  nightText: '#e8e3e2',
  nightTextMuted: '#a89f9f',
  nightBorder: 'rgba(255, 255, 255, 0.13)',
} as const;

/**
 * Couleurs de série des graphiques.
 *
 * Le rouge de marque ouvre la série, les suivantes s'en écartent nettement en
 * teinte pour rester distinguables — y compris pour un daltonisme deutan, où
 * deux rouges voisins deviendraient indiscernables.
 */
/**
 * Hauteur des contrôles d'un formulaire de saisie.
 *
 * Champs et bouton partagent la même valeur : sur un formulaire de quelques
 * éléments empilés, une différence de hauteur se voit immédiatement. 56 px
 * correspondent par ailleurs à la cible tactile recommandée.
 *
 * S'applique aux écrans où l'utilisateur remplit champ par champ — connexion,
 * réinitialisation, saisie d'un patient. Les écrans denses (tableaux, filtres)
 * gardent le `size: 'small'` par défaut du thème.
 *
 * Défini ici plutôt que dans un module à part : le thème est déjà importé par
 * tous les écrans, ce qui évite une dépendance supplémentaire.
 */
export const FORM_CONTROL_HEIGHT = 56;

export const chartPalette = {
  light: ['#b51e26', '#277c99', '#37844c', '#bb731b', '#6b4d8f', '#8a7060'],
  dark: ['#e86c68', '#67b7d6', '#66ba7f', '#eca851', '#a48ec9', '#c4a596'],
} as const;

export const theme = createTheme(
  {
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: brandRed[600],
            light: brandRed[400],
            dark: brandRed[800],
            contrastText: '#ffffff',
          },
          secondary: { main: '#6c6060', contrastText: '#ffffff' },
          error: { main: '#841521', light: '#b51e26', dark: '#551113', contrastText: '#ffffff' },
          warning: { main: '#bb731b', contrastText: '#ffffff' },
          success: { main: '#37844c', contrastText: '#ffffff' },
          info: { main: '#277c99', contrastText: '#ffffff' },
          background: { default: neutral.surface, paper: '#ffffff' },
          text: { primary: neutral.ink, secondary: neutral.inkMuted },
          divider: neutral.border,
          surfaceMuted: brandRed[50],
        },
      },
      dark: {
        palette: {
          primary: {
            main: brandRed[400],
            light: brandRed[300],
            dark: brandRed[600],
            contrastText: '#1b0d0d',
          },
          secondary: { main: '#a89f9f', contrastText: '#1b0d0d' },
          error: { main: '#f47a7d', light: '#f5a5a2', dark: '#b51e26', contrastText: '#1b0d0d' },
          warning: { main: '#eca851', contrastText: '#1b0d0d' },
          success: { main: '#66ba7f', contrastText: '#1b0d0d' },
          info: { main: '#67b7d6', contrastText: '#1b0d0d' },
          background: { default: neutral.nightBg, paper: neutral.nightPaper },
          text: { primary: neutral.nightText, secondary: neutral.nightTextMuted },
          divider: neutral.nightBorder,
          surfaceMuted: '#2a1f1f',
        },
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
      h1: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' },
      h2: { fontSize: '1.375rem', fontWeight: 650, lineHeight: 1.35, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.0625rem', fontWeight: 650, lineHeight: 1.4 },
      h4: { fontSize: '0.9375rem', fontWeight: 600 },
      h5: { fontSize: '0.875rem', fontWeight: 600 },
      h6: { fontSize: '0.8125rem', fontWeight: 600 },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      caption: { fontSize: '0.78125rem', lineHeight: 1.5 },
    },
    components: {
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: ({ theme: t }) => ({
            transition: t.transitions.create(['box-shadow', 'border-color'], {
              duration: t.transitions.duration.shorter,
            }),
          }),
        },
      },
      MuiCardHeader: {
        defaultProps: { slotProps: { title: { variant: 'h3' } } },
        styleOverrides: { root: { paddingBottom: 8 } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { paddingInline: 18, minHeight: 40 },
          sizeSmall: { minHeight: 32, paddingInline: 12 },
          sizeLarge: { minHeight: 48, fontSize: '0.9375rem' },
        },
      },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: t.vars.palette.background.paper,
            // Un anneau plus épais au focus : repère net au clavier.
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
          }),
        },
      },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiChip: { defaultProps: { size: 'small' }, styleOverrides: { root: { fontWeight: 550 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiAlert: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { alignItems: 'flex-start' } },
      },
      MuiAppBar: {
        defaultProps: { color: 'inherit', elevation: 0 },
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: t.vars.palette.background.paper,
            borderBottom: `1px solid ${t.vars.palette.divider}`,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme: t }) => ({
            borderRight: `1px solid ${t.vars.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            borderRadius: t.shape.borderRadius,
            '&.Mui-selected': {
              backgroundColor: t.vars.palette.surfaceMuted,
              '&:hover': { backgroundColor: t.vars.palette.surfaceMuted },
            },
          }),
        },
      },
      MuiDataGrid: {
        defaultProps: { disableRowSelectionOnClick: true, density: 'standard' },
        styleOverrides: {
          root: ({ theme: t }) => ({
            border: `1px solid ${t.vars.palette.divider}`,
            borderRadius: t.shape.borderRadius,
            '--DataGrid-rowBorderColor': t.vars.palette.divider,
          }),
          columnHeaders: ({ theme: t }) => ({ backgroundColor: t.vars.palette.surfaceMuted }),
        },
      },
    },
  },
  coreFrFR,
  gridFrFR,
  pickersFrFR,
);

export default theme;
