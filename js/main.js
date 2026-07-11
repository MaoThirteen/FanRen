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
  let extraOpen = false; extraToggleBtn.addEventListener('click', () => { extraOpen = !extraOpen; extraPanel.style.maxHeight = extraOpen ? '200px' : '0'; extraToggleBtn.textContent = extraOpen ? '收起' : '＋'; });

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
    const artifacts = collectCharItems(charArtifactList, ARTIFACT_GRADES, 'artifact'); const skills = collectCharItems(charSkillList, SKILL_GRADES, 'skill'); const formations = collectCharItems(charFormationList, ARTIFACT_GRADES, 'formation');
    const goal = charGoal ? charGoal.value.trim() : '';
    const stones = parseInt(charStoneInput.value) || 0;
    const invRaw = charInvInput.value.trim(); const inv = invRaw ? invRaw.split(/[,，]/).map(s => { const t = s.trim(); if (!t) return null; const m = t.match(/×(\d+)/); return m ? { name:t.replace(/×\d+/, '').trim(), count:parseInt(m[1]) } : { name:t, count:1 }; }).filter(Boolean) : [];
    const rd = getRealmDefaults(realm); const isNC = isNew; let prevE = 0;
    if (!isNC) { const src = getState(); if (type === 'protagonist') prevE = src.protagonist.exp || 0; else if (type === 'companion') prevE = (src.companions[parseInt(charEditIdx.value)] || {}).exp || 0; else prevE = (src.tempCharacters[parseInt(charEditIdx.value)] || {}).exp || 0; }
    const gender = charGender.value || '男';
    const species = (charSpecies ? charSpecies.value : '人类') || '人类';
    const char = { name, realm, species, gender, bio:(charBio?charBio.value.trim():''), sect, sectTitle, relation:charRelationField.value.trim() || '同行', exp:isNC ? 0 : prevE, expMax:rd.expMax, hp:rd.hpMax, hpMax:rd.hpMax, mp:rd.mpMax, mpMax:rd.mpMax, artifacts, skills, formations, spiritStones:stones, inventory:inv, status:charStatusField.value.trim() };
    if (type === 'protagonist') { const orig = getState().protagonist; char.age = orig.age || 16; char.lifespan = getLifespan(realm); char.goal = goal; }
    // 保存bio锁状态
    if (charBioLock) { if (!getConfig().bioLocked) getConfig().bioLocked = {}; getConfig().bioLocked[name] = charBioLock.checked; }
    if (!isNew && type === 'protagonist') { getState().protagonist = char; saveAll(); renderSidebar(); closeCE(); showToast('主角已更新'); return; }
    showSimpleConfirm('确认保存此角色信息？', () => {
      if (!isNew) { const s = charEditSrc.value, i = parseInt(charEditIdx.value); if (s === 'protagonist') getState().protagonist = char; else if (s === 'companion' && type === 'temp') { getState().companions.splice(i, 1); getState().tempCharacters.push({ ...char, tag:'同行' }); } else if (s === 'temp' && type === 'companion') { getState().tempCharacters.splice(i, 1); getState().companions.push(char); } else if (s === 'companion') getState().companions[i] = char; else getState().tempCharacters[i] = char; showToast('角色已更新'); }
      else { if (type === 'companion') { getState().companions.push(char); showToast('同伴已添加'); } else { getState().tempCharacters.push({ ...char, tag:'同行' }); showToast('临时角色已添加'); } }
      saveAll(); renderSidebar(); closeCE();
    });
  });

  // 对话参数
  paramBtn.addEventListener('click', () => { const c = getConfig(); tempSlider.value = c.temperature || 0.7; tempVal.textContent = tempSlider.value; topPSlider.value = c.topP || 0.5; topPVal.textContent = topPSlider.value; penSlider.value = c.penalty || 1.0; penVal.textContent = penSlider.value; ctxRoundsInput.value = c.contextRounds || 10; slimitInput.value = c.summaryLimit || 50; showModal(paramOverlay, paramModal); });
  closeParam.addEventListener('click', () => { const c = getConfig(); c.temperature = parseFloat(tempSlider.value); c.topP = parseFloat(topPSlider.value); c.penalty = parseFloat(penSlider.value); c.contextRounds = parseInt(ctxRoundsInput.value) || 10; c.summaryLimit = parseInt(slimitInput.value) || 50; saveAll(); hideModal(paramOverlay, paramModal); });
  paramOverlay.addEventListener('click', () => { const c = getConfig(); c.temperature = parseFloat(tempSlider.value); c.topP = parseFloat(topPSlider.value); c.penalty = parseFloat(penSlider.value); c.contextRounds = parseInt(ctxRoundsInput.value) || 10; c.summaryLimit = parseInt(slimitInput.value) || 50; saveAll(); hideModal(paramOverlay, paramModal); });

  // 提示词面板
  promptGearBtn.addEventListener('click', () => { const p = buildPrompt(inputBox.value || '（待输入指令）'); promptContent.textContent = p; const chars = p.length; const tokens = Math.round(chars / 2); $('promptCharCount').textContent = '字数：' + chars + ' 字符 ≈ ' + tokens + ' tokens'; promptOverlay.classList.add('show'); promptPanel.classList.add('show'); });
  function closePP() { promptOverlay.classList.remove('show'); promptPanel.classList.remove('show'); }
  promptOverlay.addEventListener('click', closePP); closePromptBtn.addEventListener('click', closePP);
  copyPromptBtn.addEventListener('click', () => { navigator.clipboard.writeText(promptContent.textContent).then(() => { copyPromptBtn.textContent = '已复制'; setTimeout(() => { copyPromptBtn.textContent = '复制'; }, 1500); }).catch(() => {}); });

  // 摘要
  summaryBtn.addEventListener('click', () => { renderSumList(); showModal(summaryOverlay, summaryModal); });
  function closeSum() { hideModal(summaryOverlay, summaryModal); }
  closeSummary.addEventListener('click', closeSum); summaryOverlay.addEventListener('click', closeSum);
  summaryDelModeBtn.addEventListener('click', () => { summaryDeleteMode = !summaryDeleteMode; summaryDelTools.classList.toggle('hidden', !summaryDeleteMode); summaryDelModeBtn.style.background = summaryDeleteMode ? 'rgba(200,80,80,.15)' : ''; renderSumList(); });
  summarySelectAll.addEventListener('change', () => { document.querySelectorAll('.sumChk').forEach(c => c.checked = summarySelectAll.checked); });
  summaryDeleteSelected.addEventListener('click', () => { const ids = []; document.querySelectorAll('.sumChk:checked').forEach(c => ids.push(parseInt(c.dataset.idx))); if (!ids.length) { showToast('请选择要删除的摘要'); return; } showSimpleConfirm('确定删除选中的 ' + ids.length + ' 条摘要吗？', () => { ids.sort((a, b) => b - a).forEach(i => data.summaries.splice(i, 1)); saveAll(); renderSumList(); showToast('已删除'); }); });

  // 日志
  logBtn.addEventListener('click', () => { renderLogs(); showModal(logOverlay, logModal); });
  closeLog.addEventListener('click', () => hideModal(logOverlay, logModal));
  logOverlay.addEventListener('click', () => hideModal(logOverlay, logModal));
  clearLogBtn.addEventListener('click', () => { showSimpleConfirm('清空所有日志？', () => { data.logs = []; saveAll(); renderLogs(); showToast('日志已清空'); }); });

  // 导出/导入
  exportImportBtn.addEventListener('click', () => { $('exportAll').checked = true; showModal(exportImportOverlay, exportImportModal); });
  function closeEI() { hideModal(exportImportOverlay, exportImportModal); }
  closeExportImport.addEventListener('click', closeEI); exportImportOverlay.addEventListener('click', closeEI);
  doExportBtn.addEventListener('click', () => { const mode = $('exportAll').checked ? 'all' : $('exportState').checked ? 'state' : $('exportChat').checked ? 'chat' : 'summaries'; if (!mode) { showToast('请选择导出类型'); return; } const cn = getState().protagonist.name.replace(/[\/\\?*<>|:"]/g, '_'); let obj, fn; if (mode === 'all') { obj = { version:'1.0', state:getState(), chatHistory:data.chatHistory, summaries:data.summaries }; fn = cn + '_全部.json'; } else if (mode === 'state') { obj = { type:'state', data:getState() }; fn = cn + '_状态.json'; } else if (mode === 'chat') { obj = { type:'chat', data:data.chatHistory }; fn = cn + '_对话.json'; } else { obj = { type:'summaries', data:data.summaries }; fn = cn + '_摘要.json'; } const json = JSON.stringify(obj, null, 2), blob = new Blob([json], { type:'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = fn; a.click(); URL.revokeObjectURL(url); showToast('✓ 导出成功'); });
  doImportBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', function() { const f = this.files[0]; if (!f) return; const r = new FileReader(); r.onload = function(e) { try { const j = JSON.parse(e.target.result); if (j.type === 'state' && j.data?.protagonist) { data.state = j.data; saveAll(); renderSidebar(); showToast('✓ 状态已导入'); } else if (j.type === 'chat' && Array.isArray(j.data)) { data.chatHistory = j.data; saveAll(); renderMessages(); showToast('✓ 对话已导入'); } else if (j.type === 'summaries' && Array.isArray(j.data)) { data.summaries = j.data; saveAll(); showToast('✓ 摘要已导入'); } else if (j.state?.protagonist) { data.state = j.state; if (j.chatHistory) data.chatHistory = j.chatHistory; if (j.summaries) data.summaries = j.summaries; saveAll(); renderSidebar(); renderMessages(); showToast('✓ 全部已导入'); } else showToast('⚠ 格式不匹配'); closeEI(); } catch (_) { showToast('⚠ 文件解析失败'); } }; r.readAsText(f); this.value = ''; });

  // 设置
  settingsBtn.addEventListener('click', () => { const c = getConfig(); apiBase.value = c.apiBase || ''; apiBase2.value = c.apiBase2 || ''; apiModel.value = c.apiModel || ''; apiModel2.value = c.apiModel2 || ''; apiKey.value = c.apiKey || ''; apiKey2.value = c.apiKey2 || ''; simMode.checked = c.simMode !== false; mainApiStatus.textContent = ''; backupApiStatus.textContent = ''; showModal(settingsOverlay, settingsModal); });
  function closeSet() { const c = getConfig(); c.apiBase = apiBase.value.trim(); c.apiBase2 = apiBase2.value.trim(); c.apiModel = apiModel.value.trim(); c.apiModel2 = apiModel2.value.trim(); c.apiKey = apiKey.value.trim(); c.apiKey2 = apiKey2.value.trim(); c.simMode = simMode.checked; saveAll(); hideModal(settingsOverlay, settingsModal); }
  closeSettings.addEventListener('click', closeSet); settingsOverlay.addEventListener('click', closeSet);
  async function testApi(base, model, key, statusEl) { if (simMode.checked) { statusEl.innerHTML = '<span class="text-green-400">模拟模式</span>'; return; } if (!base || !model || !key) { statusEl.innerHTML = '<span style="color:#c08060">未配置</span>'; return; } statusEl.innerHTML = '<span style="color:#888">测试中…</span>'; try { const r = await fetch(base + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key }, body: JSON.stringify({ model, messages:[{ role:'user', content:'ping' }], max_tokens:1 }) }); statusEl.innerHTML = r.ok ? '<span style="color:#70d090">✅ 连接成功</span>' : '<span style="color:#d08080">❌ 失败</span>'; } catch (e) { statusEl.innerHTML = '<span style="color:#d08080">❌ ' + e.message.substring(0, 20) + '</span>'; } }
  testMainApiBtn.addEventListener('click', () => { const c = getConfig(); testApi(apiBase.value.trim() || c.apiBase, apiModel.value.trim() || c.apiModel, apiKey.value.trim() || c.apiKey, mainApiStatus); });
  testBackupApiBtn.addEventListener('click', () => { const c = getConfig(); testApi(apiBase2.value.trim() || c.apiBase2, apiModel2.value.trim() || c.apiModel2, apiKey2.value.trim() || c.apiKey2, backupApiStatus); });
  cleanupBtn.addEventListener('click', () => { const t = data.chatHistory?.length || 0; if (t <= 300) { alert('不足300条，无需清理'); return; } if (!confirm('删除前 ' + (t - 300) + ' 条，保留最近300条？')) return; const r = t - 300; data.chatHistory = data.chatHistory.slice(r); saveAll(); renderMessages(); alert('已清理 ' + r + ' 条'); });
  resetDataBtn.addEventListener('click', () => { if (!confirm('确认重置所有数据？')) return; localStorage.removeItem(STORAGE_KEY); data = { state:defaultState(), config:defaultConfig(), chatHistory:[], summaries:[], logs:[], worldBook:defaultWorldBook() }; saveAll(); renderSidebar(); renderMessages(); closeSet(); });
  rawToggle.addEventListener('click', () => { rawArea.classList.toggle('open'); rawArrow.textContent = rawArea.classList.contains('open') ? '▴' : '▾'; rawContent.textContent = getConfig().lastRaw || '暂无记录'; });

  // Esc关闭
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCE(); closeConfirm(); closeSum(); closeEI(); hideModal(logOverlay, logModal); hideModal(paramOverlay, paramModal); closeSet(); closePP(); } });
}

function renderSumList() {
  const su = data.summaries || [];
  if (!su.length) { summaryList.innerHTML = '<div class="text-xs text-[rgba(180,180,220,.15)] text-center py-8">暂无摘要</div>'; return; }
  summaryList.innerHTML = su.map((s, i) => '<div class="flex items-start gap-2 rounded-xl px-4 py-3 bg-[rgba(15,15,35,.25)] border border-[rgba(100,90,180,.05)]"><span class="text-[rgba(180,180,220,.2)] text-xs shrink-0">#' + (i + 1) + '</span><span class="text-xs text-[rgba(200,200,230,.5)] flex-1">' + esc(s) + '</span>' + (summaryDeleteMode ? '<input type="checkbox" class="sumChk shrink-0 mt-0.5 accent-[rgba(200,80,80,.4)]" data-idx="' + i + '">' : '') + '</div>').join('');
}

// 游玩须知（空值保护：兼容旧版HTML）
if (guideBtn) { guideBtn.addEventListener('click', () => showModal(guideOverlay, guideModal)); closeGuide.addEventListener('click', () => hideModal(guideOverlay, guideModal)); guideCloseBtn.addEventListener('click', () => hideModal(guideOverlay, guideModal)); guideOverlay.addEventListener('click', () => hideModal(guideOverlay, guideModal)); }

// 时间地点编辑弹窗
if (closeTlEdit) { closeTlEdit.addEventListener('click', () => hideModal(tlEditOverlay, tlEditModal)); tlEditOverlay.addEventListener('click', () => hideModal(tlEditOverlay, tlEditModal)); saveTlEdit.addEventListener('click', () => saveTimeLocationInline()); }

// 世界书
function showWorldBookStructured() {
  worldBookStructured.classList.remove('hidden'); worldBookContent.classList.add('hidden');
  worldBookStructured.innerHTML = renderWorldBookSections(data.worldBook || defaultWorldBook());
  worldBookContent.readOnly = true; worldBookSaveRow.classList.add('hidden'); worldBookEditBtn.textContent = '✏️ 编辑';
}
function showWorldBookEdit() {
  worldBookStructured.classList.add('hidden'); worldBookContent.classList.remove('hidden');
  worldBookContent.value = data.worldBook || defaultWorldBook(); worldBookContent.readOnly = false;
  worldBookSaveRow.classList.remove('hidden'); worldBookEditBtn.textContent = '🔒 取消编辑';
}
if (worldBookBtn) {
  worldBookBtn.addEventListener('click', () => { showWorldBookStructured(); showModal(worldBookOverlay, worldBookModal); });
  closeWorldBook.addEventListener('click', () => hideModal(worldBookOverlay, worldBookModal));
  worldBookOverlay.addEventListener('click', () => hideModal(worldBookOverlay, worldBookModal));
  worldBookEditBtn.addEventListener('click', () => { if (worldBookContent.classList.contains('hidden')) { showWorldBookEdit(); } else { showWorldBookStructured(); } });
  worldBookCopyBtn.addEventListener('click', () => { const txt = worldBookContent.classList.contains('hidden') ? (data.worldBook || defaultWorldBook()) : worldBookContent.value; navigator.clipboard.writeText(txt).then(() => { worldBookCopyBtn.textContent = '✓ 已复制'; setTimeout(() => worldBookCopyBtn.textContent = '📋 复制', 1500); }); });
  saveWorldBookBtn.addEventListener('click', () => { data.worldBook = worldBookContent.value; saveAll(); showWorldBookStructured(); hideModal(worldBookOverlay, worldBookModal); showToast('世界书已保存'); });
  resetWorldBookBtn.addEventListener('click', () => { showSimpleConfirm('恢复为默认世界书？', () => { data.worldBook = defaultWorldBook(); worldBookContent.value = data.worldBook; saveAll(); showWorldBookStructured(); }); });
}

init();
