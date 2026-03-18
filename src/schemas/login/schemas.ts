import { z } from "zod";
import { Email } from "../../types/types";
import { SRPEphemeral, SRPProof } from "../../types/srp/types";

export const LoginStartSchema = z.object({ email: Email })
export type LoginStartInput = z.infer<typeof LoginStartSchema>;

export const LoginSchema = z.object({ email: Email, srpProof: SRPProof, srpEphemeral: SRPEphemeral })
export type LoginInput = z.infer<typeof LoginSchema>;