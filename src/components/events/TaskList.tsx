import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Shift = {
  id: string;
  date: string;               // ISO yyyy-mm-dd
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
  activityType: string;
  operator?: string | null;   // es. "Verdi Anna" oppure null
  operatorId?: string | null; // se presente è la chiave operatore
  phone?: string | null;      // opzionale per colonna TEL
  pauseHours?: number | null;
  numOperators?: number | null;
};

type Props = {
  shifts: Shift[];
  onUpdateShift: (id: string, patch: Partial<Shift>) => void;
};

export default function TaskList({ shifts, onUpdateShift }: Props) {
  if (!shifts?.length) {
    return <div className="text-sm text-muted-foreground px-2 py-4">Nessun turno inserito.</div>;
  }

  // Totali (con pause sottratte)
  const totalEffective = shifts.reduce((sum, s) => {
    const eff = parseFloat(calcEffectiveHours(s.startTime, s.endTime, s.pauseHours ?? 0));
    return sum + (isNaN(eff) ? 0 : eff);
  }, 0);

  const totalOperatorHours = shifts.reduce((sum, s) => {
    const eff = parseFloat(calcEffectiveHours(s.startTime, s.endTime, s.pauseHours ?? 0));
    const ops = clampInt(s.numOperators ?? 1, 1, 20);
    return sum + (isNaN(eff) ? 0 : eff) * ops;
  }, 0);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
            <th>Data</th>
            <th>Ora inizio</th>
            <th>Ora fine</th>
            <th>Tipologia attività</th>
            <th>Operatore</th>
            <th>TEL</th>
            <th>N° operatori</th>
            <th>Ore pausa</th>
            <th>Ore effettive</th>
            <th>Ore operatori</th>
            <th className="text-right pr-3">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <Row key={s.id} shift={s} onUpdate={(patch) => onUpdateShift(s.id, patch)} />
          ))}
        </tbody>
        <tfoot className="bg-muted/30 font-semibold">
          <tr>
            <td colSpan={8} className="px-3 py-2 text-right">Totali:</td>
            <td className="px-3 py-2">{totalEffective.toFixed(2)}</td>
            <td className="px-3 py-2">{totalOperatorHours.toFixed(2)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Row({ shift, onUpdate }: { shift: Shift; onUpdate: (patch: Partial<Shift>) => void }) {
  const [isEditable, setIsEditable] = useState(false);
  const [opsVal, setOpsVal] = useState<string>(String(clampInt(shift.numOperators ?? 1, 1, 20)));
  const [pauseVal, setPauseVal] = useState<string>(String(shift.pauseHours ?? 0));

  const commitOps = () => {
    const n = clampInt(parseInt(opsVal || "1", 10), 1, 20);
    const current = clampInt(shift.numOperators ?? 1, 1, 20);
    setOpsVal(String(n));
    if (n !== current) onUpdate({ numOperators: n });
  };

  const commitPause = () => {
    const n = Math.max(0, parseFloat(pauseVal || "0"));
    const current = shift.pauseHours ?? 0;
    setPauseVal(String(n));
    if (n !== current) onUpdate({ pauseHours: n });
  };

  const effectiveHoursStr = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
  const effectiveHours = parseFloat(effectiveHoursStr);
  const operators = clampInt(shift.numOperators ?? 1, 1, 20);
  const operatorHours = isNaN(effectiveHours) ? "0.00" : (effectiveHours * operators).toFixed(2);

  const noName =
    !shift.operator ||
    (typeof shift.operator === "string" && shift.operator.trim() === "") ||
    (typeof shift.operator === "string" && shift.operator.toLowerCase().includes("assegna"));
  
  const noPhone = !shift.phone || shift.phone === "-" || shift.phone.trim() === "";
  const unassigned = (!shift.operatorId && noName) || noPhone;

  const toggleEdit = () => {
    setIsEditable(!isEditable);
  };

  return (
    <tr
      className={`[&>td]:px-3 [&>td]:py-2 border-t transition-colors ${
        unassigned ? 'bg-orange-100 hover:bg-orange-200' : 'hover:bg-muted/50'
      }`}
    >
      <td className="whitespace-nowrap">
        {isEditable ? (
          <Input
            type="date"
            value={shift.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
            className="h-8 w-32"
          />
        ) : (
          safeItDate(shift.date)
        )}
      </td>
      
      <td className="whitespace-nowrap">
        {isEditable ? (
          <Input
            type="time"
            value={shift.startTime}
            onChange={(e) => onUpdate({ startTime: e.target.value })}
            className="h-8 w-20"
          />
        ) : (
          shift.startTime
        )}
      </td>
      
      <td className="whitespace-nowrap">
        {isEditable ? (
          <Input
            type="time"
            value={shift.endTime}
            onChange={(e) => onUpdate({ endTime: e.target.value })}
            className="h-8 w-20"
          />
        ) : (
          shift.endTime
        )}
      </td>
      
      <td className="whitespace-nowrap">
        {isEditable ? (
          <Input
            value={shift.activityType}
            onChange={(e) => onUpdate({ activityType: e.target.value })}
            className="h-8 w-32"
          />
        ) : (
          shift.activityType
        )}
      </td>
      
      <td className={`whitespace-nowrap ${unassigned ? 'font-semibold text-orange-800' : ''}`}>
        {isEditable ? (
          <Input
            value={shift.operator ?? ""}
            onChange={(e) => onUpdate({ operator: e.target.value })}
            className="h-8 w-32"
            placeholder="Nome operatore"
          />
        ) : (
          <>
            {shift.operator ?? "—"}
            {unassigned && <span className="ml-1 text-xs text-orange-600">(non assegnato)</span>}
          </>
        )}
      </td>
      
      <td className={`whitespace-nowrap ${unassigned ? 'font-semibold text-orange-800' : ''}`}>
        {isEditable ? (
          <Input
            value={shift.phone ?? ""}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className="h-8 w-32"
            placeholder="Telefono"
          />
        ) : (
          shift.phone ?? "-"
        )}
      </td>

      <td className="whitespace-nowrap">
        {isEditable ? (
          <Input
            type="number"
            min={1}
            max={20}
            step={1}
            className="h-8 w-20 text-right"
            value={opsVal}
            onChange={(e) => setOpsVal(e.target.value)}
            onBlur={commitOps}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
        ) : (
          operators.toString()
        )}
      </td>

      <td className="whitespace-nowrap">
        {isEditable ? (
          <Input
            type="number"
            min={0}
            max={24}
            step={0.5}
            className="h-8 w-20 text-right"
            value={pauseVal}
            onChange={(e) => setPauseVal(e.target.value)}
            onBlur={commitPause}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="0"
          />
        ) : (
          (shift.pauseHours ?? 0).toString()
        )}
      </td>

      <td className="whitespace-nowrap">{effectiveHoursStr}</td>
      <td className="whitespace-nowrap">{operatorHours}</td>
      
      <td className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleEdit}
          className="h-8 w-8 p-0 transition-all duration-300 hover:scale-110"
        >
          {isEditable ? (
            <Unlock className="h-4 w-4 text-green-600 transition-transform duration-300" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground transition-transform duration-300" />
          )}
        </Button>
      </td>
    </tr>
  );
}

// Utils
function calcEffectiveHours(start: string, end: string, pauseHours: number = 0): string {
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let diff = (endMin - startMin) / 60;
    if (diff < 0) diff = 0;
    diff = Math.max(0, diff - pauseHours); // Sottrae le ore di pausa
    return diff.toFixed(2);
  } catch {
    return "0.00";
  }
}

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function safeItDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT");
  } catch {
    return iso;
  }
}
