import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type Shift = {
  id: string;
  date: string;               // ISO yyyy-mm-dd
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
  activityType: string;
  operator?: string | null;   // es. "Bianchi Luca" oppure null (mostri bottone Assegna)
  operatorId?: string | null; // ⬅️ USATO per capire se è assegnato
  phone?: string | null;      // opzionale (TEL)
  pauseHours?: number | null; // opzionale (PAUSA H.)
  numOperators?: number | null; // opzionale (N° operatori)
};

type Props = {
  shifts: Shift[];
  onUpdateShift: (id: string, patch: Partial<Shift>) => void;
};

export default function TaskList({ shifts, onUpdateShift }: Props) {
  if (!shifts?.length) {
    return <div className="text-sm text-muted-foreground px-2 py-4">Nessun turno inserito.</div>;
  }

  const totalEff = shifts.reduce((sum, s) => sum + toNumber(calcEff(s)), 0);
  const totalOpsH = shifts.reduce((sum, s) => {
    const eff = toNumber(calcEff(s));
    const ops = clampInt(s.numOperators ?? 1, 1, 20);
    return sum + eff * ops;
  }, 0);

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="w-full text-sm">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Ora inizio</TableHead>
            <TableHead>Ora fine</TableHead>
            <TableHead>Tipologia attività</TableHead>
            <TableHead>Operatore</TableHead>
            <TableHead>TEL</TableHead>
            <TableHead>N° operatori</TableHead>
            <TableHead>Pausa h.</TableHead>
            <TableHead>Ore totali</TableHead>
            <TableHead>Ore operatori</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {shifts.map((s) => (
            <Row key={s.id} shift={s} onUpdate={(patch) => onUpdateShift(s.id, patch)} />
          ))}
        </TableBody>

        <tfoot className="border-t bg-muted/50 font-medium">
          <tr className="[&>td]:px-4 [&>td]:py-3">
            <td colSpan={8} className="text-right">Totali:</td>
            <td>{totalEff.toFixed(2)}</td>
            <td>{totalOpsH.toFixed(2)}</td>
            <td />
          </tr>
        </tfoot>
      </Table>
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

  const effStr = calcEff(shift);
  const eff = toNumber(effStr);
  const ops = clampInt(shift.numOperators ?? 1, 1, 20);
  const opsHours = (eff * ops).toFixed(2);

  // ✅ se NON c'è operatorId consideriamo "non assegnato"
  const unassigned = !shift.operatorId;
  const cellStyle = unassigned ? { backgroundColor: "#FFE0B2" } as React.CSSProperties : undefined;

  return (
    <TableRow className="border-b transition-colors">
      <TableCell style={cellStyle} className="whitespace-nowrap">{itDate(shift.date)}</TableCell>
      <TableCell style={cellStyle} className="whitespace-nowrap">{shift.startTime}</TableCell>
      <TableCell style={cellStyle} className="whitespace-nowrap">{shift.endTime}</TableCell>
      <TableCell style={cellStyle} className="whitespace-nowrap">{shift.activityType}</TableCell>

      <TableCell style={cellStyle} className="whitespace-nowrap">
        {shift.operator ?? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            Assegna
          </button>
        )}
      </TableCell>

      <TableCell style={cellStyle} className="whitespace-nowrap">{shift.phone ?? "-"}</TableCell>

      <TableCell style={cellStyle} className="whitespace-nowrap">
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
      </TableCell>

      <TableCell style={cellStyle} className="whitespace-nowrap">
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
      </TableCell>

      <TableCell style={cellStyle} className="whitespace-nowrap">{effStr}</TableCell>
      <TableCell style={cellStyle} className="whitespace-nowrap">{opsHours}</TableCell>
      <TableCell style={cellStyle} className="text-right">{/* azioni */}</TableCell>
    </TableRow>
  );
}

/* Utils */
function calcEff(s: Shift): string {
  try {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let diff = (endMin - startMin) / 60 - (s.pauseHours ?? 0);
    if (diff < 0) diff = 0;
    return diff.toFixed(2);
  } catch {
    return "0.00";
  }
}
function toNumber(x: string) { const n = parseFloat(x); return Number.isNaN(n) ? 0 : n; }
function clampInt(n: number, min: number, max: number) { if (Number.isNaN(n)) return min; return Math.max(min, Math.min(max, Math.trunc(n))); }
function itDate(iso: string) { try { return new Date(iso).toLocaleDateString("it-IT"); } catch { return iso; } }
