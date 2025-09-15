import { useAppStore } from '@/store/appStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { formatDateToDDMMYY } from '@/lib/utils';

// Notification helper functions
export const useNotificationHelpers = () => {
  const { 
    addNotification, 
    getNotificationPreferences,
    operators,
    brands,
    events,
    clients,
    shifts,
    getShiftsByEvent 
  } = useAppStore();
  
  const { sendPushNotification } = usePushNotifications();

  const getOperatorById = (operatorId: string) => {
    return operators.find(op => op.id === operatorId);
  };

  const getShiftById = (shiftId: string) => {
    return shifts.find(shift => shift.id === shiftId);
  };

  const getEventById = (eventId: string) => {
    return events.find(event => event.id === eventId);
  };

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId);
  };

  const getBrandById = (brandId: string) => {
    return brands.find(brand => brand.id === brandId);
  };

  const getEventDetails = (shiftId: string) => {
    const shift = getShiftById(shiftId);
    if (!shift) return null;

    const event = getEventById(shift.eventId);
    if (!event) return null;

    const client = getClientById(event.clientId);
    const brand = getBrandById(event.brandId);

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

  const sendShiftAssignmentNotification = async (operatorId: string, shiftId: string, eventTitle?: string) => {
    const operator = getOperatorById(operatorId);
    const preferences = getNotificationPreferences(operatorId);
    
    if (!operator || !preferences?.shiftAssignment) return;

    const eventDetails = getEventDetails(shiftId);
    if (!eventDetails) return;

    const title = "Nuovo turno assegnato";
    const message = `Nuovo turno per ${eventDetails.clientBrandName}
📍 ${eventDetails.fullLocation}
📅 ${eventDetails.dateFormatted} | ${eventDetails.timeRange}
🎯 ${eventDetails.activityType}
👥 ${eventDetails.shift.requiredOperators} operatori richiesti`;
    
    // Add notification to store
    addNotification(operatorId, {
      title,
      message,
      type: 'shift_assignment',
      shiftId,
      eventId: eventDetails.event.id,
      read: false
    });

    // Send push notification
    await sendPushNotification(operatorId, title, message, `/events/${eventDetails.event.id}`);
  };

  const sendShiftUpdateNotification = async (operatorId: string, shiftId: string, changes: string, eventTitle?: string) => {
    const operator = getOperatorById(operatorId);
    const preferences = getNotificationPreferences(operatorId);
    
    if (!operator || !preferences?.shiftUpdates) return;

    const eventDetails = getEventDetails(shiftId);
    if (!eventDetails) return;

    const title = "Turno modificato";
    const message = `Turno modificato per ${eventDetails.clientBrandName}
📍 ${eventDetails.fullLocation}
📅 ${eventDetails.dateFormatted} | ${eventDetails.timeRange}
🔄 Modifiche: ${changes}`;
    
    // Add notification to store
    addNotification(operatorId, {
      title,
      message,
      type: 'shift_update',
      shiftId,
      eventId: eventDetails.event.id,
      read: false
    });

    // Send push notification
    await sendPushNotification(operatorId, title, message, `/events/${eventDetails.event.id}`);
  };

  const sendShiftCancellationNotification = async (operatorId: string, shiftId: string, eventTitle?: string) => {
    const operator = getOperatorById(operatorId);
    const preferences = getNotificationPreferences(operatorId);
    
    if (!operator || !preferences?.shiftCancellation) return;

    const eventDetails = getEventDetails(shiftId);
    if (!eventDetails) {
      // Fallback if shift is already deleted
      const title = "Turno cancellato";
      const message = eventTitle ? `Il turno "${eventTitle}" è stato cancellato` : "Un turno è stato cancellato";
      
      addNotification(operatorId, {
        title,
        message,
        type: 'shift_cancellation',
        read: false
      });
      
      await sendPushNotification(operatorId, title, message);
      return;
    }

    const title = "Turno cancellato";
    const message = `Turno cancellato per ${eventDetails.clientBrandName}
📍 ${eventDetails.fullLocation}
📅 ${eventDetails.dateFormatted} | ${eventDetails.timeRange}
❌ Il turno è stato annullato`;
    
    // Add notification to store
    addNotification(operatorId, {
      title,
      message,
      type: 'shift_cancellation',
      shiftId,
      eventId: eventDetails.event.id,
      read: false
    });

    // Send push notification
    await sendPushNotification(operatorId, title, message);
  };

  return {
    sendShiftAssignmentNotification,
    sendShiftUpdateNotification,
    sendShiftCancellationNotification
  };
};