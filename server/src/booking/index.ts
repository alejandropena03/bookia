import { BookingProvider } from "./types.js";
import { MockBookingProvider } from "./mock.js";
import { HandoffBookingProvider } from "./handoff.js";

const providers = new Map<string, BookingProvider>();

export function getBookingProvider(mode: string): BookingProvider {
  const key = mode || "mock";
  if (providers.has(key)) return providers.get(key)!;

  let provider: BookingProvider;
  switch (key) {
    case "handoff":
      provider = new HandoffBookingProvider();
      break;
    case "mock":
    default:
      provider = new MockBookingProvider();
      break;
  }

  providers.set(key, provider);
  return provider;
}

export function resetBookingProviders(): void {
  providers.clear();
}
