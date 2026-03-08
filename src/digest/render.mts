interface RatingLinks {
  readonly love: string;
  readonly good: string;
  readonly meh: string;
  readonly bad: string;
}

interface DigestVideo {
  readonly videoId: string;
  readonly title: string;
  readonly channelTitle?: string;
  readonly publishedAt: string;
  readonly url: string;
  readonly summary: string;
  readonly reason: string;
  readonly thumbnailUrl?: string;
  readonly ratingLinks: RatingLinks;
}

export interface DigestInput {
  readonly dateLabel: string;
  readonly topicName: string;
  readonly videos: DigestVideo[];
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderCard(v: DigestVideo): string {
  return `
    <div style="border:1px solid #ddd;border-radius:10px;padding:16px;margin:16px 0;">
      ${v.thumbnailUrl ? `<img src="${escapeHtml(v.thumbnailUrl)}" alt="" style="max-width:100%;border-radius:8px;" />` : ''}
      <h2 style="margin:12px 0 6px 0;font-size:20px;">${escapeHtml(v.title)}</h2>
      <p style="margin:0 0 8px 0;"><strong>Channel:</strong> ${escapeHtml(v.channelTitle ?? 'Unknown')}</p>
      <p style="margin:0 0 8px 0;"><strong>Published:</strong> ${escapeHtml(v.publishedAt)}</p>
      <p style="margin:0 0 8px 0;"><strong>Summary:</strong> ${escapeHtml(v.summary)}</p>
      <p style="margin:0 0 12px 0;"><strong>Why selected:</strong> ${escapeHtml(v.reason)}</p>
      <p><a href="${escapeHtml(v.url)}">Watch video</a></p>
      <p>
        Rate:
        <a href="${escapeHtml(v.ratingLinks.love)}">Love it</a> |
        <a href="${escapeHtml(v.ratingLinks.good)}">Good</a> |
        <a href="${escapeHtml(v.ratingLinks.meh)}">Meh</a> |
        <a href="${escapeHtml(v.ratingLinks.bad)}">Not for me</a>
      </p>
    </div>
  `;
}

export function renderDigest(input: DigestInput): string {
  const cards = input.videos.map(renderCard).join('');

  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;max-width:800px;margin:auto;padding:24px;">
    <h1>${escapeHtml(input.topicName)} daily digest</h1>
    <p>${escapeHtml(input.dateLabel)}</p>
    ${cards}
  </body>
</html>`;
}
