// Транслитерация тегов в адреса страниц: «юнгианский анализ» → yungianskiy-analiz
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
};

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : /[a-z0-9]/.test(ch) ? ch : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export type PostLike = { data: { tags: string[] } };

/** Все теги коллекции с количеством статей, по убыванию. */
export function collectTags(posts: PostLike[]) {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, slug: slugifyTag(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'));
}

/** Теги, для которых имеет смысл отдельная страница (минимум MIN статей). */
export const MIN_POSTS_PER_TAG = 2;

export function tagsWithPages(posts: PostLike[]) {
  return collectTags(posts).filter((t) => t.count >= MIN_POSTS_PER_TAG);
}

/** Похожие статьи: сначала по числу общих тегов, затем по свежести. */
export function relatedPosts<T extends { id: string; data: { tags: string[]; date: Date } }>(
  current: T,
  all: T[],
  limit = 3
): T[] {
  const tags = new Set(current.data.tags);
  const others = all.filter((p) => p.id !== current.id);

  const byTags = others
    .map((p) => ({ post: p, shared: p.data.tags.filter((t) => tags.has(t)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.post.data.date.valueOf() - a.post.data.date.valueOf())
    .slice(0, limit)
    .map((x) => x.post);

  if (byTags.length >= limit) return byTags;

  // добираем свежими, если общих тегов не хватило
  const have = new Set(byTags.map((p) => p.id));
  const recent = others
    .filter((p) => !have.has(p.id))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, limit - byTags.length);

  return [...byTags, ...recent];
}
