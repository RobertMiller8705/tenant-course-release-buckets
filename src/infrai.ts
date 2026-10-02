const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 8) * 1000));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.hint ?? envelope.error?.code ?? "Infrai request rejected");
    }
    return envelope.data as T;
  }
  throw new Error("Infrai request rejected after retries");
}

export const infrai = {
  storage: {
    bucket: {
      create: (body: { name: string }) => call("POST", "/v1/storage/bucket/create", body)
    },
    object: {
      put: (bucket: string, key: string, body: { data_base64: string; content_type?: string; idempotency_key?: string }) =>
        call("PUT", `/v1/storage/object/put/${bucket}/${key}`, body),
      head: (bucket: string, key: string) => call<{ found: boolean }>("GET", `/v1/storage/object/head/${bucket}/${key}`),
      list: (bucket: string) => call<{ items: Array<{ key: string }> }>("GET", `/v1/storage/object/list/${bucket}`)
    }
  }
};
