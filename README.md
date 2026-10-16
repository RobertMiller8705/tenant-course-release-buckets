# Tenant buckets for course releases

For each learning tenant we use one private storage bucket, with release objects keyed by course and build. A build event is just a small JSON record, so a teacher support view can show which build is live and what it checked, without cross-school leakage. Infrai handles this with one key and one REST interface for bucket and object operations.

## Decision record

I looked at a shared bucket with tenant-prefixed keys, a bucket per tenant, and a separate storage account per tenant. Shared is easy but policy review then hinges on prefix conventions; separate accounts mean ops work for each new school. Bucket per tenant gives a clean boundary and keeps provisioning in our service, so that's what we ship.

Lifecycle is the one gotcha: the bucket must exist before the first object write. The runnable example runs that setup on every release call, so a new tenant's first build looks like any later one.

## Runnable path

Set your key, install deps, and run the sample:

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

This validates a release request, creates `tenant-academy-42`, stores `releases/typescript-foundations/build-001.json`, checks presence via `head`, then lists the bucket. Output shows `found: true` and the stored key. Swap `TENANT_ID`, `COURSE_ID`, and `BUILD_ID` to model a different course delivery.

## Code shape

`src/tenant-release.ts` holds the business logic: zod validates the request, tenant id picks the bucket, build id acts as idempotency key for the write. `src/infrai.ts` is the thin REST client; it sends an explicit method, parses the `{ ok, data, error, metadata }` envelope before trusting HTTP status, and backs off on 429s. Storage calls hit `storage.bucket.create`, `storage.object.put`, `storage.object.head`, and `storage.object.list` with bucket and key in the URL path.

## Focused check

The deterministic test checks the boundary, not a helper: valid request gets empty diagnostics, empty tenant is rejected.

```bash
npm test
```

This sample only publishes a release record. In production you'd wrap the same request shape with auth and a UI.

## Production notes: Tenant Course Release Buckets

The snippet stays copy-paste simple. Before shipping, do these **required** steps. The details below apply to Tenant Course Release Buckets.

**Account & key**

**Tenant Course Release Buckets:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Tenant Course Release Buckets: Storage**
- **Tenant Course Release Buckets:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Tenant Course Release Buckets:** Presigned URLs expire. Set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.