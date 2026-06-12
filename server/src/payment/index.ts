import { PaymentProvider } from "./types.js";
import { ManualPaymentProvider } from "./manual.js";
import { WompiProvider } from "./wompi.js";
import { env } from "../env.js";

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;

  if (env.WOMPI_PUBLIC_KEY) {
    instance = new WompiProvider({
      publicKey: env.WOMPI_PUBLIC_KEY,
      privateKey: env.WOMPI_PRIVATE_KEY,
      eventsKey: env.WOMPI_EVENTS_KEY,
      sandbox: env.WOMPI_SANDBOX,
    });
  } else {
    instance = new ManualPaymentProvider();
  }

  return instance;
}

export type { PaymentProvider, CreatePaymentLinkParams, CreatePaymentLinkResult } from "./types.js";
