import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Users, Clock, Calendar } from "lucide-react";
import { formatDateToDDMMYY, parseDateFromDDMMYY } from "@/lib/utils";

const FormSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  brandId: z.string().min(1, "Seleziona un brand"),
  address: z.string().min(3, "Inserisci un indirizzo valido"),
  startDate: z.string().min(1, "Seleziona data di inizio"),
  endDate: z.string().min(1, "Seleziona data di fine"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

const CreateEvent = () => {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const brands = useAppStore((s) => s.brands);
  const createEvent = useAppStore((s) => s.createEvent);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { 
      clientId: "", 
      brandId: "", 
      address: "", 
      startDate: "", 
      endDate: "", 
      notes: "" 
    },
  });

  const onSubmit = (values: FormValues) => {
    const clientName = clients.find((c) => c.id === values.clientId)?.name || "Cliente";
    const brandName = brands.find((b) => b.id === values.brandId)?.name || "Brand";
    const title = `${brandName} - ${clientName}`;
    
    // Convert DD/MM/YY dates to YYYY-MM-DD format for storage
    const startDateISO = parseDateFromDDMMYY(values.startDate);
    const endDateISO = parseDateFromDDMMYY(values.endDate);
    
    const ev = createEvent({ 
      title, 
      clientId: values.clientId, 
      brandId: values.brandId, 
      address: values.address,
      startDate: startDateISO,
      endDate: endDateISO,
      notes: values.notes
    });

    toast({ title: "Evento creato", description: `${title} salvato correttamente` });
    navigate(`/events/${ev.id}`);
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <Helmet>
        <title>Crea Evento | Gestionale Sicurezza</title>
        <meta name="description" content="Crea un nuovo evento selezionando cliente, brand e indirizzo." />
        <link rel="canonical" href="/events/new" />
      </Helmet>

      <div className="container py-8 max-w-6xl">
        {/* Event Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-primary mb-2">NUOVO EVENTO</h1>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Data creazione: {new Date().toLocaleDateString('it-IT')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dettagli Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cliente</Label>
                      <Select onValueChange={(v) => form.setValue("clientId", v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.clientId && (
                        <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Brand</Label>
                      <Select onValueChange={(v) => form.setValue("brandId", v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleziona brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.brandId && (
                        <p className="text-sm text-destructive">{form.formState.errors.brandId.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Indirizzo</Label>
                    <Input
                      className="h-11"
                      placeholder="Via Roma 1, Milano"
                      {...form.register("address")}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label className="text-sm font-medium">Data Inizio Evento</Label>
                       <Input
                         type="text"
                         placeholder="GG/MM/AA"
                         className="h-11"
                         {...form.register("startDate")}
                       />
                       {form.formState.errors.startDate && (
                         <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
                       )}
                     </div>
                     
                     <div className="space-y-2">
                       <Label className="text-sm font-medium">Data Fine Evento</Label>
                       <Input
                         type="text"
                         placeholder="GG/MM/AA"
                         className="h-11"
                         {...form.register("endDate")}
                       />
                       {form.formState.errors.endDate && (
                         <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
                       )}
                     </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Note (opzionale)</Label>
                    <Textarea
                      placeholder="Inserisci note per l'evento..."
                      rows={4}
                      {...form.register("notes")}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="h-11 px-8">
                      Salva evento
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card className="bg-stats-background border-stats-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Statistiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Operatori assegnati</p>
                    <p className="text-2xl font-semibold text-primary">0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totale ore assegnate</p>
                    <p className="text-2xl font-semibold text-primary">0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Totale ore evento</p>
                    <p className="text-2xl font-semibold text-primary">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateEvent;
