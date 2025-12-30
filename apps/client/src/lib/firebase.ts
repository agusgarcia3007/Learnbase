import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
} from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

const firebaseApps = new Map<string, FirebaseApp>();
const firebaseAuths = new Map<string, Auth>();

export function getFirebaseAuth(
  tenantSlug: string,
  config: FirebaseConfig
): Auth {
  if (firebaseAuths.has(tenantSlug)) {
    return firebaseAuths.get(tenantSlug)!;
  }

  const existingApp = getApps().find((app) => app.name === tenantSlug);
  const app = existingApp ?? initializeApp(config, tenantSlug);
  const auth = getAuth(app);

  firebaseApps.set(tenantSlug, app);
  firebaseAuths.set(tenantSlug, auth);

  return auth;
}

export async function signInWithGoogle(auth: Auth): Promise<string> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}

export async function signInWithApple(auth: Auth): Promise<string> {
  const provider = new OAuthProvider("apple.com");
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
