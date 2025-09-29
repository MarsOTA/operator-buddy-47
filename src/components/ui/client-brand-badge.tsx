import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClientBrandBadgeProps {
  label: string;
  text: string;
  variant?: "client" | "brand";
  className?: string;
}

export function ClientBrandBadge({ label, text, variant = "client", className }: ClientBrandBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs font-medium px-2 py-1",
          variant === "client" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700"
        )}
      >
        {label}
      </Badge>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}