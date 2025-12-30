import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let jwksCache: {
  jwks: ReturnType<typeof createRemoteJWKSet>;
  expires: number;
} | null = null;

function getJWKS() {
  if (!jwksCache || Date.now() > jwksCache.expires) {
    jwksCache = {
      jwks: createRemoteJWKSet(new URL(FIREBASE_JWKS_URL)),
      expires: Date.now() + 3600000,
    };
  }
  return jwksCache.jwks;
}

type FirebaseTokenPayload = JWTPayload & {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  firebase?: {
    sign_in_provider: string;
  };
  [key: string]: unknown;
};

const STANDARD_JWT_FIELDS = new Set([
  "iss",
  "sub",
  "aud",
  "exp",
  "iat",
  "nbf",
  "jti",
  "email",
  "name",
  "picture",
  "email_verified",
  "firebase",
  "auth_time",
  "user_id",
  "nonce",
]);

function extractCustomClaims(
  payload: FirebaseTokenPayload
): Record<string, unknown> {
  const claims: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!STANDARD_JWT_FIELDS.has(key)) {
      claims[key] = value;
    }
  }
  return claims;
}

export type FirebaseUser = {
  uid: string;
  email: string;
  name: string | undefined;
  picture: string | undefined;
  emailVerified: boolean;
  signInProvider: string | undefined;
  customClaims: Record<string, unknown>;
};

export async function verifyFirebaseToken(
  token: string,
  projectId: string
): Promise<FirebaseUser> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const firebasePayload = payload as FirebaseTokenPayload;

  if (!firebasePayload.sub || !firebasePayload.email) {
    throw new Error("Invalid Firebase token: missing uid or email");
  }

  return {
    uid: firebasePayload.sub,
    email: firebasePayload.email,
    name: firebasePayload.name,
    picture: firebasePayload.picture,
    emailVerified: firebasePayload.email_verified ?? false,
    signInProvider: firebasePayload.firebase?.sign_in_provider,
    customClaims: extractCustomClaims(firebasePayload),
  };
}
