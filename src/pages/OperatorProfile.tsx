import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OperatorData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  fiscal_code?: string;
}

export default function OperatorProfile() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: roleLoading, isOperator } = useRole();
  const navigate = useNavigate();
  const [operatorData, setOperatorData] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOperatorData = async () => {
      if (authLoading || roleLoading || !user || !profile?.operator_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('operators')
          .select('*')
          .eq('id', profile.operator_id)
          .single();

        if (error) {
          console.error('Error loading operator:', error);
          toast({
            title: "Errore",
            description: "Impossibile caricare i dati del profilo",
            variant: "destructive"
          });
          return;
        }

        setOperatorData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOperatorData();
  }, [user, profile, authLoading, roleLoading]);

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!user || !isOperator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Accesso negato</h3>
            <p className="text-muted-foreground mb-4">
              Non hai i permessi per accedere a questa sezione.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Effettua il login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!operatorData) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Profilo non trovato</h3>
            <p className="text-muted-foreground mb-4">
              Il tuo profilo operatore non è stato trovato.
            </p>
            <Button onClick={() => navigate('/operator/dashboard')}>
              Torna alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/operator/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Il Mio Profilo</h1>
          <p className="text-muted-foreground">
            Visualizza e gestisci le tue informazioni personali
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informazioni Personali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={operatorData.name}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <Input
                id="role"
                value={operatorData.role}
                readOnly
                className="bg-muted"
              />
            </div>

            {operatorData.email && (
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={operatorData.email}
                  readOnly
                  className="bg-muted"
                />
              </div>
            )}

            {operatorData.phone && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefono
                </Label>
                <Input
                  id="phone"
                  value={operatorData.phone}
                  readOnly
                  className="bg-muted"
                />
              </div>
            )}

            {operatorData.fiscal_code && (
              <div className="space-y-2">
                <Label htmlFor="fiscal_code">Codice Fiscale</Label>
                <Input
                  id="fiscal_code"
                  value={operatorData.fiscal_code}
                  readOnly
                  className="bg-muted"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Per modificare questi dati, contatta l'amministratore del sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-email">Email di Accesso</Label>
            <Input
              id="user-email"
              value={user.email || ''}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="user-id">ID Utente</Label>
            <Input
              id="user-id"
              value={user.id}
              readOnly
              className="bg-muted font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}