import type { SxProps, Theme } from '@mui/material/styles';
import { AUTH_CONTROL_HEIGHT } from '@/theme';

/**
 * Styles partagés par les écrans d'authentification.
 *
 * Le reste de l'application utilise des contrôles compacts (`size: 'small'` par
 * défaut dans le thème), adaptés aux formulaires denses. Sur la connexion et la
 * réinitialisation, l'utilisateur ne saisit que deux ou trois valeurs : champs
 * et bouton adoptent la même hauteur, plus confortable et visuellement aligné.
 */

export const authFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    minHeight: AUTH_CONTROL_HEIGHT,
  },
  // Le libellé flottant se recentre sur la nouvelle hauteur, sinon il reste
  // calé trop haut par rapport au texte saisi.
  '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
    transform: `translate(14px, ${(AUTH_CONTROL_HEIGHT - 23) / 2}px) scale(1)`,
  },
  '& .MuiOutlinedInput-input': {
    paddingTop: 0,
    paddingBottom: 0,
    height: 'auto',
  },
};

/** Bouton principal d'un écran d'authentification, aligné sur les champs. */
export const authButtonSx: SxProps<Theme> = {
  minHeight: AUTH_CONTROL_HEIGHT,
  fontSize: '0.9375rem',
};

export { AUTH_CONTROL_HEIGHT };
