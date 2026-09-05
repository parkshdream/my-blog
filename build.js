#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const OUTPUT_DIR = path.join(ROOT, 'dist');
const SITE_TITLE = 'My Blog';

function render(tpl, data) {
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (m, key) => (key in data ? String(data[key]) : ''));
}

function formatDate(d) {
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

function excerptOf(html, len = 140) {
  const text = stripHtml(html).replace(/\s+/g, ' ').trim();
  return text.length > len ? text.slice(0, len) + '…' : text;
}

function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn('[build] posts/ 폴더가 없습니다. 빈 목록으로 진행합니다.');
    return [];
  }
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    if (!data.title) throw new Error(`[build] "${file}" 에 필수 front matter "title"이 없습니다.`);
    if (!data.date) throw new Error(`[build] "${file}" 에 필수 front matter "date"가 없습니다.`);

    const date = data.date instanceof Date ? data.date : new Date(data.date);
    if (isNaN(date.getTime())) throw new Error(`[build] "${file}" 의 date 값이 올바르지 않습니다: ${data.date}`);

    const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
    const contentHtml = marked.parse(content);
    const slug = data.slug || file.replace(/\.md$/i, '');

    return {
      slug,
      title: data.title,
      date,
      dateDisplay: formatDate(date),
      tags,
      description: data.description || excerptOf(contentHtml),
      contentHtml,
    };
  });
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyStaticAssets() {
  fs.cpSync(path.join(ROOT, 'css'), path.join(OUTPUT_DIR, 'css'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'js'), path.join(OUTPUT_DIR, 'js'), { recursive: true });
}

function buildPostPages(posts) {
  const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'), 'utf8');
  const postsOutDir = path.join(OUTPUT_DIR, 'posts');
  fs.mkdirSync(postsOutDir, { recursive: true });

  for (const post of posts) {
    const tagsHtml = post.tags.map((t) => `<span class="tag">${t}</span>`).join(' ');
    const html = render(tpl, {
      site_title: SITE_TITLE,
      title: post.title,
      description: post.description,
      date: post.dateDisplay,
      tags: tagsHtml,
      content: post.contentHtml,
    });
    fs.writeFileSync(path.join(postsOutDir, `${post.slug}.html`), html, 'utf8');
  }
}

function buildIndexPage(posts) {
  const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');
  const itemsHtml = posts.map((post) => `
      <article class="post-card">
        <h2><a href="posts/${post.slug}.html">${post.title}</a></h2>
        <time datetime="${post.date.toISOString().slice(0, 10)}">${post.dateDisplay}</time>
        <p>${post.description}</p>
        <div class="tags">${post.tags.map((t) => `<span class="tag">${t}</span>`).join(' ')}</div>
      </article>`).join('\n');

  const html = render(tpl, {
    site_title: SITE_TITLE,
    posts: itemsHtml || '<p>아직 작성된 글이 없습니다.</p>',
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html, 'utf8');
}

function main() {
  console.log('[build] cleaning dist/ ...');
  ensureCleanDir(OUTPUT_DIR);
  copyStaticAssets();

  console.log('[build] loading posts ...');
  const posts = loadPosts().sort((a, b) => b.date - a.date);
  console.log(`[build] found ${posts.length} post(s)`);

  buildPostPages(posts);
  buildIndexPage(posts);

  console.log(`[build] done. Output: ${OUTPUT_DIR}`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
