import { z } from "zod";

export const intakeSchema = z.object({
  matterId: z.string().min(1),
  recipient: z.string().regex(/^\+[1-9]\d{7,14}$/),
  verificationId: z.string().min(1),
  deadline: z.string().datetime(),
  signedDocumentId: z.string().min(1),
});

export type MatterIntake = z.infer<typeof intakeSchema>;

export type FollowUp = "resend" | "wait";

export function chooseFollowUp(input: MatterIntake, now: Date, deliveryStatus: string): FollowUp {
  const deadline = new Date(input.deadline);
  if (deliveryStatus === "delivered") return "wait";
  return now >= deadline ? "resend" : "wait";
}
