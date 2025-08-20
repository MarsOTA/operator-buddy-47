import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";

const FormSchema = z.object({
  date: z.date({ required_error: "Seleziona la data del turno" }),
  startTime: z.string().min(1, "Seleziona ora di inizio"),
  endTime: z.string().min(1, "Seleziona ora di fine"),
  activityType: z.string().min(1, "Seleziona tipologia attività"),
  numOperators: z.number().min(1, "Inserisci numero operatori").max(20, "Massimo 20 operatori"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface ShiftPlanningFormProps {
  onSubmit: (values: FormValues) => void;
  onReset?: () => void;
}

const ShiftPlanningForm = ({ onSubmit, onReset }: ShiftPlanningFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: undefined,
      startTime: "",
      endTime: "",
      activityType: "",
      numOperators: 1,
      notes: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
    onReset?.();
  };

  const incrementOperators = () => {
    const current = form.getValues("numOperators");
    if (current < 20) {
      form.setValue("numOperators", current + 1);
    }
  };

  const decrementOperators = () => {
    const current = form.getValues("numOperators");
    if (current > 1) {
      form.setValue("numOperators", current - 1);
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg p-6 border border-border">
      <h2 className="text-lg font-medium text-foreground mb-6">Inserimento turno</h2>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Data inizio turno */}
          <div className="space-y-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !form.watch("date") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("date") 
                    ? form.watch("date")?.toLocaleDateString('it-IT') 
                    : "Seleziona data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("date")}
                  onSelect={(date) => {
                    form.setValue("date", date as Date);
                    setIsOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

          {/* Tipologia attività */}
          <div className="space-y-2">
            <Select onValueChange={(value) => form.setValue("activityType", value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleziona tipologia" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto">
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.activityType && (
              <p className="text-sm text-destructive">{form.formState.errors.activityType.message}</p>
            )}
          </div>

          {/* Note per turno */}
          <div className="space-y-2">
            <Input
              placeholder="Inserisci note per il turno..."
              className="h-11"
              {...form.register("notes")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ora inizio */}
          <div className="space-y-2">
            <Input
              type="time"
              placeholder="Ora inizio"
              className="h-11"
              {...form.register("startTime")}
            />
            {form.formState.errors.startTime && (
              <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
            )}
          </div>

          {/* Ora fine */}
          <div className="space-y-2">
            <Input
              type="time"
              placeholder="Ora fine"
              className="h-11"
              {...form.register("endTime")}
            />
            {form.formState.errors.endTime && (
              <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
            )}
          </div>

          {/* N°operatori */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="N° operatori"
                className="h-11 text-center pr-8"
                value={form.watch("numOperators")}
                onChange={(e) => form.setValue("numOperators", parseInt(e.target.value) || 1)}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-6 p-0 hover:bg-muted"
                  onClick={incrementOperators}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-6 p-0 hover:bg-muted"
                  onClick={decrementOperators}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {form.formState.errors.numOperators && (
              <p className="text-sm text-destructive">{form.formState.errors.numOperators.message}</p>
            )}
          </div>
        </div>

        {/* Aggiungi turno button */}
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-medium"
          >
            Aggiungi turno
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShiftPlanningForm;