export interface BookingProvider {
  createBooking(params: CreateBookingParams): Promise<CreateBookingResult>;
  getAvailableSlots(params: GetSlotsParams): Promise<Slot[]>;
  findOrCreateClient(params: ClientParams): Promise<ClientResult>;
}

export interface CreateBookingParams {
  tenantId: string;
  conversationId: string;
  contactId: string;
  serviceName: string;
  servicePrice?: string;
  city?: string;
  datetime?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface CreateBookingResult {
  success: boolean;
  bookingId: string;
  providerRef?: string;
  message: string;
}

export interface GetSlotsParams {
  serviceName?: string;
  date?: string;
}

export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface ClientParams {
  name?: string;
  phone?: string;
  externalId: string;
}

export interface ClientResult {
  clientId: string;
  created: boolean;
}
