import { CatalogItem, formatPrice } from "./catalog";

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
};

export function resolveMarket(city: string): Market {
  const key = city.toLowerCase().trim();
  return CITY_TO_MARKET[key] || "COP";
}

export interface ResolvedPrice {
  price: string;
  currency: Market;
  promoPrice?: string;
  promoLabel?: string;
  formattedPrice: string;
  formattedPromo?: string;
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
