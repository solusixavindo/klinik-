// lib/satusehat.ts

export type SatuSehatEnv = "development" | "staging" | "production"

export const SATUSEHAT_BASE_URL: Record<SatuSehatEnv, string> = {
  development: "https://api-satusehat-dev.dto.kemkes.go.id",
  staging: "https://api-satusehat-stg.dto.kemkes.go.id",
  production: "https://api-satusehat.kemkes.go.id",
}

export async function getSatuSehatToken(
  clientId: string,
  clientSecret: string,
  env: SatuSehatEnv = "development"
): Promise<string | null> {
  try {
    const res = await fetch(
      `${SATUSEHAT_BASE_URL[env]}/oauth2/v1/accesstoken?grant_type=client_credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
      }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { access_token?: string }
    return data.access_token ?? null
  } catch {
    return null
  }
}

export function buildEncounterPayload(params: {
  orgId: string
  patientIhs: string
  practitionerIhs: string
  locationId: string
  visitDate: string
  diagnosis?: string
}) {
  return {
    resourceType: "Encounter",
    status: "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    subject: { reference: `Patient/${params.patientIhs}` },
    participant: [{ individual: { reference: `Practitioner/${params.practitionerIhs}` } }],
    period: {
      start: `${params.visitDate}T08:00:00+07:00`,
      end: `${params.visitDate}T08:30:00+07:00`,
    },
    location: [{ location: { reference: `Location/${params.locationId}` } }],
    serviceProvider: { reference: `Organization/${params.orgId}` },
  }
}
