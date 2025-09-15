import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Hash, User } from "lucide-react";

interface Operator {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  fiscalCode?: string;
  photo?: string;
  availability: "Disponibile" | "Occupato" | "In ferie";
}

interface OperatorDetailsDialogProps {
  operator: Operator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OperatorDetailsDialog({ 
  operator, 
  open, 
  onOpenChange 
}: OperatorDetailsDialogProps) {
  if (!operator) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "Disponibile":
        return "bg-green-100 text-green-800 border-green-200";
      case "Occupato":
        return "bg-red-100 text-red-800 border-red-200";
      case "In ferie":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            Dettagli Operatore
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={operator.photo} alt={operator.name} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(operator.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold">{operator.name}</h3>
              <p className="text-muted-foreground">{operator.role}</p>
              <Badge 
                variant="outline" 
                className={`text-xs ${getAvailabilityColor(operator.availability)}`}
              >
                {operator.availability}
              </Badge>
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-4">
            {operator.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{operator.phone}</span>
              </div>
            )}
            
            {operator.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{operator.email}</span>
              </div>
            )}
            
            {operator.fiscalCode && (
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{operator.fiscalCode}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}