import { publishRelease } from "./tenant-release.js";

const request = {
  tenantId: process.env.TENANT_ID ?? "academy-42",
  courseId: process.env.COURSE_ID ?? "typescript-foundations",
  buildId: process.env.BUILD_ID ?? "build-001",
  diagnostics: ["asset manifest checked", "lesson links checked"]
};

const result = await publishRelease(request);
console.log(JSON.stringify({ release: result }, null, 2));
