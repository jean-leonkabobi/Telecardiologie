import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { AlertCircle, Upload, CheckCircle2 } from 'lucide-react';

export default function NewECGRequest() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    symptoms: '',
    clinicalContext: '',
    medicalHistory: '',
    priority: 'normal',
    additionalComments: '',
    ecgFile: null as File | null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, ecgFile: file }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      navigate('/request/REQ-NEW');
    }
  };

  const steps = [
    { number: 1, label: 'Patient' },
    { number: 2, label: 'Informations cliniques' },
    { number: 3, label: 'Fichier ECG' },
    { number: 4, label: 'Récapitulatif' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Nouvelle demande d'analyse ECG
          </h1>
          <p className="text-muted-foreground mt-1">
            Étape {step} sur {steps.length}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s.number <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Card className="p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Patient Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Informations du patient
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Identifiant patient</Label>
                    <Input
                      id="patientId"
                      name="patientId"
                      placeholder="Ex: PAT-2026-001"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Sexe</Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Jean"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Dupont"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Clinical Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Informations cliniques
                </h2>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptômes</Label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    placeholder="Décrivez les symptômes observés..."
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicalContext">Contexte clinique</Label>
                  <textarea
                    id="clinicalContext"
                    name="clinicalContext"
                    placeholder="Contexte de la demande..."
                    value={formData.clinicalContext}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Antécédents</Label>
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    placeholder="Antécédents médicaux pertinents..."
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="normal">Normale</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalComments">Commentaires supplémentaires</Label>
                  <textarea
                    id="additionalComments"
                    name="additionalComments"
                    placeholder="Informations additionnelles..."
                    value={formData.additionalComments}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Step 3: ECG File */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Fichier ECG
                </h2>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Glissez-déposez votre fichier ECG ici
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    ou cliquez pour sélectionner
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".ecg,.xml,.pdf"
                    className="hidden"
                    id="ecgFile"
                  />
                  <label htmlFor="ecgFile">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('ecgFile')?.click()}
                    >
                      Sélectionner un fichier
                    </Button>
                  </label>
                </div>

                {formData.ecgFile && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {formData.ecgFile.name}
                      </p>
                      <p className="text-xs text-green-700">
                        {(formData.ecgFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    Les formats acceptés seront confirmés avec le client. Formats provisoires: ECG, XML, PDF
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Récapitulatif de la demande
                </h2>

                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="text-sm font-medium text-foreground">
                      {formData.firstName} {formData.lastName}
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Symptômes</p>
                    <p className="text-sm font-medium text-foreground">
                      {formData.symptoms || '-'}
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Priorité</p>
                    <p className="text-sm font-medium text-foreground">
                      {formData.priority === 'urgent' ? 'Urgente' : 'Normale'}
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Fichier ECG</p>
                    <p className="text-sm font-medium text-foreground">
                      {formData.ecgFile?.name || 'Aucun fichier'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Précédent
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {step === 4 ? 'Envoyer la demande' : 'Suivant'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
