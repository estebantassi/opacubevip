import z from "zod";

export const SRPSalt = z
    .string()
    .length(64);

export const SRPVerifier = z
    .string()
    .length(512);

export const SRPProof = z
    .string()
    .length(64)

export const SRPEphemeral = z
    .string()
    .length(512);