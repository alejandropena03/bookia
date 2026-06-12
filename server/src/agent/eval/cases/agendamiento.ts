// Case: agendamiento — el cliente quiere agendar una cita
export const agendamientoCase = {
  name: "agendamiento_básico",
  description: "Cliente pide agendar una cita, debe detectar intención agendamiento",
  messages: [
    { role: "user", content: "Hola, quiero agendar una cita para una consulta" },
  ],
  expectedIntent: "agendamiento",
  minConfidence: 0.7,
  expectedSlots: [],
};
