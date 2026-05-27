import { getFirebaseAdmin, writeAuditLog } from "@pollaris/db";

const { adminAuth, adminDb } = getFirebaseAdmin();

export { adminAuth, adminDb, writeAuditLog };
export { admin } from "@pollaris/db";