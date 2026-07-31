/**
 * 导航站核心逻辑：
 * - 渲染分类与链接
 * - 配置读写 localStorage（本地缓存）
 * - 编辑模式：新增/编辑/删除 链接与分类
 * - 设置：站点名称、默认搜索引擎、主题、导入/导出/恢复默认
 */
(function () {
  'use strict';

  /* ---------- 常量与状态 ---------- */
  const CONFIG_KEY = 'nav_config_v1';
  const THEME_KEY = 'nav_theme_v1';
  const NEWS_KEY = 'nav_news_v1';
  const NEWS_CACHE_MS = 30 * 60 * 1000; // 资讯缓存 30 分钟
  const HOT_KEY = 'nav_hot_v1';
  const HOT_COUNT = 8; // 热搜榜单每个标签展示条数

  const state = {
    config: null,     // 站点配置（标题 / 默认引擎 / 分类与链接）
    theme: 'light',   // light | dark
    editMode: false,  // 是否处于编辑模式
    engineId: 'baidu',// 当前使用的搜索引擎
    editing: null,    // 正在编辑的链接 {catIndex, linkIndex} 或 null
    news: { list: [], source: '', ts: 0 }, // 热点资讯（列表 / 来源 / 更新时间）
    hot: { list: [], id: 'douyin', ts: 0 } // 热搜榜单（列表 / 当前标签 / 更新时间）
  };

  /* ---------- DOM 快捷引用 ---------- */
  const $ = (id) => document.getElementById(id);

  /* ---------- 本地缓存读写 ---------- */
  function loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      const cfg = JSON.parse(raw);
      return normalizeConfig(cfg);
    } catch (e) {
      console.warn('配置读取失败，使用默认配置', e);
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));
    } catch (e) {
      toast('保存失败：浏览器存储空间不足或不可用');
    }
  }

  /** 校验并规整配置结构，防止导入损坏数据 */
  function normalizeConfig(cfg) {
    const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    if (!cfg || typeof cfg !== 'object') return base;
    const out = {
      title: typeof cfg.title === 'string' && cfg.title.trim() ? cfg.title.trim() : base.title,
      defaultEngine: base.defaultEngine,
      news: {
        enabled: !(cfg.news && typeof cfg.news === 'object' && cfg.news.enabled === false),
        showCount: cfg.news && Number.isInteger(cfg.news.showCount)
          ? Math.min(Math.max(cfg.news.showCount, 5), 20)
          : base.news.showCount
      },
      categories: []
    };
    const engineIds = SEARCH_ENGINES.map((e) => e.id);
    if (engineIds.includes(cfg.defaultEngine)) out.defaultEngine = cfg.defaultEngine;
    if (Array.isArray(cfg.categories)) {
      cfg.categories.forEach((cat) => {
        if (!cat || typeof cat.name !== 'string' || !cat.name.trim()) return;
        const links = Array.isArray(cat.links) ? cat.links : [];
        out.categories.push({
          name: cat.name.trim(),
          links: links
            .filter((l) => l && typeof l.name === 'string' && l.name.trim() && typeof l.url === 'string' && l.url.trim())
            .map((l) => ({
              name: l.name.trim(),
              url: l.url.trim(),
              desc: (typeof l.desc === 'string' ? l.desc : '').trim()
            }))
        });
      });
    }
    if (!out.categories.length) out.categories = base.categories;
    return out;
  }

  function loadTheme() {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' ? 'dark' : 'light';
  }

  function saveTheme(t) {
    localStorage.setItem(THEME_KEY, t);
  }

  /* ---------- 工具 ---------- */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 根据名称生成稳定的图标底色（HSL 色相） */
  function iconColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) % 360;
    }
    return `linear-gradient(135deg, hsl(${hash}, 68%, 55%), hsl(${(hash + 40) % 360}, 68%, 45%))`;
  }

  /** 搜索引擎：按 id 查找，找不到回退到第一个 */
  function getEngine(id) {
    return SEARCH_ENGINES.find((e) => e.id === id) || SEARCH_ENGINES[0];
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  /* ---------- 渲染 ---------- */
  function renderAll() {
    renderHeader();
    renderEngineMenu();
    renderQuickEngines();
    renderMain();
    renderToday();
  }

  function renderHeader() {
    $('siteTitle').textContent = '🧭 ' + state.config.title;
    document.title = state.config.title;
  }

  function renderEngineMenu() {
    const menu = $('engineMenu');
    menu.innerHTML = SEARCH_ENGINES.map(
      (e) => `<li data-engine="${e.id}" class="${e.id === state.engineId ? 'active' : ''}">${escapeHtml(e.name)}</li>`
    ).join('');
  }

  function renderQuickEngines() {
    const wrap = $('quickEngines');
    wrap.innerHTML = SEARCH_ENGINES.map(
      (e) => `<button class="chip ${e.id === state.engineId ? 'active' : ''}" data-engine="${e.id}">${escapeHtml(e.name)}</button>`
    ).join('');
  }

  function renderToday() {
    const now = new Date();
    const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    const pad = (n) => String(n).padStart(2, '0');
    $('today').textContent =
      `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${week} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  function renderMain() {
    const main = $('main');
    const newsEnabled = state.config.news && state.config.news.enabled;
    const catsHtml = state.config.categories.map((cat, ci) => {
      const links = cat.links
        .map((link, li) => renderLinkCard(link, ci, li))
        .join('');
      const catOps = state.editMode
        ? `
          <div class="cat-actions">
            <button class="btn" data-add-link="${ci}">＋ 链接</button>
            <button class="btn danger-btn" data-del-cat="${ci}">删除分类</button>
          </div>`
        : '';
      return `
        <section class="category" data-cat="${ci}">
          <div class="category-head">
            <h2>${escapeHtml(cat.name)}</h2>
            ${catOps}
          </div>
          <div class="link-grid">${links}</div>
        </section>`;
    }).join('');
    // 开启资讯时：左侧分类导航 + 右侧资讯栏（热搜榜单在上、热点资讯在下）；关闭时只显示分类
    main.innerHTML = newsEnabled
      ? `<div class="main-layout"><div class="main-cols">${catsHtml}</div><aside class="side-col">${renderHotSection()}${renderNewsSection()}</aside></div>`
      : catsHtml;
    if (newsEnabled) {
      renderNewsList();
      renderHotList();
    }
  }

  function renderLinkCard(link, ci, li) {
    const ops = state.editMode
      ? `
        <div class="link-ops">
          <button title="编辑" data-edit-link="${ci}:${li}">✏️</button>
          <button class="del" title="删除" data-del-link="${ci}:${li}">✕</button>
        </div>`
      : '';
    return `
      <a class="link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener" title="${escapeHtml(link.url)}">
        <div class="link-icon" style="background:${iconColor(link.name)}">${escapeHtml(link.name.charAt(0))}</div>
        <div class="link-info">
          <div class="link-name">${escapeHtml(link.name)}</div>
          ${link.desc ? `<div class="link-desc">${escapeHtml(link.desc)}</div>` : ''}
        </div>
        ${ops}
      </a>`;
  }

  /* ---------- 热点资讯 ---------- */
  function renderNewsSection() {
    return `
      <aside class="category news-section">
        <div class="category-head">
          <h2>🔥 热点资讯</h2>
          <span class="news-source-tag" id="newsSource">加载中…</span>
          <div class="cat-actions">
            <button class="btn news-refresh" data-news-refresh title="刷新热点资讯">🔄</button>
          </div>
        </div>
        <div class="news-list" id="newsList"><div class="news-loading">加载中…</div></div>
      </aside>`;
  }

  function renderNewsList() {
    const listEl = $('newsList');
    if (!listEl) return;
    const count = (state.config.news && state.config.news.showCount) || 10;
    const list = state.news.list.slice(0, count);
    const tipHtml = state.news.tip ? `<div class="news-tip">💬 ${escapeHtml(state.news.tip)}</div>` : '';
    listEl.innerHTML = list.map((item, i) => {
      const rank = `<span class="news-rank ${i < 3 ? 'top' : ''}">${i + 1}</span>`;
      const title = `<span class="news-title">${escapeHtml(item.title)}</span>`;
      const source = item.source ? `<span class="news-source">${escapeHtml(item.source)}</span>` : '';
      if (item.url) {
        return `<a class="news-item" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${rank}${title}${source}</a>`;
      }
      return `<div class="news-item">${rank}${title}${source}</div>`;
    }).join('') + tipHtml;
    const tag = $('newsSource');
    if (tag && state.news.source) {
      tag.textContent = `${state.news.source} 更新于 ${formatTime(state.news.ts)}`;
    }
  }

  function formatTime(ts) {
    const d = new Date(ts || Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /**
   * 统一各数据源返回结构 → [{title, url, source}]
   * @param {object|array} raw 接口原始返回
   * @param {string} sharedUrl 整组条目共用的链接（60s 接口仅返回一个文章链接）
   */
  function normalizeNews(raw, sharedUrl) {
    if (!raw) return [];
    let arr = [];
    if (Array.isArray(raw)) arr = raw;
    else if (Array.isArray(raw.data)) arr = raw.data; // douyin：data 直接是条目数组
    else if (raw.data && Array.isArray(raw.data.news)) arr = raw.data.news; // 60s：data.news 是条目数组
    else if (raw.result) arr = Array.isArray(raw.result) ? raw.result : (Array.isArray(raw.result.list) ? raw.result.list : []);
    else if (Array.isArray(raw.list)) arr = raw.list;
    return arr
      .filter((it) => it !== null && it !== undefined)
      .map((it) => {
        // 纯字符串条目（如 60s 接口的 news 数组）
        if (typeof it === 'string') {
          return { title: it.trim(), url: normalizeUrl(sharedUrl || ''), source: '', hot: 0, hotDesc: '' };
        }
        if (typeof it !== 'object') return null;
        return {
          title: String(it.title || it.word || it.name || it.hotword || it.abstract || it.content || '').trim(),
          url: normalizeUrl(it.url || it.link || it.mobilUrl || it.mobile_url || it.mobil_url || sharedUrl || ''),
          source: String(it.source || it.info || it.label || '').trim(),
          hot: it.hot || it.hot_value || it.score || 0,
          hotDesc: it.score_desc || ''
        };
      })
      .filter((it) => it && it.title);
  }

  function normalizeUrl(u) {
    if (!u) return '';
    u = String(u);
    if (u.startsWith('//')) return 'https:' + u;
    return u;
  }

  async function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function readNewsCache() {
    try {
      const raw = localStorage.getItem(NEWS_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (!Array.isArray(c.list) || !c.list.length) return null;
      return { list: c.list, source: c.source || '', ts: Number(c.ts) || 0, tip: c.tip || '' };
    } catch (e) {
      return null;
    }
  }

  function writeNewsCache() {
    try {
      localStorage.setItem(NEWS_KEY, JSON.stringify(state.news));
    } catch (e) { /* 缓存失败不阻塞 */ }
  }

  /**
   * 获取热点资讯：优先用新鲜缓存 → 按顺序请求数据源 → 失败时回退缓存或站点提示
   * @param {boolean} force 是否强制重新请求（忽略新鲜缓存）
   */
  async function fetchNews(force) {
    const cached = readNewsCache();
    const fresh = cached && cached.ts && Date.now() - cached.ts < NEWS_CACHE_MS;
    if (!force && fresh) {
      state.news = cached;
      renderNewsList();
      return;
    }
    const btn = document.querySelector('[data-news-refresh]');
    if (btn) btn.classList.add('loading');
    let ok = false;
    for (const src of NEWS_SOURCES) {
      try {
        const raw = await fetchWithTimeout(src.url, 8000);
        const sharedUrl = raw && raw.data && raw.data.link;
        const items = normalizeNews(raw, sharedUrl);
        if (items.length >= 5) {
          state.news = {
            list: items,
            source: src.name,
            ts: Date.now(),
            tip: raw && raw.data && typeof raw.data.tip === 'string' ? raw.data.tip : ''
          };
          writeNewsCache();
          ok = true;
          break;
        }
      } catch (e) { /* 该数据源不可用，尝试下一个 */ }
    }
    if (!ok) {
      if (cached && cached.list.length) {
        state.news = { list: cached.list, source: cached.source + '（缓存）', ts: Date.now() };
      } else {
        state.news = { list: SITE_TIPS, source: '站点提示', ts: Date.now() };
      }
    }
    if (btn) btn.classList.remove('loading');
    renderNewsList();
  }

  /* ---------- 热搜榜单 ---------- */
  function renderHotSection() {
    return `
      <aside class="category hot-section">
        <div class="category-head">
          <h2>🔥 热搜榜单</h2>
          <div class="cat-actions">
            <button class="btn news-refresh" data-hot-refresh title="刷新榜单">🔄</button>
          </div>
        </div>
        <div class="hot-tabs" id="hotTabs">
          ${HOT_LISTS.map((s) => `<button class="hot-tab ${s.id === state.hot.id ? 'active' : ''}" data-hot-tab="${s.id}">${escapeHtml(s.name)}</button>`).join('')}
        </div>
        <div class="news-list" id="hotList"><div class="news-loading">加载中…</div></div>
      </aside>`;
  }

  function renderHotList() {
    const listEl = $('hotList');
    if (!listEl) return;
    if (!state.hot.list.length) {
      listEl.innerHTML = '<div class="news-loading">暂无数据，点击 🔄 重试</div>';
      return;
    }
    const list = state.hot.list.slice(0, HOT_COUNT);
    listEl.innerHTML = list.map((item, i) => {
      const rank = `<span class="news-rank ${i < 3 ? 'top' : ''}">${i + 1}</span>`;
      const title = `<span class="news-title">${escapeHtml(item.title)}</span>`;
      const hotTxt = item.hotDesc || formatHot(item.hot);
      const hotHtml = hotTxt ? `<span class="news-hot">${escapeHtml(hotTxt)}</span>` : '';
      if (item.url) {
        return `<a class="news-item" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${rank}${title}${hotHtml}</a>`;
      }
      return `<div class="news-item">${rank}${title}${hotHtml}</div>`;
    }).join('');
  }

  /** 热度值格式化：≥1亿显示“x.x亿”，≥1万显示“x.x万” */
  function formatHot(v) {
    const n = Number(v);
    if (!n || n <= 0) return '';
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return String(n);
  }

  function setHotTab(id) {
    state.hot.id = id;
    const tabs = $('hotTabs');
    if (tabs) {
      tabs.innerHTML = HOT_LISTS.map((s) => `<button class="hot-tab ${s.id === id ? 'active' : ''}" data-hot-tab="${s.id}">${escapeHtml(s.name)}</button>`).join('');
    }
    fetchHot(id, false).catch(() => {});
  }

  function readHotCache() {
    try {
      const raw = localStorage.getItem(HOT_KEY);
      if (!raw) return {};
      const c = JSON.parse(raw);
      return c && typeof c === 'object' ? c : {};
    } catch (e) {
      return {};
    }
  }

  function writeHotCache() {
    try {
      const cache = readHotCache();
      cache[state.hot.id] = { list: state.hot.list, ts: state.hot.ts };
      localStorage.setItem(HOT_KEY, JSON.stringify(cache));
    } catch (e) { /* 缓存失败不阻塞 */ }
  }

  /**
   * 获取热搜榜单：优先用新鲜缓存 → 请求数据源 → 失败时回退缓存或显示重试提示
   * @param {string} id 标签 id（douyin / toutiao / baidu）
   * @param {boolean} force 是否强制重新请求（忽略新鲜缓存）
   */
  async function fetchHot(id, force) {
    const src = HOT_LISTS.find((s) => s.id === id);
    if (!src) return;
    const cached = readHotCache()[id];
    const fresh = cached && cached.ts && Date.now() - cached.ts < NEWS_CACHE_MS;
    if (!force && fresh) {
      state.hot = { list: cached.list, id, ts: cached.ts };
      renderHotList();
      return;
    }
    const btn = document.querySelector('[data-hot-refresh]');
    if (btn) btn.classList.add('loading');
    try {
      const raw = await fetchWithTimeout(src.url, 8000);
      const items = normalizeNews(raw);
      state.hot = { list: items, id, ts: Date.now() };
      if (items.length) writeHotCache();
    } catch (e) {
      if (cached && cached.list && cached.list.length) {
        state.hot = { list: cached.list, id, ts: cached.ts };
      } else {
        state.hot = { list: [], id, ts: 0 };
      }
    }
    if (btn) btn.classList.remove('loading');
    renderHotList();
  }

  /* ---------- 搜索 ---------- */
  function doSearch() {
    const kw = $('searchInput').value.trim();
    if (!kw) {
      toast('请输入搜索关键词');
      $('searchInput').focus();
      return;
    }
    const engine = getEngine(state.engineId);
    window.open(engine.url.replace('{q}', encodeURIComponent(kw)), '_blank');
  }

  /* ---------- 弹窗通用 ---------- */
  const modals = ['linkModal', 'categoryModal', 'settingsModal'];

  function openModal(id) {
    $(id).classList.remove('hidden');
  }

  function closeModals() {
    modals.forEach((id) => $(id).classList.add('hidden'));
  }

  /* ---------- 链接 新增/编辑 ---------- */
  function openLinkModal(catIndex, linkIndex) {
    state.editing = linkIndex === undefined ? null : { catIndex, linkIndex };
    $('linkFormTitle').textContent = state.editing ? '编辑链接' : '添加链接';

    // 填充分类下拉
    const select = $('linkCategory');
    select.innerHTML = state.config.categories
      .map((c, i) => `<option value="${i}">${escapeHtml(c.name)}</option>`)
      .join('');
    select.value = String(catIndex);

    if (state.editing) {
      const link = state.config.categories[catIndex].links[linkIndex];
      $('linkName').value = link.name;
      $('linkUrl').value = link.url;
      $('linkDesc').value = link.desc || '';
    } else {
      $('linkName').value = '';
      $('linkUrl').value = '';
      $('linkDesc').value = '';
    }
    openModal('linkModal');
    $('linkName').focus();
  }

  function saveLink() {
    const name = $('linkName').value.trim();
    let url = $('linkUrl').value.trim();
    const desc = $('linkDesc').value.trim();
    const catIndex = Number($('linkCategory').value);

    if (!name) { toast('请填写链接名称'); return; }
    if (!url) { toast('请填写网址'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const cat = state.config.categories[catIndex];
    if (!cat) { toast('所选分类不存在'); return; }

    if (state.editing) {
      const link = cat.links[state.editing.linkIndex];
      if (link) Object.assign(link, { name, url, desc });
    } else {
      cat.links.push({ name, url, desc });
    }
    persistAndRefresh();
    closeModals();
    toast(state.editing ? '已保存修改' : '已添加链接');
  }

  /* ---------- 分类新增/删除 ---------- */
  function saveCategory() {
    const name = $('categoryName').value.trim();
    if (!name) { toast('请填写分类名称'); return; }
    state.config.categories.push({ name, links: [] });
    persistAndRefresh();
    closeModals();
    toast('已添加分类');
  }

  function deleteCategory(ci) {
    const cat = state.config.categories[ci];
    if (!cat) return;
    const count = cat.links.length;
    if (!confirm(`确定删除分类「${cat.name}」吗？${count ? `（将同时删除 ${count} 个链接）` : ''}`)) return;
    state.config.categories.splice(ci, 1);
    persistAndRefresh();
    toast('已删除分类');
  }

  /* ---------- 链接删除 ---------- */
  function deleteLink(ci, li) {
    const cat = state.config.categories[ci];
    if (!cat || !cat.links[li]) return;
    if (!confirm(`确定删除链接「${cat.links[li].name}」吗？`)) return;
    cat.links.splice(li, 1);
    persistAndRefresh();
    toast('已删除链接');
  }

  /* ---------- 设置 ---------- */
  function openSettings() {
    $('setTitle').value = state.config.title;
    const engineSelect = $('setEngine');
    engineSelect.innerHTML = SEARCH_ENGINES.map(
      (e) => `<option value="${e.id}" ${e.id === state.config.defaultEngine ? 'selected' : ''}>${escapeHtml(e.name)}</option>`
    ).join('');
    $('setTheme').value = state.theme;
    $('setNews').value = state.config.news && state.config.news.enabled ? 'on' : 'off';
    openModal('settingsModal');
  }

  function saveSettings() {
    const title = $('setTitle').value.trim();
    if (title) state.config.title = title;
    state.config.defaultEngine = $('setEngine').value;
    state.config.news = state.config.news || { enabled: true, showCount: 10 };
    state.config.news.enabled = $('setNews').value === 'on';
    const theme = $('setTheme').value;
    applyTheme(theme);
    persistAndRefresh();
    toast('设置已保存');
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify(state.config, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nav-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('配置已导出');
  }

  function importConfig(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const cfg = normalizeConfig(JSON.parse(reader.result));
        state.config = cfg;
        state.engineId = cfg.defaultEngine;
        persistAndRefresh();
        closeModals();
        toast('配置导入成功');
      } catch (e) {
        toast('导入失败：不是有效的配置文件');
      }
    };
    reader.readAsText(file);
  }

  function resetConfig() {
    if (!confirm('确定恢复默认配置吗？当前自定义内容将被清除。')) return;
    state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    state.engineId = state.config.defaultEngine;
    persistAndRefresh();
    closeModals();
    toast('已恢复默认配置');
  }

  /* ---------- 持久化 + 刷新 ---------- */
  function persistAndRefresh() {
    saveConfig();
    renderAll();
  }

  /* ---------- 主题 ---------- */
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    $('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    saveTheme(theme);
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  /* ---------- 编辑模式 ---------- */
  function setEditMode(on) {
    state.editMode = on;
    $('editToggle').classList.toggle('active', on);
    $('editToggle').textContent = on ? '✅ 完成' : '✏️';
    renderMain();
    toast(on ? '已进入编辑模式：可增删改分类与链接' : '已退出编辑模式');
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    // 搜索
    $('searchBtn').addEventListener('click', doSearch);
    $('searchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    // 搜索引擎下拉
    const engineSelect = $('engineSelect');
    engineSelect.addEventListener('click', (e) => {
      const item = e.target.closest('li[data-engine]');
      if (item) {
        state.engineId = item.dataset.engine;
        renderEngineMenu();
        renderQuickEngines();
        $('engineName').textContent = getEngine(state.engineId).name;
        engineSelect.classList.remove('open');
        return;
      }
      engineSelect.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!engineSelect.contains(e.target)) engineSelect.classList.remove('open');
    });

    // 快捷引擎 chip
    $('quickEngines').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip[data-engine]');
      if (!chip) return;
      state.engineId = chip.dataset.engine;
      renderEngineMenu();
      renderQuickEngines();
      $('engineName').textContent = getEngine(state.engineId).name;
      $('searchInput').focus();
    });

    // 顶部按钮
    $('themeToggle').addEventListener('click', toggleTheme);
    $('editToggle').addEventListener('click', () => setEditMode(!state.editMode));
    $('settingsBtn').addEventListener('click', openSettings);

    // 主区域事件委托：资讯刷新 / 榜单标签与刷新 / 链接卡片 / 编辑 / 删除 / 分类操作
    $('main').addEventListener('click', (e) => {
      const newsRefresh = e.target.closest('[data-news-refresh]');
      if (newsRefresh) {
        e.preventDefault();
        fetchNews(true);
        return;
      }
      const hotTab = e.target.closest('[data-hot-tab]');
      if (hotTab) {
        e.preventDefault();
        setHotTab(hotTab.dataset.hotTab);
        return;
      }
      const hotRefresh = e.target.closest('[data-hot-refresh]');
      if (hotRefresh) {
        e.preventDefault();
        fetchHot(state.hot.id, true);
        return;
      }
      const editLink = e.target.closest('[data-edit-link]');
      if (editLink) {
        e.preventDefault();
        const [ci, li] = editLink.dataset.editLink.split(':').map(Number);
        openLinkModal(ci, li);
        return;
      }
      const delLink = e.target.closest('[data-del-link]');
      if (delLink) {
        e.preventDefault();
        const [ci, li] = delLink.dataset.delLink.split(':').map(Number);
        deleteLink(ci, li);
        return;
      }
      const addLink = e.target.closest('[data-add-link]');
      if (addLink) {
        e.preventDefault();
        openLinkModal(Number(addLink.dataset.addLink));
        return;
      }
      const delCat = e.target.closest('[data-del-cat]');
      if (delCat) {
        e.preventDefault();
        deleteCategory(Number(delCat.dataset.delCat));
      }
    });

    // 链接弹窗
    $('linkSave').addEventListener('click', saveLink);
    $('categorySave').addEventListener('click', saveCategory);

    // 设置弹窗
    $('setTitle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveSettings();
    });
    $('settingsModal').querySelector('[data-close]').addEventListener('click', saveSettings);
    $('btnExport').addEventListener('click', exportConfig);
    $('btnReset').addEventListener('click', resetConfig);
    $('btnImport').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) importConfig(e.target.files[0]);
      e.target.value = '';
    });

    // 弹窗关闭：点击遮罩 / data-close / Esc
    modals.forEach((id) => {
      const el = $(id);
      el.addEventListener('mousedown', (e) => {
        if (e.target === el) closeModals();
      });
      el.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', closeModals));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModals();
    });

    // 时钟（每分钟刷新一次日期时间）
    setInterval(renderToday, 1000);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    state.config = loadConfig();
    state.engineId = state.config.defaultEngine;
    applyTheme(loadTheme());
    renderAll();
    $('engineName').textContent = getEngine(state.engineId).name;
    bindEvents();
    // 右侧资讯栏：热点资讯 + 热搜榜单（首次加载；资讯每 30 分钟自动刷新）
    if (state.config.news && state.config.news.enabled) {
      fetchNews(false).catch(() => {});
      setInterval(() => fetchNews(false).catch(() => {}), NEWS_CACHE_MS);
      fetchHot(state.hot.id, false).catch(() => {});
    }
  }

  init();
})();
