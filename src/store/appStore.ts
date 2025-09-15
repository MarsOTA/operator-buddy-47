import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ID = string;

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'shift_assignment' | 'shift_update' | 'shift_cancellation';
  read: boolean;
  createdAt: string;
  shiftId?: string;
  eventId?: string;
}

export interface NotificationPreferences {
  shiftAssignment: boolean;
  shiftUpdates: boolean;
  shiftCancellation: boolean;
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface ContactPerson {
  id: ID;
  name: string;
  email: string;
  phone: string;
}

export interface Client {
  id: ID;
  name: string; // ragione sociale
  vatNumber: string; // P.IVA
  contactPersons: ContactPerson[];
}

export interface BrandAddress {
  id: ID;
  address: string;
}

export interface Brand {
  id: ID;
  name: string;
  clientId: ID;
  addresses: BrandAddress[];
}

export interface Operator {
  id: ID;
  name: string;
  role: string;
  availability: "Disponibile" | "Occupato" | "In ferie";
  phone?: string;
  email?: string;
  fiscalCode?: string;
  photo?: string;
  notifications?: Notification[];
  notificationPreferences?: NotificationPreferences;
  pushSubscription?: NotificationSubscription;
}

export interface EventItem {
  id: ID;
  title: string;
  clientId: ID;
  brandId: ID;
  address: string;
  activityCode?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface Task {
  id: ID;
  eventId: ID;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type ActivityType =
  | "doorman"
  | "presidio notturno e diurno"
  | "presidio notturno"
  | "presido diurno"
  | "gestione flussi ingresso e uscite"
  | "shooting"
  | "endorsement"
  | "GPG armata con auto"
  | "GPG armata senza auto";

export const ACTIVITY_TYPES: ActivityType[] = [
  "doorman",
  "presidio notturno e diurno",
  "presidio notturno",
  "presido diurno",
  "gestione flussi ingresso e uscite",
  "shooting",
  "endorsement",
  "GPG armata con auto",
  "GPG armata senza auto",
];

export interface Shift {
  id: ID;
  eventId: ID;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  operatorIds: ID[];
  activityType?: ActivityType;
  teamLeaderId?: ID;
  requiredOperators: number;
  notes?: string;
  pauseHours?: number;
}

export interface AppState {
  clients: Client[];
  brands: Brand[];
  operators: Operator[];
  events: EventItem[];
  shifts: Shift[];
  tasks: Task[];
  
  // Current operator for notifications
  currentOperatorId: string | null;

  // Client management
  createClient: (data: Omit<Client, "id">) => Client;
  updateClient: (id: ID, data: Partial<Client>) => void;
  deleteClient: (id: ID) => void;
  addContactPerson: (clientId: ID, contact: Omit<ContactPerson, "id">) => void;
  updateContactPerson: (clientId: ID, contactId: ID, data: Partial<ContactPerson>) => void;
  removeContactPerson: (clientId: ID, contactId: ID) => void;

  // Brand management
  createBrand: (data: Omit<Brand, "id">) => Brand;
  updateBrand: (id: ID, data: Partial<Brand>) => void;
  deleteBrand: (id: ID) => void;
  addBrandAddress: (brandId: ID, address: string) => void;
  updateBrandAddress: (brandId: ID, addressId: ID, address: string) => void;
  removeBrandAddress: (brandId: ID, addressId: ID) => void;
  getBrandsByClient: (clientId: ID) => Brand[];

  createEvent: (data: Omit<EventItem, "id">) => EventItem;
  updateEvent: (id: ID, data: Partial<EventItem>) => void;
  getEventById: (id: ID) => EventItem | undefined;

  createShift: (data: Omit<Shift, "id" | "operatorIds"> & { operatorIds?: ID[] }) => Shift;
  assignOperators: (shiftId: ID, operatorIds: ID[]) => void;
  setOperatorSlot: (shiftId: ID, slotIndex: number, operatorId: ID) => void;
  removeOperator: (shiftId: ID, operatorId: ID) => void;
  replaceOperator: (shiftId: ID, oldOperatorId: ID, newOperatorId: ID) => void;
  setTeamLeader: (shiftId: ID, operatorId: ID) => void;
  updateShiftNotes: (shiftId: ID, notes: string) => void;
  updateShiftTime: (shiftId: ID, data: { startTime?: string; endTime?: string }) => void;
  updateShiftDate: (shiftId: ID, date: string) => void;
  updateShiftActivityType: (shiftId: ID, activityType: ActivityType | undefined) => void;
  updateShiftPauseHours: (shiftId: ID, pauseHours: number) => void;
  deleteShift: (shiftId: ID) => void;
  getShiftsByEvent: (eventId: ID) => Shift[];
  updateEventAddress: (eventId: ID, address: string) => void;
  updateEventActivityCode: (eventId: ID, activityCode: string) => void;

  createTask: (data: Omit<Task, "id" | "createdAt" | "completed">) => Task;
  updateTask: (id: ID, data: Partial<Pick<Task, "title" | "completed">>) => void;
  deleteTask: (id: ID) => void;
  getTasksByEvent: (eventId: ID) => Task[];

  // Notification functions
  setCurrentOperator: (operatorId: string | null) => void;
  addNotification: (operatorId: string, notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  getOperatorNotifications: (operatorId: string) => Notification[];
  markNotificationAsRead: (operatorId: string, notificationId: string) => void;
  getNotificationPreferences: (operatorId: string) => NotificationPreferences | undefined;
  updateNotificationPreferences: (operatorId: string, preferences: NotificationPreferences) => void;
  addNotificationSubscription: (operatorId: string, subscription: NotificationSubscription) => void;
  getNotificationSubscription: (operatorId: string) => NotificationSubscription | undefined;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initialClients: Client[] = [
  { 
    id: "c1", 
    name: "Alfa Group", 
    vatNumber: "12345678901", 
    contactPersons: [
      { id: "cp1", name: "Mario Rossi", email: "mario.rossi@alfagroup.it", phone: "333-1234567" }
    ]
  },
  { 
    id: "c2", 
    name: "Beta S.p.A.", 
    vatNumber: "09876543210", 
    contactPersons: [
      { id: "cp2", name: "Laura Bianchi", email: "laura.bianchi@beta.it", phone: "339-9876543" }
    ]
  },
  { 
    id: "c3", 
    name: "Gamma SRL", 
    vatNumber: "11223344556", 
    contactPersons: []
  },
];

const initialBrands: Brand[] = [
  { 
    id: "b1", 
    name: "BrandX", 
    clientId: "c1", 
    addresses: [
      { id: "ba1", address: "Via Roma 1, Milano" },
      { id: "ba2", address: "Corso Buenos Aires 15, Milano" }
    ]
  },
  { 
    id: "b2", 
    name: "BrandY", 
    clientId: "c2", 
    addresses: [
      { id: "ba3", address: "Via Torino 25, Torino" }
    ]
  },
  { 
    id: "b3", 
    name: "BrandZ", 
    clientId: "c1", 
    addresses: [
      { id: "ba4", address: "Piazza Duomo 3, Milano" }
    ]
  },
];

const initialOperators: Operator[] = [
  { 
    id: "o1", 
    name: "Mario Rossi", 
    role: "Guardia", 
    availability: "Disponibile", 
    phone: "333-1234567",
    email: "mario.rossi@security.it",
    fiscalCode: "RSSMRA80A01H501X",
    photo: "/placeholder.svg"
  },
  { 
    id: "o2", 
    name: "Luca Bianchi", 
    role: "Supervisore", 
    availability: "Disponibile", 
    phone: "335-9876543",
    email: "luca.bianchi@security.it",
    fiscalCode: "BNCLCU75B15F205Y",
    photo: "/placeholder.svg"
  },
  { 
    id: "o3", 
    name: "Anna Verdi", 
    role: "Guardia", 
    availability: "Occupato", 
    phone: "340-1122334",
    email: "anna.verdi@security.it",
    fiscalCode: "VRDNNA85C55H501Z",
    photo: "/placeholder.svg"
  },
  { 
    id: "o4", 
    name: "Sara Neri", 
    role: "Addetto Accoglienza", 
    availability: "Disponibile", 
    phone: "338-5566778",
    email: "sara.neri@security.it",
    fiscalCode: "NRESRA90D45H501W",
    photo: "/placeholder.svg"
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: initialClients,
      brands: initialBrands,
      operators: initialOperators,
      events: [],
      shifts: [],
      tasks: [],
      
      // Current operator for notifications
      currentOperatorId: null,

      // Client management
      createClient: (data) => {
        const newClient: Client = { id: uid(), ...data };
        set((state) => ({ clients: [newClient, ...state.clients] }));
        return newClient;
      },

      updateClient: (id, data) => {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          brands: state.brands.filter((b) => b.clientId !== id),
        }));
      },

      addContactPerson: (clientId, contact) => {
        const newContact: ContactPerson = { id: uid(), ...contact };
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId
              ? { ...c, contactPersons: [...c.contactPersons, newContact] }
              : c
          ),
        }));
      },

      updateContactPerson: (clientId, contactId, data) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  contactPersons: c.contactPersons.map((cp) =>
                    cp.id === contactId ? { ...cp, ...data } : cp
                  ),
                }
              : c
          ),
        }));
      },

      removeContactPerson: (clientId, contactId) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  contactPersons: c.contactPersons.filter((cp) => cp.id !== contactId),
                }
              : c
          ),
        }));
      },

      // Brand management
      createBrand: (data) => {
        const newBrand: Brand = { id: uid(), ...data };
        set((state) => ({ brands: [newBrand, ...state.brands] }));
        return newBrand;
      },

      updateBrand: (id, data) => {
        set((state) => ({
          brands: state.brands.map((b) => (b.id === id ? { ...b, ...data } : b)),
        }));
      },

      deleteBrand: (id) => {
        set((state) => ({
          brands: state.brands.filter((b) => b.id !== id),
        }));
      },

      addBrandAddress: (brandId, address) => {
        const newAddress: BrandAddress = { id: uid(), address };
        set((state) => ({
          brands: state.brands.map((b) =>
            b.id === brandId
              ? { ...b, addresses: [...b.addresses, newAddress] }
              : b
          ),
        }));
      },

      updateBrandAddress: (brandId, addressId, address) => {
        set((state) => ({
          brands: state.brands.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  addresses: b.addresses.map((a) =>
                    a.id === addressId ? { ...a, address } : a
                  ),
                }
              : b
          ),
        }));
      },

      removeBrandAddress: (brandId, addressId) => {
        set((state) => ({
          brands: state.brands.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  addresses: b.addresses.filter((a) => a.id !== addressId),
                }
              : b
          ),
        }));
      },

      getBrandsByClient: (clientId) => get().brands.filter((b) => b.clientId === clientId),

      createEvent: (data) => {
        const newEvent: EventItem = { id: uid(), ...data };
        set((state) => ({ events: [newEvent, ...state.events] }));
        return newEvent;
      },

      updateEvent: (id, data) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
      },

      getEventById: (id) => get().events.find((e) => e.id === id),

      createShift: ({ eventId, date, startTime, endTime, operatorIds = [], activityType, teamLeaderId, requiredOperators, notes }) => {
        const newShift: Shift = { id: uid(), eventId, date, startTime, endTime, operatorIds, activityType, teamLeaderId, requiredOperators, notes };
        set((state) => ({ shifts: [newShift, ...state.shifts] }));
        return newShift;
      },

      assignOperators: (shiftId, operatorIds) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? { ...s, operatorIds: Array.from(new Set([...s.operatorIds, ...operatorIds])) }
              : s
          ),
        }));
      },

      setOperatorSlot: (shiftId, slotIndex, operatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id !== shiftId) return s;
            const newOperatorIds = [...s.operatorIds];
            // Ensure array is large enough
            while (newOperatorIds.length <= slotIndex) {
              newOperatorIds.push("");
            }
            newOperatorIds[slotIndex] = operatorId;
            return { ...s, operatorIds: newOperatorIds };
          }),
        }));
      },

      removeOperator: (shiftId, operatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? {
                  ...s,
                  operatorIds: s.operatorIds.filter((id) => id !== operatorId),
                  teamLeaderId: s.teamLeaderId === operatorId ? undefined : s.teamLeaderId,
                }
              : s
          ),
        }));
      },

      replaceOperator: (shiftId, oldOperatorId, newOperatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId
              ? {
                  ...s,
                  operatorIds: s.operatorIds.map((id) => (id === oldOperatorId ? newOperatorId : id)),
                  teamLeaderId: s.teamLeaderId === oldOperatorId ? newOperatorId : s.teamLeaderId,
                }
              : s
          ),
        }));
      },

      setTeamLeader: (shiftId, operatorId) => {
        set((state) => ({
          shifts: state.shifts.map((s) => {
            if (s.id !== shiftId) return s;
            // Se operatorId è vuoto o non valido, rimuovi il Team Leader
            if (!operatorId || !s.operatorIds.includes(operatorId)) {
              return { ...s, teamLeaderId: undefined };
            }
            // Altrimenti imposta il Team Leader
            return { ...s, teamLeaderId: operatorId };
          }),
        }));
      },

      updateShiftNotes: (shiftId, notes) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, notes } : s
          ),
        }));
      },

      updateShiftTime: (shiftId, data) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, ...data } : s
          ),
        }));
      },

      updateShiftDate: (shiftId, date) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, date } : s
          ),
        }));
      },

      updateShiftActivityType: (shiftId, activityType) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, activityType } : s
          ),
        }));
      },

      updateShiftPauseHours: (shiftId, pauseHours) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === shiftId ? { ...s, pauseHours } : s
          ),
        }));
      },

      deleteShift: (shiftId) => {
        set((state) => ({
          shifts: state.shifts.filter((s) => s.id !== shiftId),
        }));
      },

      getShiftsByEvent: (eventId) => get().shifts.filter((s) => s.eventId === eventId),

      updateEventAddress: (eventId, address) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === eventId ? { ...e, address } : e)),
        }));
      },

      updateEventActivityCode: (eventId, activityCode) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === eventId ? { ...e, activityCode } : e)),
        }));
      },

      createTask: (data) => {
        const newTask: Task = { 
          id: uid(), 
          ...data, 
          completed: false,
          createdAt: new Date().toISOString() 
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      getTasksByEvent: (eventId) => get().tasks.filter((t) => t.eventId === eventId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      // Notification functions
      setCurrentOperator: (operatorId: string | null) => {
        set({ currentOperatorId: operatorId });
      },

      addNotification: (operatorId: string, notification: Omit<Notification, 'id' | 'createdAt'>) => {
        const newNotification: Notification = {
          ...notification,
          id: uid(),
          createdAt: new Date().toISOString(),
          read: false
        };

        set((state) => ({
          operators: state.operators.map(op => 
            op.id === operatorId 
              ? { 
                  ...op, 
                  notifications: [...(op.notifications || []), newNotification]
                }
              : op
          )
        }));
      },

      getOperatorNotifications: (operatorId: string) => {
        const operator = get().operators.find(op => op.id === operatorId);
        return operator?.notifications || [];
      },

      markNotificationAsRead: (operatorId: string, notificationId: string) => {
        set((state) => ({
          operators: state.operators.map(op => 
            op.id === operatorId 
              ? {
                  ...op,
                  notifications: op.notifications?.map(n => 
                    n.id === notificationId ? { ...n, read: true } : n
                  )
                }
              : op
          )
        }));
      },

      getNotificationPreferences: (operatorId: string) => {
        const operator = get().operators.find(op => op.id === operatorId);
        return operator?.notificationPreferences;
      },

      updateNotificationPreferences: (operatorId: string, preferences: NotificationPreferences) => {
        set((state) => ({
          operators: state.operators.map(op => 
            op.id === operatorId 
              ? { ...op, notificationPreferences: preferences }
              : op
          )
        }));
      },

      addNotificationSubscription: (operatorId: string, subscription: NotificationSubscription) => {
        set((state) => ({
          operators: state.operators.map(op => 
            op.id === operatorId 
              ? { ...op, pushSubscription: subscription }
              : op
          )
        }));
      },

      getNotificationSubscription: (operatorId: string) => {
        const operator = get().operators.find(op => op.id === operatorId);
        return operator?.pushSubscription;
      }
    }),
    { name: "security-agency-store" }
  )
);
