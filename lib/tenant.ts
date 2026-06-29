let tenantSlug = "santa-maria"
let businessName = "Estética Santa María"

export function setTenant(slug: string, name: string) {
  tenantSlug = slug
  businessName = name
}

export function getTenantSlug(): string {
  return tenantSlug
}

export function getBusinessName(): string {
  return businessName
}
