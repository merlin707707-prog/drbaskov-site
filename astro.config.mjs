import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://drbaskov.ru',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});
