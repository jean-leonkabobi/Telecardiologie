import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DetailItem } from "@/components/common/DetailItem";
import { InfoPanel } from "@/components/common/InfoPanel";
import { describeRedFlag, hasCriticalFlag } from "@/api/redFlags";
import type { EcgAnalysisResult } from "@/api/types";

/**
 * Rend les intervalles sous forme compacte, ou rien s'ils sont tous absents.
 *
 * Afficher « PR : — · QRS : — » sur un tracé non mesuré n'informerait pas, il
 * encombrerait.
 */
export function formatIntervals(
  intervals: EcgAnalysisResult["intervals"]
): string | null {
  const parties = [
    intervals.prMs !== null && `PR ${intervals.prMs} ms`,
    intervals.qrsMs !== null && `QRS ${intervals.qrsMs} ms`,
    intervals.qtMs !== null && `QT ${intervals.qtMs} ms`,
    intervals.qtcMs !== null && `QTc ${intervals.qtcMs} ms`,
    intervals.axisDegrees !== null && `axe ${intervals.axisDegrees}°`,
  ].filter((p): p is string => typeof p === "string");

  return parties.length > 0 ? parties.join(" · ") : null;
}

interface EcgInterpretationPanelProps {
  analysis: EcgAnalysisResult;
}

/**
 * Restitution de l'analyse automatique d'un tracé.
 *
 * Regroupe les trois blocs qui décrivent l'avis de l'IA — signes d'alarme,
 * avertissement « tracé non lu », et l'interprétation détaillée — pour que la
 * file d'attente et l'écran d'analyse en présentent exactement la même lecture.
 * Un seul endroit à faire évoluer, et deux écrans qui ne peuvent pas diverger.
 */
export function EcgInterpretationPanel({
  analysis,
}: EcgInterpretationPanelProps) {
  const intervals = formatIntervals(analysis.intervals);

  return (
    <Stack spacing={2}>
      {analysis.redFlags.length > 0 && (
        <InfoPanel
          tone={hasCriticalFlag(analysis.redFlags) ? "error" : "warning"}
          title={
            hasCriticalFlag(analysis.redFlags)
              ? "Signes d’alarme — demande passée en urgence"
              : "Points de vigilance mesurés"
          }
        >
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            {analysis.redFlags.map(code => {
              const flag = describeRedFlag(code);
              return (
                <Stack key={code} spacing={0.25}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Chip
                      label={flag.label}
                      size="small"
                      color={flag.severity === "critical" ? "error" : "warning"}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {flag.hint}
                  </Typography>
                </Stack>
              );
            })}
            <Typography variant="caption">
              Détectés par des seuils cliniques, indépendamment du modèle de
              langage.
            </Typography>
          </Stack>
        </InfoPanel>
      )}

      {!analysis.measuredSignal && (
        <InfoPanel tone="warning" title="Tracé non lu par l'analyseur">
          <Typography variant="body2" sx={{ mt: 1 }}>
            Aucune mesure n'a pu être extraite du fichier : l'avis ci-dessous
            s'appuie uniquement sur le dossier clinique. Rythme et fréquence
            restent à établir par votre lecture.
          </Typography>
        </InfoPanel>
      )}

      <InfoPanel title="Interprétation proposée par l'IA">
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <DetailItem label="Rythme" value={analysis.rhythmLabel} />
          <DetailItem
            label="Fréquence cardiaque"
            value={analysis.heartRateLabel}
          />
          <DetailItem
            label={analysis.measuredSignal ? "Anomalies" : "Points à vérifier"}
            value={
              analysis.anomalies.length === 0 ? (
                "Aucune anomalie détectée"
              ) : (
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ flexWrap: "wrap", gap: 0.5 }}
                >
                  {analysis.anomalies.map(anomaly => (
                    <Chip
                      key={anomaly}
                      label={anomaly}
                      size="small"
                      color="warning"
                    />
                  ))}
                </Stack>
              )
            }
          />
          {intervals && <DetailItem label="Intervalles" value={intervals} />}
          <DetailItem
            label="Score de confiance"
            value={analysis.confidenceLabel}
          />
          <DetailItem label="Conclusion" value={analysis.interpretation} />
          <Divider />
          <Typography variant="caption">
            Modèle {analysis.modelVersion} · aide à la décision, non validée.
          </Typography>
        </Stack>
      </InfoPanel>
    </Stack>
  );
}

export default EcgInterpretationPanel;
