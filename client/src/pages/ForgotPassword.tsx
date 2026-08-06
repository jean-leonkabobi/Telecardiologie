import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { InfoPanel } from "@/components/common/InfoPanel";
import { authButtonSx, authFieldSx } from "@/components/auth/authStyles";
import { PasswordField } from "@/components/auth/PasswordField";
import { ApiError, api } from "@/lib/apiClient";
import { notify } from "@/lib/alerts";

const STEPS = ["Adresse email", "Code reçu", "Nouveau mot de passe"];

const emailSchema = z.object({
  email: z.email({ message: "Adresse email invalide" }),
});

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code comporte 6 chiffres"),
});

/** Mêmes règles que le `Password` du domaine : un refus serveur serait une surprise. */
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères")
      .max(128)
      .regex(/[a-z]/, "Il doit contenir une minuscule")
      .regex(/[A-Z]/, "Il doit contenir une majuscule")
      .regex(/[0-9]/, "Il doit contenir un chiffre")
      .regex(/[^A-Za-z0-9]/, "Il doit contenir un caractère spécial"),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type EmailValues = z.infer<typeof emailSchema>;
type CodeValues = z.infer<typeof codeSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

/**
 * Parcours de réinitialisation en trois étapes.
 *
 * Le découpage est délibéré : l'utilisateur sait toujours où il en est, et le
 * code est validé dès sa saisie plutôt qu'au moment d'envoyer le nouveau mot de
 * passe — une erreur de frappe ne fait pas perdre le mot de passe déjà tapé.
 */
export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  /** Secondes restantes avant de pouvoir demander un nouveau code. */
  const [cooldown, setCooldown] = useState(0);

  // Pré-remplit l'adresse depuis le lien d'activation reçu par email.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("email");
    if (fromUrl) setEmail(fromUrl);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle={
        step === 0
          ? "Indiquez votre adresse email pour recevoir un code de vérification."
          : step === 1
            ? `Saisissez le code à 6 chiffres envoyé à ${email}.`
            : "Choisissez un nouveau mot de passe."
      }
      footer={
        <Stack direction="row" sx={{ justifyContent: "center" }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            underline="hover"
            onClick={() => navigate("/login")}
          >
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              <span>Retour à la connexion</span>
            </Stack>
          </Link>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <EmailStep
            defaultEmail={email}
            onSent={value => {
              setEmail(value);
              setCooldown(60);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <CodeStep
            email={email}
            cooldown={cooldown}
            onResend={() => setCooldown(60)}
            onVerified={value => {
              setCode(value);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <PasswordStep
            email={email}
            code={code}
            onDone={() => {
              notify.success(
                "Mot de passe réinitialisé",
                "Vous pouvez maintenant vous connecter."
              );
              navigate("/login");
            }}
            onCodeRejected={() => {
              notify.error("Code expiré", "Veuillez recommencer la procédure.");
              setStep(1);
            }}
          />
        )}
      </Stack>
    </AuthLayout>
  );
}

// --- Étape 1 : adresse email -------------------------------------------------

function EmailStep({
  defaultEmail,
  onSent,
}: {
  defaultEmail: string;
  onSent: (email: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = async (values: EmailValues): Promise<void> => {
    try {
      await api.post(
        "/auth/forgot-password",
        { email: values.email },
        { skipRefresh: true }
      );
      onSent(values.email);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "L'envoi a échoué. Veuillez réessayer.";
      if (error instanceof ApiError && error.code === "TOO_MANY_REQUESTS") {
        notify.warning("Trop de demandes", message);
      } else {
        notify.error("Envoi impossible", message);
      }
    }
  };

  return (
    <Stack
      component="form"
      spacing={2.5}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <TextField
        label="Adresse email professionnelle"
        type="email"
        placeholder="awa.diop@hopital.sn"
        autoComplete="email"
        size="medium"
        sx={authFieldSx}
        autoFocus
        disabled={isSubmitting}
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...register("email")}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        sx={authButtonSx}
        loading={isSubmitting}
        startIcon={<MarkEmailReadIcon />}
        loadingPosition="start"
      >
        Recevoir un code
      </Button>
    </Stack>
  );
}

// --- Étape 2 : code de vérification -----------------------------------------

function CodeStep({
  email,
  cooldown,
  onResend,
  onVerified,
  onBack,
}: {
  email: string;
  cooldown: number;
  onResend: () => void;
  onVerified: (code: string) => void;
  onBack: () => void;
}) {
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    mode: "onTouched",
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: CodeValues): Promise<void> => {
    try {
      await api.post(
        "/auth/verify-otp",
        { email, code: values.code },
        { skipRefresh: true }
      );
      onVerified(values.code);
    } catch (error) {
      setError("code", {
        message: error instanceof ApiError ? error.message : "Code invalide.",
      });
    }
  };

  const handleResend = async (): Promise<void> => {
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { email }, { skipRefresh: true });
      notify.info("Un nouveau code vous a été envoyé");
      onResend();
    } catch (error) {
      notify.error(
        error instanceof ApiError ? error.message : "L'envoi a échoué."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <Stack
      component="form"
      spacing={2.5}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <InfoPanel>
        Le code expire au bout de 10 minutes. Pensez à vérifier vos courriers
        indésirables.
      </InfoPanel>

      <TextField
        label="Code de vérification"
        placeholder="000000"
        size="medium"
        sx={authFieldSx}
        autoFocus
        disabled={isSubmitting}
        error={Boolean(errors.code)}
        helperText={errors.code?.message ?? "Six chiffres"}
        slotProps={{
          htmlInput: {
            inputMode: "numeric",
            autoComplete: "one-time-code",
            maxLength: 6,
            style: {
              fontSize: "1.5rem",
              letterSpacing: "0.5rem",
              textAlign: "center",
            },
          },
        }}
        {...register("code")}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        sx={authButtonSx}
        loading={isSubmitting}
      >
        Vérifier le code
      </Button>

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="hover"
          onClick={onBack}
        >
          Changer d'adresse
        </Link>
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="hover"
          onClick={handleResend}
          sx={{
            pointerEvents: cooldown > 0 || resending ? "none" : "auto",
            opacity: cooldown > 0 || resending ? 0.5 : 1,
          }}
        >
          {cooldown > 0
            ? `Renvoyer le code (${cooldown} s)`
            : "Renvoyer le code"}
        </Link>
      </Stack>
    </Stack>
  );
}

// --- Étape 3 : nouveau mot de passe ------------------------------------------

function PasswordStep({
  email,
  code,
  onDone,
  onCodeRejected,
}: {
  email: string;
  code: string;
  onDone: () => void;
  onCodeRejected: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: PasswordValues): Promise<void> => {
    try {
      await api.post(
        "/auth/reset-password",
        { email, code, newPassword: values.newPassword },
        { skipRefresh: true }
      );
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_OTP") {
        // Le code a expiré pendant la saisie : on renvoie à l'étape précédente.
        onCodeRejected();
        return;
      }
      setError("newPassword", {
        message:
          error instanceof ApiError
            ? error.message
            : "La réinitialisation a échoué.",
      });
    }
  };

  return (
    <Stack
      component="form"
      spacing={2.5}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <PasswordField
        label="Nouveau mot de passe"
        autoComplete="new-password"
        autoFocus
        showStrength
        disabled={isSubmitting}
        error={Boolean(errors.newPassword)}
        helperText={errors.newPassword?.message}
        value={watch("newPassword")}
        {...register("newPassword")}
      />

      <PasswordField
        label="Confirmer le mot de passe"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword?.message}
        value={watch("confirmPassword")}
        {...register("confirmPassword")}
      />

      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Par mesure de sécurité, toutes vos sessions ouvertes seront fermées.
      </Typography>

      <Button
        type="submit"
        variant="contained"
        size="large"
        sx={authButtonSx}
        loading={isSubmitting}
      >
        Définir le mot de passe
      </Button>
    </Stack>
  );
}
