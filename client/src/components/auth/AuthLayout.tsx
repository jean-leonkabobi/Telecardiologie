import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/LockOutlined";
import type { ReactNode } from "react";

import { Logo } from "@/components/common/Logo";

/**
 * Gabarit commun aux écrans d'authentification.
 *
 * Deux colonnes sur grand écran : à gauche un panneau illustré qui donne le
 * contexte médical, à droite le formulaire sur fond clair pour un contraste de
 * lecture maximal. Sous `md`, le panneau disparaît — il est décoratif, et le
 * conserver réduirait la place utile du formulaire sur mobile.
 */

// Moniteur de rythme cardiaque (Unsplash). Paramètres de redimensionnement
// côté CDN pour ne pas télécharger une image démesurée.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&w=1400&q=80";

const HIGHLIGHTS = [
  "Analyse ECG assistée par intelligence artificielle",
  "Validation par un cardiologue référent",
  "Traçabilité complète des actes et des accès",
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Lien ou action affichée sous la carte. */
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
      }}
    >
      {/* Panneau illustré — masqué sous md. */}
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", md: "flex" },
          position: "relative",
          width: { md: "44%", lg: "48%" },
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          alignItems: "flex-end",
          p: 6,
          // Voile dégradé : sans lui, le texte blanc deviendrait illisible sur
          // les zones claires de la photo.
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(85,17,19,0.72) 0%, rgba(85,17,19,0.55) 45%, rgba(17,12,11,0.90) 100%)",
          },
        }}
      >
        <Stack
          spacing={4}
          sx={{ position: "relative", zIndex: 1, maxWidth: 460 }}
        >
          <Logo
            size={48}
            variant="inverse"
            subtitle="Plateforme d'analyse ECG"
          />

          <Typography
            variant="h1"
            sx={{
              color: "common.white",
              fontSize: { md: "2rem", lg: "2.375rem" },
              lineHeight: 1.2,
            }}
          >
            L'expertise cardiologique, où que soit le patient.
          </Typography>

          <Stack spacing={1.5}>
            {HIGHLIGHTS.map(item => (
              <Stack
                key={item}
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "common.white",
                    opacity: 0.85,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.90)" }}
                >
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Colonne formulaire. */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {/* Marque reprise ici pour les petits écrans, où le panneau est masqué. */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Logo size={44} subtitle="Plateforme d'analyse ECG" />
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h1" component="h1">
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {subtitle}
                </Typography>
              </Stack>

              {children}
            </CardContent>
          </Card>

          {footer && <Box sx={{ mt: 2.5 }}>{footer}</Box>}

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              mt: 3,
              color: "text.secondary",
            }}
          >
            <LockIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">
              Accès réservé aux professionnels de santé autorisés
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default AuthLayout;
