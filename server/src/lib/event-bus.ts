import { EventEmitter } from "node:events";

export interface MessageEvent {
  tenantId: string;
  conversationId: string;
  message: {
    id: string;
    direction: "inbound" | "outbound";
    senderType: "contact" | "bot" | "human";
    text: string | null;
    createdAt: string;
  };
}

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export const eventBus = {
  onMessage(tenantSlug: string, listener: (event: MessageEvent) => void) {
    emitter.on(`message:${tenantSlug}`, listener);
    return () => emitter.off(`message:${tenantSlug}`, listener);
  },
  emit(tenantSlug: string, event: MessageEvent) {
    emitter.emit(`message:${tenantSlug}`, event);
  },
};
