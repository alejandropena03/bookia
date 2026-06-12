// Case: precio — el cliente pregunta por precios
export const precioCase = {
  name: "consulta_precio",
  description: "Cliente pregunta cuánto vale un servicio",
  messages: [
    { role: "user", content: "¿Cuánto vale el tratamiento facial?" },
  ],
  expectedIntent: "precio",
  minConfidence: 0.7,
  expectedSlots: [],
};
