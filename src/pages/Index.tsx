import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/events", { replace: true });
  }, [navigate]);

  return (
    <main className="min-h-[50vh] flex items-center justify-center">
      <Helmet>
        <title>Gestionale Sicurezza</title>
        <meta name="description" content="Gestionale moderno per agenzie di sicurezza: eventi, turni, operatori." />
      </Helmet>
      <p className="text-muted-foreground">Reindirizzamento...</p>
    </main>
  );
};

export default Index;
