export interface RuleInput {
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly queryText: string;
  readonly channelPreference: number;
  readonly keywordPreference: number;
}

export function scoreByRules(input: RuleInput): number {
  let score = 0;

  const title = input.title.toLowerCase();
  const desc = input.description.toLowerCase();
  const query = input.queryText.toLowerCase();

  if (title.includes(query)) score += 3;
  if (desc.includes(query)) score += 2;
  if (title.includes('langgraph')) score += 1.5;
  if (title.includes('agent')) score += 1.0;
  if (title.includes('tutorial')) score += 0.8;
  if (title.includes('beginner')) score += 0.6;
  if (title.includes('news')) score += 0.4;

  const hoursOld = (Date.now() - new Date(input.publishedAt).getTime()) / 36e5;
  if (hoursOld < 24) score += 2;
  else if (hoursOld < 72) score += 1;
  else if (hoursOld < 168) score += 0.3;

  score += input.channelPreference * 1.5;
  score += input.keywordPreference * 1.2;

  return score;
}
