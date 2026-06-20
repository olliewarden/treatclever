// TreatClever — programmatic SEO page generator.
// Pure Node, zero dependencies. Run with: node generate.js
// Produces ~2,350 static HTML pages (one per procedure × location), a sitemap,
// and robots.txt, all written into dist/ alongside the main app (index.html).
//
// Why static HTML (not client-rendered): search engines index thousands of
// static pages far faster and more reliably than JS-rendered ones. For
// programmatic SEO — where the whole point is ranking a large number of
// long-tail pages — that difference is the difference between it working and not.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROCEDURES, NHS_ICB_RTT, US_STATE_WAITS } from './data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const SITE = 'https://treatclever.com';

// ── helpers ───────────────────────────────────────────────────────────────────
const slug = (s) => s.toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const money = (n, sym) => sym + n.toLocaleString('en-GB');

// Shared page chrome. Dark theme to match the main app. Self-contained CSS so
// these pages render instantly with no JS and no external CSS dependency.
function page({ title, desc, canonical, h1, bodyHtml, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6}
  a{color:#22d3ee;text-decoration:none}
  a:hover{text-decoration:underline}
  header,footer{background:#020617;border-color:#1e293b}
  header{border-bottom:1px solid #1e293b;padding:14px 20px}
  .wrap{max-width:880px;margin:0 auto;padding:0 20px}
  .brand{font-weight:800;font-size:18px;background:linear-gradient(90deg,#93c5fd,#67e8f9,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent}
  h1{font-size:26px;line-height:1.25;margin:28px 0 8px}
  h2{font-size:18px;margin:28px 0 10px;color:#f1f5f9}
  p{color:#cbd5e1}
  .lead{color:#94a3b8;font-size:15px}
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0}
  .card{border:1px solid #334155;border-radius:14px;padding:18px;background:#1e293b66}
  .card.priv{border-color:#0e7490}
  .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700}
  .big{font-size:34px;font-weight:800;line-height:1.1;margin:6px 0}
  .big.green{color:#34d399}.big.cyan{color:#22d3ee}
  .sub{font-size:13px;color:#94a3b8}
  .cta{display:inline-block;margin:8px 0;padding:11px 18px;border-radius:10px;background:linear-gradient(90deg,#2563eb,#0891b2);color:#fff;font-weight:700;font-size:14px}
  .cta:hover{text-decoration:none;opacity:.92}
  .note{font-size:12px;color:#64748b;border-top:1px solid #1e293b;padding-top:14px;margin-top:26px}
  .links{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
  .chip{font-size:12px;padding:6px 11px;border:1px solid #334155;border-radius:999px;color:#cbd5e1}
  .chip:hover{border-color:#0891b2;text-decoration:none}
  footer{border-top:1px solid #1e293b;padding:22px 0;margin-top:40px;font-size:12px;color:#64748b}
  @media(max-width:640px){.cards{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="wrap" style="padding:0"><a href="/" class="brand">TreatClever</a></div></header>
<main class="wrap">
<h1>${esc(h1)}</h1>
${bodyHtml}
</main>
<footer><div class="wrap" style="padding:0">
  © 2026 TreatClever · <a href="/">Compare your area</a> · Information only — not medical advice. Figures are typical ranges; verify with providers.
</div></footer>
</body>
</html>`;
}

// ── UK page builder ─────────────────────────────────────────────────────────
function ukPage(proc, icbName, related) {
  const data = NHS_ICB_RTT[icbName];
  const wait = data[proc.ukKey];
  const region = icbName.replace(/^NHS /, '').replace(/ ICB$/, '');
  const url = `/uk/${slug(proc.label)}/${slug(region)}/`;
  const canonical = SITE + url;
  const cost = proc.ukCost;
  const title = `${proc.label} Waiting Time in ${region} — NHS vs Private Cost (2026) | TreatClever`;
  const desc = `${proc.label} NHS waiting time in ${region} is around ${wait} weeks. Private self-pay costs from ${money(cost.lo,'£')}. Compare your options.`;
  const h1 = `${proc.label} in ${region}: NHS Wait vs Private Cost`;

  const relLinks = related.map(r => `<a class="chip" href="${r.url}">${esc(r.label)}</a>`).join('');

  const body = `
<p class="lead">If you need a ${proc.label.toLowerCase()} in ${esc(region)}, here's the typical NHS waiting time versus what it costs to go private — updated for 2026.</p>

<div class="cards">
  <div class="card">
    <div class="eyebrow">NHS Wait (${esc(region)})</div>
    <div class="big green">${wait} wks</div>
    <div class="sub">Typical referral-to-treatment wait for ${esc(proc.cat)} in this ICB.</div>
  </div>
  <div class="card priv">
    <div class="eyebrow">Private Self-Pay</div>
    <div class="big cyan">${money(cost.lo,'£')}–${money(cost.hi,'£')}</div>
    <div class="sub">Typical UK self-pay range. Usually treated within 2–3 weeks.</div>
  </div>
</div>

<a class="cta" href="/">Compare ${esc(region)} with your exact postcode →</a>

<h2>How long is the NHS wait for a ${esc(proc.label.toLowerCase())} in ${esc(region)}?</h2>
<p>In ${esc(region)}, the typical NHS waiting time for ${esc(proc.cat.toLowerCase())} procedures such as ${esc(proc.label.toLowerCase())} is around <strong>${wait} weeks</strong> from referral to treatment. Waits vary by hospital within the region and change month to month — and under NHS Right to Choose you can ask to be referred to a faster provider elsewhere in England at no cost.</p>

<h2>What does a private ${esc(proc.label.toLowerCase())} cost?</h2>
<p>Going private for a ${esc(proc.label.toLowerCase())} in the UK typically costs between <strong>${money(cost.lo,'£')} and ${money(cost.hi,'£')}</strong>, with an average around ${money(cost.avg,'£')}. Self-pay patients are usually seen within 2–3 weeks, compared with the ${wait}-week NHS wait in ${esc(region)} — a saving of roughly ${Math.max(0, wait - 3)} weeks.</p>

<h2>Other procedures in ${esc(region)}</h2>
<div class="links">${relLinks}</div>

<div class="note">Source: NHS England RTT data (2026) and typical UK self-pay fees. Figures are indicative ranges for guidance only.</div>
`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": `How long is the NHS wait for a ${proc.label.toLowerCase()} in ${region}?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Around ${wait} weeks from referral to treatment for ${proc.cat} in ${region}, though this varies by hospital and month.` } },
      { "@type": "Question", "name": `How much does a private ${proc.label.toLowerCase()} cost in the UK?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Typically £${cost.lo.toLocaleString('en-GB')}–£${cost.hi.toLocaleString('en-GB')} self-pay, with patients usually treated within 2–3 weeks.` } }
    ]
  };

  return { url, html: page({ title, desc, canonical, h1, bodyHtml: body, jsonLd }) };
}

// ── US page builder ─────────────────────────────────────────────────────────
function usPage(proc, stateName, related) {
  const data = US_STATE_WAITS[stateName];
  const wait = data[proc.usKey] ?? data['gen'];
  const url = `/us/${slug(proc.label)}/${slug(stateName)}/`;
  const canonical = SITE + url;
  const cost = proc.usCost;
  const title = `${proc.label} Wait Time in ${stateName} — Cash-Pay vs Insured Cost (2026) | TreatClever`;
  const desc = `${proc.label} specialist wait in ${stateName} is about ${wait} days. Cash-pay costs from ${money(cost.lo,'$')}. Compare insured vs self-pay.`;
  const h1 = `${proc.label} in ${stateName}: Wait Time vs Cash-Pay Cost`;

  const relLinks = related.map(r => `<a class="chip" href="${r.url}">${esc(r.label)}</a>`).join('');

  const body = `
<p class="lead">Considering a ${proc.label.toLowerCase()} in ${esc(stateName)}? Here's the typical specialist wait time and what it costs to pay cash versus going through insurance — updated for 2026.</p>

<div class="cards">
  <div class="card">
    <div class="eyebrow">Specialist Wait (${esc(stateName)})</div>
    <div class="big green">${wait} days</div>
    <div class="sub">Typical insured appointment wait for ${esc(proc.cat)} in ${esc(stateName)}.</div>
  </div>
  <div class="card priv">
    <div class="eyebrow">Cash-Pay Range</div>
    <div class="big cyan">${money(cost.lo,'$')}–${money(cost.hi,'$')}</div>
    <div class="sub">Typical US self-pay range at ambulatory surgery centers.</div>
  </div>
</div>

<a class="cta" href="/">Compare ${esc(stateName)} in the full tool →</a>

<h2>How long is the wait for a ${esc(proc.label.toLowerCase())} in ${esc(stateName)}?</h2>
<p>In ${esc(stateName)}, the typical specialist appointment wait for ${esc(proc.cat.toLowerCase())} care such as ${esc(proc.label.toLowerCase())} is around <strong>${wait} days</strong>. Cash-pay patients at ambulatory surgery centers can often be seen faster, since they skip insurance pre-authorization delays.</p>

<h2>What does a cash-pay ${esc(proc.label.toLowerCase())} cost in ${esc(stateName)}?</h2>
<p>Self-pay pricing for a ${esc(proc.label.toLowerCase())} in the US typically runs <strong>${money(cost.lo,'$')} to ${money(cost.hi,'$')}</strong>, averaging around ${money(cost.avg,'$')}. For shoppable procedures, cash pay can beat billed insurance rates — especially if you haven't met your deductible.</p>

<h2>Other procedures in ${esc(stateName)}</h2>
<div class="links">${relLinks}</div>

<div class="note">Source: AMN Healthcare specialist wait-time survey (2025) and typical US self-pay pricing. Figures are indicative ranges for guidance only.</div>
`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": `How long is the wait for a ${proc.label.toLowerCase()} in ${stateName}?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Around ${wait} days for a specialist appointment for ${proc.cat} in ${stateName}.` } },
      { "@type": "Question", "name": `How much does a cash-pay ${proc.label.toLowerCase()} cost in ${stateName}?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Typically $${cost.lo.toLocaleString('en-US')}–$${cost.hi.toLocaleString('en-US')} self-pay at ambulatory surgery centers.` } }
    ]
  };

  return { url, html: page({ title, desc, canonical, h1, bodyHtml: body, jsonLd }) };
}

// ── run ───────────────────────────────────────────────────────────────────────
function writePage(url, html) {
  const dir = path.join(DIST, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function main() {
  fs.mkdirSync(DIST, { recursive: true });

  // Copy the main app (interactive tool + blog) into dist as the homepage.
  fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(DIST, 'index.html'));

  const urls = ['/'];

  const icbNames = Object.keys(NHS_ICB_RTT);
  const stateNames = Object.keys(US_STATE_WAITS);

  // UK pages
  for (const icbName of icbNames) {
    const region = icbName.replace(/^NHS /, '').replace(/ ICB$/, '');
    // related = up to 6 other procedures in the same region
    for (const proc of PROCEDURES) {
      const related = PROCEDURES.filter(p => p.id !== proc.id).slice(0, 6).map(p => ({
        label: `${p.label} in ${region}`,
        url: `/uk/${slug(p.label)}/${slug(region)}/`
      }));
      const { url, html } = ukPage(proc, icbName, related);
      writePage(url, html);
      urls.push(url);
    }
  }

  // US pages
  for (const stateName of stateNames) {
    for (const proc of PROCEDURES) {
      const related = PROCEDURES.filter(p => p.id !== proc.id).slice(0, 6).map(p => ({
        label: `${p.label} in ${stateName}`,
        url: `/us/${slug(p.label)}/${slug(stateName)}/`
      }));
      const { url, html } = usPage(proc, stateName, related);
      writePage(url, html);
      urls.push(url);
    }
  }

  // sitemap.xml (chunked under 50k URLs — we're well under, single file is fine)
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

  // robots.txt
  fs.writeFileSync(path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

  // Netlify SPA fallback for the interactive app's client routes (blog etc.)
  fs.writeFileSync(path.join(DIST, '_redirects'), `/*    /index.html   200\n`);

  console.log(`[generate] wrote ${urls.length} pages (incl. homepage) + sitemap.xml + robots.txt into dist/`);
}

main();
