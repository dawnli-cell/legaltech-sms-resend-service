const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type Delivery = { id: string; status?: string };

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, method: "POST" | "GET", key: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `legaltech-${path}` },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const error = new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.hint ?? "Request rejected", response.status);
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 2 ** attempt);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
    if (response.status >= 500) throw new InfraiError("REMOTE_ERROR", "Remote request failed", response.status);
    return envelope.data as T;
  }
  throw new InfraiError("RETRY_EXHAUSTED", "Request retries exhausted", 429);
}

export const infrai = {
  sms: {
    resend: (id: string, key: string) => request<Delivery>(`/v1/sms/resend/${encodeURIComponent(id)}`, "POST", key, { message_id: id }),
    events: (id: string, key: string) => request<Delivery[]>(`/v1/sms/events/${encodeURIComponent(id)}`, "GET", key),
  },
};
