import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoginIcon from "@mui/icons-material/LoginOutlined";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { authButtonSx, authFieldSx } from "@/components/auth/authStyles";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/apiClient";
import { notify } from "@/lib/alerts";

const loginSchema = z.object({
  email: z.email({ message: "Adresse email invalide" }),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    // Les erreurs apparaissent après le premier départ du champ, pas à chaque
    // frappe : signaler « adresse invalide » dès la première lettre est hostile.
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues): Promise<void> => {
    try {
      const user = await login(values.email, values.password);
      notify.success(`Bienvenue, ${user.firstName}`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        // Le champ visé par le serveur est signalé sous le champ concerné —
        // une popup ne dirait pas *où* corriger. Le reste passe en alerte.
        if (error.field === "email" || error.field === "password") {
          setError(error.field, { message: error.message });
          return;
        }

        if (
          error.code === "ACCOUNT_LOCKED" ||
          error.code === "ACCOUNT_NOT_ACTIVE"
        ) {
          notify.warning("Connexion impossible", error.message);
        } else {
          notify.error("Échec de la connexion", error.message);
        }
        return;
      }
      notify.error("Erreur inattendue", "Veuillez réessayer dans un instant.");
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre espace de télécardiologie."
      footer={
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Votre compte est créé par un administrateur de votre établissement.
        </Typography>
      }
    >
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

        <PasswordField
          label="Mot de passe"
          autoComplete="current-password"
          disabled={isSubmitting}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          value={watch("password")}
          {...register("password")}
        />

        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            underline="hover"
            onClick={() => navigate("/forgot-password")}
          >
            Mot de passe oublié ?
          </Link>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={authButtonSx}
          startIcon={<LoginIcon />}
          loading={isSubmitting}
          loadingPosition="start"
        >
          Se connecter
        </Button>
      </Stack>
    </AuthLayout>
  );
}
