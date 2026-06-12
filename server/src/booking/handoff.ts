import { BookingProvider, CreateBookingParams, CreateBookingResult } from "./types.js";

/**
 * HandoffBookingProvider: NO confirma la cita automáticamente.
 * Recolecta los datos y los deja listos para que el operador
 * los cargue a Agenda Pro manualmente (workflow real de Santa María hoy).
 * Devuelve un mensaje de cortesía + señal de escalación.
 */
export class HandoffBookingProvider implements BookingProvider {
  async createBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
    return {
      success: true,
      bookingId: crypto.randomUUID(),
      message: `Gracias ${params.contactName ?? ""}, hemos recibido tus datos para agendar ${params.serviceName} el ${params.datetime ?? "pendiente"}.\n\nUno de nuestros asesores revisará la disponibilidad y te confirmará la cita en breve.`,
    };
  }

  async getAvailableSlots(): Promise<{ start: string; end: string; available: boolean }[]> {
    return [];
  }

  async findOrCreateClient(): Promise<{ clientId: string; created: boolean }> {
    return { clientId: crypto.randomUUID(), created: true };
  }
}
