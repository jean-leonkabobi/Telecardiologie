import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'healthcare_professional' | 'cardiologist' | 'admin'>('healthcare_professional');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Veuillez remplir tous les champs');
        setLoading(false);
        return;
      }

      await login(email, password, role);

      if (role === 'healthcare_professional') {
        navigate('/dashboard');
      } else if (role === 'cardiologist') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'medecin@example.com', password: 'demo123', role: 'healthcare_professional' as const, label: 'Professionnel de santé' },
    { email: 'cardiologue@example.com', password: 'demo123', role: 'cardiologist' as const, label: 'Cardiologue' },
    { email: 'admin@example.com', password: 'demo123', role: 'admin' as const, label: 'Administrateur' },
  ];

  const handleDemoLogin = (demoEmail: string, demoPassword: string, demoRole: typeof role) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4"
      style={{
        backgroundImage: 'url(/manus-storage/hero-medical_41fa7c0b.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img
                  src="/manus-storage/logo_c406f01f.png"
                  alt="Logo"
                  className="w-16 h-16"
                />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Télécardiologie
              </h1>
              <p className="text-sm text-muted-foreground">
                Plateforme d'analyse ECG assistée par IA
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">
                Accès réservé aux professionnels de santé autorisés
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-900">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Rôle
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="healthcare_professional">
                    Professionnel de santé
                  </option>
                  <option value="cardiologist">Cardiologue</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>

            <div className="text-center mb-6">
              <button className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </button>
            </div>

            <div className="border-t pt-6">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
                Comptes de démonstration
              </p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() =>
                      handleDemoLogin(account.email, account.password, account.role)
                    }
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <span className="font-medium">{account.label}</span>
                    <br />
                    <span className="text-muted-foreground">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-white/80 mt-6">
          © 2026 Plateforme de Télécardiologie. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
