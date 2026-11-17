import assert from "node:assert/strict";
import { chooseFollowUp, intakeSchema } from "./resend_decision.ts";

const matter = intakeSchema.parse({
  matterId: "matter-test",
  recipient: "+14155550104",
  verificationId: "verification-test",
  deadline: "2026-01-01T12:00:00.000Z",
  signedDocumentId: "signed-doc-test",
});

assert.equal(chooseFollowUp(matter, new Date("2026-01-01T12:01:00.000Z"), "pending"), "resend");
assert.equal(chooseFollowUp(matter, new Date("2026-01-01T12:01:00.000Z"), "delivered"), "wait");
console.log("resend decision test passed");
