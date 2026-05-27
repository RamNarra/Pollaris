export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  environment: "local" | "preview" | "production";
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  
  // Determine environment
  let environment: "local" | "preview" | "production" = "local";
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    environment = "production";
  } else if (process.env.VERCEL_ENV === "preview") {
    environment = "preview";
  }

  const requiredVariables = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "GEMINI_API_KEY"
  ];

  for (const variable of requiredVariables) {
    const val = process.env[variable];
    if (!val || val.trim() === "") {
      errors.push(`Missing required environment variable: ${variable}`);
    }
  }

  // Production-specific hardening checks
  if (environment === "production") {
    const pKey = process.env.FIREBASE_PRIVATE_KEY || "";
    if (!pKey.includes("BEGIN PRIVATE KEY")) {
      errors.push("Production FIREBASE_PRIVATE_KEY must be a valid PEM key.");
    }
    
    const projectId = process.env.FIREBASE_PROJECT_ID || "";
    if (projectId.includes("dev") || projectId.includes("staging")) {
      console.warn(`[WARNING]: Production environment is utilizing a project ID containing dev/staging substring: "${projectId}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    environment
  };
}
