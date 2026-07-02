// Canned responses para Santa María Clínica Estética.
// Todos los textos son EXACTOS de la plantilla final de Carlos (§4 Catálogo de respuestas por tema).
// Variables: {nombre} se reemplaza con el nombre del contacto cuando esté disponible.

export const SANTA_MARIA_CANNED: Record<string, string> = {
  // ── Bienvenida / primer contacto (§2) ──
  bienvenida:
    "¡Hola! ✨ Bienvenido(a) a Santa María Clínica Estética. Mi nombre es Carlos y estaré acompañándote en todo tu proceso para resolver tus dudas y ayudarte a encontrar la mejor opción para ti. Para brindarte una atención personalizada, cuéntame por favor ¿desde qué ciudad nos escribes? 😊",

  // ── Charla / conversación natural ──
  charla:
    "¡Con gusto te ayudo! 😊 Cuéntame, ¿qué servicio te interesa o qué duda tienes?",

  // ── Preguntas abiertas de "qué servicios tienen" (grounded, sin LLM libre) ──
  faq_servicios:
    "¡Claro! 😊 Estos son los grupos de tratamientos que manejamos en Santa María:\n\n• Rostro y armonización facial: Full Face Botox, Rinomodelación, proyección de pómulos y mentón\n• Labios: Doll Lips, Russian Lips, Red Lips, hidratación\n• Rejuvenecimiento (bioestimuladores): Radiesse, Sculptra, Boost Skin Glow\n• Otros faciales: bichectomía, ojeras, mesobotox, nasolabiales\n\nCuéntame ¿qué te gustaría lograr o qué tratamiento te llama la atención? Así te doy el detalle y el precio exacto 🤍",

  // ── Precios (§4.1) ──
  precio:
    "¡Claro {nombre}! Algunos de nuestros precios:\n\n{catalog_list}\n\nDime ¿desde qué ciudad nos escribes? para darte información más específica ✨",

  // ── Agendamiento (§4.2) ──
  agendamiento:
    "En Santa María Estética te ofrecemos una valoración personalizada para diseñar un plan acorde a tus objetivos faciales. Será un placer atenderte. ¿Deseas reservar tu cita? ☺️",

  // ── Datos requeridos para agendar (§4.2 + Flujo 1) ──
  datos_agendamiento:
    "Para realizar tu reserva, envíanos:\n• Nombre completo\n• Fecha de nacimiento\n• Documento (cédula)\n• Teléfono\n• Correo\n• Fecha y hora preferida\n\nLa reserva se confirma con un abono de $50.000, descontable del procedimiento.",

  // ── Info de pago / comprobante (Flujo 1) ──
  comprobante_pago:
    "Pago: Bancolombia Ahorros – A y S Group SAS N.° 090 00005573 | NIT 901916939. O link de pago con cualquier tarjeta.\n\nCondiciones: pagos no reembolsables. Reagendamiento con mínimo 24 h de anticipación.\n\nTen presente que esta fecha y horario están sujetos a disponibilidad, ya que varios asesores gestionamos la agenda en tiempo real. El espacio solo se reserva en el momento en que el cliente envía sus datos y el comprobante de pago.",

  // ── Confirmación de cita (§4.2 + Flujo 1, texto exacto) ──
  confirmacion_cita:
    "Apreciado(a) paciente, su cita ha sido programada exitosamente en Santa María Clínica Estética ✨ Los detalles fueron enviados a su correo electrónico.\n\n*Recuerde asistir con su documento de identidad original, ya que es requerido para el cumplimiento de nuestros protocolos médicos y el ingreso a nuestras instalaciones.*\n\n*En caso de cancelación, debe informarse con mínimo 24 horas de anticipación; de lo contrario, el abono no será reembolsable.*\n\nAgradecemos su puntualidad. Muchas gracias por confiar en nosotros 🤍",

  // ── Recordatorio de cita (§4.2) ──
  recordatorio_cita:
    "Hola {nombre}, te escribimos desde Santa María Clínica Estética para recordar tu cita. ¿Deseas confirmarla? 😊 Además te volvemos a enviar la ubicación de la sede.",

  // ── Reagendamiento de control (§4.6) ──
  reagendamiento_control:
    "Reagendamiento de citas de control:\n• El paciente tiene hasta 30 días después del procedimiento para agendar su cita de control.\n• Antes de agendar, revisamos el historial y la asistencia del paciente.\n• Si el paciente canceló o no asistió a su primera cita de control, al solicitar una segunda cita deberá realizar un pago de $50.000 COP.\n• La cita solo se agenda una vez confirmado el pago.",

  // ── Ubicación (§4.3, texto exacto) ──
  ubicacion:
    "📍 Nuestras ubicaciones\n\n🇨🇴 Colombia:\n📍 Medellín — Calle 16AA Sur # 42-91, Edificio Campestre 16-43, Consultorio 311 – El Poblado\n📍 Bogotá — Carrera 7 No. 127-48, Edificio Centro Empresarial 128, Consultorio 306\n📍 Cali — Calle 25 # 98-414, C.C. Jardín Plaza, Jardín Central 2 Business Center, Consultorio 504\n📍 Bucaramanga — Calle 42 # 33-42, Torre Vitro, Consultorio 1206\n📍 Barranquilla — Calle 93 # 49c - 29 Consultorio 203. El Poblado.\n\n🇲🇽 México:\n📍 Ciudad de México — Paseo de los Tamarindos 384, Col. Bosques de las Lomas, Delegación Cuajimalpa, C.P. 05119, CDMX\n\n🇺🇸 Estados Unidos:\n📍 Miami — 3837 SW 8th St, Coral Gables, FL 33134, United State\n\n📲 WhatsApp para citas: +57 301 291 1975 🤍",

  // ── Horarios (§4.3) ──
  horarios:
    "📅 Horarios de atención:\n🕘 Lunes a sábado de 9:00 a.m. a 7:00 p.m.",

  // ── Formas de pago (§4.5, texto exacto) ──
  pago:
    "💳 Métodos de pago disponibles\n\n🇨🇴 Colombia:\n• Efectivo\n• Transferencia Bancolombia\n• Tarjetas débito y crédito\n• Link de pago\n\n🇺🇸 Estados Unidos:\n• Efectivo\n• Zelle\n• Link de pago\n\n🇲🇽 México:\n• Link de pago\n• Terminal",

  // ── Valoración (§4.1) ──
  valoracion:
    "La cita de valoración tiene un valor de *$50.000 pesos.* Si decides realizarte el procedimiento con nosotros, *¡la valoración te queda totalmente GRATIS!* y los $50.000 se descuentan del total del tratamiento que elijas. Durante la valoración, el doctor realiza una evaluación personalizada, revisa tu caso, resuelve todas tus dudas y te orienta sobre el tratamiento más adecuado, las opciones disponibles y el presupuesto según tus objetivos 🤍\n\n*Además, si lo deseas el mismo día de la valoración puedes realizarte el procedimiento.*",

  // ── Dudas médicas / procedimientos (§4.4, duraciones actualizadas 2026-07) ──
  dudas_medicas:
    "Te comparto la duración de nuestros tratamientos:\n\n• Botox: 4 meses.\n• Full Face: 1 año a 1 año y medio.\n• Ácido hialurónico (general): 6 a 12 meses.\n• Labios (Russian/Doll/Red Lips): se aplica en ~45 min, dura de 6 a 12 meses según estilo de vida.\n• Rinomodelación: 6 meses la primera vez; si se repite, dura 12 meses (se cobra cada aplicación).\n• Marcación mandibular / Mentón / Pómulos: 8 a 12 meses.\n• Rostro Coreano: 1 sola sesión, dura 8 a 12 meses.\n• Esperma de Salmón / PDRN: 4 a 6 meses.\n• Lipopapada y Bichectomía enzimática: 4 a 6 meses (requieren varias sesiones para ver resultado completo).\n• Barbie Botox: 4 a 6 meses.\n• Rejuvenecimiento de manos: 1 año.\n\nCuidados generales: evitar mucha exposición al sol, no tomar alcohol en las próximas 48 horas. Anestesia: sí, solo de manera tópica.\n\n¿Te gustaría agendar una valoración para que el doctor revise tu caso personalmente? 🤍",

  // ── Fotos / resultados reales (Instagram, fuente única de material visual confirmada) ──
  resultados_esperados:
    "Tenemos fotos y videos reales de antes/después en nuestro Instagram 📸 Ahí puedes ver los resultados de todos nuestros tratamientos:\nhttps://www.instagram.com/aestheticsantamaria\n\n¿Hay algún tratamiento en particular del que te gustaría ver más? 🤍",

  // ── Solicitud comercial / descuentos / canjes (§4.4) — NUEVO ──
  solicitud_comercial:
    "Hola, buen día.\nPara este tipo de solicitud, puedes comunicarte con:\n📞 Elkin Acevedo: 318 735 4841\n📧 Correo: esteticasantamariabga@gmail.com\nQuedamos atentos a cualquier duda adicional.\n¡Feliz día!",

  // ── Devolución / reembolso / info sensible (§4.4) — NUEVO ──
  devolucion:
    "Buenas tardes, {nombre} 😊\nPara este tipo de información, por favor realiza la solicitud directamente al área encargada a través del siguiente correo electrónico:\n📧 esteticasantamariabga@gmail.com\nPor este medio podrán brindarte la información correspondiente y darle el debido seguimiento.\nTen en cuenta que los tiempos de respuesta son de 5 a 15 días hábiles.",

  // ── Cliente no quiere dar fecha de nacimiento (§4.4) — NUEVO ──
  rechazo_fecha_nacimiento:
    "La fecha de nacimiento es un requisito indispensable, ya que nuestros médicos necesitan conocer la edad del paciente para determinar de forma segura qué tratamiento es el más adecuado. No hay una edad mínima estricta, pero si eres menor de edad debes venir acompañado(a) de tu representante legal, por lo que esta información es muy importante por temas de seguridad y protocolo médico. Te agradecemos mucho si puedes compartirnos este dato para poder continuar con tu agendamiento ✨",

  // ── Nombres de doctores por ciudad (§4.4) — NUEVO ──
  nombres_doctores:
    "Nuestros especialistas por sede:\n• Cali y México: Natalia Benavides\n• Medellín y Barranquilla: Ronald de la Rosa\n• Bucaramanga y Miami: Raúl Ramírez",

  // ── Follow-up después de enviar info (§4.6) ──
  follow_up:
    "¿Tienes alguna duda o te gustaría recibir más información sobre el procedimiento que deseas realizarte? Con gusto te ayudo 😊",

  // ── Re-engagement: cliente pidió info pero no agendó (§4.4) — NUEVO ──
  reengagement_info_enviada:
    "Hemos notado que has consultado por nuestro tratamiento y con gusto ya te compartimos la información 😊 Para brindarte una recomendación personalizada y acompañarte en el proceso, lo ideal es agendar tu cita de valoración con el doctor. Si deseas, con mucho gusto puedo revisar disponibilidad y ayudarte a reservar tu espacio 🤍",

  // ── Rinomodelación (§4.1, texto exacto) ──
  rinomodelacion:
    "💉✨ Rinomodelación sin cirugía ✨💉\n\nLa rinomodelación es un procedimiento no quirúrgico en el que utilizamos ácido hialurónico para mejorar la forma de la nariz. Nos permite perfilar el dorso, levantar la punta y corregir pequeñas asimetrías, logrando un resultado más armónico y natural sin necesidad de cirugía.\n\nEs un tratamiento rápido, con resultados inmediatos y mínima incapacidad.\n\n💰 Valor: $820.000 COP / $8.500 MXN\n\nAgenda tu valoración y cambia tu vida ✨",

  // ── Guía post-tratamiento de Rinomodelación (§A6.5 plan) — NUEVO ──
  // Disparada al confirmar cita de Rinomodelación Y al preguntar
  // "cuidados después de rinomodelación". No diagnóstica; solo orienta.
  guia_rinomodelacion:
    "Buenas {nombre} ✨ Aquí tienes la guía de cuidados post-rinomodelación:\n\n— Primeras 24 horas: no toques ni presiones la nariz; evita maquillaje en la zona.\n— 48 horas: sin alcohol, sin ejercicio intenso, evita calor directo (sauna, sol).\n— 1 semana: no gafas apretadas, duerme boca arriba, evita masajes faciales y tratamientos dentales.\n— Resultados: inmediatos, con leve hinchazón 1-3 días.\n— Control: a las 2 semanas con el doctor.\n\nSi notas algo inusual (asimetría marcada, dolor persistente, cambios de color en la zona), escríbenos para evaluación. 🤍",

  // ── Full Face / Armonización facial (§4.1, texto exacto) ──
  armonizacion_facial:
    "El tratamiento de Full Face (Armonización Facial) es una experiencia de diseño facial personalizada, enfocada en realzar tu belleza con resultados elegantes, equilibrados y completamente naturales.\n\nTrabajamos cada detalle del rostro para mejorar proporciones, definir estructuras y aportar un aspecto más fresco y sofisticado, sin alterar tu esencia, sino elevando tu imagen.\n\nA continuación, te comparto la información completa y la inversión del tratamiento 👇",

  // ── Caso de alergia / reacción (Flujo 1) — NUEVO ──
  caso_alergia:
    "Lo ideal es que asistas a la cita de valoración con el doctor, ya que él podrá examinar tu caso y recomendarte el tratamiento que sea más conveniente y seguro para ti. Si deseas, puedo ayudarte a agendar tu cita en la fecha que te quede mejor. 🤍✨",

  // ── Off-hours (§9) ──
  off_hours:
    "Gracias por escribirnos. Nuestro horario de atención es lunes a sábado de 9:00 a.m. a 7:00 p.m. Te responderemos apenas estemos disponibles.",
};

// ── Reglas de escalation (§7) ──
export const SANTA_MARIA_ESCALATION_RULES = {
  // Triggers que escalan a humano (§7.2)
  keywords: [
    { keyword: "emergencia", reason: "Cliente menciona emergencia o reacción adversa", notify: true },
    { keyword: "reacción", reason: "Cliente menciona reacción adversa", notify: true },
    { keyword: "alérgica", reason: "Cliente menciona reacción alérgica", notify: true },
    { keyword: "alergia", reason: "Cliente menciona reacción alérgica", notify: true },
    { keyword: "hinchó", reason: "Cliente reporta inflamación anormal", notify: true },
    { keyword: "humano", reason: "Cliente pide explícitamente hablar con un humano", notify: true },
    { keyword: "elkin", reason: "Cliente pide hablar con Elkin específicamente", notify: true },
    { keyword: "insatisfecho", reason: "Cliente se muestra molesto o insatisfecho", notify: true },
    { keyword: "molesto", reason: "Cliente se muestra molesto o insatisfecho", notify: true },
    { keyword: "reclamo", reason: "Cliente presenta un reclamo", notify: true },
    { keyword: "queja", reason: "Cliente presenta una queja sobre el servicio", notify: true },
    { keyword: "descuento", reason: "Cliente pide descuento o promoción no listada", notify: true },
    { keyword: "canje", reason: "Cliente solicita canje o propuesta comercial", notify: true },
    { keyword: "publicidad", reason: "Cliente solicita canje o propuesta comercial", notify: true },
    { keyword: "negocio", reason: "Cliente desea realizar algún negocio", notify: true },
    { keyword: "técnico", reason: "Pregunta muy técnica o médica fuera del catálogo", notify: true },
    { keyword: "médico", reason: "Pregunta muy técnica o médica fuera del catálogo", notify: true },
    { keyword: "níto", reason: "Cliente solicita NIT o documentación interna", notify: true },
    { keyword: "garantía", reason: "Cliente solicita garantías o reembolso", notify: true },
    { keyword: "reembolso", reason: "Cliente solicita garantías o reembolso", notify: true },
    { keyword: "cancelar", reason: "Cliente desea cancelar su cita", notify: true },
  ],
  // Lo que el agente NUNCA debe decir o hacer (§7.1)
  no_decir: [
    "dar diagnósticos médicos",
    "confirmar citas sin validación humana (el humano confirma tras recibir comprobante)",
    "recomendarle al cliente qué es lo mejor para él",
    "confirmar que algo sí o sí le va a ayudar al paciente",
    "dar precios finales de algo ambiguo (si los precios varían mucho)",
    "mencionar a la competencia",
    "promesas de resultados",
    "presupuestos sin valoración previa",
    "precios que no estén en el catálogo",
  ],
  // Frases características (§8)
  frases_caracteristicas: ["Con gusto te ayudo", "¿Tienes alguna duda?", "¿Cómo te puedo ayudar el día de hoy?"],
  // Contacto de escalation (§7.3)
  escalate_to: {
    nombre: "Elkin Acevedo",
    whatsapp: "+57 318 735 4841",
    email: "esteticasantamariabga@gmail.com",
  },
};