import type { FlowDefinition } from "../engine.js";

// Flujos de Santa María Clínica Estética.
// Textos extraídos exactos de la plantilla "Terminada" de Carlos (Sección 6 flujos completos + §4).
// Persona: Carlos. Sin menú de botones. Horario L-S 9-19h.

export const AGENDAMIENTO_FLOW: FlowDefinition = {
  initial: "ask_city",
  states: {
    ask_city: {
      prompt:
        "¡Perfecto! Para brindarte una atención personalizada, cuéntame por favor ¿desde qué ciudad nos escribes? 😊",
      collects: "city",
      next: "show_service",
      description: "Bienvenida de Carlos + pedir ciudad (Flujo 1 paso 1)",
    },
    show_service: {
      prompt:
        "¡Perfecto! Para {city} tenemos estos servicios disponibles:\n{catalog_list}\n\n¿Cuál te gustaría conocer más a fondo? 😊",
      collects: "service",
      next: "confirm_service",
      description: "Mostrar catálogo filtrado por ciudad",
    },
    confirm_service: {
      prompt:
        "Excelente elección. El tratamiento de {service_name} tiene un valor de {service_price}.\n\n{service_description}\n\n¿Te gustaría agendar una valoración personalizada con el doctor?",
      collects: "confirmation",
      transitions: {
        si: "ask_datetime",
        "me gustaría": "ask_datetime",
        quiero: "ask_datetime",
        "claro": "ask_datetime",
        "": "ask_datetime",
      },
      description: "Confirmar si desea agendar valoración",
    },
    ask_datetime: {
      prompt:
        "Perfecto. ¿Qué día y hora te gustaría agendar? 😊",
      collects: "datetime",
      next: "collect_data",
      description: "Preguntar fecha y hora preferida",
    },
    collect_data: {
      // Texto exacto del Flujo 1 (paso 5): datos requeridos
      prompt:
        "Para realizar tu reserva, envíanos los siguientes datos:\n\n• Nombre completo\n• Fecha de nacimiento\n• Documento (cédula)\n• Teléfono\n• Correo\n• Fecha y hora confirmada ({datetime})\n\nLa reserva se confirma con un abono de $50.000, descontable del procedimiento.",
      collects: "client_data",
      next: "payment_info",
      description: "Recolectar datos del paciente (§4.2)",
    },
    payment_info: {
      prompt:
        "Gracias por tus datos. Para confirmar tu cita del {datetime}, realizamos el abono de $50.000.\n\n💳 Pago:\n• Bancolombia Ahorros – A y S Group SAS N.° 090 00005573 | NIT 901916939\n• O link de pago con cualquier tarjeta\n\nCondiciones: pagos no reembolsables. Reagendamiento con mínimo 24 h de anticipación.\n\n¿Cómo prefieres pagar?",
      collects: "payment_method",
      next: "await_proof",
      description: "Instrucciones de pago (Flujo 1 paso 5)",
    },
    await_proof: {
      prompt:
        "¡Gracias! Una vez realices el pago, por favor envíame el comprobante y con gusto confirmo tu cita 🤍",
      collects: "payment_proof",
      next: "confirm_booking",
      description: "Esperar comprobante de pago",
    },
    confirm_booking: {
      // Texto EXACTO de §4.2 confirmación (no parafraseado)
      prompt:
        "Apreciado(a) paciente, su cita ha sido programada exitosamente en Santa María Clínica Estética ✨ Los detalles fueron enviados a su correo electrónico.\n\n*Recuerde asistir con su documento de identidad original, ya que es requerido para el cumplimiento de nuestros protocolos médicos y el ingreso a nuestras instalaciones.*\n\n*En caso de cancelación, debe informarse con mínimo 24 horas de anticipación; de lo contrario, el abono no será reembolsable.*\n\nAgradecemos su puntualidad. Muchas gracias por confiar en nosotros 🤍",
      collects: null,
      next: null,
      description: "Confirmación final (texto exacto §4.2) — estado terminal",
    },
    farewell: {
      prompt:
        "¡Gracias por contactarnos, {nombre}! Que tengas un excelente día. Si necesitas algo más, aquí estoy para ayudarte 😊",
      collects: null,
      next: null,
      description: "Despedida cálida",
    },
  },
};

export const FIRST_CONTACT_FLOW: FlowDefinition = {
  initial: "saludo_natural",
  states: {
    saludo_natural: {
      // Carlos prefiere algo más natural que la bienvenida automática (§2)
      prompt:
        "¡Hola {nombre}! Soy Carlos, de Santa María Clínica Estética. ¿Cómo estás? Cuéntame, ¿en qué puedo ayudarte hoy? 😊",
      collects: null,
      description: "Saludo natural cálido (preferencia de Carlos)",
    },
  },
};

export const PRECIO_FLOW: FlowDefinition = {
  initial: "ask_city",
  states: {
    ask_city: {
      prompt:
        "¡Claro! Para mostrarte los precios exactos según tu ubicación, cuéntame ¿desde qué ciudad nos escribes? 😊",
      collects: "city",
      next: "ask_service",
      description: "Pedir ciudad para filtrar precios por moneda (PR9)",
    },
    ask_service: {
      prompt:
        "¿Cuál servicio te gustaría conocer? Tenemos valoración, botox, rellenos, rinomodelación, armonización facial y más 😊",
      collects: "service",
      next: "show_price",
      description: "Pedir servicio sin menú de botones (PR9)",
    },
    show_price: {
      prompt:
        "El tratamiento de {service_name} tiene un valor de {service_price}.\n\n¿Te gustaría agendar una valoración personalizada con el doctor? 😊",
      collects: null,
      next: null,
      description: "Mostrar precio + CTA agendamiento — estado terminal (PR9)",
    },
  },
};