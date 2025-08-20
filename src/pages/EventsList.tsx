import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import CreateEventModal from "@/components/events/CreateEventModal";

const formatDateTime = (date?: string, time?: string) => {
  if (!date || !time) return "—";
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  return dt.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EventsList = () => {
  const navigate = useNavigate();
  const events = useAppStore((s) => s.events);
  const clients = useAppStore((s) => s.clients);
  const getShiftsByEvent = useAppStore((s) => s.getShiftsByEvent);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const rows = useMemo(() => {
    return events.map((ev) => {
      const client = clients.find((c) => c.id === ev.clientId)?.name || "";
      const shifts = getShiftsByEvent(ev.id).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
      const first = shifts[0];
      return {
        id: ev.id,
        title: ev.title,
        client,
        dateTime: formatDateTime(first?.date, first?.startTime),
      };
    });
  }, [events, clients, getShiftsByEvent]);

  return (
    <main className="container py-8">
      <Helmet>
        <title>Lista Eventi | Gestionale Sicurezza</title>
        <meta name="description" content="Elenco eventi con cliente e data. Crea e gestisci eventi dell'agenzia di sicurezza." />
        <link rel="canonical" href="/events" />
      </Helmet>

      <section className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Lista Eventi</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus />
          Crea evento
        </Button>
      </section>

      <section className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo Evento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data e Ora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow
                key={r.id}
                className="cursor-pointer even:bg-muted hover:bg-accent"
                onClick={() => navigate(`/events/${r.id}`)}
              >
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.client}</TableCell>
                <TableCell>{r.dateTime}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nessun evento. Crea il primo evento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
      
      <CreateEventModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </main>
  );
};

export default EventsList;
