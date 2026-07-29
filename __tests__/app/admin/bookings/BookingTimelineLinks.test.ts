import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/bookings/[id]/page.tsx'), 'utf8');

describe('/admin/bookings/[id] timeline links', () => {
  it('renders canonical timeline descriptions and CTAs visibly', () => {
    expect(source).toContain('function BookingTimelineLink');
    expect(source).toContain('{description && <p className="m-0 mt-1 line-clamp-2');
    expect(source).toContain('{entry.link && <BookingTimelineLink link={entry.link} />}');
    expect(source).not.toContain('{description && <p className="hidden">{description}</p>}');
    expect(source).not.toContain('className="hidden">{entry.link.label}</Link>');
  });

  it('opens document-like timeline links in a new tab safely', () => {
    expect(source).toContain("return /^https?:\\/\\//i.test(href) || href.startsWith('/api/');");
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
  });
});
