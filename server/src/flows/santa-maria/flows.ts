import type { FlowDefinition } from "../engine.js";

export const AGENDAMIENTO_FLOW: FlowDefinition = {
  initial: "ask_city",
  states: {
    ask_city: {
      prompt:
        "¡Hola {nombre}! Soy Carlos, de Santa María Clínica Estética. Cuéntame, ¿desde qué ciudad nos escribes? 😊",
      collects: "city",
      next: "show_service",
      description: "Preguntar la ciudad del cliente para filtrar servicios",
    },
    show_service: {
      prompt:
        "¡Perfecto! Para {city} tenemos estos servicios disponibles:\n{catalog_list}\n\n¿Cuál te gustaría conocer más a fondo?",
      collects: "service",
      next: "confirm_service",
      description: "Mostrar catálogo filtrado por ciudad",
    },
    confirm_service: {
      prompt:
        "Excelente elección. El tratamiento de {service_name} tiene un valor de {service_price}.\n\n{service_description}\n\n¿Te gustaría agendar una valoración personalizada?",
      collects: "confirmation",
      transitions: {
        si: "ask_datetime",
        "me gustaría": "ask_datetime",
        quiero: "ask_datetime",
        "": "ask_datetime",
      },
      description: "Confirmar si desea agendar",
    },
    ask_datetime: {
      prompt:
        "Perfecto. ¿Qué día y hora te gustaría agendar? 😊",
      collects: "datetime",
      next: "collect_data",
      description: "Preguntar fecha y hora",
    },
    collect_data: {
      prompt:
        "Anotado: {datetime}. Para agendar necesito los siguientes datos:\n\n• Nombre completo\n• Número de celular\n• Correo electrónico\n• Fecha de nacimiento\n• Cédula\n\n¿Me compartes esa información?",
      collects: "client_data",
      next: "payment_info",
      description: "Recolectar datos del paciente",
    },
    payment_info: {
      prompt:
        "Gracias por tus datos. Para confirmar tu cita del {datetime}, realizamos un abono del valor del tratamiento.\n\n💳 En Colombia puedes pagar por:\n• Transferencia Bancolombia\n• Tarjetas débito y crédito\n• Link de pago\n\n¿Cómo prefieres pagar?",
      collects: "payment_method",
      next: "await_proof",
      description: "Instrucciones de pago",
    },
    await_proof: {
      prompt:
        "¡Gracias! Una vez realices el pago, por favor envíame el comprobante y con gusto confirmo tu cita 🤍",
      collects: "payment_proof",
      next: "confirm_booking",
      description: "Esperar comprobante",
    },
    confirm_booking: {
      prompt:
        "✅ ¡Cita confirmada!\n\nTu cita de {service_name} queda agendada para el {datetime} en nuestra sede de {city}.\n\nTe enviaremos un recordatorio 24 horas antes.\n\nRecuerda:\n• Asistir con tu documento de identidad original\n• En caso de cancelación, informar con mínimo 24h de anticipación\n\n¿Hay algo más en que pueda ayudarte? 🤍",
      collects: null,
      next: "farewell",
      description: "Confirmación final",
    },
    farewell: {
      prompt:
        "¡Gracias por contactarnos, {nombre}! Que tengas un excelente día. Si necesitas algo más, aquí estoy para ayudarte 😊",
      collects: null,
      next: null,
      description: "Despedida",
    },
  },
};

export const FIRST_CONTACT_FLOW: FlowDefinition = {
  initial: "saludo_natural",
  states: {
    saludo_natural: {
      prompt:
        "¡Hola {nombre}! Soy Carlos, tu asesor de Santa María Clínica Estética. ¿Cómo estás? Cuéntame, ¿en qué puedo ayudarte hoy? 😊",
      collects: null,
      description: "Saludo inicial cálido y natural",
    },
  },
};
