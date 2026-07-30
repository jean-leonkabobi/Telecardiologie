import type { SxProps, Theme } from '@mui/material/styles';
import { FORM_CONTROL_HEIGHT } from '@/theme';

/**
 * Style utilisable seul (`sx={x}`) **ou** composé (`sx={[x, { … }]}`).
 *
 * `SxProps<Theme>` est une union qui contient déjà la forme tableau : un style
 * ainsi typé ne peut pas servir d'élément dans un tableau `sx`, et TypeScript
 * refuse la composition. On écarte les variantes tableau et fonction pour ne
 * garder que l'objet de style, seul assemblable.
 *
 * `SystemStyleObject` serait le type exact, mais `@mui/material/styles` ne le
 * réexporte pas et `@mui/system` n'est pas une dépendance directe.
 */
type ComposableSx = Exclude<SxProps<Theme>, readonly unknown[] | ((theme: Theme) => unknown)>;

/**
 * Contrôles de formulaire en hauteur confortable.
 *
 * Le thème met les champs en `size: 'small'` par défaut, ce qui convient aux
 * écrans denses — tableaux, filtres, boîtes de dialogue. Sur un formulaire que
 * l'utilisateur remplit champ par champ (connexion, saisie d'un patient), des
 * contrôles de 56 px sont plus confortables et correspondent à la cible tactile
 * recommandée.
 *
 * **`tallFieldSx` ne suffit pas seul** : il faut aussi passer `size="medium"` au
 * champ, sans quoi le `size: 'small'` du thème continue de piloter les paddings
 * internes et le style ne fait qu'agrandir la bordure. Les deux vont ensemble.
 */
export const tallFieldSx: ComposableSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: FORM_CONTROL_HEIGHT,
  },
  // Le libellé flottant se recentre sur la nouvelle hauteur, sinon il reste
  // calé trop haut par rapport au texte saisi.
  '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
    transform: `translate(14px, ${(FORM_CONTROL_HEIGHT - 23) / 2}px) scale(1)`,
  },
  '& .MuiOutlinedInput-input': {
    paddingTop: 0,
    paddingBottom: 0,
    height: 'auto',
  },
};

/**
 * Bouton principal aligné sur la hauteur des champs.
 *
 * `minHeight` écrase le `sizeLarge` du thème (48 px) : sur un formulaire de
 * quelques éléments empilés, une différence de hauteur entre le dernier champ et
 * le bouton se voit immédiatement.
 */
export const tallButtonSx: ComposableSx = {
  minHeight: FORM_CONTROL_HEIGHT,
  fontSize: '0.9375rem',
};

export { FORM_CONTROL_HEIGHT };
