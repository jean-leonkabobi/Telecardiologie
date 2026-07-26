import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { AlertCircle, Download, CheckCircle2, X } from 'lucide-react';

export default function ECGAnalysis() {
  const [, navigate] = useLocation();
  const [action, setAction] = useState<'validate' | 'correct' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  const requestData = {
    id: 'REQ-002',
    patient: {
      name: 'Marie Durand',
      age: 58,
      gender: 'F',
      symptoms: 'Douleur thoracique, essoufflement',
      medicalHistory: 'Hypertension, diabète',
      priority: 'Urgente',
    },
    aiAnalysis: {
      rhythm: 'Rythme sinusal régulier',
      heartRate: '78 bpm',
      anomalies: 'Sus-décalage du segment ST en dérivations II, III, aVF',
      confidence: '92%',
      interpretation:
        'Possible infarctus du myocarde inférieur. Nécessite une évaluation clinique urgente.',
    },
  };

  const handleAction = (actionType: 'validate' | 'correct' | 'reject') => {
    setAction(actionType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment && (action === 'correct' || action === 'reject')) {
      alert('Un commentaire est obligatoire pour cette action');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analyse ECG</h1>
            <p className="text-muted-foreground mt-1">{requestData.id}</p>
          </div>
          <Badge variant="destructive" className="text-base px-3 py-1">
            {requestData.patient.priority}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone 1: Patient Information */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-border space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Informations du patient
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.patient.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Âge</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.patient.age} ans
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Sexe</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.patient.gender === 'M' ? 'Masculin' : 'Féminin'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Symptômes</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.patient.symptoms}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Antécédents</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.patient.medicalHistory}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Zone 2: ECG Visualization */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-border space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Tracé ECG
              </h2>

              <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <svg
                    className="w-full h-32 text-primary/30 mx-auto mb-3"
                    viewBox="0 0 300 100"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points="0,50 10,50 15,40 20,50 30,50 40,45 50,50 60,50 70,35 80,50 90,50 100,48 110,50 120,50 130,40 140,50 150,50 160,45 170,50 180,50 190,35 200,50 210,50 220,48 230,50 240,50 250,40 260,50 270,50 280,45 290,50 300,50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <p className="text-sm text-muted-foreground">
                    Aperçu du tracé ECG
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Zoom
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Déplacer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {}}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Zone 3: Analysis & Interpretation */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-border space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Interprétation
              </h2>

              {/* AI Analysis */}
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-blue-900">
                    Interprétation proposée par l'IA
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Rythme</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.aiAnalysis.rhythm}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Fréquence cardiaque</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.aiAnalysis.heartRate}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Anomalies</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.aiAnalysis.anomalies}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Score de confiance</p>
                  <p className="text-sm font-medium text-foreground">
                    {requestData.aiAnalysis.confidence}
                  </p>
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-900">
                    ⚠️ Ce résultat n'est pas encore validé
                  </p>
                </div>
              </div>

              {/* Cardiologist Diagnosis */}
              {!action && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Avis du cardiologue
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction('validate')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Valider
                    </Button>
                    <Button
                      onClick={() => handleAction('correct')}
                      variant="outline"
                      className="flex-1"
                    >
                      Corriger
                    </Button>
                    <Button
                      onClick={() => handleAction('reject')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              )}

              {action && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {action === 'validate'
                        ? 'Confirmer la validation'
                        : action === 'correct'
                          ? 'Correction requise'
                          : 'Motif du rejet'}
                    </p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        action === 'validate'
                          ? 'Commentaire optionnel...'
                          : 'Commentaire obligatoire...'
                      }
                      rows={3}
                      required={action !== 'validate'}
                      className="w-full px-3 py-2 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAction(null);
                        setComment('');
                      }}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className={`flex-1 ${
                        action === 'validate'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-primary hover:bg-primary/90'
                      } text-white`}
                    >
                      Confirmer
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
