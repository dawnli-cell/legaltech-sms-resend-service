import { infrai } from "./infrai_sms.ts";
import { chooseFollowUp, intakeSchema } from "./resend_decision.ts";

const key = process.env.INFRAI_API_KEY;
const raw = {
  matterId: "matter-104",
  recipient: process.env.DEMO_RECIPIENT ?? "+14155550104",
  verificationId: "verification-104",
  deadline: "2026-01-01T12:00:00.000Z",
  signedDocumentId: "signed-doc-104",
};
const intake = intakeSchema.parse(raw);
const events = await infrai.sms.events(intake.verificationId, key ?? "");
const current = events.at(-1)?.status ?? "pending";
const decision = chooseFollowUp(intake, new Date("2026-01-01T12:01:00.000Z"), current);

if (decision === "resend") {
  if (!key) throw new Error("INFRAI_API_KEY is required for a resend");
  const result = await infrai.sms.resend(intake.verificationId, key);
  console.log({ matterId: intake.matterId, signedDocumentId: intake.signedDocumentId, decision, delivery: result });
} else {
  console.log({ matterId: intake.matterId, signedDocumentId: intake.signedDocumentId, decision, deliveryStatus: current });
}
