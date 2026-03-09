import { ChatOllama } from '@langchain/ollama';
import { z } from 'zod';
import { env } from '../env.mts';
import { logger } from '../config/logger.mts';

const model = new ChatOllama({
  model: env.OLLAMA_MODEL,
  baseUrl: env.OLLAMA_BASE_URL,
  temperature: 0.1,
});

const VideoAssessmentSchema = z.object({
  isEnglish: z.boolean(),
  relevanceScore: z.number().min(0).max(10),
  summary: z.string(),
  reason: z.string(),
  tags: z.array(z.string()).max(8),
});

export type VideoAssessmentResult = z.infer<typeof VideoAssessmentSchema>;

const scorer = model.withStructuredOutput(VideoAssessmentSchema);

export interface AssessVideoInput {
  /** Combined context: "{topicName} — {queryText}" — single variable representing the full search intent. */
  readonly searchContext: string;
  readonly title: string;
  readonly description: string;
  readonly channelTitle?: string;
}

export async function assessVideo(input: AssessVideoInput): Promise<VideoAssessmentResult> {
  logger.info(
    { model: env.OLLAMA_MODEL, searchContext: input.searchContext, title: input.title, channel: input.channelTitle },
    'LLM assess start',
  );

  const t0 = Date.now();
  const result = await scorer.invoke(
    `You are ranking YouTube videos for a user's personalized daily digest.

REQUIREMENT: ENGLISH ONLY. Set isEnglish=false and relevanceScore=0 for any video whose title or description is not primarily written in English. This is a hard requirement — non-English videos must be rejected regardless of content quality.

Search context: ${input.searchContext}
Title: ${input.title}
Channel: ${input.channelTitle ?? 'Unknown'}
Description: ${input.description}

Score for whether this video is likely useful to someone who wants practical, technical, current content.
Prefer:
- tutorials
- implementation guidance
- architecture
- demos
- explanations of agent loops, LangGraph, or model training

Avoid:
- vague hype
- spam
- unrelated business news
- generic AI clickbait
- non-English videos (isEnglish must be false if title/description are not primarily English)

Return structured output only.`,
  );

  const assessment = result as VideoAssessmentResult;
  const ms = Date.now() - t0;

  logger.info(
    {
      title: input.title,
      score: assessment.relevanceScore,
      tags: assessment.tags,
      reason: assessment.reason,
      summary: assessment.summary,
      ms,
    },
    'LLM assess done',
  );

  return assessment;
}
