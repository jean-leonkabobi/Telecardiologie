import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface LogoProps {
  size?: number;
  /** Affiche le nom de la plateforme à côté de la marque. */
  showWordmark?: boolean;
  /** `inverse` pour un fond sombre ou coloré. */
  variant?: 'default' | 'inverse';
  subtitle?: string;
}

/**
 * Marque de la plateforme : cœur stylisé traversé d'un tracé ECG.
 *
 * Le symbole est dessiné en SVG inline plutôt que chargé depuis un fichier :
 * il hérite ainsi des couleurs du thème et reste net à toute taille, sans
 * requête réseau supplémentaire.
 */
export function Logo({ size = 36, showWordmark = true, variant = 'default', subtitle }: LogoProps) {
  const inverse = variant === 'inverse';

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        component="svg"
        viewBox="0 0 64 64"
        role="img"
        aria-label="Télécardiologie"
        sx={{ width: size, height: size, flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logo-heart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4393b" />
            <stop offset="1" stopColor="#94151d" />
          </linearGradient>
        </defs>

        <rect
          width="64"
          height="64"
          rx="15"
          fill={inverse ? 'rgba(255,255,255,0.14)' : 'url(#logo-heart-gradient)'}
        />

        {/* Contour du cœur, interrompu là où passe le tracé. */}
        <path
          d="M32 51.5C32 51.5 13.5 40.2 13.5 27.7C13.5 21.2 18.4 16.5 24.3 16.5C27.9 16.5 30.6 18.3 32 20.6C33.4 18.3 36.1 16.5 39.7 16.5C45.6 16.5 50.5 21.2 50.5 27.7C50.5 30.3 49.7 32.8 48.4 35.2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Complexe QRS. */}
        <path
          d="M11 35.2H22.6L26.2 27.4L31.2 43.4L35.4 31.6L38.2 35.2H53"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Box>

      {showWordmark && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            noWrap
            sx={{
              color: inverse ? 'common.white' : 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Télécardiologie
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: 'block',
                color: inverse ? 'rgba(255,255,255,0.78)' : 'text.secondary',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
}

export default Logo;
