import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock, Building2, MapPin, Calendar, Badge, Phone, StickyNote, Lock, Unlock, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OperatorDetailsDialog from "@/components/events/OperatorDetailsDialog";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import ShiftPlanningForm from "@/components/events/ShiftPlanningForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, formatDateToDDMMYY, parseDateFromDDMMYY } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/services/notificationService";
import { ClientBrandBadge } from "@/components/ui/client-brand-badge";

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
  const updateShiftDate = useAppStore(s => s.updateShiftDate);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const updateShiftPauseHours = useAppStore(s => s.updateShiftPauseHours);
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
  const [pauseHours, setPauseHours] = useState<Record<string, number>>({});
  // Initialize row edit state: unassigned rows start in edit mode
  const initializeRowEdit = (shifts: any[]) => {
    const initialState: Record<string, boolean> = {};
    shifts.forEach(shift => {
      shift.operatorIds.forEach((operatorId: any, slotIndex: number) => {
        const rowKey = `${shift.id}-${slotIndex}`;
        const isAssigned = operatorId && operatorId.trim() !== "";
        initialState[rowKey] = !isAssigned; // Unassigned rows start in edit mode
      });
    });
    return initialState;
  };

  // Initialize rowEdit state - unassigned operators start in edit mode
  const [rowEdit, setRowEdit] = useState<Record<string, boolean>>(() => initializeRowEdit(shifts));

  // Update rowEdit when new shifts are added (ensure unassigned ones start in edit mode)
  useEffect(() => {
    const newRowEdit = initializeRowEdit(shifts);
    setRowEdit(prev => {
      // Only update new rows that don't exist in current state
      const updated = { ...prev };
      Object.keys(newRowEdit).forEach(key => {
        if (!(key in updated)) {
          updated[key] = newRowEdit[key];
        }
      });
      return updated;
    });
  }, [shifts.length]); // Only trigger when shifts array length changes (new shifts added)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedShiftForEmail, setSelectedShiftForEmail] = useState<any>(null);
  const [operatorDetailsOpen, setOperatorDetailsOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [notePopoverOpen, setNotePopoverOpen] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Inline editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const handleStartEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setTempValues({ ...tempValues, [field]: currentValue });
  };

  const handleSaveField = (field: string) => {
    const value = tempValues[field];
    if (field === 'address') {
      updateEvent(event.id, { address: value });
    } else if (field === 'startDate') {
      // Convert DD/MM/YY to YYYY-MM-DD for storage
      const isoDate = parseDateFromDDMMYY(value);
      updateEvent(event.id, { startDate: isoDate });
    } else if (field === 'endDate') {
      // Convert DD/MM/YY to YYYY-MM-DD for storage
      const isoDate = parseDateFromDDMMYY(value);
      updateEvent(event.id, { endDate: isoDate });
    } else if (field === 'activityCode') {
      updateEvent(event.id, { activityCode: value });
    } else if (field === 'notes') {
      updateEvent(event.id, { notes: value });
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  const handleStartTitleEdit = () => {
    setEditingTitle(true);
    setTempTitle(event.title);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      updateEvent(event.id, { title: tempTitle.trim() });
    }
    setEditingTitle(false);
    setTempTitle("");
  };

  const handleCancelTitleEdit = () => {
    setEditingTitle(false);
    setTempTitle("");
  };

  if (!event) return (
    <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>
  );

  const client = clients.find(c => c.id === event.clientId);
  const brand = brands.find(b => b.id === event.brandId);

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
      const shift = shifts.find(s => s.id === currentShift);
      const previousOperatorId = shift?.operatorIds[currentSlotIndex] || "";
      
      if (selectedIds.length === 0 || selectedIds[0] === "") {
        setOperatorSlot(currentShift, currentSlotIndex, "");
        // No notification needed for removal
      } else {
        const newOperatorId = selectedIds[0];
        setOperatorSlot(currentShift, currentSlotIndex, newOperatorId);
        
        // Send notification to newly assigned operator
        if (newOperatorId !== previousOperatorId && newOperatorId) {
          const store = useAppStore.getState();
          const notificationService = new NotificationService(store);
          notificationService.sendShiftAssignmentNotification(newOperatorId, currentShift);
        }
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

  const calculateHours = (startTime: string, endTime: string, pauseHours: number = 0) => {
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts (e.g., 20:00 to 03:00)
    if (end.getTime() < start.getTime()) {
      end = new Date(`2000-01-02T${endTime}`); // Add one day to end time
    }
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const effectiveHours = Math.max(0, hours - pauseHours);
    return effectiveHours.toFixed(1);
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
    setTempNotes("");
    // Close the popover
    setNotePopoverOpen(prev => ({ ...prev, [noteKey]: false }));
  };

  const handleCancelEditNotes = (noteKey?: string) => {
    setTempNotes("");
    setEditingNotes(null);
    // Close the popover if noteKey is provided
    if (noteKey) {
      setNotePopoverOpen(prev => ({ ...prev, [noteKey]: false }));
    }
  };

  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      setTeamLeader(shiftId, "");
    } else {
      setTeamLeader(shiftId, operatorId);
    }
  };

  const handleSendEmail = (shift: any) => {
    setSelectedShiftForEmail(shift);
    setEmailModalOpen(true);
  };

  const confirmSendEmail = () => {
    if (selectedShiftForEmail && selectedShiftForEmail.isAssigned) {
      const operatorName = getOperatorName(selectedShiftForEmail.operatorId);
      const slotKey = `${selectedShiftForEmail.id}-${selectedShiftForEmail.slotIndex}`;
      const actualStartTime = slotTimes[slotKey]?.startTime || selectedShiftForEmail.startTime;
      const actualEndTime = slotTimes[slotKey]?.endTime || selectedShiftForEmail.endTime;
      
      // Simulate email sending (can be replaced with real email service integration)
      console.log("Invio email a:", {
        operatore: operatorName,
        data: selectedShiftForEmail.date,
        oraInizio: actualStartTime,
        oraFine: actualEndTime,
        attivita: selectedShiftForEmail.activityType,
        note: slotNotes[slotKey] || selectedShiftForEmail.notes || "Nessuna nota"
      });
      
      toast({
        title: "Email inviata!",
        description: `Email di notifica turno inviata a ${operatorName}`,
      });
      
      setEmailModalOpen(false);
      setSelectedShiftForEmail(null);
    }
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
        va = calculateHours(a.startTime, a.endTime, shifts.find(s => s.id === a.id)?.pauseHours || 0);
        vb = calculateHours(b.startTime, b.endTime, shifts.find(s => s.id === b.id)?.pauseHours || 0);
      }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [flattenedShifts, sort, operators]);

  // Calculate total operator hours (assigned) and total billable hours (all shifts)
  const totalOperatorHours = useMemo(() => {
    return sortedShifts.reduce((total, row) => {
      if (row.isAssigned) {
        const slotKey = `${row.id}-${row.slotIndex}`;
        const hours = parseFloat(calculateHours(
          slotTimes[slotKey]?.startTime || row.startTime,
          slotTimes[slotKey]?.endTime || row.endTime,
          pauseHours[slotKey] || shifts.find(s => s.id === row.id)?.pauseHours || 0
        ));
        return total + hours;
      }
      return total;
    }, 0);
  }, [sortedShifts, slotTimes, pauseHours]);

  const totalBillableHours = useMemo(() => {
    return sortedShifts.reduce((total, row) => {
      const slotKey = `${row.id}-${row.slotIndex}`;
      const hours = parseFloat(calculateHours(
        slotTimes[slotKey]?.startTime || row.startTime,
        slotTimes[slotKey]?.endTime || row.endTime,
        pauseHours[slotKey] || shifts.find(s => s.id === row.id)?.pauseHours || 0
      ));
      return total + hours;
    }, 0);
  }, [sortedShifts, slotTimes, pauseHours]);

  return (
    <main className="container py-8">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Event header with title and badges */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          {/* Event title - editable on hover */}
          <div className="group flex items-center gap-2">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-3xl font-extrabold font-mulish h-12 border-2 border-primary"
                  style={{ color: "#72AD97" }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelTitleEdit();
                  }}
                />
                <Button variant="ghost" size="sm" onClick={handleSaveTitle}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelTitleEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold font-mulish" style={{ color: "#72AD97" }}>
                  {event.title}
                </h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleStartTitleEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {/* Client and Brand badges */}
          <div className="flex flex-col gap-2">
            {client && <ClientBrandBadge label="CLIENT" text={client.name} variant="client" />}
            {brand && <ClientBrandBadge label="BRAND" text={brand.name} variant="brand" />}
          </div>
        </div>
      </header>

      {/* Main content layout */}
      <section className="mb-8">
        <div className="flex gap-8">
          {/* Left side - Event details (60%) */}
          <div className="flex-[0_0_60%]">
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-6">
                {/* Event details */}
                <div className="space-y-4">
                  {/* Address field */}
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <MapPin className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Indirizzo evento</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex-1 flex items-center gap-2">
                      {editingField === 'address' ? (
                        <>
                          <Input
                            value={tempValues.address || ''}
                            onChange={(e) => setTempValues({ ...tempValues, address: e.target.value })}
                            className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                            placeholder="Viale Montenapeoleone 10, Milano"
                            autoFocus
                          />
                          <Button variant="ghost" size="sm" onClick={() => handleSaveField('address')}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 py-2">{event.address || 'Indirizzo non specificato'}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleStartEdit('address', event.address)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                
                  {/* Date fields */}
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Calendar className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Data inizio e fine evento</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex-1">
                      <div className="flex gap-2 items-center">
                        {/* Start Date */}
                        <div className="flex items-center gap-2">
                          {editingField === 'startDate' ? (
                            <>
                              <Input
                                type="text"
                                placeholder="GG/MM/AA"
                                value={tempValues.startDate || ''}
                                onChange={(e) => setTempValues({ ...tempValues, startDate: e.target.value })}
                                className="h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                                autoFocus
                              />
                              <Button variant="ghost" size="sm" onClick={() => handleSaveField('startDate')}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="py-2">{formatDateToDDMMYY(event.startDate) || 'Data non specificata'}</span>
                              <Button variant="ghost" size="sm" onClick={() => handleStartEdit('startDate', formatDateToDDMMYY(event.startDate))}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <span className="text-muted-foreground">al</span>
                        
                        {/* End Date */}
                        <div className="flex items-center gap-2">
                          {editingField === 'endDate' ? (
                            <>
                              <Input
                                type="text"
                                placeholder="GG/MM/AA"
                                value={tempValues.endDate || ''}
                                onChange={(e) => setTempValues({ ...tempValues, endDate: e.target.value })}
                                className="h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                                autoFocus
                              />
                              <Button variant="ghost" size="sm" onClick={() => handleSaveField('endDate')}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="py-2">{formatDateToDDMMYY(event.endDate) || 'Data non specificata'}</span>
                              <Button variant="ghost" size="sm" onClick={() => handleStartEdit('endDate', formatDateToDDMMYY(event.endDate))}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Code field */}
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="h-5 w-5" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Codice attività</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex-1 flex items-center gap-2">
                      {editingField === 'activityCode' ? (
                        <>
                          <Input
                            value={tempValues.activityCode || ''}
                            onChange={(e) => setTempValues({ ...tempValues, activityCode: e.target.value })}
                            className="flex-1 h-10 border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                            placeholder="Codice attività"
                            autoFocus
                          />
                          <Button variant="ghost" size="sm" onClick={() => handleSaveField('activityCode')}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 py-2">{event.activityCode || 'Codice non specificato'}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleStartEdit('activityCode', event.activityCode)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Event Notes field */}
                  <div className="flex items-start gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <StickyNote className="h-5 w-5 mt-2" style={{ color: '#72AD97', backgroundColor: 'transparent' }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Note evento</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex-1 flex flex-col gap-2">
                      {editingField === 'notes' ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            value={tempValues.notes || ''}
                            onChange={(e) => setTempValues({ ...tempValues, notes: e.target.value })}
                            className="min-h-[80px] border-0 border-b border-border/30 rounded-none focus:border-primary bg-transparent"
                            placeholder="Inserisci note per l'evento..."
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleSaveField('notes')}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="flex-1 py-2 min-h-[40px] text-sm">
                            {event.notes || 'Nessuna nota inserita'}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleStartEdit('notes', event.notes)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - Shift planning form (40%) */}
          <div className="flex-[0_0_40%]">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="h-5 w-5" style={{ color: '#72AD97' }} />
                  <h2 className="text-lg font-semibold">Inserimento Turno</h2>
                </div>
                <ShiftPlanningForm 
                  onSubmit={handleShiftSubmit}
                  eventStartDate={event.startDate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Shifts Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="mt-6 text-2xl font-extrabold font-mulish" style={{ color: "#72AD97" }}>TABELLA LISTA TURNI</h2>
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
                <TableHead>TELEFONO</TableHead>
                <TableHead>N° OPERATORI</TableHead>
                <TableHead>ORE PAUSA</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('hours')} className="px-0">
                    <span className="mr-2">ORE FATTURATE</span>
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
                  data-unassigned={!row.isAssigned ? "true" : undefined}
                  className="even:bg-muted transition-all duration-300 hover:bg-muted/80"
                >
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateShiftDate(row.id, e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <span className="text-sm">{new Date(row.date).toLocaleDateString('it-IT')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
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
                    ) : (
                      <span className="text-sm">{slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
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
                    ) : (
                      <span className="text-sm">{slotTimes[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
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
                    ) : (
                      <span className="text-sm">{row.activityType || "Non specificata"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
                      row.isAssigned ? (
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
                      )
                    ) : (
                      row.isAssigned ? (
                        <button
                          className="text-sm text-primary hover:underline cursor-pointer transition-colors"
                          onClick={() => {
                            const operator = operators.find(op => op.id === row.operatorId);
                            if (operator) {
                              setSelectedOperator(operator);
                              setOperatorDetailsOpen(true);
                            }
                          }}
                        >
                          {getOperatorName(row.operatorId)}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-orange-700">Non assegnato</span>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{row.isAssigned ? getOperatorPhone(row.operatorId) : "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">1</span>
                  </TableCell>
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={pauseHours[`${row.id}-${row.slotIndex}`] || shifts.find(s => s.id === row.id)?.pauseHours || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setPauseHours(prev => ({
                            ...prev,
                            [`${row.id}-${row.slotIndex}`]: value
                          }));
                        }}
                        onBlur={() => {
                          const value = pauseHours[`${row.id}-${row.slotIndex}`] || 0;
                          updateShiftPauseHours(row.id, value);
                        }}
                        className="h-8 text-sm w-16 text-center"
                      />
                    ) : (
                      <span className="text-sm">
                        {pauseHours[`${row.id}-${row.slotIndex}`] || shifts.find(s => s.id === row.id)?.pauseHours || 0}h
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rowEdit[`${row.id}-${row.slotIndex}`] ? (
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={calculateHours(
                          slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime, 
                          slotTimes[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime,
                          pauseHours[`${row.id}-${row.slotIndex}`] || shifts.find(s => s.id === row.id)?.pauseHours || 0
                        )}
                       onChange={(e) => {
                         const newHours = parseFloat(e.target.value) || 0;
                         const startTime = slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime;
                         const [startHour, startMinute] = startTime.split(':').map(Number);
                         const startDate = new Date(2000, 0, 1, startHour, startMinute);
                         const endDate = new Date(startDate.getTime() + newHours * 60 * 60 * 1000);
                         const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
                         
                         setSlotTimes(prev => ({
                           ...prev,
                           [`${row.id}-${row.slotIndex}`]: {
                             ...prev[`${row.id}-${row.slotIndex}`],
                             startTime,
                             endTime
                           }
                         }));
                       }}
                       className="h-8 text-sm w-16 text-center"
                     />
                   ) : (
                      <span className="text-sm font-medium">
                        {calculateHours(
                          slotTimes[`${row.id}-${row.slotIndex}`]?.startTime || row.startTime, 
                          slotTimes[`${row.id}-${row.slotIndex}`]?.endTime || row.endTime,
                          pauseHours[`${row.id}-${row.slotIndex}`] || shifts.find(s => s.id === row.id)?.pauseHours || 0
                        )}h
                      </span>
                   )}
                 </TableCell>
                 <TableCell>
                   {rowEdit[`${row.id}-${row.slotIndex}`] ? (
                     row.isAssigned ? (
                       <Checkbox
                         checked={row.teamLeaderId === row.operatorId}
                         onCheckedChange={() => handleToggleTeamLeader(row.id, row.operatorId, row.teamLeaderId === row.operatorId)}
                         aria-label={row.teamLeaderId === row.operatorId ? "Rimuovi come team leader" : "Imposta come team leader"}
                       />
                     ) : "-"
                   ) : (
                     <span className="text-sm">{row.isAssigned && row.teamLeaderId === row.operatorId ? "Sì" : "-"}</span>
                   )}
                 </TableCell>
                 <TableCell>
                   {rowEdit[`${row.id}-${row.slotIndex}`] ? (
                     <div className="flex items-center justify-center">
                       {(slotNotes[`${row.id}-${row.slotIndex}`] || row.notes) ? (
                         <Popover 
                           open={notePopoverOpen[`${row.id}-${row.slotIndex}`]} 
                           onOpenChange={(open) => setNotePopoverOpen(prev => ({ ...prev, [`${row.id}-${row.slotIndex}`]: open }))}
                         >
                           <PopoverTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 w-8 p-0"
                               aria-label="Visualizza/modifica note"
                             >
                               <StickyNote className="h-4 w-4 text-primary" />
                             </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-80 pointer-events-auto" align="center">
                             <div className="space-y-4">
                               <h4 className="font-medium">Note del turno</h4>
                               <div className="space-y-2">
                                 <Label htmlFor="note-edit">Contenuto</Label>
                                 <Textarea
                                   id="note-edit"
                                   value={tempNotes || slotNotes[`${row.id}-${row.slotIndex}`] || row.notes || ""}
                                   onChange={(e) => setTempNotes(e.target.value)}
                                   placeholder="Inserisci note per il turno..."
                                   className="min-h-[80px]"
                                   onFocus={() => {
                                     if (!tempNotes) {
                                       setTempNotes(slotNotes[`${row.id}-${row.slotIndex}`] || row.notes || "");
                                     }
                                   }}
                                 />
                               </div>
                               <div className="flex justify-end gap-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleCancelEditNotes(`${row.id}-${row.slotIndex}`)}
                                   type="button"
                                 >
                                   <X className="h-4 w-4 mr-1" />
                                   Annulla
                                 </Button>
                                 <Button
                                   size="sm"
                                   onClick={() => handleSaveNotes(`${row.id}-${row.slotIndex}`)}
                                   type="button"
                                 >
                                   <Save className="h-4 w-4 mr-1" />
                                   Salva
                                 </Button>
                               </div>
                             </div>
                           </PopoverContent>
                         </Popover>
                       ) : (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0"
                           onClick={() => {
                             setEditingNotes(`${row.id}-${row.slotIndex}`);
                             setTempNotes("");
                           }}
                           aria-label="Aggiungi note"
                         >
                           <Plus className="h-4 w-4 text-muted-foreground" />
                         </Button>
                       )}
                     </div>
                   ) : (
                     <div className="flex items-center justify-center">
                       {(slotNotes[`${row.id}-${row.slotIndex}`] || row.notes) ? (
                         <Popover 
                           open={notePopoverOpen[`${row.id}-${row.slotIndex}`]} 
                           onOpenChange={(open) => setNotePopoverOpen(prev => ({ ...prev, [`${row.id}-${row.slotIndex}`]: open }))}
                         >
                           <PopoverTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 w-8 p-0"
                               aria-label="Visualizza note"
                             >
                               <StickyNote className="h-4 w-4 text-primary" />
                             </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-80 pointer-events-auto" align="center">
                             <div className="space-y-4">
                               <h4 className="font-medium">Note del turno</h4>
                               <div className="space-y-2">
                                 <p className="text-sm text-muted-foreground">{slotNotes[`${row.id}-${row.slotIndex}`] || row.notes}</p>
                               </div>
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 onClick={() => setNotePopoverOpen(prev => ({ ...prev, [`${row.id}-${row.slotIndex}`]: false }))}
                               >
                                 Chiudi
                               </Button>
                             </div>
                           </PopoverContent>
                         </Popover>
                       ) : (
                         <span className="text-sm text-muted-foreground">-</span>
                       )}
                     </div>
                   )}
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-2">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => deleteShift(row.id)}
                       aria-label="Elimina turno"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className={rowEdit[`${row.id}-${row.slotIndex}`] ? "text-green-600" : "text-muted-foreground"}
                       onClick={() => setRowEdit(prev => ({ ...prev, [`${row.id}-${row.slotIndex}`]: !prev[`${row.id}-${row.slotIndex}`] }))}
                       aria-label={rowEdit[`${row.id}-${row.slotIndex}`] ? "Blocca modifica" : "Sblocca modifica"}
                     >
                       {rowEdit[`${row.id}-${row.slotIndex}`] ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                     </Button>
                   </div>
                 </TableCell>
               </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={9} className="text-right font-medium">
                  Totale ore fatturate: {totalBillableHours.toFixed(1)}h
                </TableCell>
                <TableCell className="text-right font-medium">
                  Totale ore assegnate: {totalOperatorHours.toFixed(1)}h
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>

      {/* Email confirmation dialog */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma invio email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Vuoi inviare una email di notifica turno a {selectedShiftForEmail ? getOperatorName(selectedShiftForEmail.operatorId) : ''}?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={confirmSendEmail}>
                Invia Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operator Details Dialog */}
      <OperatorDetailsDialog 
        open={operatorDetailsOpen}
        onOpenChange={setOperatorDetailsOpen}
        operator={selectedOperator}
      />

      {/* Operator Assignment Dialog */}
      <OperatorAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onConfirm={onAssign}
        currentOperatorId={currentShift && currentSlotIndex !== null ? 
          shifts.find(s => s.id === currentShift)?.operatorIds[currentSlotIndex] || "" : ""}
      />
    </main>
  );
};

export default EventDetail;