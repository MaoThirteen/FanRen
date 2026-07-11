/* ============================================================
   storage.js — localStorage 读写、数据迁移、全局 data 初始化
   依赖: data.js
   ============================================================ */

let data;

function loadAll() {
  try {
    const r = localStorage.getItem(STORAGE_KEY); if (!r) return null;
    const d = JSON.parse(r);
    if (!d.state) d.state = defaultState();
    if (!d.config) d.config = defaultConfig();
    if (!d.config.sidebarFold) d.config.sidebarFold = {};
    if (d.config.lastRaw === undefined) d.config.lastRaw = '';
    if (d.config.simMode === undefined) d.config.simMode = true;
    if (d.config.temperature === undefined) d.config.temperature = 0.7;
    if (d.config.topP === undefined) d.config.topP = 0.5;
    if (d.config.penalty === undefined) d.config.penalty = 1.0;
    if (d.config.contextRounds === undefined) d.config.contextRounds = 20;
    if (d.config.summaryLimit === undefined) d.config.summaryLimit = 200;
    if (d.config.theme === undefined) d.config.theme = 'dark';
    if (d.config.shownGuide === undefined) d.config.shownGuide = false;
    if (d.config.bioLocked === undefined) d.config.bioLocked = {};
    if (!d.chatHistory) d.chatHistory = d.messages || [];
    if (!d.summaries) d.summaries = [];
    if (!d.logs) d.logs = [];

    // 主角迁移
    if (!d.state.protagonist.name) d.state.protagonist.name = '猫十三';
    if (!d.state.protagonist.age) d.state.protagonist.age = 16;
    d.state.protagonist.lifespan = getLifespan(d.state.protagonist.realm);
    if (!d.state.protagonist.gender) d.state.protagonist.gender = '男';
    if (!d.state.timeLocation) d.state.timeLocation = defaultState().timeLocation;

    // 所有角色迁移
    ['protagonist','companions','tempCharacters'].forEach(k => {
      const arr = k === 'protagonist' ? [d.state.protagonist] : d.state[k];
      if (!Array.isArray(arr)) return;
      arr.forEach(c => {
        if (!c.exp) c.exp = 50;
        if (!c.expMax) c.expMax = calcExpMax(c.realm || '炼气一层');
        if (!c.hp) { const rd = getRealmDefaults(c.realm || '炼气一层'); c.hp = rd.hpMax; c.hpMax = rd.hpMax; c.mp = rd.mpMax; c.mpMax = rd.mpMax; }
        if (!c.spiritStones) c.spiritStones = 0;
        if (!c.inventory) c.inventory = [];
        if (!c.artifacts) c.artifacts = [];
        if (!c.skills) c.skills = [];
        // daoRoot 已移除
        if (!c.gender) c.gender = '男';
        if (!c.sect) c.sect = '无';
        if (!c.sectTitle) c.sectTitle = '散修';
        if (!c.relation) c.relation = '同行';
        if (!c.status) c.status = '';
        if (!c.bio) c.bio = '';
        if (!c.species) c.species = '人类';
        if (!c.formations) c.formations = [];
        if (c.artifacts) for (let i = 0; i < c.artifacts.length; i++) { const a = c.artifacts[i]; if (typeof a === 'string') { const n = a.split('（')[0] || a; const ds = a.includes('（') ? a.match(/（([^）]*)）/)?.[1]||'' : '功能未知'; c.artifacts[i] = { name:n, grade:'凡器', desc:ds }; } }
        if (c.skills) for (let i = 0; i < c.skills.length; i++) { const a = c.skills[i]; if (typeof a === 'string') { const n = a.split('（')[0] || a; const ds = a.includes('（') ? a.match(/（([^）]*)）/)?.[1]||'' : '功能未知'; c.skills[i] = { name:n, grade:'凡品功法', desc:ds }; } }
      });
    });

    // 王铁迁移
    const wt = d.state.companions.find(c => c.name === '王铁');
    if (!wt) d.state.companions.unshift({ name:'王铁', realm:'炼气三层', gender:'男', species:'人类', sect:'无', sectTitle:'散修', relation:'好友', exp:45, expMax:calcExpMax('炼气三层'), hp:85, hpMax:200, mp:35, mpMax:100, artifacts:[{ name:'开山斧', grade:'凡器', desc:'势大力沉' }], skills:[{ name:'铁布衫', grade:'凡品功法', desc:'淬炼肉身' }], spiritStones:20, inventory:[], status:'同行身旁' });
    else {
      if (wt.exp === undefined) wt.exp = 45;
      if (wt.expMax === undefined) wt.expMax = calcExpMax(wt.realm || '炼气三层');
      if (wt.hp === undefined) { const rd = getRealmDefaults(wt.realm || '炼气三层'); wt.hp = 85; wt.hpMax = rd.hpMax; wt.mp = 35; wt.mpMax = rd.mpMax; }
      if (!wt.artifacts) wt.artifacts = [{ name:'开山斧', grade:'凡器', desc:'势大力沉' }];
      if (!wt.skills) wt.skills = [{ name:'铁布衫', grade:'凡品功法', desc:'淬炼肉身' }];
      // daoRoot 已移除
      if (!wt.spiritStones) wt.spiritStones = 20;
      if (!wt.inventory) wt.inventory = [];
      if (!wt.sect) wt.sect = '无';
      if (!wt.sectTitle) wt.sectTitle = '散修';
      if (!wt.relation) wt.relation = '好友';
      if (!wt.status) wt.status = '同行身旁';
      if (!wt.gender) wt.gender = '男';
    }
    return d;
  } catch (_) { return null; }
}

data = loadAll();
if (!data) { data = { state:defaultState(), config:defaultConfig(), chatHistory:[], summaries:[], logs:[], worldBook:defaultWorldBook() }; saveAll(); }
else { validateRealmStats(data.state); if (!data.worldBook || !data.worldBook.includes('8.1')) data.worldBook = defaultWorldBook(); }

function saveAll() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {} }
function getState() { return data.state; }
function getConfig() { return data.config; }
