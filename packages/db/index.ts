import * as admin from "firebase-admin";
import { validateEnvironment } from "@pollaris/config";

export const COLLECTIONS = {
  USERS: "users",
  POLLS: "polls",
  VOTES: "votes",
  INVITES: "invites",
  SHARE_TOKENS: "shareTokens",
  CONVERSATIONS: "conversations",
  AUDIT_LOGS: "auditLogs",
} as const;

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    // Run environment validation
    const envResult = validateEnvironment();
    if (!envResult.valid) {
      console.warn(
        `[Environment Validation Warning]: Missing configurations in environment: ${envResult.environment}.\nErrors:\n${envResult.errors.join(
          "\n"
        )}`
      );
    } else {
      console.log(`[Environment Validation Success]: Running in ${envResult.environment} mode.`);
    }

    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey && clientEmail && projectId) {
        let formattedKey = privateKey.trim();
        if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
          formattedKey = formattedKey.slice(1, -1);
        }
        formattedKey = formattedKey.replace(/\\h/g, "\\nh");
        formattedKey = formattedKey.replace(/\\n/g, "\n");

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formattedKey,
          }),
        });
      } else {
        // Fallback to default or demo environment (e.g. during build/Docker)
        admin.initializeApp({ projectId: projectId || "demo-project" });
      }
    } catch (error: any) {
      console.error("Firebase Admin Initialization Error", error.stack);
    }
  }

  return {
    adminAuth: admin.auth(),
    adminDb: admin.firestore(),
  };
}

export async function writeAuditLog(
  actorId: string,
  action: string,
  targetId: string,
  metadata?: Record<string, any>
) {
  try {
    const { adminDb } = getFirebaseAdmin();
    const logRef = adminDb.collection(COLLECTIONS.AUDIT_LOGS).doc();
    await logRef.set({
      actorId,
      action,
      targetId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export { admin };
