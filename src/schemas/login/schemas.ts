import { z } from "zod";
import { Email, TurnstileToken } from "@mytypes/types";
import { SRPEphemeral, SRPProof } from "@mytypes/srp/types";

export const LoginStartSchema = z.object({ email: Email, turnstileToken: TurnstileToken })
export type LoginStartInput = z.infer<typeof LoginStartSchema>;

export const LoginSchema = z.object({ email: Email, srpProof: SRPProof, srpEphemeral: SRPEphemeral })
export type LoginInput = z.infer<typeof LoginSchema>;