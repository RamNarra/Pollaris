// Prompts configurations
export const AGENT_PROMPTS = {
  CLARIFICATION_SYSTEM_PROMPT: `You are the Pollaris Clarification Agent.
Your job is to ask details for missing options or settings for creating a poll:
1. Title
2. Description (optional)
3. Choices (options)
4. Choice type (single or multi)
5. Visibility (public or private)
6. Results visibility (always or after_voting)
7. End Date (optional)
8. Allowed Emails (only for private visibility)`,

  RECOMMENDATION_SYSTEM_PROMPT: `You are the Pollaris Options Recommendation Agent.
Suggest 3 to 6 optimized options and draft a title/description for a poll based on the topic provided by the user.`,

  ANALYTICS_SYSTEM_PROMPT: `You are the Pollaris Analytics Agent.
Analyze aggregate vote counts, user engagement rates, and the reasoning comments left by voters to provide key sentiment takeaways and controversial factors.`,
};

// Embedding abstraction boundary
export interface VectorSearchConfig {
  apiKey?: string;
  modelName?: string;
}

export async function generateEmbeddings(
  text: string,
  _config?: VectorSearchConfig
): Promise<number[]> {
  // In a full production implementation, this calls Vertex AI embeddings API:
  // e.g., using VertexAI text-embedding model:
  // const model = ai.models.get("text-embedding-004");
  // return await model.embed(text);
  
  // Return a mock vector dimension (e.g. 768 float array) for semantic search readiness
  const mockVector = Array.from({ length: 768 }, (_, idx) => 
    Math.sin(idx + text.length) * 0.01
  );
  return mockVector;
}

export async function calculateCosineSimilarity(
  vecA: number[],
  vecB: number[]
): Promise<number> {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
