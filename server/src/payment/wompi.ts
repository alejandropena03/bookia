import { PaymentProvider, CreatePaymentLinkParams, CreatePaymentLinkResult } from "./types.js";
import crypto from "crypto";

export class WompiProvider implements PaymentProvider {
  private publicKey: string;
  private privateKey: string;
  private eventsKey: string;
  private sandbox: boolean;

  constructor(config: {
    publicKey: string;
    privateKey: string;
    eventsKey: string;
    sandbox: boolean;
  }) {
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
    this.eventsKey = config.eventsKey;
    this.sandbox = config.sandbox;
  }

  private apiBase(): string {
    return this.sandbox
      ? "https://sandbox.wompi.co/v1"
      : "https://production.wompi.co/v1";
  }

  private checkoutBase(): string {
    return this.sandbox
      ? "https://sandbox.wompi.co/p"
      : "https://checkout.wompi.co/p";
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
    const signature = this.signIntegrity(params.reference, params.amount, params.currency);

    const res = await fetch(`${this.apiBase()}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.privateKey}`,
      },
      body: JSON.stringify({
        amount_in_cents: Math.round(params.amount * 100),
        currency: params.currency === "COP" ? "COP" : "USD",
        reference: params.reference,
        description: params.description.slice(0, 255),
        signature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Wompi API error ${res.status}: ${errText}`);
    }

    const json = await res.json() as {
      data: { id: string };
    };

    return {
      url: `${this.checkoutBase()}/${json.data.id}`,
      transactionId: json.data.id,
      sandbox: this.sandbox,
    };
  }

  signIntegrity(reference: string, amount: number, currency: string): string {
    const raw = `${reference}${Math.round(amount * 100)}${currency}${this.eventsKey}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  verifyWebhookSignature(body: string, headerChecksum: string): boolean {
    // Wompi checksum: SHA256 of concatenated event property values (sorted by key) + events_key
    // Ref: https://docs.wompi.co/docs/en/widget-checkout-web#integridad
    // In sandbox, Wompi may send checksum as SHA256(rawBody + events_key) — we try both
    try {
      const event = JSON.parse(body);
      const data = event?.data ?? {};
      // Standard Wompi: concat sorted top-level data values + events_key
      const props = Object.keys(data).sort().map((k) => String(data[k])).join("");
      const standard = crypto.createHash("sha256").update(props + this.eventsKey).digest("hex");
      if (standard === headerChecksum) return true;
    } catch {}
    // Fallback: raw body concat (sandbox / legacy)
    const fallback = crypto.createHash("sha256").update(body + this.eventsKey).digest("hex");
    return fallback === headerChecksum;
  }
}
