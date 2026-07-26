import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { ArrowLeft, Download, MessageSquare } from 'lucide-react';

export default function RequestDetail() {
  const [, navigate] = useLocation();

  const request = {
    id: 'REQ-001',
    patient: {
      name: 'Jean Dupont',
      age: 65,
      gender: 'M',
      id: 'PAT-2026-001',
    },
    clinicalInfo: {
      symptoms: 'Douleur thoracique légère, essoufflement à l\'effort',
      context: 'Suivi cardiaque de routine',
      history: 'Hypertension, antécédent d\'infarctus (2015)',
    },
    priority: 'Normale',
    status: 'Validée',
    createdAt: '2026-07-26 10:30',
    validatedAt: '2026-07-26 14:15',
    cardiologist: 'Dr. Martin Leclerc',
    aiAnalysis: {
      rhythm: 'Rythme sinusal régulier',
      heartRate: '72 bpm',
      anomalies: 'Aucune anomalie significative détectée',
      confidence: '95%',
    },
    finalDiagnosis: 'ECG normal. Pas d\'anomalie détectée.',
    comments: 'Patient stable. Suivi de routine recommandé.',
  };

  const timeline = [
    {
      time: '10:30',
      event: 'Demande créée',
      actor: 'Dr. Sophie Dupont',
    },
    {
      time: '11:45',
      event: 'Analyse IA terminée',
      actor: 'Système',
    },
    {
      time: '14:15',
      event: 'Résultat validé',
      actor: 'Dr. Martin Leclerc',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/my-requests')}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {request.id}
              </h1>
              <p className="text-muted-foreground mt-1">
                Créée le {request.createdAt}
              </p>
            </div>
          </div>
          <Badge variant="default" className="text-base px-3 py-1">
            {request.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient & Clinical Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Informations du patient
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.patient.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Âge</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.patient.age} ans
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Identifiant</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.patient.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sexe</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.patient.gender === 'M' ? 'Masculin' : 'Féminin'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Contexte clinique
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Symptômes</p>
                  <p className="text-sm text-foreground">
                    {request.clinicalInfo.symptoms}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contexte</p>
                  <p className="text-sm text-foreground">
                    {request.clinicalInfo.context}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Antécédents</p>
                  <p className="text-sm text-foreground">
                    {request.clinicalInfo.history}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Résultat final
              </h2>
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  {request.finalDiagnosis}
                </p>
                <p className="text-xs text-muted-foreground">
                  Validé par {request.cardiologist}
                </p>
                <p className="text-sm text-foreground mt-3">
                  <span className="font-medium">Commentaires: </span>
                  {request.comments}
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar: AI Analysis & Timeline */}
          <div className="space-y-6">
            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Analyse IA
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Rythme</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.aiAnalysis.rhythm}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fréquence</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.aiAnalysis.heartRate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anomalies</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.aiAnalysis.anomalies}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confiance</p>
                  <p className="text-sm font-medium text-foreground">
                    {request.aiAnalysis.confidence}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Progression
              </h2>
              <div className="space-y-4">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {idx < timeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {item.time}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {item.event}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-1" />
                Rapport
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Commentaire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
