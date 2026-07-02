import { CatalogItem, formatPrice, IMAGE_MANIFEST } from "./catalog";

type Market = "COP" | "MXN" | "USD" | "EUR";

const CITY_TO_MARKET: Record<string, Market> = {
  "medellín": "COP",
  medellin: "COP",
  "bogotá": "COP",
  bogota: "COP",
  cali: "COP",
  bucaramanga: "COP",
  barranquilla: "COP",
  cdmx: "MXN",
  "ciudad de méxico": "MXN",
  "méxico": "MXN",
  mexico: "MXN",
  miami: "USD",
  "madrid": "EUR",
  barcelona: "EUR",
  europa: "EUR",
  berlin: "EUR",
  paris: "EUR",
  london: "EUR",
  "londres": "EUR",
};

export function resolveMarket(city: string): Market {
  const key = city.toLowerCase().trim();
  return CITY_TO_MARKET[key] || "COP";
}

// Filtra las imágenes de un servicio para que el cliente solo reciba las de SU
// mercado (ej. Bogotá → COP), no las 4 monedas juntas. Si ninguna imagen tiene
// el mercado exacto, cae a las genéricas (sin mercado definido); si tampoco hay
// genéricas, devuelve todas antes que no mandar nada.
export function filterImagesByMarket(imageKeys: string[], city: string | undefined): string[] {
  if (!city) return imageKeys;
  const market = resolveMarket(city);
  const matched = imageKeys.filter((key) => IMAGE_MANIFEST[key]?.market === market);
  if (matched.length > 0) return matched;
  const generic = imageKeys.filter((key) => !IMAGE_MANIFEST[key]?.market);
  return generic.length > 0 ? generic : imageKeys;
}

export interface ResolvedPrice {
  price: string;
  currency: Market;
  promoPrice?: string;
  promoLabel?: string;
  formattedPrice: string;
  formattedPromo?: string;
  // A6.6 — true cuando el mercado solicitado no tiene precio confirmado
  requiresHumanConfirmation?: boolean;
  unconfirmedMarkets?: Market[];
}

export function resolveServicePrice(
  service: CatalogItem,
  city: string
): ResolvedPrice {
  const market = resolveMarket(city);

  if (service.prices?.[market]) {
    const mp = service.prices[market]!;
    const formattedPrice = formatPrice(mp.price, market);
    const formattedPromo = mp.promoPrice
      ? formatPrice(mp.promoPrice, market)
      : undefined;
    return {
      price: mp.price,
      currency: market,
      promoPrice: mp.promoPrice,
      promoLabel: mp.promoLabel,
      formattedPrice,
      formattedPromo,
    };
  }

  // A6.6 — if market is missing AND service requires human confirmation for it,
  // return unconfirmed flag instead of alucinating COP fallback.
  const rc = (service as any).requiresHumanConfirmation as Market[] | undefined;
  if (rc?.includes(market)) {
    return {
      price: "",
      currency: market,
      formattedPrice: "",
      requiresHumanConfirmation: true,
      unconfirmedMarkets: rc.filter((m) => !service.prices?.[m]),
    };
  }

  // If requested market not available, try COP as fallback
  if (service.prices?.COP) {
    const cop = service.prices.COP!;
    return {
      price: cop.price,
      currency: "COP",
      promoPrice: cop.promoPrice,
      promoLabel: cop.promoLabel,
      formattedPrice: formatPrice(cop.price, "COP"),
      formattedPromo: cop.promoPrice
        ? formatPrice(cop.promoPrice, "COP")
        : undefined,
    };
  }

  // Final fallback: use service's default price/currency
  return {
    price: service.price,
    currency: service.currency as Market,
    formattedPrice: formatPrice(service.price, service.currency),
  };
}

export function getMarketForCity(city: string): Market {
  return resolveMarket(city);
}

export function cityBelongsToMarket(
  city: string,
  market: Market
): boolean {
  return resolveMarket(city) === market;
}
