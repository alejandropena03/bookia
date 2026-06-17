import { renderTemplate } from "./template.js";

export interface FlowDefinition {
  initial: string;
  states: Record<string, FlowState>;
}

export interface FlowState {
  prompt: string;
  collects: string | null;
  next?: string | null;
  transitions?: Record<string, string>;
  description?: string;
}

export interface FlowContext {
  flowKey: string;
  currentState: string;
  slots: Record<string, string>;
}

export interface FlowResult {
  response: string;
  context: FlowContext;
  completed: boolean;
}

export interface CatalogItem {
  name: string;
  price: string;
  currency: string;
}

function normalizeText(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—\-_\/,.;!¡¿?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const LEADING_WORDS = ["quiero", "me gustaria", "quisiera", "necesito", "el", "la", "un", "una", "los", "las", "de"];

function stripLeadingWords(t: string): string {
  let result = t;
  for (const w of LEADING_WORDS) {
    if (result.startsWith(w + " ")) {
      result = result.slice(w.length + 1);
    }
  }
  return result;
}

function buildTemplateContext(slots: Record<string, string>, catalogItems?: CatalogItem[]): Record<string, string> {
  const catalog = catalogItems ?? [];
  const rawName = slots.service || slots.service_name || "";
  const cleanName = stripLeadingWords(normalizeText(rawName));

  const selected = catalog.find((c) => {
    const cn = normalizeText(c.name);
    return cleanName.includes(cn) || cn.includes(cleanName);
  });

  // Clean double-article patterns from slot values for nicer rendering
  function cleanSlot(val: string): string {
    const v = val.trim();
    const articles = ["el ", "la ", "un ", "una ", "los ", "las ", "de "];
    for (const a of articles) {
      if (v.toLowerCase().startsWith(a) && v.length > a.length + 2) {
        return v.slice(a.length).trim();
      }
    }
    return v;
  }

  return {
    ...slots,
    nombre: slots.nombre || "",
    city: cleanSlot(slots.city || slots.ciudad || ""),
    service_name: selected?.name ?? cleanSlot(slots.service_name ?? slots.service ?? ""),
    service_price: selected ? `${selected.price} ${selected.currency}` : slots.service_price ?? "",
    datetime: cleanSlot(slots.datetime || ""),
    client_name: slots.client_name || slots.clientData || "",
    catalog_list: catalog.length > 0
      ? catalog.map((c) => `- ${c.name}: ${c.price} ${c.currency}`).join("\n")
      : slots.catalog_list || "(Sin servicios disponibles)",
  };
}

export function getNextState(definition: FlowDefinition, currentState: string, input: string): { next: string | null; completed: boolean } {
  const state = definition.states[currentState];
  if (!state) return { next: null, completed: true };

  if (state.collects && state.transitions) {
    const lower = input.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [key, target] of Object.entries(state.transitions)) {
      if (lower.includes(key)) {
        return { next: target, completed: target === "farewell" || !definition.states[target] };
      }
    }
    return { next: currentState, completed: false };
  }

  const next = state.next ?? null;
  return { next, completed: next === null || next === "farewell" || !definition.states[next] };
}

export function evaluateFlow(
  definition: FlowDefinition,
  context: FlowContext,
  input: string,
  catalogItems?: CatalogItem[]
): FlowResult {
  const state = definition.states[context.currentState];
  if (!state) {
    return {
      response: "Lo siento, no pude procesar tu solicitud. Un agente te atenderá pronto.",
      context,
      completed: true,
    };
  }

  const collects = state.collects;
  const newSlots = { ...context.slots };

  if (collects && input) {
    newSlots[collects] = input;
  }

  const { next, completed } = getNextState(definition, context.currentState, input);

  if (!next || completed) {
    const farewell = definition.states[next ?? "farewell"];
    const targetState = farewell ?? state;
    const templateContext = buildTemplateContext(newSlots, catalogItems);
    return {
      response: renderTemplate(targetState.prompt, templateContext),
      context: { ...context, currentState: next ?? "farewell", slots: newSlots },
      completed: true,
    };
  }

  const nextState = definition.states[next];
  const templateContext = buildTemplateContext(newSlots, catalogItems);
  const response = nextState ? renderTemplate(nextState.prompt, templateContext) : state.prompt;

  return {
    response,
    context: { ...context, currentState: next, slots: newSlots },
    completed: false,
  };
}

export function startFlow(definition: FlowDefinition, contactName?: string, catalogItems?: CatalogItem[]): FlowResult {
  const initial = definition.states[definition.initial];
  if (!initial) {
    return {
      response: "Lo siento, hubo un error al iniciar el flujo.",
      context: { flowKey: "", currentState: "", slots: {} },
      completed: true,
    };
  }

  const context: FlowContext = {
    flowKey: "",
    currentState: definition.initial,
    slots: { nombre: contactName ?? "" },
  };

  const templateContext = buildTemplateContext(context.slots, catalogItems);
  const response = renderTemplate(initial.prompt, templateContext);
  return {
    response,
    context,
    completed: false,
  };
}
