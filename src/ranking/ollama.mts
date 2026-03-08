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
  relevanceScore: z.number().min(0).max(10),
  summary: z.string(),
  reason: z.string(),
  tags: z.array(z.string()).max(8),
});

export type VideoAssessmentResult = z.infer<typeof VideoAssessmentSchema>;

const scorer = model.withStructuredOutput(VideoAssessmentSchema);

export interface AssessVideoInput {
  readonly topicName: string;
  readonly queryText: string;
  readonly title: string;
  readonly description: string;
  readonly channelTitle?: string;
}

export async function assessVideo(input: AssessVideoInput): Promise<VideoAssessmentResult> {
  logger.info(
    { model: env.OLLAMA_MODEL, title: input.title, channel: input.channelTitle },
    'LLM assess start',
  );

  const t0 = Date.now();
  const result = await scorer.invoke(
    `You are ranking YouTube videos for a user's personalized daily digest.

Topic: ${input.topicName}
Query matched: ${input.queryText}
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
