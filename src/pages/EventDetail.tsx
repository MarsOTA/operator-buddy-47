import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock, Building2, MapPin, Calendar, Badge, Copy, Phone } from "lucide-react";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import ShiftPlanningForm from "@/components/events/ShiftPlanningForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const event = useAppStore(s => s.getEventById(id!));
  const clients = useAppStore(s => s.clients);
  const brands = useAppStore(s => s.brands);
  const operators = useAppStore(s => s.operators);
  const createShift = useAppStore(s => s.createShift);
  const assignOperators = useAppStore(s => s.assignOperators);
  const setOperatorSlot = useAppStore(s => s.setOperatorSlot);
  const removeOperator = useAppStore(s => s.removeOperator);
  const updateEvent = useAppStore(s => s.updateEvent);
  const setTeamLeader = useAppStore(s => s.setTeamLeader);
  const updateShiftNotes = useAppStore(s => s.updateShiftNotes);
  const updateShiftTime = useAppStore(s => s.updateShiftTime);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const deleteShift = useAppStore(s => s.deleteShift);
  
  const shifts = useAppStore(s => s.getShiftsByEvent(id!));
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [slotTimes, setSlotTimes] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [editingPhones, setEditingPhones] = useState<Record<string, string>>({});
  const [slotNotes, setSlotNotes] = useState<Record<string, string>>({});

  if (!event) return (
    <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>
  );

  const handleShiftSubmit = (values: any) => {
    const d = `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, "0")}-${String(values.date.getDate()).padStart(2, "0")}`;
    
    // Crea array di slot vuoti per il numero di operatori specificato
    const operatorIds = Array(values.numOperators).fill("");
    
    createShift({
      eventId: event.id,
      date: d,
      startTime: values.startTime,
      endTime: values.endTime,
      operatorIds: operatorIds,
      activityType: values.activityType as ActivityType,
      requiredOperators: values.numOperators,
      notes: values.notes || undefined
    });
  };

  const onAssign = (selectedIds: string[]) => {
    if (currentShift && currentSlotIndex !== null) {
      if (selectedIds.length === 0 || selectedIds[0] === "") {
        setOperatorSlot(currentShift, currentSlotIndex, "");
      } else {
        setOperatorSlot(currentShift, currentSlotIndex, selectedIds[0]);
      }
    }
    setAssignOpen(false);
    setCurrentShift(null);
    setCurrentSlotIndex(null);
  };

  const getOperatorName = (id: string) => {
    const operator = operators.find(o => o.id === id);
    if (!operator) return id;
    
    // Convert "Nome Cognome" to "Cognome Nome" format
    const nameParts = operator.name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts.slice(0, -1).join(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} ${firstName}`;
    }
    return operator.name;
  };

  const getOperatorPhone = (id: string) => {
    const operator = operators.find(o => o.id === id);
    return operator?.phone || "-";
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts (e.g., 20:00 to 03:00)
    if (end.getTime() < start.getTime()) {
      end = new Date(`2000-01-02T${endTime}`); // Add one day to end time
    }
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  const handleSaveNotes = (noteKey: string) => {
    if (noteKey.includes('-')) {
      // It's a slot-specific note
      setSlotNotes(prev => ({ ...prev, [noteKey]: tempNotes }));
    } else {
      // It's a shift note
      updateShiftNotes(noteKey, tempNotes);
    }
    setEditingNotes(null);
  };

  const handleCancelEditNotes = () => {
    setTempNotes("");
    setEditingNotes(null);
  };

  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      setTeamLeader(shiftId, "");
    } else {
      setTeamLeader(shiftId, operatorId);
    }
  };

  const handleDuplicateShift = (shift: any, operatorId: string) => {
    createShift({
      eventId: event.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      operatorIds: [""], // No operator assigned to duplicate
      activityType: shift.activityType,
      requiredOperators: 1,
      notes: shift.notes
    });
  };

  // Ordinamento tabella turni per cognome operatore
  const [sort, setSort] = useState<{ key: 'date' | 'activityType' | 'operator' | 'startTime' | 'endTime' | 'hours'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
  
  const toggleSort = (key: 'date' | 'activityType' | 'operator' | 'startTime' | 'endTime' | 'hours') =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // Flatten shifts to individual rows for each operator
  const flattenedShifts = useMemo(() => {
    const rows: any[] = [];
    shifts.forEach(shift => {
      shift.operatorIds.forEach((operatorId, slotIndex) => {
        rows.push({
          ...shift,
          operatorId,
          slotIndex,
          isAssigned: operatorId && operatorId.trim() !== ""
        });
      });
    });
    return rows;
  }, [shifts]);

  const sortedShifts = useMemo(() => {
    const arr = [...flattenedShifts];
    arr.sort((a, b) => {
      let va = '', vb = '';
      if (sort.key === 'date') { va = a.date; vb = b.date; }
      if (sort.key === 'activityType') { va = a.activityType || ''; vb = b.activityType || ''; }
      if (sort.key === 'operator') { 
        va = a.isAssigned ? getOperatorName(a.operatorId) : '';
        vb = b.isAssigned ? getOperatorName(b.operatorId) : '';
      }
      if (sort.key === 'startTime') { va = a.startTime; vb = b.startTime; }
      if (sort.key === 'endTime') { va = a.endTime; vb = b.endTime; }
      if (sort.key === 'hours') { 
        va = calculateHours(a.startTime, a.endTime);
        vb = calculateHours(b.startTime, b.endTime);
      }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [flattenedShifts, sort, operators]);

  return (
    <main className="container py-8">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Event info header and shift planning */}
      <section className="mb-8">
        <div className="flex gap-8">
          {/* Left side - Event details (40%) */}
          <div className="flex-[0_0_40%]">
            <h1 className="mb-6 text-3xl font-extrabold font-mulish" style={{ color: "#72AD97" }}>{event.title}</h1>
            
            {/* Event details under title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                <Input
                  value={event.address}
                  onChange={(e) => updateEvent(event.id, { address: e.target.value })}
                  className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                  placeholder="Viale Montenapeoleone 10, Milano"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={event.startDate || ''}
                      onChange={(e) => updateEvent(event.id, { startDate: e.target.value })}
                      className="h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                      placeholder="Data inizio"
                    />
                    <span className="self-center text-muted-foreground">al</span>
                    <Input
                      type="date"
                      value={event.endDate || ''}
                      onChange={(e) => updateEvent(event.id, { endDate: e.target.value })}
                      className="h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                      placeholder="Data fine"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                <Input
                  value={event.notes || ''}
                  onChange={(e) => updateEvent(event.id, { notes: e.target.value })}
                  className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                  placeholder="Necessità di GPG..."
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                <Input
                  value={event.activityCode || ''}
                  onChange={(e) => updateEvent(event.id, { activityCode: e.target.value })}
                  className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                  placeholder="Codice attività"
                />
              </div>
            </div>
          </div>

          {/* Right side - Shift Planning Form (60%) */}
          <div className="flex-[0_0_60%]">
            <ShiftPlanningForm onSubmit={handleShiftSubmit} />
          </div>
        </div>
      </section>

      {/* Shifts Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="mt-6 text-2xl font-extrabold font-mulish" style={{ color: "#72AD97" }}>LISTA TURNI EVENTO</h2>
        </div>
        
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('date')} className="px-0">
                    <span className="mr-2">DATA</span>
                    {sort.key !== 'date' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('activityType')} className="px-0">
                    <span className="mr-2">TIPOLOGIA ATTIVITÀ</span>
                    {sort.key !== 'activityType' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('operator')} className="px-0">
                    <span className="mr-2">OPERATORE</span>
                    {sort.key !== 'operator' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>TEL</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('startTime')} className="px-0">
                    <span className="mr-2">ORA INIZIO</span>
                    {sort.key !== 'startTime' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('endTime')} className="px-0">
                    <span className="mr-2">ORA FINE</span>
                    {sort.key !== 'endTime' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('hours')} className="px-0">
                    <span className="mr-2">ORE TOTALI</span>
                    {sort.key !== 'hours' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>TL</TableHead>
                <TableHead>NOTE</TableHead>
                <TableHead>AZIONI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.map((row, index) => (
                <TableRow 
                  key={`${row.id}-${row.slotIndex}`}
                  className="even:bg-muted transition-all duration-300 hover:bg-muted/80"
                >
                  <TableCell>
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateShiftTime(row.id, { startTime: row.startTime })}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={row.activityType || ""} 
                      onValueChange={(value) => updateShiftActivityType(row.id, value as ActivityType)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleziona attività" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {row.isAssigned ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{getOperatorName(row.operatorId)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setCurrentShift(row.id);
                            setCurrentSlotIndex(row.slotIndex);
                            setAssignOpen(true);
                          }}
                          aria-label={`Modifica operatore ${getOperatorName(row.operatorId)}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setCurrentShift(row.id);
                          setCurrentSlotIndex(row.slotIndex);
                          setAssignOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assegna
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {row.isAssigned ? (
                        <Input
                          value={editingPhones[`${row.id}-${row.slotIndex}`] || getOperatorPhone(row.operatorId)}
                          onChange={(e) => setEditingPhones(prev => ({ ...prev, [`${row.id}-${row.slotIndex}`]: e.target.value }))}
                          className="h-6 text-xs w-24"
                          placeholder="Telefono"
                        />
                      ) : (
                        <span className="text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime}
                      onChange={(e) => setSlotTimes(prev => ({ 
                        ...prev, 
                        [`${row.id}-${row.slotIndex}`]: { 
                          ...prev[`${row.id}-${row.slotIndex}`], 
                          startTime: e.target.value,
                          endTime: prev[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime
                        }
                      }))}
                      className="h-8 text-sm w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={slotTimes[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime}
                      onChange={(e) => setSlotTimes(prev => ({ 
                        ...prev, 
                        [`${row.id}-${row.slotIndex}`]: { 
                          ...prev[`${row.id}-${row.slotIndex}`], 
                          startTime: prev[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime,
                          endTime: e.target.value
                        }
                      }))}
                      className="h-8 text-sm w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {calculateHours(
                        slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime, 
                        slotTimes[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime
                      )}h
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.isAssigned ? (
                      <Checkbox
                        checked={row.teamLeaderId === row.operatorId}
                        onCheckedChange={() => handleToggleTeamLeader(row.id, row.operatorId, row.teamLeaderId === row.operatorId)}
                        aria-label={row.teamLeaderId === row.operatorId ? "Rimuovi come team leader" : "Imposta come team leader"}
                      />
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {slotNotes[`${row.id}-${row.slotIndex}`] || row.notes ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setEditingNotes(`${row.id}-${row.slotIndex}`);
                          setTempNotes(slotNotes[`${row.id}-${row.slotIndex}`] || row.notes || "");
                        }}
                        aria-label="Visualizza/Modifica note"
                        title={slotNotes[`${row.id}-${row.slotIndex}`] || row.notes}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setEditingNotes(`${row.id}-${row.slotIndex}`);
                          setTempNotes("");
                        }}
                        aria-label="Aggiungi note"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateShift(row, row.operatorId)}
                        aria-label="Duplica turno"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (row.isAssigned) {
                            removeOperator(row.id, row.operatorId);
                            // Check if this was the last operator, if so delete the shift
                            const shift = shifts.find(s => s.id === row.id);
                            if (shift && shift.operatorIds.filter(id => id && id.trim() !== "" && id !== row.operatorId).length === 0) {
                              deleteShift(row.id);
                            }
                          } else {
                            deleteShift(row.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                        aria-label="Elimina riga"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedShifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nessun turno pianificato. Crea il primo turno.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Dialog per modificare note */}
      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Note Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              value={tempNotes} 
              onChange={e => setTempNotes(e.target.value)} 
              placeholder="Inserisci note per il turno" 
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEditNotes}>
                Annulla
              </Button>
              <Button onClick={() => editingNotes && handleSaveNotes(editingNotes)}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OperatorAssignDialog 
        open={assignOpen} 
        onOpenChange={setAssignOpen} 
        operators={currentShift ? operators.filter(op => !shifts.find(s => s.id === currentShift)?.operatorIds.includes(op.id)) : operators} 
        onConfirm={onAssign} 
      />
    </main>
  );
};

export default EventDetail;
