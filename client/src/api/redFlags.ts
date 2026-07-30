/**
 * Libellés des signes d'alarme.
 *
 * Le serveur envoie des **codes** stables ; la formulation et la gravité
 * d'affichage vivent ici. C'est ce qui permet de reformuler un libellé sans
 * migration, et d'ajouter une règle côté serveur sans casser cet écran — un code
 * inconnu retombe sur un rendu neutre plutôt que de faire disparaître l'alerte.
 */
export interface RedFlagPresentation {
  label: string;
  /** `critical` déclenche le passage automatique en urgence côté serveur. */
  severity: 'critical' | 'warning';
  /** Ce que le cardiologue doit vérifier en priorité. */
  hint: string;
}

const CATALOGUE: Record<string, RedFlagPresentation> = {
  ST_ELEVATION: {
    label: 'Sus-décalage ST',
    severity: 'critical',
    hint: 'Évoque un syndrome coronarien aigu. Prise en charge immédiate.',
  },
  ST_DEPRESSION: {
    label: 'Sous-décalage ST',
    severity: 'critical',
    hint: 'Évoque une ischémie. À corréler aux biomarqueurs.',
  },
  AV_BLOCK_COMPLETE: {
    label: 'Bloc auriculo-ventriculaire complet',
    severity: 'critical',
    hint: 'Risque de syncope et d’arrêt. Surveillance rapprochée.',
  },
  VENTRICULAR_TACHYCARDIA: {
    label: 'Tachycardie ventriculaire',
    severity: 'critical',
    hint: 'Trouble du rythme grave. Urgence absolue.',
  },
  SEVERE_BRADYCARDIA: {
    label: 'Bradycardie sévère',
    severity: 'critical',
    hint: 'Fréquence sous 40 bpm. Rechercher un bloc ou une cause iatrogène.',
  },
  SEVERE_TACHYCARDIA: {
    label: 'Tachycardie sévère',
    severity: 'critical',
    hint: 'Fréquence au-delà de 150 bpm. Rechercher la cause du trouble.',
  },
  QTC_PROLONGED: {
    label: 'QTc allongé',
    severity: 'critical',
    hint: 'Au-delà de 500 ms : risque de torsades de pointes.',
  },
  WIDE_QRS: {
    label: 'QRS élargi',
    severity: 'warning',
    hint: 'Au-delà de 120 ms : évoque un bloc de branche.',
  },
  PR_PROLONGED: {
    label: 'PR allongé',
    severity: 'warning',
    hint: 'Au-delà de 200 ms : bloc auriculo-ventriculaire du premier degré.',
  },
};

/** Un code inconnu reste affiché : mieux vaut brut que silencieux. */
export function describeRedFlag(code: string): RedFlagPresentation {
  return (
    CATALOGUE[code] ?? {
      label: code,
      severity: 'warning',
      hint: 'Signe signalé par les règles de sécurité.',
    }
  );
}

export function hasCriticalFlag(codes: string[]): boolean {
  return codes.some((c) => describeRedFlag(c).severity === 'critical');
}
