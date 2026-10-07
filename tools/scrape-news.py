"""One-off scraper: Rooibos Ltd blog -> data/news.json + assets/news/*. Run: python3 -I tools/scrape-news.py <dir with saved blog*.html and posts/*.html>"""
import sys, os, re, json, hashlib, io, urllib.request, ssl
from bs4 import BeautifulSoup
from PIL import Image

src = sys.argv[1]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root, 'assets/news'), exist_ok=True)
os.makedirs(os.path.join(root, 'data'), exist_ok=True)

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40).read()

def save_img(url, maxw=1400):
    url = url.split('?')[0]
    name = hashlib.md5(url.encode()).hexdigest()[:10]
    for ext in ('jpg', 'png'):
        if os.path.exists(os.path.join(root, f'assets/news/{name}.{ext}')):
            return f'/assets/news/{name}.{ext}'
    try:
        im = Image.open(io.BytesIO(fetch(url)))
    except Exception as e:
        print('  ! image failed', url, e); return None
    im.thumbnail((maxw, maxw), Image.LANCZOS)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        if im.getchannel('A').getextrema()[0] < 250:
            p = f'assets/news/{name}.png'; im.save(os.path.join(root, p), optimize=True); return '/' + p
        im = im.convert('RGB')
    im = im.convert('RGB')
    p = f'assets/news/{name}.jpg'; im.save(os.path.join(root, p), 'JPEG', quality=82, optimize=True, progressive=True); return '/' + p

# listing thumbnails: slug -> thumb url
thumbs = {}
for i in ['blog.html'] + [f'blog{n}.html' for n in range(2, 6)]:
    s = BeautifulSoup(open(os.path.join(src, i)).read(), 'lxml')
    for im in s.select('.elementor-widget-theme-post-featured-image a'):
        href = im['href']; t = im.find('img')
        if t and t.get('src'): thumbs[href.rstrip('/').split('/')[-1]] = t['src']

ALLOWED = {'p','h2','h3','h4','ul','ol','li','blockquote','figure','figcaption','img','a','strong','em','b','i','sup','sub','br','u'}
posts = []
for fn in sorted(os.listdir(os.path.join(src, 'posts'))):
    slug = fn[:-5]
    h = open(os.path.join(src, 'posts', fn)).read()
    s = BeautifulSoup(h, 'lxml')
    url = [u for u in open(os.path.join(src, 'urls.txt')).read().split() if u.rstrip('/').endswith('/' + slug)][0]
    y, m, d = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', url).groups()
    title = s.select_one('h1').get_text(' ', strip=True)
    c = s.select_one('div.elementor-widget-theme-post-content .elementor-widget-container')
    for t in c.select('script,style,iframe,form,.sharedaddy,.addtoany_share_save_container'): t.decompose()
    first_img = None
    for img in c.find_all('img'):
        u = img.get('src');
        if not u: img.decompose(); continue
        local = save_img(u)
        if not local:
            fig = img.find_parent('figure'); (fig or img).decompose(); continue
        first_img = first_img or local
        alt = img.get('alt', '')
        img.attrs = {'src': local, 'alt': alt, 'loading': 'lazy'}
    for a in c.find_all('a'):
        href = a.get('href', '')
        a.attrs = {'href': href, 'target': '_blank', 'rel': 'noopener'} if href.startswith('http') else {'href': href}
    for t in c.find_all(True):
        if t.name not in ALLOWED: t.unwrap()
        elif t.name not in ('a', 'img'): t.attrs = {}
    for t in c.find_all(['p', 'li']):
        if not t.get_text(strip=True) and not t.find('img'): t.decompose()
    body = ''.join(str(x) for x in c.contents).strip()
    body = re.sub(r'\s*\n\s*', '\n', body)
    paras = [p.get_text(' ', strip=True) for p in c.find_all('p')]
    lead = next((p for p in paras if len(p) > 40), '')
    desc = (s.select_one('meta[name="description"]') or {}).get('content') or lead
    thumb = save_img(thumbs[slug], 900) if slug in thumbs else first_img
    posts.append({'slug': slug, 'date': f'{y}-{m}-{d}', 'rawTitle': title, 'excerpt': desc, 'image': thumb, 'hero': first_img or thumb, 'body': body, 'source': url})
    print(slug, len(body), thumb, first_img)
posts.sort(key=lambda p: p['date'], reverse=True)
json.dump(posts, open(os.path.join(root, 'data/news.json'), 'w'), indent=1, ensure_ascii=False)
print(len(posts), 'posts')
