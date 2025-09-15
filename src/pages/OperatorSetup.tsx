import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { toast } from '@/hooks/use-toast';
import { User, ArrowRight } from 'lucide-react';

interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function OperatorSetup() {
  const { user } = useAuth();
  const { profile, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Redirect if user already has operator_id set
    if (!roleLoading && profile?.operator_id) {
      navigate('/operator/dashboard');
      return;
    }

    fetchOperators();
  }, [profile, roleLoading, navigate]);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('id, name, email, role')
        .order('name');

      if (error) {
        console.error('Error fetching operators:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare la lista operatori",
          variant: "destructive"
        });
        return;
      }

      setOperators(data || []);
    } catch (err) {
      console.error('Error in fetchOperators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkOperator = async () => {
    if (!selectedOperator || !user) return;

    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ operator_id: selectedOperator })
        .eq('id', user.id);

      if (error) {
        console.error('Error linking operator:', error);
        toast({
          title: "Errore collegamento",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Collegamento completato",
        description: "Account collegato con successo all'operatore",
      });

      // Redirect to dashboard
      navigate('/operator/dashboard');

    } catch (err) {
      console.error('Error in handleLinkOperator:', err);
      toast({
        title: "Errore",
        description: "Errore durante il collegamento",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <User className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl">Configura Account Operatore</CardTitle>
          <p className="text-muted-foreground">
            Seleziona il tuo profilo operatore per completare la configurazione
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleziona il tuo profilo</label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Scegli un operatore..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{operator.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {operator.email} - {operator.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleLinkOperator}
            disabled={!selectedOperator || updating}
            className="w-full"
          >
            {updating ? (
              "Collegamento..."
            ) : (
              <>
                Collega Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Non trovi il tuo nome? Contatta l'amministratore per aggiungere il tuo profilo operatore.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}