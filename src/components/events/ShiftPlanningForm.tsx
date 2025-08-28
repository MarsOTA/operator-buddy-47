import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES } from "@/store/appStore";
import { startOfDay } from "date-fns";

type FormValues = {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  activityType: string;
  numOperators: number;
  pauseHours?: number;
  notes?: string;
};

interface ShiftPlanningFormProps {
  onSubmit: (values: FormValues) => void;
  onReset?: () => void;
  eventStartDate?: string; // YYYY-MM-DD
}

const ShiftPlanningForm = ({ onSubmit, onReset, eventStartDate }: ShiftPlanningFormProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const eventStart = eventStartDate ? startOfDay(new Date(eventStartDate)) : undefined;

  const validationSchema = z.object({
    date: z.date({ required_error: "Seleziona la data del turno" }).refine(
      (date) => {
        if (!eventStart) return true;
        return startOfDay(date) >= eventStart;
      },
      { message: "La data del turno deve essere uguale o successiva all’inizio evento" }
    ),
    startTime: z.string().min(1, "Seleziona ora di inizio"),
    endTime: z.string().min(1, "Seleziona ora di fine"),
    activityType: z.string().min(1, "Seleziona tipologia attività"),
    numOperators: z.number().min(1, "Inserisci numero operatori").max(20, "Massimo 20"),
    pauseHours: z.preprocess(
      (v) => (v === "" || v === undefined ? 0 : Number(v)),
      z.number().min(0, "La pausa non può essere negativa")
    ).optional(),
    notes: z.string().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      date: undefined,
      startTime: "",
      endTime: "",
      activityType: "",
      numOperators: 1,
      pauseHours: 0,
      notes: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
    onReset?.();
  };

  return (
    <div className="rounded-lg p-6 border border-border mr-[30px]" style={{ backgroundColor: 'hsl(var(--shift-form-background))' }}>
      <h2 className="text-lg font-extrabold mb-6" style={{ color: 'hsl(var(--shift-form-title))', fontFamily: "'Mulish', sans-serif" }}>
        Inserimento turno
      </h2>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Data inizio turno */}
          <div className="space-y-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal h-11", !form.watch("date") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" style={{ color: 'hsl(var(--shift-form-icons))' }} />
                  {form.watch("date") ? form.watch("date")?.toLocaleDateString("it-IT") : "Seleziona data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("date")}
                  onSelect={(date) => {
                    if (date) form.setValue("date", date as Date, { shouldValidate: true });
                    setIsOpen(false);
                  }}
                  fromDate={eventStart}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.date && <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>}
          </div>

          {/* Tipologia attività */}
          <div className="space-y-2">
            <Select onValueChange={(value) => form.setValue("activityType", value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona tipologia" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.activityType && <p className="text-sm text-destructive">{form.formState.errors.activityType.message}</p>}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Input placeholder="Note per il turno..." className="h-11" {...form.register("notes")} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Ora inizio */}
          <Input type="time" className="h-11" {...form.register("startTime")} />
          {/* Ora fine */}
          <Input type="time" className="h-11" {...form.register("endTime")} />
          {/* N° operatori */}
          <Input type="number" min="1" max="20" className="h-11 text-center" {...form.register("numOperators", { valueAsNumber: true })} />
          {/* Pausa h. */}
          <Input type="number" min="0" step="0.25" className="h-11 text-right" placeholder="Pausa h." {...form.register("pauseHours", { valueAsNumber: true })} />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-12 text-base font-medium">
            Aggiungi turno
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShiftPlanningForm;
