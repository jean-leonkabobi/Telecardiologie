import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Boutons ou filtres alignés à droite du titre. */
  action?: ReactNode;
  /**
   * Écran parent, pour les pages de détail.
   *
   * Une adresse explicite plutôt qu'un retour dans l'historique : on arrive sur
   * un tracé depuis la file, mais aussi depuis une notification ou un lien collé
   * dans un message. `history.back()` renverrait alors hors de l'application,
   * alors que la section parente reste toujours la bonne destination.
   */
  backTo?: { href: string; label: string };
}

/** En-tête de page : retour éventuel, titre, sous-titre et zone d'actions. */
export function PageHeader({
  title,
  subtitle,
  action,
  backTo,
}: PageHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "flex-start" },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "flex-start", minWidth: 0 }}
      >
        {backTo && (
          <Tooltip title={backTo.label}>
            <IconButton
              onClick={() => navigate(backTo.href)}
              aria-label={backTo.label}
              // Aligné sur la première ligne du titre plutôt que centré sur le
              // bloc : avec un sous-titre, un centrage vertical ferait descendre
              // la flèche entre les deux lignes.
              sx={{ mt: -0.5 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1">{title}</Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

export default PageHeader;
