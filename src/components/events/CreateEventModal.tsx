import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const FormSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  brandId: z.string().min(1, "Seleziona un brand"),
  address: z.string().min(3, "Inserisci un indirizzo valido"),
  customAddress: z.string().optional(),
  startDate: z.string().min(1, "Seleziona data di inizio"),
  endDate: z.string().min(1, "Seleziona data di fine"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateEventModal = ({ open, onOpenChange }: CreateEventModalProps) => {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const brands = useAppStore((s) => s.brands);
  const getBrandsByClient = useAppStore((s) => s.getBrandsByClient);
  const createEvent = useAppStore((s) => s.createEvent);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { clientId: "", brandId: "", address: "", customAddress: "", startDate: "", endDate: "", notes: "" },
  });

  const selectedClientId = form.watch("clientId");
  const selectedBrandId = form.watch("brandId");
  const selectedAddress = form.watch("address");
  const startDate = form.watch("startDate");
  
  // Filter brands based on selected client
  const availableBrands = selectedClientId ? getBrandsByClient(selectedClientId) : [];
  
  // Auto-populate address when brand is selected
  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  
  // Copy start date to end date when start date changes
  React.useEffect(() => {
    if (startDate && !form.getValues("endDate")) {
      form.setValue("endDate", startDate);
    }
  }, [startDate, form]);
  
  // Reset address when brand is selected
  React.useEffect(() => {
    if (selectedBrand) {
      form.setValue("address", "");
      form.setValue("customAddress", "");
    }
  }, [selectedBrand, form]);
  
  // Reset brand and address when client changes
  React.useEffect(() => {
    if (selectedClientId) {
      form.setValue("brandId", "");
      form.setValue("address", "");
    }
  }, [selectedClientId, form]);

  const onSubmit = (values: FormValues) => {
    const clientName = clients.find((c) => c.id === values.clientId)?.name || "Cliente";
    const brandName = brands.find((b) => b.id === values.brandId)?.name || "Brand";
    const title = `${brandName} - ${clientName}`;
    
    // Use custom address if "altro" is selected, otherwise use the selected address
    const finalAddress = values.address === "altro" ? values.customAddress || "" : values.address;
    
    const ev = createEvent({ 
      title, 
      clientId: values.clientId, 
      brandId: values.brandId, 
      address: finalAddress,
      startDate: values.startDate,
      endDate: values.endDate,
      notes: values.notes 
    });

    toast({ title: "Evento creato", description: `${title} salvato correttamente` });
    onOpenChange(false);
    form.reset();
    navigate(`/events/${ev.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crea evento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => form.setValue("clientId", v)}>
                <SelectTrigger aria-label="Cliente">
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto">
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
              <Label>Brand</Label>
              <Select onValueChange={(v) => form.setValue("brandId", v)}>
                <SelectTrigger aria-label="Brand">
                  <SelectValue placeholder="Seleziona brand" />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto">
                  {availableBrands.map((b) => (
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
            <Label>Indirizzo</Label>
            {selectedBrand ? (
              <>
                <Select onValueChange={(v) => form.setValue("address", v)}>
                  <SelectTrigger aria-label="Indirizzo">
                    <SelectValue placeholder="Seleziona indirizzo" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {selectedBrand.addresses?.map((addr) => (
                      <SelectItem key={addr.id} value={addr.address}>
                        {addr.address}
                      </SelectItem>
                    ))}
                    <SelectItem value="altro">Altro...</SelectItem>
                  </SelectContent>
                </Select>
                {selectedAddress === "altro" && (
                  <Input
                    placeholder="Inserisci indirizzo personalizzato"
                    {...form.register("customAddress")}
                  />
                )}
              </>
            ) : (
              <Input
                placeholder="Seleziona prima un brand"
                disabled
                {...form.register("address")}
              />
            )}
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
            {form.formState.errors.customAddress && (
              <p className="text-sm text-destructive">{form.formState.errors.customAddress.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inizio Evento</Label>
              <Input
                type="date"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data Fine Evento</Label>
              <Input
                type="date"
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note (opzionale)</Label>
            <Input
              placeholder="Note per l'evento..."
              {...form.register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">Salva evento</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;