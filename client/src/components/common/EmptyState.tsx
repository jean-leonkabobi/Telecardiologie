import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InboxIcon from "@mui/icons-material/InboxOutlined";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/** Bloc affiché lorsqu'une liste ou un tableau ne contient aucune donnée. */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Stack
      spacing={1.5}
      sx={{ alignItems: "center", textAlign: "center", py: 6, px: 3 }}
    >
      <Box sx={{ color: "text.disabled", display: "flex", fontSize: 48 }}>
        {icon ?? <InboxIcon fontSize="inherit" />}
      </Box>
      <Typography variant="h3">{title}</Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", maxWidth: 420 }}
        >
          {description}
        </Typography>
      )}
      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}

export default EmptyState;
