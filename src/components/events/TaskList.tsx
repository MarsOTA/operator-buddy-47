import { useState } from "react";
import { Input } from "@/components/ui/input";

type Shift = {
  id: string;
  date: string;          // ISO yyyy-mm-dd
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  activityType: string;
  operator?: string | null;
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

  // Totali
  const totalEffective = shifts.reduce((sum, s) => {
    const eff = parseFloat(calcEffectiveHours(s.startTime, s.endTime, s.pauseHours ?? 0));
    return sum + (isNaN(eff) ? 0 : eff);
  }, 0);

  const totalOperatorHours = shifts.reduce((sum, s) => {
    const eff = parseFloat(calcEffectiveHours(s.startTime, s.endTime, s.pauseHours ?? 0));
    const ops = clampInt(s.numOperators ?? 1, 1, 20);
    const row = (isNaN(eff) ? 0 : eff) * ops;
    return sum + row;
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
            <th>N° operatori</th> {/* nuovo: editabile */}
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
            <td colSpan={7} className="px-3 py-2 text-right">Totali:</td>
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
  // stati locali per gli input editabili
  const [pauseVal, setPauseVal] = useState<string>((shift.pauseHours ?? 0).toString());
  const [opsVal, setOpsVal] = useState<string>(String(clampInt(shift.numOperators ?? 1, 1, 20)));

  const commitPause = () => {
    const n = Number(pauseVal.replace(",", "."));
    if (isNaN(n) || n < 0) {
      setPauseVal((shift.pauseHours ?? 0).toString());
      return;
    }
    if (n !== (shift.pauseHours ?? 0)) {
      onUpdate({ pauseHours: n });
    }
  };

  const commitOps = () => {
    const n = clampInt(parseInt(opsVal || "1", 10), 1, 20);
    const current = clampInt(shift.numOperators ?? 1, 1, 20);
    // normalizza il campo input mostrando il clamp
    setOpsVal(String(n));
    if (n !== current) {
      onUpdate({ numOperators: n });
    }
  };

  const effectiveHoursStr = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
  const effectiveHours = parseFloat(effectiveHoursStr);
  const operators = clampInt(shift.numOperators ?? 1, 1, 20);
  const operatorHours = isNaN(effectiveHours) ? "0.00" : (effectiveHours * operators).toFixed(2);

  return (
    <tr className="[&>td]:px-3 [&>td]:py-2 border-t">
      <td>{new Date(shift.date).toLocaleDateString("it-IT")}</td>
      <td>{shift.startTime}</td>
      <td>{shift.endTime}</td>
      <td>{shift.activityType}</td>
      <td>{shift.operator ?? "—"}</td>

      {/* N° operatori (editabile) */}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </td>

      {/* Pausa h. (editabile) */}
      <td className="whitespace-nowrap">
        <Input
          type="number"
          min="0"
          step="0.25"
          className="h-9 w-24 text-right"
          value={pauseVal}
          onChange={(e) => setPauseVal(e.target.value)}
          onBlur={commitPause}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          })}
        />
      </td>

      <td>{effectiveHoursStr}</td>
      <td>{operatorHours}</td>
      <td className="text-right">{/* pulsanti azioni esistenti */}</td>
    </tr>
  );
}

// Utility: calcola ore effettive come stringa decimale
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
