import { renderTemplate } from "../flows/template.js";

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

export function evaluateFlow(definition: FlowDefinition, context: FlowContext, input: string): FlowResult {
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
    if (farewell) {
      const templateContext = {
        ...newSlots,
        nombre: newSlots.nombre || "",
        city: newSlots.city || newSlots.ciudad || "",
        service_name: newSlots.service_name || newSlots.service || "",
        service_price: newSlots.service_price || "",
        datetime: newSlots.datetime || "",
        client_name: newSlots.client_name || newSlots.clientData || "",
      };
      return {
        response: renderTemplate(farewell.prompt, templateContext),
        context: { ...context, currentState: next ?? "farewell", slots: newSlots },
        completed: true,
      };
    }
    return {
      response: renderTemplate(state.prompt, newSlots),
      context: { ...context, currentState: state.next ?? "farewell", slots: newSlots },
      completed: true,
    };
  }

  const nextState = definition.states[next];
  const templateContext = {
    ...newSlots,
    nombre: newSlots.nombre || "",
    city: newSlots.city || newSlots.ciudad || "",
    service_name: newSlots.service_name || newSlots.service || "",
    service_price: newSlots.service_price || "",
    datetime: newSlots.datetime || "",
    client_name: newSlots.client_name || "",
  };

  const response = nextState ? renderTemplate(nextState.prompt, templateContext) : state.prompt;

  return {
    response,
    context: { ...context, currentState: next, slots: newSlots },
    completed: false,
  };
}

export function startFlow(definition: FlowDefinition, contactName?: string): FlowResult {
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

  const response = renderTemplate(initial.prompt, context.slots);
  return {
    response,
    context,
    completed: false,
  };
}
