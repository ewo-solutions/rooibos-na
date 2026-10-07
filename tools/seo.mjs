// SEO metadata, structured data, sitemap and robots for the static build.
import fs from 'node:fs';
import path from 'node:path';

export const SITE = (process.env.SITE_URL || 'https://rooibosna.com').replace(/\/$/, '');
const OG_IMAGE = '/og-image.jpg';

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export const meta = {
  home: {
    title: 'Bulk Rooibos & Botanical Ingredients Supplier | Rooibos NA',
    desc: 'Bulk rooibos and botanical ingredients supplier in the USA. Hibiscus, chamomile, moringa, peppermint, spearmint, extracts and powders, direct from origin.',
  },
  products: {
    title: 'Bulk Botanical Ingredients Supplier USA | Rooibos NA',
    desc: 'Bulk rooibos, hibiscus, chamomile, moringa leaf and powder, peppermint, spearmint and rosehips, plus botanical extracts and powders. Organic available.',
  },
  about: {
    title: 'Direct-from-Origin Botanical Supplier | About Rooibos NA',
    desc: 'Rooibos North America and partners Rooibos Ltd and Serendib Ingredients supply traceable, sustainably sourced botanical ingredients direct from origin.',
  },
  certifications: {
    title: 'Organic & Food Safety Certifications | Rooibos NA',
    desc: 'Download organic, FSSC 22000, Kosher and Halaal certificates for traceable bulk rooibos and botanical ingredients from Rooibos NA.',
  },
  news: {
    title: 'Rooibos News | Rooibos North America',
    desc: 'Rooibos and botanical news and insights from Rooibos North America, a bulk rooibos supplier to North American manufacturers and wholesalers.',
  },
  contact: {
    title: 'Contact | Bulk Rooibos & Botanicals Supplier USA',
    desc: 'Contact Rooibos North America for bulk rooibos, hibiscus, chamomile, moringa and botanical extract quotes. U.S. warehouses in Los Angeles, CA and Lorton, VA.',
  },
};

const org = {
  '@type': 'Organization',
  '@id': SITE + '/#organization',
  name: 'Rooibos North America LLC',
  alternateName: 'Rooibos NA',
  url: SITE + '/',
  logo: SITE + '/assets/logo-rooibos-na.png',
  description: 'Bulk rooibos, honeybush, hibiscus, chamomile, moringa and other botanical ingredients, extracts and powders supplied direct from origin to North American manufacturers and wholesalers.',
  telephone: '+1-951-595-2637',
  email: 'jackie@rooibosna.com',
  address: { '@type': 'PostalAddress', streetAddress: '27710 Jefferson Ave., Suite 106', addressLocality: 'Temecula', addressRegion: 'CA', postalCode: '92590', addressCountry: 'US' },
  areaServed: ['US', 'CA', 'MX'],
  sameAs: ['https://rooibosltd.co.za'],
  parentOrganization: { '@type': 'Organization', name: 'Rooibos Ltd', url: 'https://rooibosltd.co.za' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', name: 'Jacqueline Lamond', telephone: '+1-951-595-2637', email: 'jackie@rooibosna.com', areaServed: 'US', availableLanguage: 'English' },
  knowsAbout: ['Bulk rooibos', 'Honeybush', 'Hibiscus', 'Chamomile', 'Moringa', 'Peppermint', 'Spearmint', 'Botanical extracts', 'Botanical powders', 'Rosehip seed oil'],
};

function products(body) {
  const items = [];
  for (const m of body.matchAll(/<article[\s\S]*?<\/article>/g)) {
    const a = m[0];
    const name = (a.match(/<h3[^>]*>([^<]+)</) || [])[1];
    const img = (a.match(/<img[^>]*src="([^"]+)"/) || [])[1];
    const text = a.replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const origin = (a.match(/Origin:\s*([^<]+)</) || [])[1];
    if (!name) continue;
    const desc = text.replace(name, '').replace(/^Origin:[^A-Z]*/, '').trim().slice(0, 300);
    items.push({
      '@type': 'ListItem', position: items.length + 1,
      item: {
        '@type': 'Product', name: name.replace(/&amp;/g, '&'),
        category: 'Bulk botanical ingredients',
        ...(img ? { image: SITE + img } : {}),
        ...(desc ? { description: desc.replace(/&amp;/g, '&') } : {}),
        ...(origin ? { countryOfOrigin: origin.trim() } : {}),
        brand: { '@id': SITE + '/#organization' },
      },
    });
  }
  return items;
}

export function seoHead(page, body, pages) {
  const m = meta[page.key];
  const url = SITE + page.href;
  const graph = [org, { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Rooibos North America', publisher: { '@id': SITE + '/#organization' } }];
  const pageType = { about: 'AboutPage', contact: 'ContactPage', certifications: 'CollectionPage', products: 'CollectionPage', news: 'CollectionPage', home: 'WebPage' }[page.key];
  graph.push({ '@type': pageType, '@id': url + '#webpage', url, name: m.title, description: m.desc, dateModified: new Date().toISOString().slice(0, 10), isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#organization' } });
  if (page.key !== 'home') {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: m.title.split('|')[0].trim(), item: url },
    ] });
  }
  if (page.key === 'products') {
    const list = products(body);
    if (list.length) graph.push({ '@type': 'ItemList', name: 'Bulk botanical ingredients', itemListElement: list });
  }
  return `<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#5d1720">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Rooibos North America">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE + OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Rooibos plantation in the Cederberg, South Africa">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(m.title)}">
<meta name="twitter:description" content="${esc(m.desc)}">
<meta name="twitter:image" content="${SITE + OG_IMAGE}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

export function articleHead(post, body) {
  const url = SITE + '/news/' + post.slug + '/';
  const title = post.title.length > 52 ? post.title.slice(0, 52).replace(/\s+\S*$/, '') + '…' : post.title;
  const full = title + ' | Rooibos News';
  const desc = post.excerpt.length > 155 ? post.excerpt.slice(0, 155).replace(/\s+\S*$/, '') + '…' : post.excerpt;
  const img = SITE + (post.image || post.hero || OG_IMAGE);
  const graph = [org,
    { '@type': 'Article', '@id': url + '#article', headline: post.title, datePublished: post.date, dateModified: post.date, image: img, mainEntityOfPage: url, description: post.excerpt, author: { '@id': SITE + '/#organization' }, publisher: { '@id': SITE + '/#organization' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Rooibos News', item: SITE + '/news/' },
      { '@type': 'ListItem', position: 3, name: post.title, item: url } ] }];
  return `<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#5d1720">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Rooibos North America">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="article:published_time" content="${post.date}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

export function writeCrawlFiles(root, pages, posts = []) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.map(p => `  <url><loc>${SITE}${p.href}</loc><lastmod>${today}</lastmod><priority>${p.key === 'home' ? '1.0' : p.key === 'products' ? '0.9' : '0.7'}</priority></url>`)
    .concat(posts.map(p => `  <url><loc>${SITE}/news/${p.slug}/</loc><lastmod>${p.date}</lastmod><priority>0.5</priority></url>`)).join('\n');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];
  fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\n${bots.map(b => `User-agent: ${b}\nAllow: /\n`).join('\n')}\nSitemap: ${SITE}/sitemap.xml\n`);
}
