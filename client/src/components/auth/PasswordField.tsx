import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import { forwardRef, useState } from 'react';

import { authFieldSx } from './authStyles';

/** Règles alignées sur le `Password` du domaine, pour un retour identique. */
const RULES = [
  { label: '12 caractères minimum', test: (v: string) => v.length >= 12 },
  { label: 'une minuscule', test: (v: string) => /[a-z]/.test(v) },
  { label: 'une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'un chiffre', test: (v: string) => /[0-9]/.test(v) },
  { label: 'un caractère spécial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordStrength(value: string): number {
  return RULES.filter((rule) => rule.test(value)).length;
}

type PasswordFieldProps = Omit<TextFieldProps, 'type'> & {
  /** Affiche la jauge et la liste des règles non satisfaites. */
  showStrength?: boolean;
  value?: string;
};

/**
 * Champ mot de passe avec bascule d'affichage.
 *
 * En mode `showStrength`, il énonce les règles restantes plutôt que de se
 * contenter d'un verdict : l'utilisateur sait quoi corriger sans avoir à
 * soumettre le formulaire.
 */
export const PasswordField = forwardRef<HTMLDivElement, PasswordFieldProps>(function PasswordField(
  { showStrength = false, value = '', size = 'medium', sx, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  const satisfied = passwordStrength(String(value));
  const ratio = (satisfied / RULES.length) * 100;
  const missing = RULES.filter((rule) => !rule.test(String(value))).map((r) => r.label);

  const color = satisfied <= 2 ? 'error' : satisfied <= 4 ? 'warning' : 'success';

  return (
    <Stack spacing={1}>
      <TextField
        {...props}
        ref={ref}
        size={size}
        value={value}
        type={visible ? 'text' : 'password'}
        // Le style de l'appelant est fusionné, pas écrasé.
        sx={[authFieldSx, ...(Array.isArray(sx) ? sx : [sx])]}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setVisible((v) => !v)}
                  edge="end"
                  size="small"
                  // Le libellé décrit l'action, pas l'état : c'est ce qu'annonce
                  // un lecteur d'écran au moment de l'activation.
                  aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {showStrength && String(value).length > 0 && (
        <Stack spacing={0.75}>
          <LinearProgress
            variant="determinate"
            value={ratio}
            color={color}
            sx={{ height: 5, borderRadius: 3 }}
            aria-label="Robustesse du mot de passe"
          />
          {missing.length > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Il manque : {missing.join(', ')}.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
});

export default PasswordField;
