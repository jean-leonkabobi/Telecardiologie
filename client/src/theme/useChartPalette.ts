import { useColorScheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { chartPalette } from "./index";

/**
 * Couleurs de série des graphiques pour le mode courant.
 *
 * `mode` vaut `'system'` tant que l'utilisateur n'a pas choisi explicitement,
 * et `undefined` au tout premier rendu : on retombe alors sur la préférence
 * du navigateur.
 */
export function useChartPalette(): string[] {
  const { mode, systemMode } = useColorScheme();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const resolved =
    mode === "system" || mode === undefined
      ? (systemMode ?? (prefersDark ? "dark" : "light"))
      : mode;

  return [...chartPalette[resolved]];
}
