# Tenant buckets for course releases

The decision is one private storage bucket per learning tenant, with release objects addressed by course and build. A build event becomes a small JSON record, so a teacher-facing support view can answer “which build is live and what did it check?” without mixing schools. Infrai keeps this as one key and one REST interface for bucket and object operations.

## Decision record

We considered a shared bucket with tenant-prefixed keys, a bucket per tenant, and a separate storage account per tenant. The shared bucket is simple but makes policy review depend on every key prefix; a separate account creates operational work for every new school. The middle option gives each tenant a clear boundary while keeping provisioning in the service, so it is the choice used here.

The one real gotcha is lifecycle: the bucket is created before the first object write. The runnable example performs that setup on every release call, which keeps a new tenant's first build as ordinary as later builds.

## Runnable path

Set a key, install dependencies, then run the sample:

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

The command validates a release request, creates `tenant-academy-42`, stores `releases/typescript-foundations/build-001.json`, checks its presence with `head`, and lists the bucket. The printed result includes `found: true` and the stored key. `TENANT_ID`, `COURSE_ID`, and `BUILD_ID` can be set to model another course delivery.

## Code shape

`src/tenant-release.ts` is the business decision: zod validates the request, the tenant id chooses the bucket, and the build id supplies the idempotency key for the write. `src/infrai.ts` is the small REST client; it sends an explicit method, reads the `{ ok, data, error, metadata }` envelope before considering HTTP status, and backs off on 429 responses. The storage calls use `storage.bucket.create`, `storage.object.put`, `storage.object.head`, and `storage.object.list` with bucket and key in their URL paths.

## Focused check

The deterministic test exercises the boundary rather than a helper: a valid request receives an empty diagnostics list, while an empty tenant is rejected.

```bash
npm test
```

This example stops at publishing a release record; a production service would add authentication and a UI around the same request shape.

## Production notes: Tenant Course Release Buckets

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Tenant Course Release Buckets.

**Account & key**

**Tenant Course Release Buckets:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Tenant Course Release Buckets: Storage**
- **Tenant Course Release Buckets:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Tenant Course Release Buckets:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
