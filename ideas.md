# Stratégie de Design - Plateforme de Télécardiologie Assistée par IA

## Trois Approches Stylistiques

### 1. **Clinical Minimalism** (Approche sélectionnée)
**Intro :** Un design épuré et hautement fonctionnel inspiré des interfaces médicales modernes. Accent sur la clarté, la hiérarchie de l'information et la confiance professionnelle.
**Probabilité :** 0.08

### 2. **Warm Professional**
**Intro :** Une approche plus accessible avec des teintes chaudes et des formes arrondies. Équilibre entre rigueur professionnelle et humanité.
**Probabilité :** 0.06

### 3. **Data-Driven Modern**
**Intro :** Un design centré sur la visualisation des données avec des graphiques dynamiques et une palette de couleurs analytiques.
**Probabilité :** 0.04

---

## Approche Sélectionnée : **Clinical Minimalism**

### Design Movement
Inspiré de **Swiss Design** et des interfaces médicales contemporaines (Epic EHR, Cerner). Emphasis sur la fonctionnalité, la grille, et la typographie claire.

### Core Principles
1. **Clarté extrême** : Chaque élément a un objectif clair. Pas de décoration gratuite.
2. **Hiérarchie stricte** : L'information critique est immédiatement visible. Les détails secondaires sont accessibles mais non intrusifs.
3. **Confiance par la précision** : Les espacements, les alignements et les couleurs sont mathématiquement cohérents.
4. **Accessibilité médicale** : Contraste élevé, typographie lisible, pas de dépendance aux couleurs seules pour les statuts.

### Color Philosophy
- **Primaire :** Bleu médical profond (`oklch(0.55 0.15 260)`) - inspire confiance et professionnalisme
- **Accent critique :** Rouge doux pour les urgences et les erreurs (`oklch(0.58 0.20 25)`) - visible mais pas agressif
- **Succès/Validation :** Vert apaisant (`oklch(0.65 0.15 140)`) - indique la progression positive
- **Neutre/Attente :** Gris froid (`oklch(0.70 0.05 260)`) - neutre et professionnel
- **Fond :** Blanc pur (`oklch(1 0 0)`) pour la lisibilité maximale
- **Texte :** Charbon profond (`oklch(0.20 0.02 260)`) pour le contraste

### Layout Paradigm
- **Sidebar persistante** pour la navigation principale (Professionnel, Cardiologue, Admin)
- **Grille 12 colonnes** pour l'alignement des contenus
- **Espaces généreux** : Padding 24px, gap 16px entre les sections
- **Zones de contenu** : Largeur max 1280px, centrée
- **Trois colonnes pour l'analyse ECG** : Patient info | ECG | Interprétation

### Signature Elements
1. **Badges de statut distincts** : Chaque statut a une forme, une couleur ET un symbole (pas de couleur seule)
2. **Timeline verticale** : Progression visuelle claire des étapes de la demande
3. **Cartes de statistiques** : Design épuré avec nombre grand, label petit, icône subtile

### Interaction Philosophy
- **Confirmations explicites** : Les actions importantes (valider, rejeter) demandent confirmation
- **Feedback immédiat** : Boutons avec micro-interactions (scale, highlight)
- **États visuels clairs** : Hover, active, disabled, loading - tous distincts
- **Transitions fluides** : 150-200ms pour les changements d'état

### Animation
- **Entrée des éléments** : Fade-in + slide-up (150ms, ease-out)
- **Changement de statut** : Pulse subtil (300ms) pour attirer l'attention
- **Chargement** : Spinner minimaliste, pas d'animation flashy
- **Transitions de page** : Fade-in/fade-out (100ms) pour la fluidité
- **Hover des boutons** : Scale 1.02 + shadow (100ms)

### Typography System
- **Display (Titres principaux) :** Inter Bold, 32px, line-height 1.2
- **Heading 1 (Titres de section) :** Inter SemiBold, 24px, line-height 1.3
- **Heading 2 (Sous-titres) :** Inter Medium, 18px, line-height 1.4
- **Body (Texte courant) :** Inter Regular, 14px, line-height 1.6
- **Label (Étiquettes) :** Inter Medium, 12px, line-height 1.4, uppercase
- **Mono (Données techniques) :** JetBrains Mono, 13px, line-height 1.5

### Brand Essence
**Positionnement :** La plateforme qui transforme l'analyse ECG en décision médicale sûre et rapide.
**Trois adjectifs :** Fiable, Efficace, Transparent

### Brand Voice
- **Tone :** Professionnel, clair, rassurant
- **Exemple 1 :** "Nouvelle demande d'analyse ECG" (direct, actionnable)
- **Exemple 2 :** "Analyse IA en attente de validation" (informatif, pas alarmiste)

### Wordmark & Logo
Logo : Un cœur stylisé en ligne continue, bleu médical, avec une onde ECG intégrée. Pas de texte, juste le symbole.

### Signature Brand Color
**Bleu Médical :** `oklch(0.55 0.15 260)` - La couleur de confiance et de professionnalisme médical

---

## Style Decisions (à valider avec le client)
- Palette de couleurs provisoire validée
- Logo provisoire (cœur + ECG)
- Typographie : Inter + JetBrains Mono
