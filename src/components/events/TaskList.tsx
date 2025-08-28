import { useState } from "react";
import { Input } from "@/components/ui/input";

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

  // Totali (se ti servono in fondo, lasciali; altrimenti puoi rimuovere la sezione <tfoot>)
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
            <th>Pausa h.</th>
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
  const [pauseVal, setPauseVal] = useState<string>((shift.pauseHours ?? 0).toString());
  const [opsVal, setOpsVal] = useState<string>(String(clampInt(shift.numOperators ?? 1, 1, 20)));

  const commitPause = () => {
    const n = Number(String(pauseVal).replace(",", "."));
    if (isNaN(n) || n < 0) {
      setPauseVal((shift.pauseHours ?? 0).toString());
      return;
    }
    if (n !== (shift.pauseHours ?? 0)) onUpdate({ pauseHours: n });
  };

  const commitOps = () => {
    const n = clampInt(parseInt(opsVal || "1", 10), 1, 20);
    const current = clampInt(shift.numOperators ?? 1, 1, 20);
    setOpsVal(String(n));
    if (n !== current) onUpdate({ numOperators: n });
  };

  const effectiveHoursStr = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
  const effectiveHours = parseFloat(effectiveHoursStr);
  const operators = clampInt(shift.numOperators ?? 1, 1, 20);
  const operatorHours = isNaN(effectiveHours) ? "0.00" : (effectiveHours * operators).toFixed(2);

  // ✅ Rilevazione "non assegnato" + logica più robusta
  const noName =
    !shift.operator ||
    (typeof shift.operator === "string" && shift.operator.trim() === "") ||
    (typeof shift.operator === "string" && shift.operator.toLowerCase().includes("assegna"));
  
  const noPhone = !shift.phone || shift.phone === "-" || shift.phone.trim() === "";
  
  const unassigned = (!shift.operatorId && noName) || noPhone;

  // Debug: aggiungi questo per vedere cosa sta succedendo
  console.log('Shift:', shift.id, {
    operator: shift.operator,
    operatorId: shift.operatorId,
    phone: shift.phone,
    noName,
    noPhone,
    unassigned
  });

  return (
    <tr
      className={`[&>td]:px-3 [&>td]:py-2 border-t ${
        unassigned ? '!bg-orange-100 hover:!bg-orange-200' : 'hover:bg-muted/50'
      }`}
      style={unassigned ? { 
        backgroundColor: '#FED7AA !important',
        '--tw-bg-opacity': '1'
      } : undefined}
    >
      <td className="whitespace-nowrap">{safeItDate(shift.date)}</td>
      <td className="whitespace-nowrap">{shift.startTime}</td>
      <td className="whitespace-nowrap">{shift.endTime}</td>
      <td className="whitespace-nowrap">{shift.activityType}</td>
      <td className={`whitespace-nowrap ${unassigned ? 'font-semibold text-orange-800' : ''}`}>
        {shift.operator ?? "—"}
        {unassigned && <span className="ml-1 text-xs text-orange-600">(non assegnato)</span>}
      </td>
      <td className={`whitespace-nowrap ${unassigned ? 'font-semibold text-orange-800' : ''}`}>
        {shift.phone ?? "-"}
      </td>

      {/* N° operatori */}
      <td className="whitespace-nowrap">
        <Input
          type="number"
          min={1}
          max={20}
          step={1}
          className="h-9 w-24 text-right"
          value={opsVal}
          onChange={(e) => setOpsVal(e.target.value)}
          onBlur={commitOps}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </td>

      {/* Pausa h. */}
      <td className="whitespace-nowrap">
        <Input
          type="number"
          min="0"
          step="0.25"
          className="h-9 w-24 text-right"
          value={pauseVal}
          onChange={(e) => setPauseVal(e.target.value)}
          onBlur={commitPause}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </td>

      <td className="whitespace-nowrap">{effectiveHoursStr}</td>
      <td className="whitespace-nowrap">{operatorHours}</td>
      <td className="text-right">{/* pulsanti azioni esistenti */}</td>
    </tr>
  );
}

// Utils
function calcEffectiveHours(start: string, end: string, pause: number): string {
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let diff = (endMin - startMin) / 60 - pause;
    if (diff < 0) diff = 0;
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
