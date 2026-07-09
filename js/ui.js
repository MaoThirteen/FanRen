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
const settingsBtn = $('settingsBtn'), settingsOverlay = $('settingsOverlay'), settingsModal = $('settingsModal'), closeSettings = $('closeSettings');
const apiBase = $('apiBase'), apiBase2 = $('apiBase2'), apiModel = $('apiModel'), apiModel2 = $('apiModel2'), apiKey = $('apiKey'), apiKey2 = $('apiKey2'), simMode = $('simMode');
const testMainApiBtn = $('testMainApiBtn'), testBackupApiBtn = $('testBackupApiBtn'), mainApiStatus = $('mainApiStatus'), backupApiStatus = $('backupApiStatus');
const cleanupBtn = $('cleanupBtn'), resetDataBtn = $('resetDataBtn'), rawToggle = $('rawToggle'), rawArea = $('rawArea'), rawContent = $('rawContent'), rawArrow = $('rawArrow');
const summaryBtn = $('summaryBtn'), summaryOverlay = $('summaryOverlay'), summaryModal = $('summaryModal'), summaryList = $('summaryList'), closeSummary = $('closeSummary');
const summaryDelModeBtn = $('summaryDelModeBtn'), summaryDelTools = $('summaryDelTools'), summarySelectAll = $('summarySelectAll'), summaryDeleteSelected = $('summaryDeleteSelected');
const logBtn = $('logBtn'), logOverlay = $('logOverlay'), logModal = $('logModal'), logList = $('logList'), closeLog = $('closeLog'), clearLogBtn = $('clearLogBtn');
const charEditOverlay = $('charEditOverlay'), charEditModal = $('charEditModal'), closeCharEdit = $('closeCharEdit');
const charTypeSelect = $('charTypeSelect'), charNameInput = $('charNameInput'), charRealmSelect = $('charRealmSelect');
const charArtifactList = $('charArtifactList'), charSkillList = $('charSkillList'), charStoneInput = $('charStoneInput'), charInvInput = $('charInvInput');
const saveCharBtn = $('saveCharBtn'), addArtifactRow = $('addArtifactRow'), addSkillRow = $('addSkillRow');
const charBloodList = $('charBloodList'), addBloodRow = $('addBloodRow'), charDaoRoot = $('charDaoRoot'), charGender = $('charGender');
const charSectToggle = $('charSectToggle'), charSectName = $('charSectName'), charSectTitle = $('charSectTitle'), charSectFields = $('charSectFields');
const charStatusField = $('charStatusField'), charRelationField = $('charRelationField');
const charEditIdx = $('charEditIdx'), charEditSrc = $('charEditSrc'), charTypeRow = $('charTypeRow'), charStatusRow = $('charStatusRow'), charRelationRow = $('charRelationRow');
const exportImportBtn = $('exportImportBtn'), exportImportOverlay = $('exportImportOverlay'), exportImportModal = $('exportImportModal'), closeExportImport = $('closeExportImport');
const doExportBtn = $('doExportBtn'), doImportBtn = $('doImportBtn'), importFileInput = $('importFileInput');
const confirmOverlay = $('confirmOverlay'), confirmModal = $('confirmModal'), confirmTitle = $('confirmTitle'), confirmMsg = $('confirmMsg');
const confirmOkBtn = $('confirmOkBtn'), confirmCancelBtn = $('confirmCancelBtn');
const paramBtn = $('paramBtn'), paramOverlay = $('paramOverlay'), paramModal = $('paramModal'), closeParam = $('closeParam');
const tempSlider = $('tempSlider'), topPSlider = $('topPSlider'), penSlider = $('penSlider');
const tempVal = $('tempVal'), topPVal = $('topPVal'), penVal = $('penVal');
const promptGearBtn = $('promptGearBtn'), promptPanel = $('promptPanel'), promptOverlay = $('promptOverlay'), promptContent = $('promptContent');
const copyPromptBtn = $('copyPromptBtn'), closePromptBtn = $('closePromptBtn');

/* ---- 全局状态 ---- */
let deleteMode = false, summaryDeleteMode = false, confirmTimer = null, lt = null;
let isLoading = false, lastUserInput = '';

/* ---- 弹窗通用 ---- */
function showModal(ov, md) { ov.classList.remove('opacity-0','pointer-events-none'); ov.classList.add('opacity-100'); md.classList.remove('opacity-0','pointer-events-none'); md.classList.add('opacity-100'); md.style.pointerEvents = 'auto'; ov.style.pointerEvents = 'auto'; }
function hideModal(ov, md) { ov.classList.remove('opacity-100'); ov.classList.add('opacity-0'); md.classList.remove('opacity-100'); md.classList.add('opacity-0'); ov.style.pointerEvents = 'none'; md.style.pointerEvents = 'none'; setTimeout(() => { ov.classList.add('pointer-events-none'); md.classList.add('pointer-events-none'); }, 300); }
function closeSidebarFn() { sidebar.classList.remove('sidebar-open'); sidebar.classList.add('sidebar-enter','pointer-events-none'); sidebarOverlay.classList.remove('opacity-100'); sidebarOverlay.classList.add('opacity-0'); sidebarOverlay.style.pointerEvents = 'none'; }

/* ---- 消息渲染 ---- */
function scrollToBottom() { setTimeout(() => { chatArea.scrollTop = chatArea.scrollHeight; }, 50); }
function appendMsg(r, c, sn) {
  const u = r === 'user'; const h = chatArea.querySelector('.text-center'); if (h) h.remove();
  const d = document.createElement('div'); d.className = 'chat-msg flex ' + (u ? 'justify-end' : 'justify-start');
  const m = u ? 'max-w-[75%]' : 'max-w-[85%]';
  d.innerHTML = '<div class="' + m + ' rounded-2xl px-4 py-3 ' + (u ? 'bg-gradient-to-br from-[rgba(74,122,255,.15)] to-[rgba(100,80,220,.1)] border border-[rgba(100,90,200,.12)]' : 'bg-[rgba(18,20,40,.6)] border border-[rgba(100,90,180,.06)]') + '"><div class="text-sm leading-relaxed whitespace-pre-wrap text-[rgba(220,220,240,.8)]">' + esc(c) + '</div>' + (sn ? '<div class="text-[10px] mt-1.5 ' + (sn.includes('✓') ? 'text-[rgba(120,200,160,.5)]' : 'text-[rgba(200,160,80,.45)]') + '">' + sn + '</div>' : '') + '</div>';
  chatArea.appendChild(d); scrollToBottom();
}
function renderMessages() { const ms = data.chatHistory || []; chatArea.innerHTML = '<div class="text-center text-[rgba(180,180,220,.2)] text-sm tracking-[2px] pt-8 select-none">— 故事从这里开始 —</div>'; ms.forEach(m => appendMsg(m.role, m.content, m.statusNotice)); scrollToBottom(); }

/* ---- 流式气泡 ---- */
function createStreamBubble() { const oldB = document.getElementById('streamB'); if (oldB) oldB.remove(); if (lt) { clearInterval(lt); lt = null; } const d = document.createElement('div'); d.id = 'streamB'; d.className = 'chat-msg flex justify-start'; d.innerHTML = '<div class="max-w-[85%] rounded-2xl px-4 py-3 bg-[rgba(18,20,40,.6)] border border-[rgba(100,90,180,.06)]"><div id="streamContent" class="text-sm leading-relaxed whitespace-pre-wrap text-[rgba(220,220,240,.8)]"></div><div id="streamTimer" class="text-[10px] text-[rgba(180,180,220,.25)] mt-2 tracking-[1px]">修仙世界运转中… 0秒</div></div>'; chatArea.appendChild(d); scrollToBottom(); let sec = 0; lt = setInterval(() => { sec++; const e = document.getElementById('streamTimer'); if (e) e.textContent = '修仙世界运转中… ' + sec + '秒'; }, 1000); return d; }
function appendStreamText(t) { const el = document.getElementById('streamContent'); if (el) el.textContent += t; scrollToBottom(); }
function finalizeStreamBubble(sn, cleanText) { const d = document.getElementById('streamB'); if (!d) return; if (lt) { clearInterval(lt); lt = null; } if (cleanText !== undefined) { const sc = document.getElementById('streamContent'); if (sc) sc.textContent = cleanText; } const timer = document.getElementById('streamTimer'); if (timer) { const tn = sn || ''; timer.textContent = tn; timer.style.color = tn.includes('✓') ? 'rgba(120,200,160,.5)' : 'rgba(200,160,80,.45)'; timer.innerHTML = tn + ' <button onclick="event.stopPropagation();regenerate()" class="ml-2 px-2 py-0.5 rounded text-[10px] bg-[rgba(100,90,180,.1)] border border-[rgba(100,90,180,.12)] text-[rgba(160,180,240,.5)] hover:bg-[rgba(100,90,180,.2)] transition">🔄 重新生成</button>'; } d.removeAttribute('id'); }
function removeStreamBubble() { const d = document.getElementById('streamB'); if (d) d.remove(); if (lt) { clearInterval(lt); lt = null; } }
function addRegenBtn() { const msgs = chatArea.querySelectorAll('.chat-msg:not(.justify-end)'); if (!msgs.length) return; const last = msgs[msgs.length - 1]; const inner = last.querySelector('.rounded-2xl'); if (!inner) return; const btn = document.createElement('div'); btn.className = 'text-[10px] mt-1.5 text-[rgba(160,180,240,.4)]'; btn.innerHTML = '<button onclick="event.stopPropagation();regenerate()" class="px-2 py-0.5 rounded bg-[rgba(100,90,180,.1)] border border-[rgba(100,90,180,.12)] hover:bg-[rgba(100,90,180,.2)] transition">🔄 重新生成</button>'; inner.appendChild(btn); }

/* ---- 日志 ---- */
function addLog(msg) { if (!data.logs) data.logs = []; const ts = new Date().toLocaleTimeString(); data.logs.push('[' + ts + '] ' + msg); if (data.logs.length > 200) data.logs = data.logs.slice(-200); saveAll(); }
function renderLogs() { const logs = data.logs || []; if (!logs.length) { logList.innerHTML = '<div class="text-xs text-[rgba(180,180,220,.15)] text-center py-8">暂无日志</div>'; return; } logList.innerHTML = logs.slice().reverse().map(l => '<div class="leading-relaxed py-0.5 border-b border-[rgba(100,90,180,.03)] text-[11px] text-[rgba(200,200,230,.35)]">' + esc(l) + '</div>').join(''); }

/* ---- 侧边栏渲染 ---- */
function collapsibleBlock(t, c, h, e) { const id = 'c_' + Math.random().toString(36).slice(2, 6); return '<div class="rounded-lg border border-[rgba(100,90,180,.05)] overflow-hidden"><div class="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-[rgba(100,90,180,.05)] transition" onclick="document.getElementById(\'' + id + '\').classList.toggle(\'hidden\');this.querySelector(\'.ca\').classList.toggle(\'rotate-180\')"><span class="text-xs text-[rgba(180,180,220,.3)]">' + t + (c !== undefined ? ' <span class="text-[rgba(180,180,220,.15)]">（' + c + '）</span>' : '') + '</span><span class="ca text-[10px] text-[rgba(180,180,220,.15)] transition-transform">▸</span></div><div id="' + id + '" class="hidden px-2.5 pb-2 space-y-1">' + (h || '<span class="text-xs text-[rgba(180,180,220,.15)]">' + (e || '无') + '</span>') + '</div></div>'; }
function renderItemLine(item, type) { const g = item.grade || ((type === 'skill' ? SKILL_GRADES : ARTIFACT_GRADES).slice(-1)[0]); return '<div class="rounded-lg px-2 py-1 cursor-pointer text-xs border border-transparent hover:border-[rgba(100,90,180,.08)]" onclick="this.querySelector(\'.ib\').classList.toggle(\'open\')"><span class="text-[rgba(200,200,230,.5)]">' + esc(item.name) + '</span> ' + gradeTag(g) + '<span class="float-right text-[rgba(180,180,220,.12)]">▾</span><div class="ib artifact-body text-[10px] text-[rgba(180,180,220,.25)] pl-1">' + esc(item.desc || '') + '</div></div>'; }

function renderCharCard(c, o) {
  const st = o?.timeLocation, sb = o?.bloodline !== false, si = o?.inventory !== false, pr = o?.protagonist, comp = o?.companion, istemp = o?.temp;
  const eP = c.expMax > 0 ? Math.round(c.exp / c.expMax * 100) : 0, hP = c.hpMax > 0 ? Math.round(c.hp / c.hpMax * 100) : 0, mP = c.mpMax > 0 ? Math.round(c.mp / c.mpMax * 100) : 0;
  const tl = getState().timeLocation, clpsId = 'l_' + Math.random().toString(36).slice(2, 6);
  const aH = c.artifacts?.length ? c.artifacts.map(a => renderItemLine(a, 'artifact')).join('') : '无';
  const sH = c.skills?.length ? c.skills.map(a => renderItemLine(a, 'skill')).join('') : '无';
  const iH = c.inventory?.length ? c.inventory.map(i => '<span class="text-[rgba(200,200,230,.4)]">' + renderInvItem(i) + '</span>').join('') : '空';
  const nCol = pr ? 'text-[#e8c860]' : comp ? 'text-[#70d090]' : 'text-[rgba(200,200,240,.7)]';
  const seTxt = c.sect || '无';
  const relTag = !pr && c.relation ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(100,200,100,.08)] border border-[rgba(100,200,100,.15)] text-[rgba(140,200,140,.5)]">' + esc(c.relation) + '</span>' : '';
  const hasFold = comp || istemp;
  const body = '<div class="text-sm tracking-[1px] text-[rgba(200,200,230,.6)] font-medium">' + esc(c.realm || '?') + '</div>'
    + (sb || !istemp ? '<div class="text-xs text-[rgba(200,200,230,.35)]">灵根：' + (c.daoRoot ? esc(c.daoRoot) : '无') + '</div>' : '')
    + (sb || !istemp ? '<div class="text-xs text-[rgba(200,200,230,.35)]">血脉：' + (Array.isArray(c.bloodline) ? c.bloodline.filter(x => x !== '无').join('、') || '无' : (c.bloodline && c.bloodline !== '无' ? esc(c.bloodline) : '无')) + '</div>' : '')
    + (c.gender ? '<div class="text-xs text-[rgba(200,200,230,.3)]">性别：' + esc(c.gender) + ' · 宗门：' + esc(seTxt) + (c.sectTitle ? '·' + esc(c.sectTitle) : '') + '</div>' : '<div class="text-xs text-[rgba(200,200,230,.35)]">宗门：' + esc(seTxt) + (c.sectTitle ? '·' + esc(c.sectTitle) : '') + '</div>')
    + '<div class="text-xs text-[rgba(200,200,230,.45)]">修为：' + (c.exp || 0) + '/' + (c.expMax || 100) + '（' + getExpStage(eP) + '）</div>'
    + bar('', c.exp || 0, c.expMax || 100, 'from-[#e8c860] to-[#d4a830]')
    + '<div class="text-xs text-[rgba(200,200,230,.45)]">血量：' + (c.hp || 0) + '/' + (c.hpMax || 100) + '（' + getHpStage(hP) + '）</div>'
    + bar('', c.hp || 0, c.hpMax || 100, 'from-[#d06060] to-[#b04040]')
    + '<div class="text-xs text-[rgba(200,200,230,.45)]">法力：' + (c.mp || 0) + '/' + (c.mpMax || 50) + '（' + getMpStage(mP) + '）</div>'
    + bar('', c.mp || 0, c.mpMax || 50, 'from-[#4a7aff] to-[#58d6ff]')
    + collapsibleBlock('法器', c.artifacts?.length, aH) + collapsibleBlock('功法', c.skills?.length, sH)
    + '<div class="text-xs text-[rgba(200,200,230,.5)]">灵石：' + (c.spiritStones || 0) + '</div>'
    + '<div class="text-xs text-[rgba(180,180,220,.3)]">背包：' + iH + '</div>'
    + '<div class="text-xs text-[rgba(180,180,220,.3)]">状态：' + esc(c.status || c.tag || '') + '</div>';
  const foldHtml = hasFold
    ? '<div class="comp-collapse-btn flex items-center justify-between px-3 py-2 rounded-xl bg-[rgba(15,15,35,.25)] border border-[rgba(100,90,180,.05)] cursor-pointer" onclick="document.getElementById(\'' + clpsId + '\').classList.toggle(\'hidden\');this.querySelector(\'.fld\').classList.toggle(\'rotate-90\')"><div class="flex items-center gap-2"><span class="text-base font-bold tracking-[2px] ' + nCol + '">' + esc(c.name) + '</span>' + relTag + '</div><span class="fld text-[rgba(180,180,220,.25)] transition-transform" style="display:inline-block;font-size:14px">▸</span></div><div id="' + clpsId + '" class="hidden rounded-xl px-3 py-3 bg-[rgba(15,15,35,.25)] border border-[rgba(100,90,180,.05)] space-y-1.5">' + body + '</div>'
    : '<div class="rounded-xl px-3 py-3 bg-[rgba(15,15,35,.25)] border border-[rgba(100,90,180,.05)] space-y-1.5">' + (st ? '<div class="text-sm tracking-[1px] text-[rgba(200,200,230,.4)]">' + esc(tl.time) + (tl.location ? '·' + esc(tl.location) : '') + (tl.detail ? '·' + esc(tl.detail) : '') + (tl.day ? '·' + esc(tl.day) : '') + '</div>' : '') + '<div class="text-base font-bold tracking-[2px] ' + nCol + '">' + esc(c.name) + '</div>' + body + '</div>';
  return foldHtml;
}

const MODULE_DEFS = [{ key:'protagonist', icon:'◈', label:'主角状态' }, { key:'companions', icon:'✦', label:'同伴' }, { key:'temp', icon:'◇', label:'临时角色' }];

function renderSidebar() {
  const s = getState(), f = getConfig().sidebarFold;
  const tl = getState().timeLocation; tlDisplay.innerHTML = esc(tl.time) + (tl.location ? '·' + esc(tl.location) : '') + (tl.detail ? '·' + esc(tl.detail) : '') + (tl.day ? '·' + esc(tl.day) : '');
  sidebarModules.innerHTML = MODULE_DEFS.map(d => { const o = !f[d.key]; return '<div class="module-item ' + (o ? 'module-open' : '') + '"><div class="module-header flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer bg-[rgba(15,15,35,.35)] border border-[rgba(100,90,180,.05)] hover:border-[rgba(100,90,180,.12)] transition" data-key="' + d.key + '"><div class="flex items-center gap-2.5"><span class="text-[rgba(180,180,220,.35)] text-xs">' + d.icon + '</span><span class="text-xs tracking-[2px] text-[rgba(200,200,230,.55)]">' + d.label + '</span><span class="text-[10px] text-[rgba(180,180,220,.25)]" id="sbBadge_' + d.key + '"></span></div><span class="module-arrow text-[rgba(180,180,220,.2)] text-xs">▾</span></div><div class="module-body px-3 pt-3 pb-2 space-y-2 ' + (o ? '' : 'hidden') + '" id="sbBody_' + d.key + '"></div></div>'; }).join('');
  sidebarModules.querySelectorAll('.module-header').forEach(el => { el.addEventListener('click', () => { const k = el.dataset.key; getConfig().sidebarFold[k] = !getConfig().sidebarFold[k]; saveAll(); renderSidebar(); }); });
  renderProtagonist(); renderCompanions(); renderTempChars();
}

function editBtns(type, i) { return deleteMode ? '<div class="absolute top-2 right-2 flex gap-1"><button class="px-2 py-0.5 rounded text-[10px] bg-[rgba(100,160,200,.2)] text-[rgba(160,200,240,.5)] hover:bg-[rgba(100,160,200,.35)] transition" onclick="event.stopPropagation();openEditModal(\'' + type + '\',' + i + ')">编辑</button><button class="px-2 py-0.5 rounded text-[10px] bg-[rgba(200,60,60,.25)] text-[rgba(240,200,200,.6)] hover:bg-[rgba(200,60,60,.4)] transition" onclick="event.stopPropagation();showDeleteConfirm(\'' + type + '\',' + i + ')">删除</button></div>' : ''; }
function renderProtagonist() { const s = getState().protagonist, b = $('sbBody_protagonist'), badge = $('sbBadge_protagonist'); const p = s.expMax > 0 ? Math.round(s.exp / s.expMax * 100) : 0; badge.textContent = s.realm + ' ' + p + '%'; b.innerHTML = '<div class="relative">' + renderCharCard(s, { timeLocation:false, protagonist:true }) + editBtns('protagonist', -1) + '</div>'; }
function renderCompanions() { const s = getState().companions, b = $('sbBody_companions'), badge = $('sbBadge_companions'); badge.textContent = s.length ? s.length + '人' : '无'; if (!s.length) { b.innerHTML = '<div class="text-xs text-[rgba(180,180,220,.15)]">无同伴</div>'; return; } b.innerHTML = s.map((c, i) => '<div class="relative">' + renderCharCard(c, { companion:true }) + editBtns('companion', i) + '</div>').join(''); }
function renderTempChars() { const s = getState().tempCharacters, b = $('sbBody_temp'), badge = $('sbBadge_temp'); badge.textContent = s.length ? s.length + '个' : '无'; if (!s.length) { b.innerHTML = '<div class="text-xs text-[rgba(180,180,220,.15)]">无临时角色</div>'; return; } b.innerHTML = s.map((c, i) => '<div class="relative">' + renderCharCard(c, { temp:true }) + editBtns('temp', i) + '</div>').join(''); }

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
function addArtifactRowUI(v) { const d = document.createElement('div'); d.className = 'flex gap-1 items-start'; d.innerHTML = '<input placeholder="名称" class="flex-1 rounded px-1.5 py-0.5 text-[10px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none" value="' + (v?.name || '') + '"><select class="rounded px-0.5 py-0.5 text-[9px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none">' + ARTIFACT_GRADES.map(g => '<option value="' + g + '"' + (v?.grade === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select><input placeholder="≤15字" maxlength="15" class="w-20 rounded px-1.5 py-0.5 text-[10px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none" value="' + (v?.desc || '') + '"><button class="text-[rgba(200,80,80,.4)] hover:text-[rgba(200,80,80,.7)] transition text-xs" onclick="this.parentElement.remove()">✕</button>'; charArtifactList.appendChild(d); }
function addSkillRowUI(v) { const d = document.createElement('div'); d.className = 'flex gap-1 items-start'; d.innerHTML = '<input placeholder="名称" class="flex-1 rounded px-1.5 py-0.5 text-[10px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none" value="' + (v?.name || '') + '"><select class="rounded px-0.5 py-0.5 text-[9px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none">' + SKILL_GRADES.map(g => '<option value="' + g + '"' + (v?.grade === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select><input placeholder="≤15字" maxlength="15" class="w-20 rounded px-1.5 py-0.5 text-[10px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none" value="' + (v?.desc || '') + '"><button class="text-[rgba(200,80,80,.4)] hover:text-[rgba(200,80,80,.7)] transition text-xs" onclick="this.parentElement.remove()">✕</button>'; charSkillList.appendChild(d); }
function collectCharItems(c, g) { const items = []; c.querySelectorAll('div').forEach(row => { if (!row.parentNode || row.parentNode !== c) return; const inputs = row.querySelectorAll('input'), sel = row.querySelector('select'), name = inputs[0]?.value.trim(), desc = inputs[1]?.value.trim(); if (name) items.push({ name, grade:sel?.value || g[g.length - 1], desc:desc || '功能未知' }); }); return items; }
function addBloodRowUI(v) { const d = document.createElement('div'); d.className = 'flex gap-1 items-start'; d.innerHTML = '<input placeholder="血脉名称" class="flex-1 rounded px-1.5 py-0.5 text-[10px] bg-[rgba(10,10,25,.6)] border border-[rgba(100,90,180,.12)] text-[#d0d0e8] outline-none" value="' + (typeof v === 'string' ? v : '') + '"><button class="text-[rgba(200,80,80,.4)] hover:text-[rgba(200,80,80,.7)] transition text-xs" onclick="this.parentElement.remove()">✕</button>'; charBloodList.appendChild(d); }

function openEditModal(type, idx) {
  if (sidebar.classList.contains('sidebar-open')) closeSidebarFn();
  charEditIdx.value = idx; charEditSrc.value = type;
  let c; if (type === 'protagonist') c = getState().protagonist; else if (type === 'companion') c = getState().companions[idx]; else c = getState().tempCharacters[idx];
  if (!c) return;
  if (type === 'protagonist') { charTypeRow.style.display = 'none'; charRelationRow.style.display = 'none'; }
  else { charTypeRow.style.display = ''; charRelationRow.style.display = ''; charTypeSelect.innerHTML = '<option value="companion">同伴</option><option value="temp">临时角色</option>'; charTypeSelect.value = type; charTypeSelect.disabled = false; }
  charNameInput.value = c.name || ''; charStatusField.value = c.status || ''; charRelationField.value = c.relation || '';
  charRealmSelect.innerHTML = '<option value="">--</option>' + buildRealmOptions(c.realm || ''); charRealmSelect.value = c.realm || '';
  charDaoRoot.value = c.daoRoot || ''; charGender.value = c.gender || '男';
  charSectToggle.value = c.sect && c.sect !== '无' ? 'yes' : 'no'; charSectName.value = c.sect && c.sect !== '无' ? c.sect : ''; charSectTitle.value = c.sectTitle || ''; charSectFields.style.display = charSectToggle.value === 'yes' ? 'flex' : 'none';
  charStoneInput.value = c.spiritStones || 0; charInvInput.value = c.inventory?.length ? c.inventory.map(i => renderInvItem(i)).join(', ') : '';
  charArtifactList.innerHTML = ''; charSkillList.innerHTML = ''; charBloodList.innerHTML = '';
  (c.artifacts || []).forEach(a => addArtifactRowUI(a)); (c.skills || []).forEach(a => addSkillRowUI(a));
  (Array.isArray(c.bloodline) ? c.bloodline : [c.bloodline || '无']).filter(x => x !== '无').forEach(b => addBloodRowUI(b));
  charRealmSelect.onchange = function() { const rd = getRealmDefaults(this.value); document.getElementById('charStoneInput').setAttribute('data-expmax', rd.expMax); document.getElementById('charStoneInput').setAttribute('data-hpmax', rd.hpMax); document.getElementById('charStoneInput').setAttribute('data-mpmax', rd.mpMax); };
  showModal(charEditOverlay, charEditModal);
}
function closeCE() { hideModal(charEditOverlay, charEditModal); }
