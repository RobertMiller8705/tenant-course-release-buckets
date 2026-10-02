import { z } from "zod";
import { infrai } from "./infrai.js";

export const releaseRequest = z.object({
  tenantId: z.string().min(1),
  courseId: z.string().min(1),
  buildId: z.string().min(1),
  diagnostics: z.array(z.string()).default([])
});
export type ReleaseRequest = z.infer<typeof releaseRequest>;

const bucketFor = (tenantId: string) => `tenant-${tenantId}`;
const objectFor = (input: ReleaseRequest) => `releases/${input.courseId}/${input.buildId}.json`;

export async function publishRelease(raw: unknown) {
  const input = releaseRequest.parse(raw);
  const bucket = bucketFor(input.tenantId);
  await infrai.storage.bucket.create({ name: bucket });
  const key = objectFor(input);
  const document = JSON.stringify({ tenant_id: input.tenantId, course_id: input.courseId, build_id: input.buildId, diagnostics: input.diagnostics });
  await infrai.storage.object.put(bucket, key, {
    data_base64: Buffer.from(document).toString("base64"),
    content_type: "application/json",
    idempotency_key: input.buildId
  });
  const head = await infrai.storage.object.head(bucket, key);
  const listing = await infrai.storage.object.list(bucket);
  return { bucket, key, found: head.found, storedObjects: listing.items.map((item) => item.key), diagnostics: input.diagnostics };
}
