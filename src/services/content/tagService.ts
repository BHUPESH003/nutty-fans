import { TagRepository } from '@/repositories/tagRepository';

function normalizeTag(raw: string): { slug: string; name: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const noHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const lower = noHash.trim().toLowerCase();
  if (!lower) return null;

  // allow letters, numbers, underscore, dash. Convert spaces to dash.
  const slug = lower
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');

  if (!slug) return null;
  if (slug.length > 100) return null;

  // Store a display name that's a bit nicer than the slug (still safe)
  const name = slug;
  return { slug, name };
}

export class TagService {
  constructor(private readonly tagRepo = new TagRepository()) {}

  normalizeMany(rawTags: string[] | undefined | null) {
    const out: Array<{ slug: string; name: string }> = [];
    for (const t of rawTags ?? []) {
      const norm = normalizeTag(t);
      if (norm) out.push(norm);
    }
    // Unique by slug
    const uniq = new Map<string, { slug: string; name: string }>();
    for (const t of out) uniq.set(t.slug, t);
    return Array.from(uniq.values()).slice(0, 10); // hard cap
  }

  async setPostTags(postId: string, rawTags: string[] | undefined | null) {
    const tags = this.normalizeMany(rawTags);
    const createdOrExisting = await this.tagRepo.upsertMany(tags);
    const tagIds = createdOrExisting.map((t) => t.id);
    await this.tagRepo.setTagsForPost(postId, tagIds);
  }

  async search(query: string, limit?: number) {
    return this.tagRepo.search(query, limit ?? 20);
  }

  async trending(limit?: number) {
    return this.tagRepo.trending(limit ?? 20);
  }
}
