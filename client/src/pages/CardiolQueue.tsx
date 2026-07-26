import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function CardiolQueue() {
  const [, navigate] = useLocation();
  const [queue, setQueue] = useState([
    {
      id: 'REQ-002',
      patient: 'Marie Durand',
      age: 58,
      priority: 'Urgente',
      symptoms: 'Douleur thoracique, essoufflement',
      submittedAt: '2026-07-26 12:45',
      waitingTime: '1h 47min',
      aiConfidence: '92%',
      status: 'En attente',
    },
    {
      id: 'REQ-003',
      patient: 'Pierre Bernard',
      age: 72,
      priority: 'Normale',
      symptoms: 'Suivi de routine',
      submittedAt: '2026-07-26 10:30',
      waitingTime: '4h 22min',
      aiConfidence: '88%',
      status: 'En attente',
    },
    {
      id: 'REQ-007',
      patient: 'Luc Moreau',
      age: 45,
      priority: 'Normale',
      symptoms: 'Palpitations occasionnelles',
      submittedAt: '2026-07-25 16:15',
      waitingTime: '22h 17min',
      aiConfidence: '85%',
      status: 'En attente',
    },
    {
      id: 'REQ-008',
      patient: 'Sophie Martin',
      age: 55,
      priority: 'Urgente',
      symptoms: 'Arythmie détectée',
      submittedAt: '2026-07-25 14:30',
      waitingTime: '24h 2min',
      aiConfidence: '94%',
      status: 'En attente',
    },
  ]);

  const handleStartAnalysis = (id: string) => {
    navigate(`/analyze/${id}`);
  };

  const handleSkip = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const urgentCount = queue.filter((q) => q.priority === 'Urgente').length;
  const normalCount = queue.filter((q) => q.priority === 'Normale').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">File d'attente</h1>
          <p className="text-muted-foreground mt-1">
            Demandes en attente de validation
          </p>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total en attente</p>
            <p className="text-2xl font-bold text-foreground mt-1">{queue.length}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Urgentes</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{urgentCount}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Normales</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{normalCount}</p>
          </Card>
        </div>

        {/* Info Box */}
        {urgentCount > 0 && (
          <Card className="p-4 border border-red-200 bg-red-50">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {urgentCount} demande{urgentCount > 1 ? 's' : ''} urgente{urgentCount > 1 ? 's' : ''} en attente
                </p>
                <p className="text-xs text-red-800 mt-1">
                  Nous recommandons de traiter les demandes urgentes en priorité
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Queue Items */}
        <div className="space-y-4">
          {queue.length === 0 ? (
            <Card className="p-12 border border-border text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-foreground font-medium">Aucune demande en attente</p>
              <p className="text-muted-foreground text-sm mt-1">
                Toutes les demandes ont été traitées
              </p>
            </Card>
          ) : (
            queue.map((item, idx) => (
              <Card
                key={item.id}
                className={`p-6 border-2 transition-all ${
                  item.priority === 'Urgente'
                    ? 'border-red-300 bg-red-50'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Position Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.patient}
                      </h3>
                      <Badge
                        variant={
                          item.priority === 'Urgente' ? 'destructive' : 'secondary'
                        }
                      >
                        {item.priority}
                      </Badge>
                      <Badge variant="outline">{item.id}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Âge</p>
                        <p className="text-sm font-medium text-foreground">
                          {item.age} ans
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Symptômes</p>
                        <p className="text-sm font-medium text-foreground">
                          {item.symptoms}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Confiance IA
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {item.aiConfidence}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          En attente depuis
                        </p>
                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.waitingTime}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Soumis le {item.submittedAt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    <Button
                      onClick={() => handleStartAnalysis(item.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
                    >
                      Analyser
                    </Button>
                    <Button
                      onClick={() => handleSkip(item.id)}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      Passer
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Tips */}
        <Card className="p-4 border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-900">
            <span className="font-medium">💡 Conseil :</span> Les demandes urgentes sont affichées en premier. Vous pouvez les traiter dans l'ordre ou sauter une demande pour la traiter plus tard.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
