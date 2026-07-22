/* ============================================================
   main.js — 初始化入口 + 事件绑定
   依赖: data.js, storage.js, ui.js, core.js
   ============================================================ */

function init() {
  renderSidebar(); renderMessages();
  charRealmSelect.innerHTML = '<option value="">--</option>' + buildRealmOptions('');

  addArtifactRow.addEventListener('click', () => addArtifactRowUI());
  addSkillRow.addEventListener('click', () => addSkillRowUI());
  if (addFormationRow) addFormationRow.addEventListener('click', () => addFormationRowUI());

  // 输入与发送
  inputBox.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputBox.value); } });
  sendBtn.addEventListener('click', () => sendMessage(inputBox.value));
  let extraOpen = false; extraToggleBtn.addEventListener('click', () => { extraOpen = !extraOpen; extraPanel.style.maxHeight = extraOpen ? '80px' : '0'; extraToggleBtn.textContent = extraOpen ? '－' : '＋'; });
  const sbb = document.getElementById('scrollBottomBtn'); if (sbb) sbb.addEventListener('click', () => { const last = chatArea.lastElementChild; if (last) last.scrollIntoView({ behavior:'smooth', block:'end' }); else chatArea.scrollTop = chatArea.scrollHeight; sbb.style.color = '#f0e8d8'; setTimeout(() => { sbb.style.color = ''; }, 200); });

  // 侧边栏
  menuBtn.addEventListener('click', () => { sidebar.classList.remove('sidebar-enter','pointer-events-none'); sidebar.classList.add('sidebar-open'); sidebarOverlay.classList.remove('opacity-0','pointer-events-none'); sidebarOverlay.classList.add('opacity-100'); sidebarOverlay.style.pointerEvents = 'auto'; });
  closeSidebar.addEventListener('click', closeSidebarFn);
  sidebarOverlay.addEventListener('click', closeSidebarFn);
  delModeBtn.addEventListener('click', () => { deleteMode = !deleteMode; delModeBtn.style.background = deleteMode ? 'rgba(200,80,80,.15)' : ''; renderSidebar(); });

  // 新增角色
  addCharSidebarBtn.addEventListener('click', () => {
    if (sidebar.classList.contains('sidebar-open')) closeSidebarFn();
    charEditIdx.value = '-1'; charEditSrc.value = ''; charTypeRow.style.display = ''; charRelationRow.style.display = '';
    charTypeSelect.innerHTML = '<option value="companion">同伴</option><option value="temp">临时角色</option>'; charTypeSelect.disabled = false;
    charNameInput.value = ''; charStatusField.value = ''; charRelationField.value = '';
    charRealmSelect.innerHTML = '<option value="">--</option>' + buildRealmOptions('');
    charGender.value = '男'; charSpecies.value = '人类'; charSectToggle.value = 'no'; charSectName.value = ''; charSectTitle.value = ''; charSectFields.style.display = 'none';
    charStoneInput.value = '0'; charInvInput.value = ''; charArtifactList.innerHTML = ''; charSkillList.innerHTML = ''; charFormationList.innerHTML = ''; if (charGoal) { charGoal.value = ''; charGoal.style.display = 'none'; } if (editGoalLabel) editGoalLabel.style.display = 'none';
    saveCharBtn.textContent = '保存角色'; showModal(charEditOverlay, charEditModal);
  });
  closeCharEdit.addEventListener('click', closeCE); charEditOverlay.addEventListener('click', closeCE);

  // 保存角色
  saveCharBtn.addEventListener('click', function() {
    const name = charNameInput.value.trim(); if (!name) { showToast('请输入角色名称'); return; }
    const isNew = charEditSrc.value === ''; let type = isNew ? charTypeSelect.value : charEditSrc.value;
    if (!isNew && type !== 'protagonist') type = charTypeSelect.value;
    const realm = charRealmSelect.value; if (!realm) { showToast('请选择修为境界'); return; }
    const sect = charSectToggle.value === 'yes' ? charSectName.value.trim() || '未知宗门' : '无'; const sectTitle = charSectToggle.value === 'yes' ? charSectTitle.value.trim() || '散修' : '散修';
    const artifacts = collectCharItems(charArtifactList, ARTIFACT_GRADES, 'artifact'); const skills = collectCharItems(charSkillList, SKILL_GRADES, 'skill'); const formations = collectCharItems(charFormationList, FORMATION_GRADES, 'formation');
    const goal = charGoal ? charGoal.value.trim() : '';
    const stones = parseInt(charStoneInput.value) || 0;
    const invRaw = charInvInput.value.trim(); const inv = invRaw ? invRaw.split(/[,，、]/).map(s => { const t = s.trim(); if (!t) return null; const m = t.match(/×(\d+)/); return m ? { name:t.replace(/×\d+/, '').trim(), count:parseInt(m[1]) } : { name:t, count:1 }; }).filter(Boolean) : [];
    const rd = getRealmDefaults(realm); const isNC = isNew; let prevE = 0;
    if (!isNC) { const src = getState(); if (type === 'protagonist') prevE = src.protagonist.exp || 0; else if (type === 'companion') prevE = (src.companions[parseInt(charEditIdx.value)] || {}).exp || 0; else prevE = (src.tempCharacters[parseInt(charEditIdx.value)] || {}).exp || 0; }
    // 解析修为经验（支持百分比）
    let expVal = isNC ? 0 : prevE;
    if (charExpVal) { const v = parseInt(charExpVal.value); if (!isNaN(v)) expVal = Math.min(v, rd.expMax); }
    if (expVal > rd.expMax) expVal = rd.expMax;
    const gender = charGender.value || '男';
    const species = (charSpecies ? charSpecies.value : '人类') || '人类';
    const ageVal = charAge ? parseInt(charAge.value) || 16 : 16;
    const lifespanVal = charLifespan ? parseInt(charLifespan.value) || getLifespan(realm) : getLifespan(realm);
    const char = { name, realm, species, gender, bio:(charBio?charBio.value.trim():''), sect, sectTitle, relation:charRelationField.value.trim() || '同行', exp:expVal, expMax:rd.expMax, hp:rd.hpMax, hpMax:rd.hpMax, mp:rd.mpMax, mpMax:rd.mpMax, artifacts, skills, formations, spiritStones:stones, inventory:inv, status:charStatusField.value.trim() };
    if (type === 'protagonist') { char.age = ageVal; char.lifespan = lifespanVal; char.goal = goal; }
    // 保存bio锁状态
    if (charBioLock) { if (!getConfig().bioLocked) getConfig().bioLocked = {}; getConfig().bioLocked[name] = charBioLock.checked; }
    if (!isNew && type === 'protagonist') { getState().protagonist = char; saveAll(); renderSidebar(); closeCE(); showToast('主角已更新'); return; }
    showSimpleConfirm('确认保存此角色信息？', () => {
      if (!isNew) { const s = charEditSrc.value, i = parseInt(charEditIdx.value); if (s === 'protagonist') getState().protagonist = char; else if (s === 'companion' && type === 'temp') { getState().companions.splice(i, 1); getState().tempCharacters.push({ ...char, tag:'同行' }); } else if (s === 'temp' && type === 'companion') { getState().tempCharacters.splice(i, 1); getState().companions.push(char); } else if (s === 'companion') getState().companions[i] = char; else getState().tempCharacters[i] = char; showToast('角色已更新'); }
      else { if (type === 'companion') { getState().companions.push(char); showToast('同伴已添加'); } else { getState().tempCharacters.push({ ...char, tag:'同行' }); showToast('临时角色已添加'); } }
      saveAll(); renderSidebar(); closeCE();
    });
  });


  // 提示词面板
  promptGearBtn.addEventListener('click', () => { const p = buildPrompt(inputBox.value || '（待输入指令）'); promptContent.textContent = p; const chars = p.length; const tokens = Math.round(chars / 2); $('promptCharCount').textContent = '字数：' + chars + ' 字符 ≈ ' + tokens + ' tokens'; promptOverlay.classList.add('show'); promptPanel.classList.add('show'); });
  function closePP() { promptOverlay.classList.remove('show'); promptPanel.classList.remove('show'); }
  promptOverlay.addEventListener('click', closePP); closePromptBtn.addEventListener('click', closePP);
  copyPromptBtn.addEventListener('click', () => { navigator.clipboard.writeText(promptContent.textContent).then(() => { copyPromptBtn.textContent = '已复制'; setTimeout(() => { copyPromptBtn.textContent = '复制'; }, 1500); }).catch(() => {}); });

  // 摘要
  function loadAutoSumCfg() { const c = getConfig(); if (autoSummarizeToggle) autoSummarizeToggle.checked = !!c.autoSummarize; if (autoSumEvery) autoSumEvery.value = c.autoSumEvery || 10; if (autoSumRounds) autoSumRounds.value = c.autoSumRounds || 5; }
  function saveAutoSumCfg() { const c = getConfig(); c.autoSummarize = autoSummarizeToggle ? autoSummarizeToggle.checked : false; c.autoSumEvery = autoSumEvery ? parseInt(autoSumEvery.value) || 10 : 10; c.autoSumRounds = autoSumRounds ? parseInt(autoSumRounds.value) || 5 : 5; saveAll(); }
  if (autoSummarizeToggle) autoSummarizeToggle.addEventListener('change', saveAutoSumCfg);
  if (autoSumEvery) autoSumEvery.addEventListener('change', saveAutoSumCfg);
  if (autoSumRounds) autoSumRounds.addEventListener('change', saveAutoSumCfg);
  summaryBtn.addEventListener('click', () => { renderSumList(); loadAutoSumCfg(); showModal(summaryOverlay, summaryModal); });
  function closeSum() { saveAutoSumCfg(); hideModal(summaryOverlay, summaryModal); }
  closeSummary.addEventListener('click', closeSum); summaryOverlay.addEventListener('click', closeSum);
  summaryDelModeBtn.addEventListener('click', () => { summaryDeleteMode = !summaryDeleteMode; summaryDelTools.classList.toggle('hidden', !summaryDeleteMode); summaryDelModeBtn.style.background = summaryDeleteMode ? 'rgba(200,80,80,.15)' : ''; renderSumList(); });
  summarySelectAll.addEventListener('change', () => { document.querySelectorAll('.sumChk').forEach(c => c.checked = summarySelectAll.checked); });
  summaryDeleteSelected.addEventListener('click', () => { const ids = []; document.querySelectorAll('.sumChk:checked').forEach(c => ids.push(parseInt(c.dataset.idx))); if (!ids.length) { showToast('请选择要删除的摘要'); return; } showSimpleConfirm('确定删除选中的 ' + ids.length + ' 条摘要吗？', () => { ids.sort((a, b) => b - a).forEach(i => data.summaries.splice(i, 1)); saveAll(); renderSumList(); showToast('已删除'); }); });
  if (summarizeBtn) summarizeBtn.addEventListener('click', () => {
    const roundsEl = document.getElementById('summaryRounds');
    const rounds = roundsEl ? parseInt(roundsEl.value) || 0 : 0;
    if (!rounds || rounds <= 0) { showToast('请填写要总结的轮次数'); return; }
    summarizeSummaries(rounds);
  });
  if (addSummaryBtn) addSummaryBtn.addEventListener('click', () => {
    const txt = prompt('请输入摘要内容：');
    if (txt && txt.trim()) { if (!data.summaries) data.summaries = []; data.summaries.push(txt.trim()); saveAll(); renderSumList(); showToast('✓ 摘要已新增'); }
  });
  if (summaryPromptBtn) summaryPromptBtn.addEventListener('click', () => {
    const all = data.summaries || [];
    const roundsEl = document.getElementById('summaryRounds');
    const rounds = roundsEl ? parseInt(roundsEl.value) || all.length : all.length;
    const su = rounds > 0 && rounds < all.length ? all.slice(0, rounds) : all;
    const prompt = '你是修仙小说剧情整理助手。将任意数量的对话摘要压缩为一段极简总结。\n\n【禁止事项】\n- 严禁输出任何思考过程、分析步骤、筛选逻辑或"首先""根据规则""列出关键事件"等引导语。只输出最终总结正文本身。\n\n【硬性限制】\n- 不管输入多少轮，尽可能压缩但不设硬性字数上限。\n- 禁止逐段概括，必须合并同类事件。早期剧情压缩为1-3句背景交代，只详写最近3-5个关键转折。\n\n【筛选规则】\n- 只保留产生后续后果的事件：修为大境界突破、获得/失去重要法宝、关键人物死亡或离开、阵营转换、重伤/逃生类转折。\n- 小境界突破、常规战斗过程、日常修炼、灵石消耗、次要物品获取一律舍弃或合并为"历经N年苦修"式短语。\n- 同一法宝的多次使用只提最关键的一次。\n\n【压缩技巧】\n- 连续多年的修炼/战斗用一句话打包："此后十年，他迂回黑市与宗门间积累资源，修为至筑基圆满。"\n- 次要角色批量处理："与王铁、孙默等人先后探遗址、斩同门、夺三焰扇。"\n- 地点转移省略过程，只留结果："经传送阵逃至乱星海。"\n\n【输出格式】\n直接输出第三人称叙事正文，不加任何标记。主角名"猫十三"。结尾落于最新悬念。\n\n以下为待总结的摘要：\n\n' + su.join('\n');
    summaryPromptContent.textContent = prompt;
    summaryPromptArea.classList.toggle('hidden');
    summaryPromptBtn.textContent = summaryPromptArea.classList.contains('hidden') ? '提示词' : '隐藏';
  });

  // 日志
  logBtn.addEventListener('click', () => { renderLogs(); showModal(logOverlay, logModal); });
  closeLog.addEventListener('click', () => hideModal(logOverlay, logModal));
  logOverlay.addEventListener('click', () => hideModal(logOverlay, logModal));
  clearLogBtn.addEventListener('click', () => { showSimpleConfirm('清空所有日志？', () => { data.logs = []; saveAll(); renderLogs(); showToast('日志已清空'); }); });

  // 导出/导入
  exportImportBtn.addEventListener('click', () => { $('exportAll').checked = true; showModal(exportImportOverlay, exportImportModal); });
  function closeEI() { hideModal(exportImportOverlay, exportImportModal); }
  closeExportImport.addEventListener('click', closeEI); exportImportOverlay.addEventListener('click', closeEI);
  doExportBtn.addEventListener('click', () => { const mode = $('exportAll').checked ? 'all' : $('exportState').checked ? 'state' : $('exportChat').checked ? 'chat' : $('exportSummaries').checked ? 'summaries' : 'worldbook'; if (!mode) { showToast('请选择导出类型'); return; } const cn = getState().protagonist.name.replace(/[\/\\?*<>|:"]/g, '_'); let obj, fn; if (mode === 'all') { obj = { version:'1.0', state:getState(), chatHistory:data.chatHistory, summaries:data.summaries, worldBook:wbString(data.worldBook) }; fn = cn + '_全部.json'; } else if (mode === 'state') { obj = { type:'state', data:getState() }; fn = cn + '_状态.json'; } else if (mode === 'chat') { obj = { type:'chat', data:data.chatHistory }; fn = cn + '_对话.json'; } else if (mode === 'summaries') { obj = { type:'summaries', data:data.summaries }; fn = cn + '_摘要.json'; } else { obj = { type:'worldbook', data:wbString(data.worldBook) }; fn = cn + '_世界书.json'; } const json = JSON.stringify(obj, null, 2), blob = new Blob([json], { type:'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = fn; a.click(); URL.revokeObjectURL(url); showToast('✓ 导出成功'); });
  doImportBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', function() { const f = this.files[0]; if (!f) return; const r = new FileReader(); r.onload = function(e) { try { const j = JSON.parse(e.target.result); if (j.type === 'state' && j.data?.protagonist) { data.state = j.data; saveAll(); renderSidebar(); showToast('✓ 状态已导入'); } else if (j.type === 'chat' && Array.isArray(j.data)) { data.chatHistory = j.data; saveAll(); renderMessages(); showToast('✓ 对话已导入'); } else if (j.type === 'summaries' && Array.isArray(j.data)) { data.summaries = j.data; saveAll(); showToast('✓ 摘要已导入'); } else if (j.type === 'worldbook' && j.data) { data.worldBook = typeof j.data === 'string' ? parseWorldBookSections(j.data) : (Array.isArray(j.data) ? j.data : parseWorldBookSections(j.data)); saveAll(); showToast('✓ 世界书已导入'); } else if (j.state?.protagonist) { data.state = j.state; if (j.chatHistory) data.chatHistory = j.chatHistory; if (j.summaries) data.summaries = j.summaries; if (j.worldBook) data.worldBook = typeof j.worldBook === 'string' ? parseWorldBookSections(j.worldBook) : j.worldBook; saveAll(); renderSidebar(); renderMessages(); showToast('✓ 全部已导入'); } else showToast('⚠ 格式不匹配'); closeEI(); } catch (_) { showToast('⚠ 文件解析失败'); } }; r.readAsText(f); this.value = ''; });

  // 设置
  function loadParamCfg() { const c = getConfig(); if (ctxRoundsInput) ctxRoundsInput.value = c.contextRounds || 10; if (slimitInput) slimitInput.value = c.summaryLimit || 50; }
  settingsBtn.addEventListener('click', () => { const c = getConfig(); apiBase.value = c.apiBase || ''; apiBase2.value = c.apiBase2 || ''; apiModel.value = c.apiModel || ''; apiModel2.value = c.apiModel2 || ''; apiKey.value = c.apiKey || ''; apiKey2.value = c.apiKey2 || ''; simMode.checked = c.simMode !== false; loadParamCfg(); mainApiStatus.textContent = ''; backupApiStatus.textContent = ''; showModal(settingsOverlay, settingsModal); });
  function closeSet() { const c = getConfig(); c.apiBase = apiBase.value.trim(); c.apiBase2 = apiBase2.value.trim(); c.apiModel = apiModel.value.trim(); c.apiModel2 = apiModel2.value.trim(); c.apiKey = apiKey.value.trim(); c.apiKey2 = apiKey2.value.trim(); c.simMode = simMode.checked; saveAll(); hideModal(settingsOverlay, settingsModal); }
  closeSettings.addEventListener('click', closeSet); settingsOverlay.addEventListener('click', closeSet);
  async function testApi(base, model, key, statusEl) { if (simMode.checked) { statusEl.innerHTML = '<span class="text-green-400">模拟模式</span>'; return; } if (!base || !model || !key) { statusEl.innerHTML = '<span style="color:#c08060">未配置</span>'; return; } statusEl.innerHTML = '<span style="color:#888">测试中…</span>'; try { const r = await fetch(base + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key }, body: JSON.stringify({ model, messages:[{ role:'user', content:'ping' }], max_tokens:1 }) }); statusEl.innerHTML = r.ok ? '<span style="color:#70d090">✅ 连接成功</span>' : '<span style="color:#d08080">❌ 失败</span>'; } catch (e) { statusEl.innerHTML = '<span style="color:#d08080">❌ ' + e.message.substring(0, 20) + '</span>'; } }
  testMainApiBtn.addEventListener('click', () => { const c = getConfig(); testApi(apiBase.value.trim() || c.apiBase, apiModel.value.trim() || c.apiModel, apiKey.value.trim() || c.apiKey, mainApiStatus); });
  testBackupApiBtn.addEventListener('click', () => { const c = getConfig(); testApi(apiBase2.value.trim() || c.apiBase2, apiModel2.value.trim() || c.apiModel2, apiKey2.value.trim() || c.apiKey2, backupApiStatus); });
  cleanupBtn.addEventListener('click', () => { const t = data.chatHistory?.length || 0; if (t <= 300) { alert('不足300条，无需清理'); return; } if (!confirm('删除前 ' + (t - 300) + ' 条，保留最近300条？')) return; const r = t - 300; data.chatHistory = data.chatHistory.slice(r); saveAll(); renderMessages(); alert('已清理 ' + r + ' 条'); });
  resetDataBtn.addEventListener('click', () => { if (!confirm('确认重置所有数据？')) return; localStorage.removeItem(STORAGE_KEY); data = { state:defaultState(), config:defaultConfig(), chatHistory:[], summaries:[], logs:[], worldBook:[{ heading:'一、【请导入世界书或点击一键导入】', content:'当前用户未导入世界书，请直接回复"当前未导入世界书"。' }], stateHistory:[], nextSteps:[] }; saveAll(); renderSidebar(); renderMessages(); closeSet(); });
  rawToggle.addEventListener('click', () => { rawArea.classList.toggle('open'); rawArrow.textContent = rawArea.classList.contains('open') ? '▴' : '▾'; rawContent.textContent = getConfig().lastRaw || '暂无记录'; });

  // Esc关闭
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCE(); closeConfirm(); closeSum(); closeEI(); hideModal(logOverlay, logModal); hideModal(histOverlay, histModal); hideModal(nextStepsOverlay, nextStepsModal); hideModal(descEditOverlay, descEditModal); closeSet(); closePP(); } });
}

// 全局：对话参数即时保存（供设置面板inline handler调用）
function saveParamCfg() { const c = getConfig(); if (ctxRoundsInput) c.contextRounds = parseInt(ctxRoundsInput.value) || 10; if (slimitInput) c.summaryLimit = parseInt(slimitInput.value) || 50; saveAll(); }

function renderSumList() {
  const su = data.summaries || [];
  if (!su.length) { summaryList.innerHTML = '<div class="text-xs text-[rgba(180,180,220,.15)] text-center py-8">暂无摘要</div>'; return; }
  summaryList.innerHTML = su.map((s, i) => '<div class="flex items-start gap-2 rounded-xl px-4 py-3 bg-[rgba(15,15,35,.25)] border border-[rgba(100,90,180,.05)]"><div class="shrink-0 text-center"><div class="text-[11px] text-[rgba(180,180,220,.3)]">#' + (i + 1) + '</div><div class="text-[8px] text-[rgba(180,180,220,.15)]">' + (s.length || 0) + '字</div></div><span class="sum-text text-xs text-[rgba(200,200,230,.5)] flex-1 cursor-pointer hover:text-[rgba(200,200,230,.7)] transition" onclick="editSummary(' + i + ')">' + esc(s) + '</span>' + (summaryDeleteMode ? '<input type="checkbox" class="sumChk shrink-0 mt-0.5 accent-[rgba(200,80,80,.4)]" data-idx="' + i + '">' : '') + '</div>').join('');
}

// 全局：编辑摘要
function editSummary(i) {
  if (!data.summaries || !data.summaries[i]) return;
  const old = data.summaries[i];
  const txt = prompt('编辑摘要 #' + (i + 1) + '（' + old.length + '字）：', old);
  if (txt !== null && txt.trim()) { data.summaries[i] = txt.trim(); saveAll(); renderSumList(); showToast('✓ 摘要已更新'); }
}

// 全局：打开历史状态弹窗
function showHistoryModal() {
  if (!historyList) return;
  const sh = data.stateHistory || [];
  if (histCount) histCount.textContent = '历史状态（' + sh.length + '/10）';
  if (!sh.length) { historyList.innerHTML = '<div class="text-[10px] text-[rgba(220,200,160,.15)] text-center py-6">暂无记录</div>'; }
  else {
    historyList.innerHTML = sh.slice().reverse().map((r, i) => {
      const origIdx = sh.length - 1 - i;
      const id = 'hst_' + i;
      const p = r.state?.protagonist || {};
      const realm = p.realm || '?';
      const exp = p.expMax > 0 ? Math.round((p.exp||0) / p.expMax * 100) + '%' : '';
      const hp = p.hpMax > 0 ? Math.round((p.hp||0) / p.hpMax * 100) + '%' : '';
      const st = p.spiritStones != null ? p.spiritStones + '灵石' : '';
      const tl = r.state?.timeLocation;
      const loc = tl ? (tl.location || '') + (tl.detail ? '·' + tl.detail : '') : '';
      return '<div class="rounded border border-[rgba(160,120,60,.06)] overflow-hidden">'
        + '<div class="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-[rgba(160,120,60,.04)] transition" onclick="document.getElementById(\'' + id + '\').classList.toggle(\'hidden\');this.querySelector(\'.hs-arrow\').classList.toggle(\'rotate-90\')">'
        + '<div><div class="text-[10px] text-[rgba(220,200,160,.5)]">' + esc(r.time) + '</div><div class="text-[9px] text-[rgba(220,200,160,.25)]">' + esc(realm + ' ' + exp + ' HP' + hp + ' ' + st) + '</div></div>'
        + '<div class="flex gap-1 items-center" onclick="event.stopPropagation()"><button onclick="restoreStateFromHistory(' + origIdx + ')" class="px-1.5 py-0.5 rounded text-[8px] bg-[rgba(180,140,60,.15)] text-[rgba(220,200,160,.5)] hover:bg-[rgba(180,140,60,.25)] transition">↩ 回溯</button><span class="hs-arrow text-[rgba(220,200,160,.4)]" style="display:inline-block">▸</span></div>'
        + '</div>'
        + '<pre id="' + id + '" class="hidden px-3 pb-2 text-[9px] text-[rgba(200,200,180,.45)] leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-36 overflow-y-auto">' + esc(JSON.stringify(r.state, null, 2)) + '</pre>'
        + '</div>';
    }).join('');
  }
  showModal(histOverlay, histModal);
}

// 全局：回溯到历史状态
function restoreStateFromHistory(idx) {
  const sh = data.stateHistory || [];
  const entry = sh[idx];
  if (!entry) { showToast('⚠ 记录不存在'); return; }
  if (!confirm('确认回退状态到「' + entry.time + '」？当前进度可能丢失。')) return;
  data.state = JSON.parse(JSON.stringify(entry.state));
  saveAll(); renderSidebar();
  hideModal(histOverlay, histModal);
  showToast('✓ 状态已回溯至 ' + entry.time);
  addLog('↩ 状态回溯 → ' + entry.time);
}

// 全局：下一步剧情选项弹窗
const NS_TAG_COLORS = { '求稳':'#60c0a0','冒险':'#e8a040','奇谋':'#a080e0','隐秘':'#6080c0','交易':'#c0a060','逃亡':'#c08080' };
function showNextStepsModal() {
  if (!nextStepsList) return;
  const ns = data.nextSteps || [];
  if (!ns.length) { showToast('暂无下一步选项'); return; }
  nextStepsList.innerHTML = ns.map((s, i) => {
    const text = typeof s === 'string' ? s : s.text || '';
    const tag = typeof s === 'string' ? '' : s.tag || '';
    const clr = NS_TAG_COLORS[tag] || '#888';
    return '<button onclick="selectNextStep(' + i + ')" class="w-full text-left px-4 py-3 rounded-xl border text-xs leading-relaxed ns-opt-btn" style="background:rgba(30,24,20,.5);border-color:rgba(160,120,60,.1);color:rgba(255,255,255,.7)">'
      + (tag ? '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] mb-1" style="background:' + clr + '20;border:1px solid ' + clr + '50;color:' + clr + '">' + esc(tag) + '</span> ' : '')
      + esc(text) + '</button>';
  }).join('');
  showModal(nextStepsOverlay, nextStepsModal);
}
function selectNextStep(i) {
  const ns = data.nextSteps || [];
  const s = ns[i]; if (!s) return;
  const text = typeof s === 'string' ? s : s.text || '';
  inputBox.value = text; inputBox.focus();
  hideModal(nextStepsOverlay, nextStepsModal);
  showToast('▸ 已填入输入框，可直接发送');
}

// 全局：实时时钟
function tickClock() { if (liveClock) { const n = new Date(); liveClock.textContent = n.toLocaleTimeString(); } }
setInterval(tickClock, 1000); tickClock();

// 游玩须知（空值保护：兼容旧版HTML）
if (guideBtn) { guideBtn.addEventListener('click', () => showModal(guideOverlay, guideModal)); closeGuide.addEventListener('click', () => hideModal(guideOverlay, guideModal)); guideCloseBtn.addEventListener('click', () => hideModal(guideOverlay, guideModal)); guideOverlay.addEventListener('click', () => hideModal(guideOverlay, guideModal)); }

// 时间地点编辑弹窗
if (closeTlEdit) { closeTlEdit.addEventListener('click', () => hideModal(tlEditOverlay, tlEditModal)); tlEditOverlay.addEventListener('click', () => hideModal(tlEditOverlay, tlEditModal)); saveTlEdit.addEventListener('click', () => saveTimeLocationInline()); }

// 世界书
const addWbSectionBtn = $('addWbSectionBtn');
const importWbBtn = $('importWbBtn');
if (worldBookBtn) {
  worldBookBtn.addEventListener('click', () => { refreshWbView(); showModal(worldBookOverlay, worldBookModal); });
  closeWorldBook.addEventListener('click', () => hideModal(worldBookOverlay, worldBookModal));
  worldBookOverlay.addEventListener('click', () => hideModal(worldBookOverlay, worldBookModal));
  worldBookCopyBtn.addEventListener('click', () => { const txt = wbString(data.worldBook || WB_DEFAULT); navigator.clipboard.writeText(txt).then(() => { worldBookCopyBtn.textContent = '✓ 已复制'; setTimeout(() => worldBookCopyBtn.textContent = '📋 复制', 1500); }); });
  resetWorldBookBtn.addEventListener('click', () => { showSimpleConfirm('恢复为默认世界书？', () => { data.worldBook = JSON.parse(JSON.stringify(WB_DEFAULT)); saveAll(); refreshWbView(); showToast('世界书已重置'); }); });
  if (addWbSectionBtn) addWbSectionBtn.addEventListener('click', () => {
    const name = prompt('请输入新章节标题：'); if (!name || !name.trim()) return;
    if (!confirm('确认新增章节「' + name.trim() + '」？')) return;
    data.worldBook.push({ heading: name.trim(), content: '（内容待编辑）' });
    saveAll(); refreshWbView(); showToast('✓ 章节已新增');
  });
  if (importWbBtn) importWbBtn.addEventListener('click', () => {
    showSimpleConfirm('将用内嵌 Worldbook 数据覆盖当前所有章节，确认导入？', () => {
      data.worldBook = JSON.parse(JSON.stringify(WB_DEFAULT));
      saveAll(); refreshWbView(); showToast('✓ 世界书已导入（' + data.worldBook.length + '章节）');
    });
  });
}

// 历史/下一步/介绍 弹窗（全局）
if (closeHist) { closeHist.addEventListener('click', () => hideModal(histOverlay, histModal)); histOverlay.addEventListener('click', () => hideModal(histOverlay, histModal)); }
if (closeNextSteps) { closeNextSteps.addEventListener('click', () => hideModal(nextStepsOverlay, nextStepsModal)); nextStepsOverlay.addEventListener('click', () => hideModal(nextStepsOverlay, nextStepsModal)); }
if (closeDescEdit) { closeDescEdit.addEventListener('click', () => hideModal(descEditOverlay, descEditModal)); descEditOverlay.addEventListener('click', () => hideModal(descEditOverlay, descEditModal)); if (cancelDescEdit) cancelDescEdit.addEventListener('click', () => hideModal(descEditOverlay, descEditModal)); }
if (saveDescEdit) saveDescEdit.addEventListener('click', () => { if (descEditTarget && descEditTextarea) { descEditTarget.setAttribute('data-desc', descEditTextarea.value); const locked = descEditTarget.getAttribute('data-locked') === '1'; const preview = descEditTextarea.value.length > 30 ? descEditTextarea.value.slice(0, 30) + '…' : (descEditTextarea.value || '点击填写介绍'); descEditTarget.textContent = '📝 ' + preview.replace(/【不可修改】/g, ''); } hideModal(descEditOverlay, descEditModal); });
document.addEventListener('click', e => { const btn = e.target.closest('.desc-preview-btn'); if (btn) { descEditTarget = btn; if (descEditTextarea) descEditTextarea.value = btn.getAttribute('data-desc') || ''; if (descEditTitle) descEditTitle.textContent = btn.getAttribute('data-locked') === '1' ? '📖 查看介绍（已锁定）' : '✏️ 编辑介绍'; if (descEditTextarea) descEditTextarea.readOnly = btn.getAttribute('data-locked') === '1'; showModal(descEditOverlay, descEditModal); } });

init();
