import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppStore, Client, ContactPerson, Brand } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Building2, Users, MapPin } from "lucide-react";

const ClientFormSchema = z.object({
  name: z.string().min(2, "Inserisci ragione sociale valida"),
  vatNumber: z.string().min(11, "Inserisci P.IVA valida (min 11 caratteri)"),
});

const ContactFormSchema = z.object({
  name: z.string().min(2, "Inserisci nome valido"),
  email: z.string().email("Inserisci email valida"),
  phone: z.string().min(10, "Inserisci telefono valido"),
});

const BrandFormSchema = z.object({
  name: z.string().min(2, "Inserisci nome brand valido"),
});

type ClientFormValues = z.infer<typeof ClientFormSchema>;
type ContactFormValues = z.infer<typeof ContactFormSchema>;
type BrandFormValues = z.infer<typeof BrandFormSchema>;

const Clienti = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);

  const clients = useAppStore((s) => s.clients);
  const brands = useAppStore((s) => s.brands);
  const createClient = useAppStore((s) => s.createClient);
  const updateClient = useAppStore((s) => s.updateClient);
  const deleteClient = useAppStore((s) => s.deleteClient);
  const addContactPerson = useAppStore((s) => s.addContactPerson);
  const updateContactPerson = useAppStore((s) => s.updateContactPerson);
  const removeContactPerson = useAppStore((s) => s.removeContactPerson);
  const createBrand = useAppStore((s) => s.createBrand);
  const updateBrand = useAppStore((s) => s.updateBrand);
  const deleteBrand = useAppStore((s) => s.deleteBrand);
  const addBrandAddress = useAppStore((s) => s.addBrandAddress);
  const updateBrandAddress = useAppStore((s) => s.updateBrandAddress);
  const removeBrandAddress = useAppStore((s) => s.removeBrandAddress);
  const getBrandsByClient = useAppStore((s) => s.getBrandsByClient);

  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: { name: "", vatNumber: "" },
  });

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(BrandFormSchema),
    defaultValues: { name: "" },
  });

  const onSubmitClient = (values: ClientFormValues) => {
    if (!values.name || !values.vatNumber) return;
    createClient({ name: values.name, vatNumber: values.vatNumber, contactPersons: [] });
    clientForm.reset();
    setClientDialogOpen(false);
    toast({ title: "Cliente creato", description: "Cliente salvato correttamente" });
  };

  const onSubmitContact = (values: ContactFormValues) => {
    if (!selectedClientId || !values.name || !values.email || !values.phone) return;
    
    const contactData = {
      name: values.name,
      email: values.email, 
      phone: values.phone
    };
    
    if (editingContact) {
      updateContactPerson(selectedClientId, editingContact.id, contactData);
      toast({ title: "Referente aggiornato", description: "Referente salvato correttamente" });
    } else {
      addContactPerson(selectedClientId, contactData);
      toast({ title: "Referente aggiunto", description: "Referente salvato correttamente" });
    }
    
    contactForm.reset();
    setContactDialogOpen(false);
    setEditingContact(null);
  };

  const onSubmitBrand = (values: BrandFormValues) => {
    if (!selectedClientId || !values.name) return;
    
    if (editingBrand) {
      updateBrand(editingBrand.id, values as BrandFormValues);
      toast({ title: "Brand aggiornato", description: "Brand salvato correttamente" });
    } else {
      const newBrand = createBrand({ name: values.name, clientId: selectedClientId, addresses: [] });
      addBrandAddress(newBrand.id, "Inserisci indirizzo");
      toast({ title: "Brand creato", description: "Brand salvato correttamente" });
    }
    
    brandForm.reset();
    setBrandDialogOpen(false);
    setEditingBrand(null);
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo cliente e tutti i suoi brand?")) {
      deleteClient(clientId);
      if (selectedClientId === clientId) setSelectedClientId(null);
      toast({ title: "Cliente eliminato", description: "Cliente eliminato correttamente" });
    }
  };

  const handleDeleteContact = (contactId: string) => {
    if (!selectedClientId) return;
    if (confirm("Sei sicuro di voler eliminare questo referente?")) {
      removeContactPerson(selectedClientId, contactId);
      toast({ title: "Referente eliminato", description: "Referente eliminato correttamente" });
    }
  };

  const handleDeleteBrand = (brandId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo brand?")) {
      deleteBrand(brandId);
      toast({ title: "Brand eliminato", description: "Brand eliminato correttamente" });
    }
  };

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
  const clientBrands = selectedClientId ? getBrandsByClient(selectedClientId) : [];

  return (
    <main className="min-h-screen bg-muted/30">
      <Helmet>
        <title>Clienti | Gestionale Sicurezza</title>
        <meta name="description" content="Gestisci clienti, brand e referenti aziendali" />
        <link rel="canonical" href="/clienti" />
      </Helmet>

      <div className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-primary">CLIENTI</h1>
          <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ragione Sociale</Label>
                  <Input {...clientForm.register("name")} placeholder="Inserisci ragione sociale" />
                  {clientForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{clientForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>P.IVA</Label>
                  <Input {...clientForm.register("vatNumber")} placeholder="12345678901" />
                  {clientForm.formState.errors.vatNumber && (
                    <p className="text-sm text-destructive">{clientForm.formState.errors.vatNumber.message}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit">Salva Cliente</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Lista Clienti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClientId === client.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{client.name}</h4>
                      <p className="text-sm text-muted-foreground">P.IVA: {client.vatNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClient(client.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Client Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClient ? (
              <>
                {/* Contact Persons */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Referenti - {selectedClient.name}
                      </CardTitle>
                      <Dialog 
                        open={contactDialogOpen} 
                        onOpenChange={(open) => {
                          setContactDialogOpen(open);
                          if (!open) {
                            setEditingContact(null);
                            contactForm.reset();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Aggiungi Referente
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingContact ? "Modifica" : "Nuovo"} Referente
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Nome</Label>
                              <Input 
                                {...contactForm.register("name")} 
                                placeholder="Mario Rossi" 
                              />
                              {contactForm.formState.errors.name && (
                                <p className="text-sm text-destructive">{contactForm.formState.errors.name.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input 
                                {...contactForm.register("email")} 
                                placeholder="mario.rossi@azienda.it" 
                                type="email"
                              />
                              {contactForm.formState.errors.email && (
                                <p className="text-sm text-destructive">{contactForm.formState.errors.email.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Telefono</Label>
                              <Input 
                                {...contactForm.register("phone")} 
                                placeholder="333-1234567" 
                              />
                              {contactForm.formState.errors.phone && (
                                <p className="text-sm text-destructive">{contactForm.formState.errors.phone.message}</p>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
                                Annulla
                              </Button>
                              <Button type="submit">
                                {editingContact ? "Aggiorna" : "Salva"} Referente
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedClient.contactPersons || selectedClient.contactPersons.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nessun referente aggiunto
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedClient.contactPersons?.map((contact) => (
                          <div key={contact.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{contact.name}</h4>
                                <p className="text-sm text-muted-foreground">{contact.email}</p>
                                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingContact(contact);
                                    contactForm.setValue("name", contact.name);
                                    contactForm.setValue("email", contact.email);
                                    contactForm.setValue("phone", contact.phone);
                                    setContactDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Brands */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Brand e Indirizzi - {selectedClient.name}
                      </CardTitle>
                      <Dialog 
                        open={brandDialogOpen} 
                        onOpenChange={(open) => {
                          setBrandDialogOpen(open);
                          if (!open) {
                            setEditingBrand(null);
                            brandForm.reset();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Aggiungi Brand
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingBrand ? "Modifica" : "Nuovo"} Brand
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={brandForm.handleSubmit(onSubmitBrand)} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Nome Brand</Label>
                              <Input 
                                {...brandForm.register("name")} 
                                placeholder="Nike Store" 
                              />
                              {brandForm.formState.errors.name && (
                                <p className="text-sm text-destructive">{brandForm.formState.errors.name.message}</p>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setBrandDialogOpen(false)}>
                                Annulla
                              </Button>
                              <Button type="submit">
                                {editingBrand ? "Aggiorna" : "Salva"} Brand
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientBrands.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nessun brand aggiunto
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {clientBrands.map((brand) => (
                          <div key={brand.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lg">{brand.name}</h4>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingBrand(brand);
                                    brandForm.setValue("name", brand.name);
                                    setBrandDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBrand(brand.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                             <div className="space-y-2">
                               <p className="text-sm font-medium text-muted-foreground">Indirizzi:</p>
                               {brand.addresses?.map((address) => (
                                 <div key={address.id} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                                   <Input
                                     value={address.address}
                                     onChange={(e) => updateBrandAddress(brand.id, address.id, e.target.value)}
                                     className="flex-1 h-8 text-sm"
                                   />
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => removeBrandAddress(brand.id, address.id)}
                                   >
                                     <Trash2 className="w-3 h-3" />
                                   </Button>
                                 </div>
                               ))}
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => addBrandAddress(brand.id, "Nuovo indirizzo")}
                                 className="mt-2"
                               >
                                 <Plus className="w-3 h-3 mr-1" />
                                 Aggiungi Indirizzo
                               </Button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Seleziona un cliente dalla lista per visualizzare i dettagli
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Clienti;