// GEO (AI-search) files: llms.txt and llms-full.txt, generated verbatim from the built pages.
import fs from 'node:fs';
import path from 'node:path';
import { SITE, meta } from './seo.mjs';

const dec = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;/g, '·').replace(/&rarr;/g, '→').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n));

function toMarkdown(mainHtml) {
  let s = mainHtml
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .replace(/<img[^>]*>/g, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (m, href, t) => {
      const text = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text) return '';
      const abs = href.startsWith('/') ? SITE + href : href;
      return `[${text}](${abs})`;
    })
    .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/g, (m, n, t) => `\n\n${'#'.repeat(+n + 0)} ${t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n\n`)
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/g, '**$2**')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/(p|div|article|section|li|span|figure|figcaption)>/g, '\n')
    .replace(/<[^>]+>/g, ' ');
  s = dec(s).split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

export function writeGeoFiles(root, pages) {
  const names = { home: 'Home', products: 'Products', about: 'About', certifications: 'Certifications', news: 'Rooibos News', contact: 'Contact' };
  let idx = `# Rooibos North America LLC\n\n> Bulk rooibos, honeybush, hibiscus, chamomile, moringa and other botanical ingredients, extracts and powders, supplied direct from origin to North American manufacturers and wholesalers. Wholly-owned subsidiary of Rooibos Ltd (South Africa), in partnership with Serendib Ingredients (Egypt). Warehouses in Los Angeles, CA and Lorton, VA.\n\n`;
  idx += `Contact: Jacqueline Lamond, +1 951 595 2637, jackie@rooibosna.com. 27710 Jefferson Ave., Suite 106, Temecula, CA 92590 USA.\n\n## Pages\n\n`;
  for (const p of pages) idx += `- [${names[p.key]}](${SITE}${p.href}): ${meta[p.key].desc}\n`;
  idx += `\n## Full text\n\n- [All page content as plain text](${SITE}/llms-full.txt)\n`;
  fs.writeFileSync(path.join(root, 'llms.txt'), idx);

  let full = `# Rooibos North America LLC: full site content\n\nSource: ${SITE}/ . Text below is reproduced from the website.\n`;
  for (const p of pages) {
    const html = fs.readFileSync(path.join(root, p.file), 'utf8');
    const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [])[1] || '';
    full += `\n\n---\n\n<!-- ${SITE}${p.href} -->\n\n${toMarkdown(main)}\n`;
  }
  fs.writeFileSync(path.join(root, 'llms-full.txt'), full);
}
