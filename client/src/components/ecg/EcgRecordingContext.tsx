import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeartOutlined";

import { DetailItem } from "@/components/common/DetailItem";
import type { EcgRequestDetail } from "@/api/types";

interface EcgRecordingContextProps {
  indicationLabel: string;
  recording: EcgRequestDetail["recording"];
}

/**
 * Conditions dans lesquelles le tracé a été enregistré.
 *
 * **Pourquoi un bloc distinct du contexte clinique.** Les symptômes disent
 * pourquoi on demande un avis ; ces champs disent comment lire le tracé. Un
 * porteur de stimulateur ou un patient sous bêtabloquant produisent des tracés
 * qu'on interpréterait de travers sans le savoir — ce n'est pas du contexte, c'est
 * une clé de lecture.
 *
 * Le stimulateur ressort en pastille et non en ligne de texte : c'est la seule
 * information de ce bloc qui change la lecture de **toutes** les autres, et elle
 * doit se voir avant qu'on ait commencé à examiner le tracé.
 */
export function EcgRecordingContext({
  indicationLabel,
  recording,
}: EcgRecordingContextProps) {
  const tension =
    recording.systolicBp !== null || recording.diastolicBp !== null
      ? `${recording.systolicBp ?? "—"}/${recording.diastolicBp ?? "—"} mmHg`
      : null;

  const morphologie =
    recording.weightKg !== null || recording.heightCm !== null
      ? [
          recording.weightKg !== null ? `${recording.weightKg} kg` : null,
          recording.heightCm !== null ? `${recording.heightCm} cm` : null,
          recording.bmi !== null
            ? `IMC ${String(recording.bmi).replace(".", ",")}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  /**
   * Seules les valeurs renseignées sont affichées.
   *
   * Une grille de six lignes dont cinq portent un tiret cadratin fait croire à un
   * dossier vide. Le motif, lui, est toujours présent — il est obligatoire.
   */
  const lignes: [string, string][] = [
    ["Motif de l'examen", indicationLabel],
    ...(recording.recordedAt
      ? ([
          [
            "Enregistré le",
            new Date(recording.recordedAt).toLocaleString("fr-FR"),
          ],
        ] as [string, string][])
      : []),
    ...(tension
      ? ([["Tension artérielle", tension]] as [string, string][])
      : []),
    ...(morphologie
      ? ([["Morphologie", morphologie]] as [string, string][])
      : []),
    ...(recording.deviceModel
      ? ([["Appareil", recording.deviceModel]] as [string, string][])
      : []),
  ];

  return (
    <Stack spacing={2}>
      {recording.hasPacemaker && (
        <Chip
          icon={<MonitorHeartIcon />}
          label="Porteur d'un stimulateur ou défibrillateur"
          color="info"
          sx={{ alignSelf: "flex-start" }}
        />
      )}

      <Grid container spacing={2}>
        {lignes.map(([label, value]) => (
          <Grid key={label} size={{ xs: 12, sm: 6 }}>
            <DetailItem label={label} value={value} />
          </Grid>
        ))}
      </Grid>

      {recording.currentMedication && (
        <DetailItem
          label="Traitement en cours"
          value={recording.currentMedication}
        />
      )}

      {!recording.recordedAt && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          La date d'enregistrement n'a pas été précisée : le tracé peut être
          antérieur à la soumission.
        </Typography>
      )}
    </Stack>
  );
}

export default EcgRecordingContext;
