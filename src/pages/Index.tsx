import { Button } from "@/components/ui/button";
import { Calendar, Plus, Users, Shield, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OperatorDashboard from "@/components/OperatorDashboard";
import { useSupabaseStore } from "@/hooks/useSupabaseStore";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const { loading, operatorData } = useSupabaseStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-pulse">Caricamento...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Helmet>
        <title>DETELDER EZYSTAFF - Gestionale Sicurezza</title>
        <meta name="description" content="Gestionale moderno per agenzie di sicurezza: eventi, turni, operatori." />
      </Helmet>
      
      {/* If user is linked to an operator, show operator dashboard */}
      {operatorData ? (
        <OperatorDashboard />
      ) : (
        /* Admin/Manager Dashboard */
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              DETELDER EZYSTAFF
            </h1>
            <p className="text-xl text-muted-foreground">
              Gestionale moderno per agenzie di sicurezza
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Events Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Eventi
                </CardTitle>
                <CardDescription>
                  Gestisci eventi e turni di lavoro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/events">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Visualizza Eventi
                  </Button>
                </Link>
                <Link to="/events/new">
                  <Button className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Evento
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Clients Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Clienti
                </CardTitle>
                <CardDescription>
                  Gestisci clienti e brand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/clienti">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Gestisci Clienti
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Security Services Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Servizi
                </CardTitle>
                <CardDescription>
                  I nostri servizi di sicurezza
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Servizi di portierato
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Presidio notturno e diurno
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Gestione flussi
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  GPG armata
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contatti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Sede Operativa</h3>
                  <p className="text-sm text-muted-foreground">
                    Via della Sicurezza, 123<br />
                    20100 Milano (MI)<br />
                    Tel: +39 02 1234567<br />
                    Email: info@detelder.it
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Orari di Servizio</h3>
                  <p className="text-sm text-muted-foreground">
                    Lunedì - Venerdì: 8:00 - 18:00<br />
                    Sabato: 9:00 - 13:00<br />
                    Domenica: Solo emergenze<br />
                    Reperibilità H24 per clienti
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
