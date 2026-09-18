import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const root = path.resolve(import.meta.dirname, "..");
const contentDirectory = path.join(root, "content", "worlds");
const output = path.join(root, "dist");
const required = ["title", "slug", "creator", "type", "status", "created"];
const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
const slugOkay = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || "");

function layout({ title, description, body }) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(title)} · Pixel Port</title><meta name="description" content="${escapeHtml(description)}"><link rel="stylesheet" href="/styles.css"></head><body><header class="site-header"><a class="brand" href="/"><strong>Pixel Port</strong><span>X星球实验室 · Pixel Port</span></a><nav><a href="/worlds/">作品世界</a><a href="/#about">关于</a></nav></header><main>${body}</main><footer>Pixel Port · Children creating digital worlds with AI</footer></body></html>`;
}
function card(world) {
  return `<article class="world-card"><a class="cover" href="/worlds/${world.slug}/">${world.cover ? `<img src="${escapeHtml(world.cover)}" alt="${escapeHtml(world.title)} 作品封面">` : ""}</a><p class="eyebrow">${escapeHtml(world.type)} · ${escapeHtml(world.status)}</p><h2><a href="/worlds/${world.slug}/">${escapeHtml(world.title)}</a></h2><p>${escapeHtml(world.summary || "一个正在成长的数字世界。")}</p><p class="meta">by ${escapeHtml(world.creator)} · v${escapeHtml(world.version || "0.1")}</p></article>`;
}
async function worlds() {
  const files = (await readdir(contentDirectory)).filter(file => file.endsWith(".md"));
  const records = await Promise.all(files.map(async file => {
    const parsed = matter(await readFile(path.join(contentDirectory, file), "utf8"));
    const world = { ...parsed.data, body: parsed.content };
    for (const field of required) if (!world[field]) throw new Error(`${file}: 缺少 ${field}`);
    if (!slugOkay(world.slug)) throw new Error(`${file}: slug 必须为小写英文、数字和连字符`);
    if (world.play_url && !/^https:\/\//.test(world.play_url)) throw new Error(`${file}: play_url 必须为 HTTPS`);
    if (world.cover && !String(world.cover).startsWith("/assets/")) throw new Error(`${file}: cover 必须为 /assets/ 下的站内路径`);
    return world;
  }));
  const slugs = new Set(); records.forEach(world => { if (slugs.has(world.slug)) throw new Error(`重复 slug: ${world.slug}`); slugs.add(world.slug); });
  return records.sort((a, b) => String(b.created).localeCompare(String(a.created)));
}
async function write(route, html) { const file = path.join(output, route, "index.html"); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, html); }

const allWorlds = await worlds();
await rm(output, { recursive: true, force: true }); await mkdir(output, { recursive: true });
await cp(path.join(root, "public"), output, { recursive: true });
await writeFile(path.join(output, "styles.css"), await readFile(path.join(root, "src", "styles.css")));
const featured = allWorlds.filter(world => world.featured);
await write("", layout({ title: "Pixel Port", description: "孩子创造的数字世界展示空间", body: `<section class="hero"><p class="eyebrow">X STAR LAB · PUBLIC WORLD</p><h1>Pixel Port</h1><p class="subtitle">Children creating digital worlds with AI</p><p>这里不是游戏商店。这里是孩子创造数字世界的港口。</p><a class="button" href="/worlds/">探索作品世界</a></section><section class="section"><p class="eyebrow">FEATURED WORLDS</p><h2>精选作品</h2><div class="grid">${(featured.length ? featured : allWorlds).map(card).join("")}</div></section><section id="about" class="statement"><p class="eyebrow">WHY PIXEL PORT</p><h2>AI 时代，孩子不仅是使用者，也是创造者。</h2><p>每一个作品都记录一次提问、一次尝试与一个正在形成的世界。</p></section><section class="section"><p class="eyebrow">LATEST</p><h2>最新作品</h2><div class="grid">${allWorlds.map(card).join("")}</div></section>` }));
await write("worlds", layout({ title: "作品世界", description: "Pixel Port 的孩子创作世界", body: `<section class="page-intro"><p class="eyebrow">WORLD ARCHIVE</p><h1>作品世界</h1><p>每个世界都从一个孩子真正想探索的问题开始。</p></section><div class="grid">${allWorlds.map(card).join("")}</div>` }));
for (const world of allWorlds) {
  const tools = (world.tools || []).map(tool => `<li>${escapeHtml(tool)}</li>`).join(""); const tags = (world.tags || []).map(tag => `<li>${escapeHtml(tag)}</li>`).join("");
  await write(`worlds/${world.slug}`, layout({ title: world.title, description: world.summary || world.title, body: `<article class="world"><section class="world-hero">${world.cover ? `<img src="${escapeHtml(world.cover)}" alt="${escapeHtml(world.title)} 作品封面">` : ""}<div><p class="eyebrow">${escapeHtml(world.type)} · ${escapeHtml(world.status)} · v${escapeHtml(world.version || "0.1")}</p><h1>${escapeHtml(world.title)}</h1><p class="creator">Created by <strong>${escapeHtml(world.creator)}</strong></p><p>${escapeHtml(world.creator_bio || "Pixel Port 创作者")}</p>${world.play_url ? `<a class="button" href="${escapeHtml(world.play_url)}" target="_blank" rel="noopener noreferrer">进入体验 ↗</a>` : ""}</div></section><section class="world-body">${marked.parse(world.body)}<aside><h2>使用工具</h2><ul>${tools}</ul><h2>标签</h2><ul class="tags">${tags}</ul></aside></section></article>` }));
}
await writeFile(path.join(output, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://play.talk1.top/sitemap.xml\n");
await writeFile(path.join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/worlds/", ...allWorlds.map(world => `/worlds/${world.slug}/`)].map(route => `<url><loc>https://play.talk1.top${route}</loc></url>`).join("")}</urlset>`);
console.log(`Built Pixel Port: ${allWorlds.length} world(s) → ${output}`);
