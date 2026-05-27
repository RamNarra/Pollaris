import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Initialize Firebase for Client
// Use dummy strings if environment variables are missing during CI build phase
const isClient = typeof window !== "undefined";
const dynamicAuthDomain = isClient
  ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? firebaseConfig.authDomain
      : window.location.hostname)
  : firebaseConfig.authDomain;

const sanitizedConfig = {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey || "mock-key",
  projectId: firebaseConfig.projectId || "mock-project",
  authDomain: dynamicAuthDomain || firebaseConfig.authDomain,
};

const app = getApps().length > 0 ? getApp() : initializeApp(sanitizedConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };