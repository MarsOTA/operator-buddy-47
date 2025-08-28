import { useState } from "react";
import { Input } from "@/components/ui/input";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
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
      </table>
    </div>
  );
}

function Row({ shift, onUpdate }: { shift: Shift; onUpdate: (patch: Partial<Shift>) => void }) {
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
    setOpsVal(String(n));
    if (n !== current) {
      onUpdate({ numOperators: n });
    }
  };

  const effectiveHoursStr = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
  const effectiveHours = parseFloat(effectiveHoursStr);
  const operators = clampInt(shift.numOperators ?? 1, 1, 20);
  const operatorHours = isNaN(effectiveHours) ? "0.00" : (effectiveHours * operators).toFixed(2);

  // se manca l’operatore → evidenzia celle in arancione tenue
  const cellStyle = !shift.operator ? { backgroundColor: "#FFE0B2" } : undefined;

  return (
    <tr className="[&>td]:px-3 [&>td]:py-2 border-t">
      <td style={cellStyle}>{safeItDate(shift.date)}</td>
      <td style={cellStyle}>{shift.startTime}</td>
      <td style={cellStyle}>{shift.endTime}</td>
      <td style={cellStyle}>{shift.activityType}</td>
      <td style={cellStyle}>{shift.operator ?? "—"}</td>

      <td style={cellStyle}>
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

      <td style={cellStyle}>
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

      <td style={cellStyle}>{effectiveHoursStr}</td>
      <td style={cellStyle}>{operatorHours}</td>
      <td style={cellStyle} className="text-right">{/* pulsanti azioni */}</td>
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
