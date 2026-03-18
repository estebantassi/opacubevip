declare module "secure-remote-password/client" {
  export type SRPEphemeral = {
    public: string;
    secret: string;
  };

  export type SRPSession = {
    key: string;
    proof: string;
  };

  export function generateSalt(): string;

  export function generateEphemeral(): SRPEphemeral;

  export function derivePrivateKey(
    salt: string,
    username: string,
    password: string
  ): string;

  export function deriveVerifier(
    privateKey: string
  ): string;

  export function deriveSession(
    secret: string,
    serverPublic: string,
    salt: string,
    username: string,
    privateKey: string
  ): SRPSession;

  export function verifySession(
    clientPublic: string,
    clientSession: SRPSession,
    serverProof: string
  ): void;
}