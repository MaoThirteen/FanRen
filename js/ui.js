/* ============================================================
   ui.js — DOM引用、UI渲染函数、弹窗控制、侧边栏
   依赖: data.js, storage.js
   ============================================================ */

const $ = id => document.getElementById(id);

/* ---- DOM 引用 ---- */
const chatArea = $('chatArea'), inputBox = $('inputBox'), sendBtn = $('sendBtn');
const menuBtn = $('menuBtn'), sidebar = $('sidebar'), sidebarOverlay = $('sidebarOverlay'), closeSidebar = $('closeSidebar');
const sidebarModules = $('sidebarModules'), delModeBtn = $('delModeBtn'), addCharSidebarBtn = $('addCharSidebarBtn');
const tlDisplay = $('tlDisplay'), extraToggleBtn = $('extraToggleBtn'), extraPanel = $('extraPanel');
const liveClock = $('liveClock'), historyList = $('historyList'), histCount = $('histCount');
const histOverlay = $('histOverlay'), histModal = $('histModal'), closeHist = $('closeHist');
const settingsBtn = $('settingsBtn'), settingsOverlay = $('settingsOverlay'), settingsModal = $('settingsModal'), closeSettings = $('closeSettings');
const apiBase = $('apiBase'), apiBase2 = $('apiBase2'), apiModel = $('apiModel'), apiModel2 = $('apiModel2'), apiKey = $('apiKey'), apiKey2 = $('apiKey2'), simMode = $('simMode');
const testMainApiBtn = $('testMainApiBtn'), testBackupApiBtn = $('testBackupApiBtn'), mainApiStatus = $('mainApiStatus'), backupApiStatus = $('backupApiStatus');
const cleanupBtn = $('cleanupBtn'), resetDataBtn = $('resetDataBtn'), rawToggle = $('rawToggle'), rawArea = $('rawArea'), rawContent = $('rawContent'), rawArrow = $('rawArrow');
const summaryBtn = $('summaryBtn'), summaryOverlay = $('summaryOverlay'), summaryModal = $('summaryModal'), summaryList = $('summaryList'), closeSummary = $('closeSummary');
const summaryDelModeBtn = $('summaryDelModeBtn'), summaryDelTools = $('summaryDelTools'), summarySelectAll = $('summarySelectAll'), summaryDeleteSelected = $('summaryDeleteSelected');
const summarizeBtn = $('summarizeBtn');
const addSummaryBtn = $('addSummaryBtn');
const summaryPromptBtn = $('summaryPromptBtn'), summaryPromptArea = $('summaryPromptArea'), summaryPromptContent = $('summaryPromptContent');
const autoSummarizeToggle = $('autoSummarizeToggle'), autoSumEvery = $('autoSumEvery'), autoSumRounds = $('autoSumRounds');
const logBtn = $('logBtn'), logOverlay = $('logOverlay'), logModal = $('logModal'), logList = $('logList'), closeLog = $('closeLog'), clearLogBtn = $('clearLogBtn');
const charEditOverlay = $('charEditOverlay'), charEditModal = $('charEditModal'), closeCharEdit = $('closeCharEdit');
const charTypeSelect = $('charTypeSelect'), charNameInput = $('charNameInput'), charRealmSelect = $('charRealmSelect');
const charArtifactList = $('charArtifactList'), charSkillList = $('charSkillList'), charStoneInput = $('charStoneInput'), charInvInput = $('charInvInput'), charFormationList = $('charFormationList');
const saveCharBtn = $('saveCharBtn'), addArtifactRow = $('addArtifactRow'), addSkillRow = $('addSkillRow'), addFormationRow = $('addFormationRow');
const charGender = $('charGender'), charGoal = $('charGoal'), editGoalLabel = $('charGoalLabel');
const charSectToggle = $('charSectToggle'), charSectName = $('charSectName'), charSectTitle = $('charSectTitle'), charSectFields = $('charSectFields');
const charStatusField = $('charStatusField'), charRelationField = $('charRelationField');
const charEditIdx = $('charEditIdx'), charEditSrc = $('charEditSrc'), charTypeRow = $('charTypeRow'), charStatusRow = $('charStatusRow'), charRelationRow = $('charRelationRow');
const charTimeRow = $('charTimeRow'), charTimeTime = $('charTimeTime'), charTimeLoc = $('charTimeLoc'), charTimeDetail = $('charTimeDetail'), charBio = $('charBio'), charBioLock = $('charBioLock'), charSpecies = $('charSpecies');
const charAge = $('charAge'), charLifespan = $('charLifespan'), charExpVal = $('charExpVal'), charExpPct = $('charExpPct'), charExpMaxLabel = $('charExpMaxLabel');
const charExpBarInner = $('charExpBarInner');
const exportImportBtn = $('exportImportBtn'), exportImportOverlay = $('exportImportOverlay'), exportImportModal = $('exportImportModal'), closeExportImport = $('closeExportImport');
const doExportBtn = $('doExportBtn'), doImportBtn = $('doImportBtn'), importFileInput = $('importFileInput');
const confirmOverlay = $('confirmOverlay'), confirmModal = $('confirmModal'), confirmTitle = $('confirmTitle'), confirmMsg = $('confirmMsg');
const confirmOkBtn = $('confirmOkBtn'), confirmCancelBtn = $('confirmCancelBtn');
const ctxRoundsInput = $('ctxRoundsInput'), slimitInput = $('slimitInput');
const promptGearBtn = $('promptGearBtn'), promptPanel = $('promptPanel'), promptOverlay = $('promptOverlay'), promptContent = $('promptContent');
const copyPromptBtn = $('copyPromptBtn'), closePromptBtn = $('closePromptBtn'), promptCharCount = $('promptCharCount');
const guideBtn = $('guideBtn'), guideOverlay = $('guideOverlay'), guideModal = $('guideModal'), closeGuide = $('closeGuide'), guideCloseBtn = $('guideCloseBtn');
const tlEditOverlay = $('tlEditOverlay'), tlEditModal = $('tlEditModal'), closeTlEdit = $('closeTlEdit'), saveTlEdit = $('saveTlEdit');
const tlModalTime = $('tlModalTime'), tlModalLoc = $('tlModalLoc'), tlModalDetail = $('tlModalDetail'), tlModalDay = $('tlModalDay');
const worldBookBtn = $('worldBookBtn'), worldBookOverlay = $('worldBookOverlay'), worldBookModal = $('worldBookModal'), closeWorldBook = $('closeWorldBook');
const worldBookContent = $('worldBookContent'), resetWorldBookBtn = $('resetWorldBookBtn');
const worldBookCopyBtn = $('worldBookCopyBtn'), worldBookStructured = $('worldBookStructured');

/* ---- 全局状态 ---- */
let deleteMode = false, summaryDeleteMode = false, confirmTimer = null, lt = null;
let isLoading = false, lastUserInput = '';

/* ---- 弹窗通用 ---- */
function showModal(ov, md) { ov.classList.remove('opacity-0','pointer-events-none'); ov.classList.add('opacity-100'); md.classList.remove('opacity-0','pointer-events-none'); md.classList.add('opacity-100'); md.style.pointerEvents = 'auto'; ov.style.pointerEvents = 'auto'; }
function hideModal(ov, md) { ov.classList.remove('opacity-100'); ov.classList.add('opacity-0'); md.classList.remove('opacity-100'); md.classList.add('opacity-0'); ov.style.pointerEvents = 'none'; md.style.pointerEvents = 'none'; setTimeout(() => { ov.classList.add('pointer-events-none'); md.classList.add('pointer-events-none'); }, 300); }
function closeSidebarFn() { sidebar.classList.remove('sidebar-open'); sidebar.classList.add('sidebar-enter','pointer-events-none'); sidebarOverlay.classList.remove('opacity-100'); sidebarOverlay.classList.add('opacity-0'); sidebarOverlay.style.pointerEvents = 'none'; }

/* ---- 消息渲染 ---- */
function scrollToBottom() { const last = chatArea.lastElementChild; if (last) last.scrollIntoView({ behavior:'smooth', block:'end' }); else chatArea.scrollTop = chatArea.scrollHeight; }
function appendMsg(r, c, sn) {
  const u = r === 'user'; const h = chatArea.querySelector('.text-center'); if (h) h.remove();
  const content = u ? c : cleanNarrative(c); // assistant消息兜底清洗（防旧数据残留代码块）
  const d = document.createElement('div'); d.className = 'chat-msg flex ' + (u ? 'justify-end' : 'justify-start');
  const m = u ? 'max-w-[75%]' : 'max-w-[85%]';
  d.innerHTML = '<div class="' + m + ' rounded-2xl px-4 py-3 ' + (u ? 'bg-gradient-to-br from-[rgba(180,140,60,.15)] to-[rgba(180,120,40,.1)] border border-[rgba(180,140,60,.12)]' : 'bg-[rgba(28,24,20,.6)] border border-[rgba(160,120,60,.1)]') + '"><div class="text-sm leading-relaxed whitespace-pre-wrap text-[rgba(255,255,255,.75)]">' + esc(content) + '</div>' + (sn ? '<div class="text-[10px] mt-1.5 ' + (sn.includes('✓') ? 'text-[rgba(120,200,160,.5)]' : 'text-[rgba(220,180,100,.45)]') + '">' + sn + '</div>' : '') + '</div>';
  chatArea.appendChild(d); scrollToBottom();
}
function renderMessages() { const ms = data.chatHistory || []; chatArea.innerHTML = '<div class="text-center text-[rgba(220,200,160,.25)] text-sm tracking-[2px] pt-8 select-none">— 故事从这里开始 —</div>'; ms.forEach(m => appendMsg(m.role, m.content, m.statusNotice)); scrollToBottom(); }

/* ---- 加载气泡（非流式，仅显示加载中） ---- */
function createStreamBubble() { const oldB = document.getElementById('streamB'); if (oldB) oldB.remove(); if (lt) { clearInterval(lt); lt = null; } const d = document.createElement('div'); d.id = 'streamB'; d.className = 'chat-msg flex justify-start'; d.innerHTML = '<div class="max-w-[85%] rounded-2xl px-4 py-3 bg-[rgba(28,24,20,.6)] border border-[rgba(160,120,60,.1)]"><div id="streamContent" class="text-sm leading-relaxed text-[rgba(220,200,160,.5)]"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div><div id="streamTimer" class="text-[10px] text-[rgba(220,200,160,.25)] mt-2 tracking-[1px]">修仙世界运转中… 0秒</div></div>'; chatArea.appendChild(d); scrollToBottom(); let sec = 0; lt = setInterval(() => { sec++; const e = document.getElementById('streamTimer'); if (e) e.textContent = '修仙世界运转中… ' + sec + '秒'; }, 1000); return d; }
function removeStreamBubble() { const d = document.getElementById('streamB'); if (d) d.remove(); if (lt) { clearInterval(lt); lt = null; } }
function addRegenBtn() { const msgs = chatArea.querySelectorAll('.chat-msg:not(.justify-end)'); if (!msgs.length) return; const last = msgs[msgs.length - 1]; const inner = last.querySelector('.rounded-2xl'); if (!inner) return; const btn = document.createElement('div'); btn.className = 'text-[10px] mt-1.5 text-[rgba(220,180,100,.4)]'; btn.innerHTML = '<button onclick="event.stopPropagation();regenerate()" class="px-2 py-0.5 rounded bg-[rgba(160,120,60,.12)] border border-[rgba(160,120,60,.14)] hover:bg-[rgba(160,120,60,.2)] transition">🔄 重新生成</button>'; inner.appendChild(btn); }

/* ---- 日志 ---- */
function addLog(msg) { if (!data.logs) data.logs = []; const ts = new Date().toLocaleTimeString(); data.logs.push('[' + ts + '] ' + msg); if (data.logs.length > 200) data.logs = data.logs.slice(-200); saveAll(); }
function renderLogs() { const logs = data.logs || []; if (!logs.length) { logList.innerHTML = '<div class="text-xs text-[rgba(220,200,160,.2)] text-center py-8">暂无日志</div>'; return; } logList.innerHTML = logs.slice().reverse().map(l => '<div class="leading-relaxed py-0.5 border-b border-[rgba(160,120,60,.05)] text-[11px] text-[rgba(255,255,255,.5)]">' + esc(l) + '</div>').join(''); }

/* ---- 侧边栏渲染 ---- */
function collapsibleBlock(t, c, h, e) { const id = 'c_' + Math.random().toString(36).slice(2, 6); return '<div class="rounded-lg border border-[rgba(160,120,60,.08)] overflow-hidden"><div class="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-[rgba(160,120,60,.06)] transition" onclick="document.getElementById(\'' + id + '\').classList.toggle(\'hidden\');this.querySelector(\'.carrow\').classList.toggle(\'rotate-90\')"><span class="text-xs text-[rgba(220,200,160,.4)]">' + t + (c !== undefined ? ' <span class="text-[rgba(220,200,160,.2)]">（' + c + '）</span>' : '') + '</span><span class="carrow">▸</span></div><div id="' + id + '" class="hidden px-2.5 pb-2 space-y-1">' + (h || '<span class="text-xs text-[rgba(220,200,160,.2)]">' + (e || '无') + '</span>') + '</div></div>'; }
function renderItemLine(item, type) {
  const g = item.grade || ((type === 'skill' ? SKILL_GRADES : ARTIFACT_GRADES).slice(-1)[0]);
  const st = item.status ? '<span class="text-[9px] px-1.5 rounded-full bg-[rgba(180,120,40,.12)] border border-[rgba(180,120,40,.15)] text-[rgba(220,180,120,.55)]">' + esc(item.status) + '</span> ' : '';
  const catClr = (c) => CATEGORY_COLORS[c] || '#888';
  const cats = (type === 'artifact' && item.categories?.length) ? '<span class="inline-flex flex-wrap gap-0.5">' + item.categories.map(c => '<span class="text-[8px] px-1 rounded-full" style="background:' + catClr(c) + '20;border:1px solid ' + catClr(c) + '50;color:' + catClr(c) + '">' + esc(c) + '</span>').join('') + '</span> ' : '';
  const ftTag = (type === 'formation' && item.formType) ? '<span class="text-[8px] px-1 rounded-full" style="background:' + (FORMATION_TYPE_COLORS[item.formType]||'#888') + '30;border:1px solid ' + (FORMATION_TYPE_COLORS[item.formType]||'#888') + '60;color:' + (FORMATION_TYPE_COLORS[item.formType]||'#888') + '">' + esc(item.formType) + '</span> ' : '';
  return '<div class="rounded-lg px-2 py-1 cursor-pointer text-xs border border-transparent hover:border-[rgba(160,120,60,.1)]" onclick="this.querySelector(\'.ib\').classList.toggle(\'open\');this.querySelector(\'.ixp\').classList.toggle(\'rotate-180\')"><span class="text-[rgba(255,255,255,.6)]">' + esc(item.name) + '</span> ' + ftTag + cats + st + gradeTag(g) + '<span class="ixp float-right text-[20px] text-[rgba(220,200,160,.45)]" style="display:inline-block">▾</span><div class="ib artifact-body text-[10px] text-[rgba(220,200,160,.35)] pl-1">' + esc(item.desc || '') + '</div></div>';
}

function renderCharCard(c, o) {
  const st = o?.timeLocation, si = o?.inventory !== false, pr = o?.protagonist, comp = o?.companion, istemp = o?.temp;
  const eP = c.expMax > 0 ? Math.round(c.exp / c.expMax * 100) : 0, hP = c.hpMax > 0 ? Math.round(c.hp / c.hpMax * 100) : 0, mP = c.mpMax > 0 ? Math.round(c.mp / c.mpMax * 100) : 0;
  const tl = getState().timeLocation, clpsId = 'l_' + Math.random().toString(36).slice(2, 6);
  const aH = c.artifacts?.length ? c.artifacts.map(a => renderItemLine(a, 'artifact')).join('') : '无';
  const sH = c.skills?.length ? c.skills.map(a => renderItemLine(a, 'skill')).join('') : '无';
  const fH = c.formations?.length ? c.formations.map(a => renderItemLine(a, 'formation')).join('') : '无';
  const iH = c.inventory?.length ? c.inventory.map(i => renderInvItem(i)).join('、') : '空';
  const nCol = pr ? 'text-[#e8c860]' : comp ? 'text-[#90d0a0]' : 'text-[rgba(255,255,255,.75)]';
  const seTxt = c.sect || '无';
  const relTag = !pr && c.relation ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(140,180,100,.1)] border border-[rgba(140,180,100,.15)] text-[rgba(160,200,140,.55)]">' + esc(c.relation) + '</span>' : '';
  const hasFold = comp || istemp;
  const body = '<div class="text-sm tracking-[1px] text-[rgba(255,255,255,.65)] font-medium">' + esc(c.realm || '?') + '</div>'
    + '<div class="text-xs text-[rgba(255,255,255,.35)]">' + esc(c.species || '人类') + ' · ' + esc(c.gender || '男') + '</div>'
    + (pr && c.goal ? '<div class="text-xs text-[rgba(200,220,255,.55)]">目标：' + esc(c.goal) + '</div>' : '')
    + '<div class="text-xs text-[rgba(255,255,255,.35)]">宗门：' + esc(seTxt) + (c.sectTitle ? '·' + esc(c.sectTitle) : '') + '</div>'
    + (pr && c.age ? '<div class="text-xs text-[rgba(255,255,255,.5)]">寿元：' + c.age + '/' + (c.lifespan || getLifespan(c.realm)) + '岁</div>' : '')
    + '<div class="text-xs text-[rgba(255,255,255,.5)]">修为：' + (c.exp || 0) + '/' + (c.expMax || 100) + '（' + getExpStage(eP) + '）</div>'
    + bar('', c.exp || 0, c.expMax || 100, 'from-[#e8c860] to-[#d4a830]')
    + '<div class="text-xs text-[rgba(255,255,255,.5)]">血量：' + (c.hp || 0) + '/' + (c.hpMax || 100) + '（' + getHpStage(hP) + '）</div>'
    + bar('', c.hp || 0, c.hpMax || 100, 'from-[#d06060] to-[#b04040]')
    + '<div class="text-xs text-[rgba(255,255,255,.5)]">法力：' + (c.mp || 0) + '/' + (c.mpMax || 50) + '（' + getMpStage(mP) + '）</div>'
    + bar('', c.mp || 0, c.mpMax || 50, 'from-[#4a7aff] to-[#3060d0]')
    + collapsibleBlock('法器', c.artifacts?.length, aH) + collapsibleBlock('功法', c.skills?.length, sH) + collapsibleBlock('符箓/灵兽/阵法', c.formations?.length, fH)
    + collapsibleBlock('背包', c.inventory?.length, '<div class="text-xs text-[rgba(255,255,255,.5)] leading-relaxed">' + iH + '</div>')
    + '<div class="text-xs font-semibold text-[#e8c860]">灵石：' + (c.spiritStones || 0) + '</div>'
    + (c.bio ? collapsibleBlock('生平' + (deleteMode ? ' <span class="text-[10px] cursor-pointer" onclick="event.stopPropagation();toggleBioLock(\'' + esc(c.name) + '\')">' + ((getConfig().bioLocked||{})[c.name] ? '🔒' : '🔓') + '</span>' : ''), undefined, '<div class="text-xs text-[rgba(220,180,100,.5)] leading-relaxed">' + esc(c.bio) + '</div>') : '')
    + '<div class="text-xs text-[rgba(255,255,255,.4)]">身体/行动：' + esc(c.status || c.tag || '') + '</div>';
  const foldHtml = hasFold
    ? '<div class="comp-collapse-btn flex items-center justify-between px-3 py-2 rounded-xl bg-[rgba(30,24,20,.3)] border border-[rgba(160,120,60,.08)] cursor-pointer" onclick="document.getElementById(\'' + clpsId + '\').classList.toggle(\'hidden\');this.querySelector(\'.fld\').classList.toggle(\'rotate-90\')"><div class="flex items-center gap-2"><span class="text-base font-bold tracking-[2px] ' + nCol + '">' + esc(c.name) + '</span>' + relTag + '</div><span class="fld text-[rgba(220,200,160,.55)] transition-transform" style="display:inline-block;font-size:22px">▸</span></div><div id="' + clpsId + '" class="hidden rounded-xl px-3 py-3 bg-[rgba(30,24,20,.3)] border border-[rgba(160,120,60,.08)] space-y-1.5">' + body + '</div>'
    : '<div class="rounded-xl px-3 py-3 bg-[rgba(30,24,20,.3)] border border-[rgba(160,120,60,.08)] space-y-1.5">' + (st ? '<div class="text-sm tracking-[1px] text-[rgba(255,255,255,.5)]">' + esc(tl.time) + (tl.location ? '·' + esc(tl.location) : '') + (tl.detail ? '·' + esc(tl.detail) : '') + '</div>' : '') + '<div class="text-base font-bold tracking-[2px] ' + nCol + '">' + esc(c.name) + '</div>' + body + '</div>';
  return foldHtml;
}

const MODULE_DEFS = [{ key:'protagonist', icon:'◈', label:'主角状态' }, { key:'companions', icon:'✦', label:'同伴' }, { key:'temp', icon:'◇', label:'临时角色' }];

function renderSidebar() {
  const s = getState(), f = getConfig().sidebarFold;
  const tl = getState().timeLocation;
  const tlText = esc(tl.time) + (tl.location ? '·' + esc(tl.location) : '') + (tl.detail ? '·' + esc(tl.detail) : '');
  tlDisplay.innerHTML = '<div class="flex items-center justify-between gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-[rgba(160,120,60,.06)] transition" onclick="document.getElementById(\'tlDetailArea\').classList.toggle(\'hidden\');this.querySelector(\'.tl-arrow\').classList.toggle(\'rotate-90\')"><div class="flex items-center gap-1 min-w-0"><span class="tl-arrow inline-block text-[rgba(220,200,160,.45)] text-xs transition-transform">▸</span><span class="text-xs text-[rgba(255,255,255,.55)] truncate">' + esc(tl.time) + '</span></div>' + (deleteMode ? '<button onclick="openTlEditModal()" class="px-2 py-0.5 rounded text-[10px] bg-[rgba(160,120,60,.2)] text-[rgba(220,200,160,.7)] hover:bg-[rgba(160,120,60,.3)] transition shrink-0">✎ 编辑</button>' : '') + '</div><div id="tlDetailArea" class="hidden mt-1 px-2 pb-1"><span class="text-xs text-[rgba(255,255,255,.45)]">' + tlText + '</span></div>';
  sidebarModules.innerHTML = MODULE_DEFS.map(d => { const o = !f[d.key]; return '<div class="module-item ' + (o ? 'module-open' : '') + '"><div class="module-header flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer bg-[rgba(30,24,20,.4)] border border-[rgba(160,120,60,.08)] hover:border-[rgba(160,120,60,.15)] transition" data-key="' + d.key + '"><div class="flex items-center gap-2.5"><span class="text-[rgba(220,200,160,.4)] text-xs">' + d.icon + '</span><span class="text-xs tracking-[2px] text-[rgba(255,255,255,.6)]">' + d.label + '</span><span class="text-[10px] text-[rgba(220,200,160,.3)]" id="sbBadge_' + d.key + '"></span></div><span class="module-arrow text-[rgba(220,200,160,.6)]" style="display:inline-block;font-size:22px">▾</span></div><div class="module-body px-3 pt-3 pb-2 space-y-2 ' + (o ? '' : 'hidden') + '" id="sbBody_' + d.key + '"></div></div>'; }).join('');
  sidebarModules.querySelectorAll('.module-header').forEach(el => { el.addEventListener('click', () => { const k = el.dataset.key; getConfig().sidebarFold[k] = !getConfig().sidebarFold[k]; saveAll(); renderSidebar(); }); });
  renderProtagonist(); renderCompanions(); renderTempChars();
}
function openTlEditModal() { const tl = getState().timeLocation; tlModalTime.value = tl.time || ''; tlModalLoc.value = tl.location || ''; tlModalDetail.value = tl.detail || ''; showModal(tlEditOverlay, tlEditModal); }
function saveTimeLocationInline() { getState().timeLocation = { time:tlModalTime.value.trim(), location:tlModalLoc.value.trim(), detail:tlModalDetail.value.trim() }; saveAll(); renderSidebar(); hideModal(tlEditOverlay, tlEditModal); showToast('时间地点已更新'); }

function editBtns(type, i) { return deleteMode ? '<div class="absolute top-2 right-2 flex gap-1"><button class="px-2 py-0.5 rounded text-[10px] bg-[rgba(160,120,60,.2)] text-[rgba(220,200,160,.55)] hover:bg-[rgba(160,120,60,.35)] transition" onclick="event.stopPropagation();openEditModal(\'' + type + '\',' + i + ')">编辑</button><button class="px-2 py-0.5 rounded text-[10px] bg-[rgba(200,60,60,.25)] text-[rgba(240,200,200,.6)] hover:bg-[rgba(200,60,60,.4)] transition" onclick="event.stopPropagation();showDeleteConfirm(\'' + type + '\',' + i + ')">删除</button></div>' : ''; }
function renderProtagonist() { const s = getState().protagonist, b = $('sbBody_protagonist'), badge = $('sbBadge_protagonist'); const p = s.expMax > 0 ? Math.round(s.exp / s.expMax * 100) : 0; badge.textContent = s.realm + ' ' + p + '%'; b.innerHTML = '<div class="relative">' + renderCharCard(s, { timeLocation:false, protagonist:true }) + editBtns('protagonist', -1) + '</div>'; }
function renderCompanions() { const s = getState().companions, b = $('sbBody_companions'), badge = $('sbBadge_companions'); badge.textContent = s.length ? s.length + '人' : '无'; if (!s.length) { b.innerHTML = '<div class="text-xs text-[rgba(220,200,160,.2)]">无同伴</div>'; return; } b.innerHTML = s.map((c, i) => '<div class="relative">' + renderCharCard(c, { companion:true }) + editBtns('companion', i) + '</div>').join(''); }
function renderTempChars() { const s = getState().tempCharacters, b = $('sbBody_temp'), badge = $('sbBadge_temp'); badge.textContent = s.length ? s.length + '个' : '无'; if (!s.length) { b.innerHTML = '<div class="text-xs text-[rgba(220,200,160,.2)]">无临时角色</div>'; return; } b.innerHTML = s.map((c, i) => '<div class="relative">' + renderCharCard(c, { temp:true }) + editBtns('temp', i) + '</div>').join(''); }

function showDeleteConfirm(type, idx) {
  const lb = { 'protagonist':'主角', 'companion':'同伴', 'temp':'临时角色' };
  confirmTitle.textContent = '⚠ 删除确认'; confirmMsg.textContent = '删除后将无法找回，确定要删除此' + lb[type] + '吗？';
  confirmOkBtn.disabled = true; confirmOkBtn.textContent = '确认（10秒）'; confirmCancelBtn.textContent = '取消';
  showModal(confirmOverlay, confirmModal);
  let sec = 10; confirmTimer = setInterval(() => { sec--; confirmOkBtn.textContent = '确认（' + sec + '秒）'; if (sec <= 0) { clearInterval(confirmTimer); confirmTimer = null; confirmOkBtn.disabled = false; confirmOkBtn.textContent = '确认删除'; } }, 1000);
  confirmOkBtn.onclick = function() { if (confirmTimer) { clearInterval(confirmTimer); confirmTimer = null; } closeConfirm(); if (type === 'protagonist') getState().protagonist = defaultState().protagonist; else if (type === 'companion') getState().companions.splice(idx, 1); else getState().tempCharacters.splice(idx, 1); saveAll(); renderSidebar(); showToast('已删除'); };
  confirmCancelBtn.onclick = closeConfirm;
}
function closeConfirm() { if (confirmTimer) { clearInterval(confirmTimer); confirmTimer = null; } hideModal(confirmOverlay, confirmModal); }
function showSimpleConfirm(msg, onOk) { confirmTitle.textContent = '确认操作'; confirmMsg.textContent = msg; confirmOkBtn.disabled = false; confirmOkBtn.textContent = '确认'; confirmCancelBtn.textContent = '取消'; showModal(confirmOverlay, confirmModal); confirmOkBtn.onclick = function() { closeConfirm(); if (onOk) onOk(); }; confirmCancelBtn.onclick = closeConfirm; }

/* ---- 角色编辑 ---- */
/* 法器行：支持拖拽排序 + 名称/品阶/状态/类别 第一行，备注第二行 */
function addArtifactRowUI(v) {
  const d = document.createElement('div');
  d.className = 'artifact-row';
  d.draggable = true;
  const cats = v?.categories || [];
  d.innerHTML = '<div class="flex gap-1 items-center flex-wrap">'
    + '<span class="text-[11px] text-[rgba(220,200,160,.35)] cursor-move select-none">⠿</span>'
    + '<input placeholder="名称" class="w-14 min-w-0 flex-1 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none" value="' + esc(v?.name || '') + '">'
    + '<select class="rounded px-1 py-1 text-[10px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none">' + ARTIFACT_GRADES.map(g => '<option value="' + g + '"' + (v?.grade === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select>'
    + '<input placeholder="状态" class="w-16 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none" value="' + esc(v?.status || '完好无缺') + '">'
    + '<button class="text-[rgba(200,100,60,.5)] hover:text-[rgba(200,100,60,.8)] transition text-xs shrink-0" onclick="this.closest(\'.artifact-row\').remove()">✕</button>'
    + '</div>'
    + '<div class="flex gap-2 mt-0.5">' + ARTIFACT_CATEGORIES.map(c => '<label class="text-[9px] text-[rgba(220,200,160,.35)] cursor-pointer"><input type="checkbox" class="art-cat-chk mr-0.5 accent-[rgba(160,200,240,.5)]" value="' + c + '"' + (cats.includes(c) ? ' checked' : '') + '>' + c + '</label>').join('') + '</div>'
    + '<textarea placeholder="备注（样子、功能）" maxlength="100" rows="2" class="w-full mt-0.5 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none resize-y" oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\'">' + esc(v?.desc || '') + '</textarea>';
  attachDragEvents(d, charArtifactList, 'artifact-row');
  charArtifactList.appendChild(d);
}

/* 功法行：支持拖拽排序 + 名称/品阶/状态 第一行，备注第二行 */
function addSkillRowUI(v) {
  const d = document.createElement('div');
  d.className = 'skill-row';
  d.draggable = true;
  d.innerHTML = '<div class="flex gap-1 items-center">'
    + '<span class="text-[11px] text-[rgba(220,200,160,.35)] cursor-move select-none">⠿</span>'
    + '<input placeholder="名称" class="w-14 min-w-0 flex-1 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none" value="' + esc(v?.name || '') + '">'
    + '<select class="rounded px-1 py-1 text-[10px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none">' + SKILL_GRADES.map(g => '<option value="' + g + '"' + (v?.grade === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select>'
    + '<input placeholder="状态" class="w-16 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none" value="' + esc(v?.status || '可用') + '">'
    + '<button class="text-[rgba(200,100,60,.5)] hover:text-[rgba(200,100,60,.8)] transition text-xs shrink-0" onclick="this.closest(\'.skill-row\').remove()">✕</button>'
    + '</div>'
    + '<textarea placeholder="功能介绍" maxlength="100" rows="2" class="w-full mt-0.5 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none resize-y" oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\'">' + esc(v?.desc || '') + '</textarea>';
  attachDragEvents(d, charSkillList, 'skill-row');
  charSkillList.appendChild(d);
}

/* 符箓/灵兽/阵盘行：支持拖拽排序 + 类型/名称/品阶/状态 第一行，备注第二行 */
function addFormationRowUI(v) {
  const d = document.createElement('div');
  d.className = 'formation-row';
  d.draggable = true;
  d.innerHTML = '<div class="flex gap-1 items-center">'
    + '<span class="text-[11px] text-[rgba(220,200,160,.35)] cursor-move select-none">⠿</span>'
    + '<select class="rounded px-1 py-1 text-[10px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none">' + FORMATION_TYPES.map(t => '<option value="' + t + '"' + (v?.formType === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>'
    + '<input placeholder="名称" class="w-12 min-w-0 flex-1 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none" value="' + esc(v?.name || '') + '">'
    + '<select class="rounded px-1 py-1 text-[10px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none">' + FORMATION_GRADES.map(g => '<option value="' + g + '"' + (v?.grade === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select>'
    + '<input placeholder="状态" class="w-16 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none" value="' + esc(v?.status || '完好') + '">'
    + '<button class="text-[rgba(200,100,60,.5)] hover:text-[rgba(200,100,60,.8)] transition text-xs shrink-0" onclick="this.closest(\'.formation-row\').remove()">✕</button>'
    + '</div>'
    + '<textarea placeholder="备注" maxlength="100" rows="2" class="w-full mt-0.5 rounded px-1.5 py-1 text-[11px] bg-[rgba(30,24,18,.6)] border border-[rgba(160,120,60,.16)] text-[#f0e8d8] outline-none resize-y" oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\'">' + esc(v?.desc || '') + '</textarea>';
  attachDragEvents(d, charFormationList, 'formation-row');
  charFormationList.appendChild(d);
}

/* 通用拖拽事件绑定 */
function attachDragEvents(d, container, className) {
  d.addEventListener('dragstart', e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); d.classList.add('opacity-40'); });
  d.addEventListener('dragend', () => { d.classList.remove('opacity-40'); container.querySelectorAll('.' + className).forEach(el => el.classList.remove('drag-over')); });
  d.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; d.classList.add('drag-over'); });
  d.addEventListener('dragleave', () => d.classList.remove('drag-over'));
  d.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation();
    d.classList.remove('drag-over');
    const rows = [...container.querySelectorAll('.' + className)];
    const dragged = rows.find(r => r.classList.contains('opacity-40'));
    if (!dragged || dragged === d) return;
    const rect = d.getBoundingClientRect();
    const after = (e.clientY - rect.top) > rect.height / 2;
    if (after) { if (d.nextSibling) container.insertBefore(dragged, d.nextSibling); else container.appendChild(dragged); }
    else { container.insertBefore(dragged, d); }
  });
}

function collectCharItems(c, g, type) {
  const items = [];
  const cls = type === 'artifact' ? '.artifact-row' : (type === 'formation' ? '.formation-row' : '.skill-row');
  const defStatus = type === 'artifact' ? '完好无缺' : (type === 'formation' ? '完好' : '可用');
  c.querySelectorAll(cls).forEach(row => {
    const inputs = row.querySelectorAll('input:not(.art-cat-chk)'), sels = row.querySelectorAll('select');
    const descEl = row.querySelector('textarea');
    const catChks = row.querySelectorAll('.art-cat-chk');
    if (!inputs.length) return;
    if (type === 'formation') {
      const formType = sels[0]?.value || '符箓';
      const name = inputs[0]?.value.trim(); if (!name) return;
      const status = inputs[1]?.value.trim() || defStatus;
      const desc = descEl ? descEl.value.trim() || '功能未知' : '功能未知';
      items.push({ name, grade: sels[1]?.value || g[g.length - 1], formType, status, desc });
    } else {
      const name = inputs[0]?.value.trim(); if (!name) return;
      const status = inputs[1]?.value.trim() || defStatus;
      const desc = descEl ? descEl.value.trim() || '功能未知' : '功能未知';
      const item = { name, grade: sels[0]?.value || g[g.length - 1], status, desc };
      if (type === 'artifact' && catChks.length) { const cats = []; catChks.forEach(cb => { if (cb.checked) cats.push(cb.value); }); if (cats.length) item.categories = cats; }
      items.push(item);
    }
  });
  return items;
}

// addBloodRowUI 已删除（血脉功能已移除）

function openEditModal(type, idx) {
  if (sidebar.classList.contains('sidebar-open')) closeSidebarFn();
  charEditIdx.value = idx; charEditSrc.value = type;
  let c; if (type === 'protagonist') c = getState().protagonist; else if (type === 'companion') c = getState().companions[idx]; else c = getState().tempCharacters[idx];
  if (!c) return;
  if (type === 'protagonist') { charTypeRow.style.display = 'none'; charRelationRow.style.display = 'none'; charTimeRow.style.display = 'none'; }
  else { charTypeRow.style.display = ''; charRelationRow.style.display = ''; charTimeRow.style.display = 'none'; charTypeSelect.innerHTML = '<option value="companion">同伴</option><option value="temp">临时角色</option>'; charTypeSelect.value = type; charTypeSelect.disabled = false; }
  charNameInput.value = c.name || ''; charStatusField.value = c.status || ''; charRelationField.value = c.relation || '';
  charRealmSelect.innerHTML = '<option value="">--</option>' + buildRealmOptions(c.realm || ''); charRealmSelect.value = c.realm || '';
  charGender.value = c.gender || '男'; charSpecies.value = c.species || '人类';
  if (charAge) charAge.value = c.age || '';
  if (charLifespan) charLifespan.value = c.lifespan || getLifespan(c.realm || '');
  const ex = c.exp || 0; const em = c.expMax || 1;
  if (charExpVal) { charExpVal.value = ex; charExpVal.setAttribute('data-expmax', em); }
  if (charExpPct) { charExpPct.value = Math.round(ex / em * 100); charExpPct.setAttribute('data-expmax', em); }
  if (charExpMaxLabel) charExpMaxLabel.textContent = em;
  if (charExpBarInner) charExpBarInner.style.width = Math.round(ex / em * 100) + '%';
  if (charBio) charBio.value = c.bio || '';
  if (charBioLock) charBioLock.checked = !!(getConfig().bioLocked || {})[c.name];
  if (type === 'protagonist') { const tl = getState().timeLocation; charTimeTime.value = tl.time || ''; charTimeLoc.value = tl.location || ''; charTimeDetail.value = tl.detail || ''; }
  charSectToggle.value = c.sect && c.sect !== '无' ? 'yes' : 'no'; charSectName.value = c.sect && c.sect !== '无' ? c.sect : ''; charSectTitle.value = c.sectTitle || ''; charSectFields.style.display = charSectToggle.value === 'yes' ? 'flex' : 'none';
  charStoneInput.value = c.spiritStones || 0; charInvInput.value = c.inventory?.length ? c.inventory.map(i => renderInvItem(i)).join(', ') : '';
  charArtifactList.innerHTML = ''; charSkillList.innerHTML = ''; charFormationList.innerHTML = '';
  (c.artifacts || []).forEach(a => addArtifactRowUI(a)); (c.skills || []).forEach(a => addSkillRowUI(a)); (c.formations || []).forEach(a => addFormationRowUI(a));
  // 自动展开有内容的栏目 + 更新计数
  const ac = c.artifacts?.length || 0, sc = c.skills?.length || 0, fc = c.formations?.length || 0;
  const aCount = document.getElementById('artifactEditCount'), sCount = document.getElementById('skillEditCount'), fCount = document.getElementById('formationEditCount');
  if (aCount) aCount.textContent = '（' + ac + '）'; if (sCount) sCount.textContent = '（' + sc + '）'; if (fCount) fCount.textContent = '（' + fc + '）';
  if (ac) { const ab = document.getElementById('artifactEditBody'); if (ab) ab.classList.remove('hidden'); }
  if (sc) { const sb = document.getElementById('skillEditBody'); if (sb) sb.classList.remove('hidden'); }
  if (fc) { const fb = document.getElementById('formationEditBody'); if (fb) fb.classList.remove('hidden'); }
  if (charGoal) { charGoal.value = c.goal || ''; charGoal.style.display = (type === 'protagonist') ? '' : 'none'; }
  if (editGoalLabel) editGoalLabel.style.display = (type === 'protagonist') ? '' : 'none';
  charRealmSelect.onchange = function() { const rd = getRealmDefaults(this.value); const em = rd.expMax; if (charExpVal) charExpVal.setAttribute('data-expmax', em); if (charExpPct) charExpPct.setAttribute('data-expmax', em); if (charExpMaxLabel) charExpMaxLabel.textContent = em; if (charStoneInput) { charStoneInput.setAttribute('data-expmax', em); charStoneInput.setAttribute('data-hpmax', rd.hpMax); charStoneInput.setAttribute('data-mpmax', rd.mpMax); } updateExpBar(); };
  if (charExpVal) charExpVal.oninput = function() { const em = parseInt(this.getAttribute('data-expmax')) || 1; const v = Math.min(parseInt(this.value) || 0, em); if (charExpPct) charExpPct.value = Math.round(v / em * 100); updateExpBar(); };
  if (charExpPct) charExpPct.oninput = function() { const em = parseInt(this.getAttribute('data-expmax')) || 1; const p = Math.min(parseFloat(this.value) || 0, 100); if (charExpVal) charExpVal.value = Math.round(em * p / 100); updateExpBar(); };
  function updateExpBar() { const em = charExpVal ? parseInt(charExpVal.getAttribute('data-expmax')) || 1 : 1; const ex = charExpVal ? parseInt(charExpVal.value) || 0 : 0; if (charExpBarInner) charExpBarInner.style.width = Math.round(Math.min(ex, em) / em * 100) + '%'; }
  showModal(charEditOverlay, charEditModal);
}
function closeCE() { hideModal(charEditOverlay, charEditModal); }
function toggleBioLock(name) { const bl = getConfig().bioLocked || {}; bl[name] = !bl[name]; getConfig().bioLocked = bl; saveAll(); renderSidebar(); }

/* 世界书：数组→字符串 */
function rebuildWorldBook(sections) { return sections.map(s => s.heading + '\n' + s.content).join('\n\n'); }

/* 世界书每节独立渲染 + 编辑功能 */
let wbEditIdx = -1;
function getWbArr() { return data.worldBook || JSON.parse(JSON.stringify(WB_DEFAULT)); }

function renderWorldBookSections(arr) {
  const sections = Array.isArray(arr) ? arr : parseWorldBookSections(arr);
  let html = '';
  sections.forEach((sec, i) => {
    if (!sec || !sec.heading) return;
    const isEditing = wbEditIdx === i;
    html += '<div class="rounded-lg border border-[rgba(160,120,60,.08)] overflow-hidden mb-2">'
      + '<div class="flex items-center justify-between px-3 py-2 cursor-pointer bg-[rgba(20,18,16,.4)] hover:bg-[rgba(160,120,60,.05)] transition" onclick="if(' + i + '!==wbEditIdx)document.getElementById(\'wbBody_' + i + '\').classList.toggle(\'hidden\')">'
      + '<span class="text-xs text-[rgba(255,255,255,.65)] font-medium">' + esc(sec.heading) + '</span>'
      + '<div class="flex gap-1" onclick="event.stopPropagation()">'
      + (isEditing
        ? '<button onclick="saveWbSec(' + i + ')" class="px-2 py-0.5 rounded text-[9px] bg-[rgba(180,140,60,.2)] text-[rgba(220,200,160,.6)] hover:bg-[rgba(180,140,60,.3)] transition">保存</button><button onclick="cancelWbEdit()" class="px-2 py-0.5 rounded text-[9px] bg-[rgba(180,80,60,.15)] text-[rgba(220,140,140,.5)] hover:bg-[rgba(200,60,60,.2)] transition">取消</button>'
        : '<button onclick="editWbSec(' + i + ')" class="px-2 py-0.5 rounded text-[9px] bg-[rgba(160,120,60,.12)] text-[rgba(220,200,160,.42)] hover:bg-[rgba(160,120,60,.2)] transition">✏️</button><button onclick="deleteWbSec(' + i + ')" class="px-2 py-0.5 rounded text-[9px] bg-[rgba(200,60,60,.12)] text-[rgba(220,140,140,.4)] hover:bg-[rgba(200,60,60,.2)] transition">✕</button>')
      + '</div></div>'
      + (isEditing
        ? '<textarea id="wbEdit_' + i + '" class="w-full p-2 text-[11px] bg-[rgba(30,24,18,.6)] text-[#f0e8d8] outline-none border-t border-[rgba(160,120,60,.08)] resize-y" rows="6">' + esc(sec.content || '') + '</textarea>'
        : '<div id="wbBody_' + i + '" class="hidden px-3 pb-2 pt-1"><pre class="text-[11px] text-[rgba(255,255,255,.5)] leading-relaxed whitespace-pre-wrap font-[\'PingFang_SC\',\'Microsoft_YaHei\']">' + esc(sec.content || '（空）') + '</pre></div>')
      + '</div>';
  });
  return html || '<div class="text-xs text-[rgba(220,200,160,.2)] text-center py-8">暂无内容</div>';
}

function refreshWbView() { wbEditIdx = -1; worldBookStructured.innerHTML = renderWorldBookSections(getWbArr()); }
function editWbSec(i) { wbEditIdx = i; worldBookStructured.innerHTML = renderWorldBookSections(getWbArr()); }
function cancelWbEdit() { refreshWbView(); }
function saveWbSec(i) {
  const ta = document.getElementById('wbEdit_' + i); if (!ta) return;
  data.worldBook[i].content = ta.value.trim(); saveAll(); refreshWbView(); showToast('✓ 章节已保存');
}
function deleteWbSec(i) {
  const sec = data.worldBook[i];
  if (!confirm('确认删除「' + sec.heading + '」？')) return;
  if (data.worldBook.length <= 1) { showToast('至少保留一个章节'); return; }
  data.worldBook.splice(i, 1); saveAll(); refreshWbView(); showToast('✓ 章节已删除');
}
