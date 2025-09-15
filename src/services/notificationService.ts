import { formatDateToDDMMYY } from '@/lib/utils';
import type { AppState } from '@/store/appStore';

// Notification service that works without React hooks
export class NotificationService {
  private store: AppState;

  constructor(store: AppState) {
    this.store = store;
  }

  private getOperatorById = (operatorId: string) => {
    return this.store.operators.find(op => op.id === operatorId);
  };

  private getShiftById = (shiftId: string) => {
    return this.store.shifts.find(shift => shift.id === shiftId);
  };

  private getEventById = (eventId: string) => {
    return this.store.events.find(event => event.id === eventId);
  };

  private getClientById = (clientId: string) => {
    return this.store.clients.find(client => client.id === clientId);
  };

  private getBrandById = (brandId: string) => {
    return this.store.brands.find(brand => brand.id === brandId);
  };

  private getEventDetails = (shiftId: string) => {
    const shift = this.getShiftById(shiftId);
    if (!shift) return null;

    const event = this.getEventById(shift.eventId);
    if (!event) return null;

    const client = this.getClientById(event.clientId);
    const brand = this.getBrandById(event.brandId);

    return {
      shift,
      event,
      client,
      brand,
      fullLocation: `${brand?.name || 'Brand sconosciuto'} - ${event.address}`,
      clientBrandName: `${client?.name || 'Cliente sconosciuto'} - ${brand?.name || 'Brand sconosciuto'}`,
      dateFormatted: formatDateToDDMMYY(shift.date),
      timeRange: `${shift.startTime}-${shift.endTime}`,
      activityType: shift.activityType || 'Attività non specificata'
    };
  };

  public sendShiftAssignmentNotification = async (operatorId: string, shiftId: string) => {
    const operator = this.getOperatorById(operatorId);
    const preferences = this.store.getNotificationPreferences(operatorId);
    
    if (!operator || !preferences?.shiftAssignment) return;

    const eventDetails = this.getEventDetails(shiftId);
    if (!eventDetails) return;

    const title = "Nuovo turno assegnato";
    const message = `Nuovo turno per ${eventDetails.clientBrandName}
📍 ${eventDetails.fullLocation}
📅 ${eventDetails.dateFormatted} | ${eventDetails.timeRange}
🎯 ${eventDetails.activityType}
👥 ${eventDetails.shift.requiredOperators} operatori richiesti`;
    
    // Add notification to store
    this.store.addNotification(operatorId, {
      title,
      message,
      type: 'shift_assignment',
      shiftId,
      eventId: eventDetails.event.id,
      read: false
    });

    // Note: Push notifications would need to be handled separately
    // since they require browser APIs not available in this service
    console.log(`Notification sent to ${operator.name}: ${title}`);
  };

  public sendShiftUpdateNotification = async (operatorId: string, shiftId: string, changes: string) => {
    const operator = this.getOperatorById(operatorId);
    const preferences = this.store.getNotificationPreferences(operatorId);
    
    if (!operator || !preferences?.shiftUpdates) return;

    const eventDetails = this.getEventDetails(shiftId);
    if (!eventDetails) return;

    const title = "Turno modificato";
    const message = `Turno modificato per ${eventDetails.clientBrandName}
📍 ${eventDetails.fullLocation}
📅 ${eventDetails.dateFormatted} | ${eventDetails.timeRange}
🔄 Modifiche: ${changes}`;
    
    // Add notification to store
    this.store.addNotification(operatorId, {
      title,
      message,
      type: 'shift_update',
      shiftId,
      eventId: eventDetails.event.id,
      read: false
    });

    console.log(`Update notification sent to ${operator.name}: ${title}`);
  };

  public sendShiftCancellationNotification = async (operatorId: string, shiftId: string) => {
    const operator = this.getOperatorById(operatorId);
    const preferences = this.store.getNotificationPreferences(operatorId);
    
    if (!operator || !preferences?.shiftCancellation) return;

    const eventDetails = this.getEventDetails(shiftId);
    if (!eventDetails) {
      // Fallback if shift is already deleted
      const title = "Turno cancellato";
      const message = "Un turno è stato cancellato";
      
      this.store.addNotification(operatorId, {
        title,
        message,
        type: 'shift_cancellation',
        read: false
      });
      
      console.log(`Cancellation notification sent to ${operator.name}: ${title}`);
      return;
    }

    const title = "Turno cancellato";
    const message = `Turno cancellato per ${eventDetails.clientBrandName}
📍 ${eventDetails.fullLocation}
📅 ${eventDetails.dateFormatted} | ${eventDetails.timeRange}
❌ Il turno è stato annullato`;
    
    // Add notification to store
    this.store.addNotification(operatorId, {
      title,
      message,
      type: 'shift_cancellation',
      shiftId,
      eventId: eventDetails.event.id,
      read: false
    });

    console.log(`Cancellation notification sent to ${operator.name}: ${title}`);
  };
}