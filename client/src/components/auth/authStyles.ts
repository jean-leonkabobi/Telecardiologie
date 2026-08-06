/**
 * Styles des écrans d'authentification.
 *
 * La hauteur confortable n'est plus propre à l'authentification : le formulaire
 * de nouvelle demande ECG l'utilise aussi. La définition vit donc dans
 * `components/common/formStyles.ts`, et ce module n'en conserve que les alias
 * historiques — importer `@/components/auth/...` depuis une page métier serait un
 * défaut de couche.
 */
export {
  tallFieldSx as authFieldSx,
  tallButtonSx as authButtonSx,
  FORM_CONTROL_HEIGHT as AUTH_CONTROL_HEIGHT,
} from "@/components/common/formStyles";
