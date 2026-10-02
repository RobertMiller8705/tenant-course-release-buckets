import assert from "node:assert/strict";
import { releaseRequest } from "../src/tenant-release.js";

const parsed = releaseRequest.parse({ tenantId: "school-7", courseId: "algebra", buildId: "b-9" });
assert.deepEqual(parsed.diagnostics, []);
assert.throws(() => releaseRequest.parse({ tenantId: "", courseId: "algebra", buildId: "b-9" }));
console.log("release boundary test passed: valid input defaults diagnostics and rejects an empty tenant");
