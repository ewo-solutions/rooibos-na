// Native news: listing page + one page per article, from data/news.json
import fs from 'node:fs';
import path from 'node:path';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const clip = (s, n) => s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…';
const eyebrow = 'font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#b32025;font-weight:800';

export function loadPosts(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'data/news.json'), 'utf8'));
}

export function listingBody(posts) {
  const cards = posts.map((p, i) => `
        <article class="news-card" data-news-card style="border:1px solid #dfd8ce;background:#fff;border-radius:4px;overflow:hidden;display:flex;flex-direction:column">
          ${p.image ? `<a href="/news/${p.slug}/" tabindex="-1" aria-hidden="true" style="display:block"><img src="${p.image}" alt="" width="900" height="500" style="width:100%;height:200px;object-fit:cover;display:block;background:#f3f0eb"></a>` : ''}
          <div style="padding:24px 26px 26px;display:flex;flex-direction:column;gap:12px;flex:1">
            <span style="${eyebrow}">Rooibos Industry News · ${fmt(p.date)}</span>
            <h2 style="font:500 24px/1.15 Georgia,'Times New Roman',serif;margin:0;text-wrap:pretty"><a href="/news/${p.slug}/" style="color:inherit;text-decoration:none">${esc(p.title)}</a></h2>
            <p style="font-size:15px;color:#666;margin:0;flex:1">${esc(clip(p.excerpt, 230))}</p>
            <a href="/news/${p.slug}/" style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b32025;text-decoration:none">Read the article</a>
          </div>
        </article>`).join('');
  return `
  <div data-screen-label="Rooibos News">

    <section style="padding:70px 0 0">
      <div style="width:min(1180px,calc(100% - 40px));margin:auto;max-width:860px">
        <div style="font-size:12px;font-weight:800;letter-spacing:.16em;color:#b32025;text-transform:uppercase;margin-bottom:18px">Rooibos news</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;line-height:1.05;margin:0;font-size:clamp(40px,5vw,64px)">Rooibos news</h1>
        <p style="font-size:19px;color:#626262;margin:22px 0 0">Stay updated with the latest developments from Rooibos Ltd.</p>
      </div>
    </section>

    <section style="padding:56px 0 90px">
      <div data-news-grid style="width:min(1180px,calc(100% - 40px));margin:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px">${cards}
      </div>
      <div style="width:min(1180px,calc(100% - 40px));margin:34px auto 0">
        <button type="button" data-news-more hidden style="display:inline-block;background:#fff;color:#242424;border:1px solid #dfd8ce;font:inherit;font-weight:700;padding:14px 20px;border-radius:3px;cursor:pointer">Load more articles</button>
      </div>
    </section>

  </div>
  `;
}

export function articleBody(p, prev, next) {
  const hasInlineImg = /<img /.test(p.body);
  const nav = (x, label) => x ? `<a href="/news/${x.slug}/" class="news-nav-link"><span style="${eyebrow}">${label}</span><span style="font:500 20px/1.2 Georgia,'Times New Roman',serif;color:#242424;display:block;margin-top:6px">${esc(x.title)}</span></a>` : '<span></span>';
  return `
  <div data-screen-label="News article">
    <article>
    <section style="padding:56px 0 0">
      <div style="width:min(1180px,calc(100% - 40px));margin:auto;max-width:800px">
        <a href="/news/" style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b32025;text-decoration:none">&larr; Rooibos news</a>
        <div style="${eyebrow};font-size:12px;letter-spacing:.16em;margin:26px 0 16px">Rooibos Industry News · <time datetime="${p.date}">${fmt(p.date)}</time></div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;line-height:1.1;margin:0;font-size:clamp(32px,4.4vw,52px);text-wrap:pretty">${esc(p.title)}</h1>
      </div>
    </section>
    ${(!hasInlineImg && p.image) ? `<div style="width:min(1180px,calc(100% - 40px));margin:36px auto 0;max-width:800px"><img src="${p.image}" alt="" fetchpriority="high" style="width:100%;height:auto;max-height:440px;object-fit:cover;border-radius:4px;display:block"></div>` : ''}
    <section style="padding:36px 0 70px">
      <div class="article-body" style="width:min(1180px,calc(100% - 40px));margin:auto;max-width:800px">
${p.body}
        <p class="article-source">Originally published on the <a href="${p.source}" target="_blank" rel="noopener">Rooibos Ltd website</a>.</p>
      </div>
    </section>
    </article>
    <section style="padding:0 0 90px">
      <div style="width:min(1180px,calc(100% - 40px));margin:auto;max-width:800px;border-top:1px solid #e6ded2;padding-top:34px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px">
        ${nav(next, 'Newer')}${nav(prev, 'Older')}
      </div>
      <div style="width:min(1180px,calc(100% - 40px));margin:34px auto 0;max-width:800px">
        <a href="/news/" style="display:inline-block;background:#b32025;color:#fff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:3px">All Rooibos news</a>
      </div>
    </section>
  </div>
  `;
}
