import fs from 'fs';
import path from 'path';

type StaticGoogleReviewSummary = {
  lastUpdated?: string;
  total?: number;
  rating?: number;
  reviews?: unknown[];
};

export function readStaticGoogleReviewsData(): StaticGoogleReviewSummary {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'google-reviews.json');
    const content = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content) as StaticGoogleReviewSummary;
  } catch {
    return {};
  }
}
