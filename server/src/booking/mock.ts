import { BookingProvider, CreateBookingParams, CreateBookingResult } from "./types.js";

export class MockBookingProvider implements BookingProvider {
  async createBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
    const bookingId = crypto.randomUUID();
    return {
      success: true,
      bookingId,
      providerRef: `mock_booking_${Date.now()}`,
      message: `✅ ¡Cita confirmada!\n\n${params.contactName ?? ""}, tu cita de ${params.serviceName} queda agendada para el ${params.datetime ?? "pendiente"} en nuestra sede.\n\nTe enviaremos un recordatorio 24 horas antes.\n\n¿Hay algo más en que pueda ayudarte?`,
    };
  }

  async getAvailableSlots(): Promise<{ start: string; end: string; available: boolean }[]> {
    return [
      { start: "09:00", end: "10:00", available: true },
      { start: "10:00", end: "11:00", available: true },
      { start: "11:00", end: "12:00", available: false },
      { start: "14:00", end: "15:00", available: true },
      { start: "15:00", end: "16:00", available: true },
    ];
  }

  async findOrCreateClient(): Promise<{ clientId: string; created: boolean }> {
    return { clientId: crypto.randomUUID(), created: true };
  }
}
