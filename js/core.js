/* ============================================================
   core.js — 对话核心逻辑（prompt构建、API调用、状态解析）
   依赖: data.js, storage.js, ui.js
   ============================================================ */

function enforceMsgLimit() { const m = data.chatHistory || []; if (m.length > MAX_MSGS) { const r = m.length - MAX_MSGS; data.chatHistory = m.slice(r); addLog('自动清理 ' + r + ' 条旧记录'); saveAll(); } }

function buildPrompt(u) {
  const cfg = getConfig();
  const realmTable = '一、【境界-数据对照表】\n' + REALM_ORDER.map(r => { const d = REALM_HPMP[r] || {}; return r + ' → expMax:' + calcExpMax(r) + ' hpMax:' + (d.hpMax||'?') + ' mpMax:' + (d.mpMax||'?'); }).join('\n');
  const bioLocked = cfg.bioLocked || {};
  const bioLockNote = Object.keys(bioLocked).length ? '\n【角色生平锁状态】以下角色生平已锁定，只可读取不可修改：' + Object.keys(bioLocked).filter(k => bioLocked[k]).join('、') : '';
  const wbText = Array.isArray(data.worldBook) ? wbString(data.worldBook) : (data.worldBook || defaultWorldBook());
  const fixed = '【最高优先级指令】遵循下方世界书的全部规则。\n\n' + realmTable + '\n\n' + wbText + bioLockNote + '\n\nTemperature: ' + cfg.temperature + ' | TopP: ' + cfg.topP + ' | 重复惩罚: ' + cfg.penalty;
  const ctx = cfg.contextRounds || 10, slimit = cfg.summaryLimit || 50;
  const st = JSON.stringify(getState(), null, 2), ch = data.chatHistory || [], su = data.summaries || [];
  const rc = ch.slice(-ctx * 2); let rl = []; rc.forEach(m => { if (m.role === 'user') rl.push('玩家：' + m.content); else rl.push('AI：' + (m.content || '')); }); const rs = rl.length ? '\n\n【最近对话】\n' + rl.join('\n') : '';
  let sl = []; su.forEach(s => { if (s) sl.push('- ' + s); }); while (sl.length > slimit) { sl.shift(); data.summaries.shift(); } const ss = sl.length ? '\n\n【对话历史摘要】\n' + sl.join('\n') : '';
  return fixed + '\n\n【当前角色状态数据】\n' + st + rs + ss + '\n\n【玩家指令】\n' + u;
}

function genSim(s) {
  const st = NARRATIVES[Math.floor(Math.random() * NARRATIVES.length)];
  const ns = JSON.parse(JSON.stringify(s)); const p = ns.protagonist;
  p.exp = Math.min(p.exp + (3 + Math.floor(Math.random() * 6)), p.expMax);
  p.spiritStones += Math.floor(Math.random() * 5) + 1;
  if (Math.random() < 0.08 && !p.artifacts.find(a => a.name === '青铜古剑')) p.artifacts.push({ name:'青铜古剑', grade:'凡器', status:'完好无缺', desc:'斩铁如泥' });
  if (Math.random() < 0.1 && p.skills.length < 5) { const n2 = ['吐纳术','火球诀','清风步','金刚罩','灵犀指']; const pk = n2[Math.floor(Math.random() * n2.length)]; if (!p.skills.find(s => s.name === pk)) p.skills.push({ name:pk, grade:'凡品功法', status:'可用', desc:'基础法门' }); }
  p.hp = Math.min(p.hp + Math.floor(Math.random() * 5), p.hpMax); p.mp = Math.min(p.mp + Math.floor(Math.random() * 4), p.mpMax);
  return { story:st, state:ns };
}

function regenerate() {
  if (isLoading) return;
  if (!data.chatHistory) return;
  const last = data.chatHistory[data.chatHistory.length - 1];
  if (last && last.role === 'assistant') data.chatHistory.pop();
  saveAll();
  const msgs = chatArea.querySelectorAll('.chat-msg');
  for (let i = msgs.length - 1; i >= 0; i--) { const el = msgs[i]; if (el.id !== 'streamB' && !el.classList.contains('justify-end')) { el.remove(); break; } }
  const sb = document.getElementById('streamB'); if (sb) sb.remove();
  sendMessage(lastUserInput, true);
}

/* 解析状态并保存，返回 {sn, st} */
function parseAndSaveStatus(rt) {
  const cfg = getConfig();
  cfg.lastRaw = rt; saveAll();
  let js = null;
  const m1 = rt.match(/```(?:status|json)?\s*(?:json)?\s*\n?([\s\S]*?)```/i);
  if (m1) js = m1[1].trim();
  if (!js) { const ab = rt.match(/```[\s\S]*?```/); if (ab) { const i = ab[0].replace(/^```\w*\n?/, '').replace(/```$/, '').trim(); try { JSON.parse(i); js = i; } catch (_) {} } }
  if (!js) { const bm = rt.match(/\{[\s\S]*"protagonist"[\s\S]*\}/); if (bm) { try { JSON.parse(bm[0]); js = bm[0]; } catch (_) {} } }
  let sn = '';
  if (js) {
    let p = null;
    // 先尝试原始解析
    try { p = JSON.parse(js); } catch(rawErr) {
      // 原始失败，尝试repairJSON修复
      try { const fixed = repairJSON(js); p = JSON.parse(fixed); addLog('🔧 JSON修复后解析成功'); } catch(fixErr) {
        // 都失败，记录详细信息
        const tail = js.slice(-300); addLog('⚠ JSON解析失败（原始+修复均失败）→ 末尾:' + tail.replace(/[\n\r]+/g,'↵'));
      }
    }
    if (p) {
      if (p.protagonist) {
        // 清洗所有角色的境界名（去除巅峰/圆满等后缀）
        if (p.protagonist.realm) p.protagonist.realm = normalizeRealm(p.protagonist.realm);
        (p.companions || []).forEach(c => { if (c.realm) c.realm = normalizeRealm(c.realm); });
        (p.tempCharacters || []).forEach(c => { if (c.realm) c.realm = normalizeRealm(c.realm); });
        if (p.roundSummary) { if (!data.summaries) data.summaries = []; data.summaries.push(p.roundSummary); delete p.roundSummary; }
        if (p.timeLocation && p.timeLocation.time) data.state.timeLocation = p.timeLocation;
        data.state = p;
        if (!data.state.companions || !Array.isArray(data.state.companions)) data.state.companions = getState().companions || [];
        if (!data.state.tempCharacters || !Array.isArray(data.state.tempCharacters)) data.state.tempCharacters = getState().tempCharacters || [];
        validateRealmStats(data.state);
        saveAll(); renderSidebar();
        sn = '✓ 状态已更新'; addLog('✓ 状态更新 · 同伴' + data.state.companions.length + ' · 临时' + data.state.tempCharacters.length);
      } else { sn = '⚠ 状态结构不完整'; addLog('⚠ 状态结构不完整'); }
    } else { sn = '⚠ JSON解析失败'; }
  } else { sn = '⚠ 未检测到状态更新'; const tail = rt.slice(-200).replace(/[\n\r]+/g, '↵'); addLog('⚠ 未检测到状态代码块 → 末尾: ' + tail); }
  let st = cleanNarrative(rt);
  if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'assistant', content:st, statusNotice:sn }); saveAll();
  return { sn, st };
}

async function sendMessage(u, isRegen) {
  if (isLoading || !u || !u.trim()) return;
  isLoading = true; sendBtn.disabled = true; sendBtn.textContent = '发送中';
  lastUserInput = u;
  if (!isRegen) { if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'user', content:u }); enforceMsgLimit(); saveAll(); appendMsg('user', u); inputBox.value = ''; }
  createStreamBubble(); // 仅作为加载提示，不流式输出
  const cfg = getConfig();
  try {
    let fullText = '';
    if (cfg.simMode) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      const g = genSim(getState()); const wm = '\n\n（此为模拟回复，请先关闭设置中的模拟回复，连接API）';
      fullText = g.state ? (g.story + wm + '\n\n```status\n' + JSON.stringify(g.state, null, 2) + '\n```') : (g.story + wm);
    } else {
      const base = cfg.apiBase, model = cfg.apiModel, key = cfg.apiKey;
      if (!base || !model || !key) throw new Error('请填写 API 配置');
      const r = await fetch(base + '/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
        body: JSON.stringify({ model, messages:[{ role:'user', content:buildPrompt(u) }], temperature:cfg.temperature || 0.7, top_p:cfg.topP || 0.5, frequency_penalty:cfg.penalty ? cfg.penalty - 1 : 0 })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      fullText = j.choices?.[0]?.message?.content || '';
      // 记录 token 用量（兼容多种 API 格式）
      let usage = j.usage || j.model_usage || (j.choices?.[0]?.usage);
      if (usage) {
        const tout = usage.completion_tokens || usage.output_tokens || 0;
        const cached = usage.prompt_tokens_details?.cached_tokens || usage.cached_prompt_tokens || 0;
        const tmiss = (usage.prompt_tokens || 0) - cached;
        if (cached > 0) {
          addLog('📊 输入（命中缓存）：' + cached + ' · 输入（未命中）：' + tmiss + ' · 输出：' + tout);
        } else {
          addLog('📊 输入：' + (usage.prompt_tokens||'?') + ' · 输出：' + tout);
        }
      } else {
        addLog('📊 Token: 本API不返回usage（无token统计）');
      }
      if (!fullText) throw new Error('API 返回为空');
    }
    // 检测是否缺少status代码块，若缺少则自动续写请求
    if (!fullText.match(/```(?:status|json)/i) && !fullText.includes('"protagonist"')) {
      addLog('⚠ 正文无status代码块，发送续写请求…');
      try {
        const base = cfg.apiBase, model = cfg.apiModel, key = cfg.apiKey;
        const r2 = await fetch(base + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
          body: JSON.stringify({ model, messages:[
            { role:'user', content:buildPrompt(u) },
            { role:'assistant', content:fullText.slice(-2000) },
            { role:'user', content:'你刚才的回复缺少末尾的status代码块。请立即只输出status代码块，包含protagonist、companions、tempCharacters、timeLocation、roundSummary全部字段，不要输出任何剧情或其他内容。' }
          ], temperature:0.3 }) });
        if (r2.ok) {
          const j2 = await r2.json();
          const t2 = j2.choices?.[0]?.message?.content || '';
          if (j2.usage) { const u2 = j2.usage; const c2=u2.prompt_tokens_details?.cached_tokens||0; addLog('📊 续写：输入'+(u2.prompt_tokens||'?')+(c2>0?'(缓存命中'+c2+')':'')+' · 输出'+(u2.completion_tokens||'?')); }
          if (t2) { fullText += '\n' + t2; addLog('✓ 续写状态已获取'); }
        }
      } catch (e2) { addLog('⚠ 续写请求失败: ' + e2.message); }
    }
    // 移除加载气泡，显示完整回复
    removeStreamBubble();
    const { sn, st } = parseAndSaveStatus(fullText);
    appendMsg('assistant', st, sn);
    addRegenBtn();
    // 自动总结触发检查：摘要累积达到设定轮数时触发
    if (cfg.autoSummarize && data.summaries && data.summaries.length >= (cfg.autoSumEvery || 10)) {
      addLog('⚡ 摘要达到' + data.summaries.length + '轮，触发自动总结（取前' + (cfg.autoSumRounds || 5) + '轮）…');
      summarizeSummaries(cfg.autoSumRounds || 5);
    }
  } catch (err) {
    removeStreamBubble();
    const em = '请求失败：' + err.message;
    if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'assistant', content:em, statusNotice:'' }); saveAll();
    appendMsg('assistant', em); addRegenBtn();
    addLog('⚠ 请求失败: ' + err.message);
  }
  isLoading = false; sendBtn.disabled = false; sendBtn.textContent = '发送';
}

/* 摘要总结：将前n轮摘要发送至摘要总结API，返回300~500字总结 */
async function summarizeSummaries(rounds) {
  const all = data.summaries || [];
  if (!all.length) { showToast('没有摘要可总结'); return; }
  const su = rounds && rounds > 0 ? all.slice(0, rounds) : all;
  if (!su.length) { showToast('没有摘要可总结'); return; }
  const cfg = getConfig();
  const base = cfg.apiBase2, model = cfg.apiModel2, key = cfg.apiKey2;
  if (!base || !model || !key) { showToast('请先在设置中配置"摘要总结API"'); return; }
  // 持久加载弹窗 + 计时器
  let toastEl = document.getElementById('summarizeToast');
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'summarizeToast'; toastEl.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:999;padding:10px 20px;border-radius:12px;background:rgba(25,28,60,.94);border:1px solid rgba(100,90,180,.16);color:#c0c0e0;font-size:14px;letter-spacing:1px;pointer-events:none;backdrop-filter:blur(10px);opacity:0;transition:opacity .3s'; document.body.appendChild(toastEl); }
  toastEl.textContent = '⏳ 正在总结 ' + su.length + ' 轮摘要… 0秒'; toastEl.style.opacity = '1';
  let sumSec = 0; const sumTimer = setInterval(() => { sumSec++; toastEl.textContent = '⏳ 正在总结 ' + su.length + ' 轮摘要… ' + sumSec + '秒'; }, 1000);
  function dismissSumToast(msg) { clearInterval(sumTimer); toastEl.textContent = msg; setTimeout(() => { toastEl.style.opacity = '0'; }, 3000); }
  try {
    const prompt = '你是修仙小说剧情整理助手。将任意数量的对话摘要压缩为一段极简总结。\n\n【禁止事项】\n- 严禁输出任何思考过程、分析步骤、筛选逻辑或"首先""根据规则""列出关键事件"等引导语。只输出最终总结正文本身。\n\n【硬性限制】\n- 不管输入多少轮，输出字数1200字以内，尽可能压缩。\n- 禁止逐段概括，必须合并同类事件。早期剧情压缩为1-3句背景交代，只详写最近3-5个关键转折。\n\n【筛选规则】\n- 只保留产生后续后果的事件：修为大境界突破、获得/失去重要法宝、关键人物死亡或离开、阵营转换、重伤/逃生类转折。\n- 小境界突破、常规战斗过程、日常修炼、灵石消耗、次要物品获取一律舍弃或合并为"历经N年苦修"式短语。\n- 同一法宝的多次使用只提最关键的一次。\n\n【压缩技巧】\n- 连续多年的修炼/战斗用一句话打包："此后十年，他迂回黑市与宗门间积累资源，修为至筑基圆满。"\n- 次要角色批量处理："与王铁、孙默等人先后探遗址、斩同门、夺三焰扇。"\n- 地点转移省略过程，只留结果："经传送阵逃至乱星海。"\n\n【输出格式】\n直接输出第三人称叙事正文，不加任何标记。主角名"猫十三"。结尾落于最新悬念。\n\n以下为待总结的摘要：\n\n' + su.join('\n');
    const r = await fetch(base + '/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
      body: JSON.stringify({ model, messages:[{ role:'user', content:prompt }], temperature:0.3, max_tokens:8000, reasoning_effort:'disabled' })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    let result = j.choices?.[0]?.message?.content?.trim() || '';
    // 兜底：推理模型把内容放在 reasoning_content 中
    const reasoning = j.choices?.[0]?.message?.reasoning_content;
    if ((!result || result.length < 50) && reasoning) {
      result = reasoning.trim();
      addLog('⚠ 摘要模型返回了推理内容，已兜底使用reasoning_content');
    }
    // 清洗：检测模型是否把思考过程吐在了正文里，提取最后的叙事总结
    const thinkingMarkers = ['首先，用户要求我','根据规则','列出关键事件','] 现在','现在，我需要','好的，我来','] 我来','首先，我','压缩技巧','筛选规则','早期剧情'];
    let hasThinking = false;
    for (const m of thinkingMarkers) { if (result.includes(m)) { hasThinking = true; break; } }
    if (hasThinking) {
      // 找所有以"猫十三"开头的段落
      const parts = result.split(/\n(?=猫十三)/);
      if (parts.length > 1) {
        result = parts[parts.length - 1].trim();
        addLog('⚠ 检测到思考过程，已截取最后一段以"猫十三"开头的总结');
      } else {
        // 找不到"猫十三"段落，尝试从最后出现"猫十三"的位置截取
        const idx = result.lastIndexOf('猫十三');
        if (idx > result.length / 2) {
          result = result.substring(idx).trim();
          addLog('⚠ 检测到思考过程，已从最后"猫十三"处截取');
        } else {
          addLog('⚠ 检测到思考过程但无法提取有效总结，返回空');
          result = '';
        }
      }
    }
    // 限制结果长度
    if (result.length > 1200) { result = result.substring(0, 1200); addLog('⚠ 总结超1200字，已截断'); }
    // 日志记录
    let usage = j.usage || j.model_usage || (j.choices?.[0]?.usage);
    if (usage) {
      const tout = usage.completion_tokens || usage.output_tokens || 0;
      const cached = usage.prompt_tokens_details?.cached_tokens || usage.cached_prompt_tokens || 0;
      const tmiss = (usage.prompt_tokens || 0) - cached;
      if (cached > 0) {
        addLog('摘要总结完成 输入（命中缓存）：' + cached + '，输入（未命中缓存）：' + tmiss + '，输出：' + tout);
      } else {
        addLog('摘要总结完成 输入：' + (usage.prompt_tokens||'?') + '，输出：' + tout);
      }
    } else {
      addLog('摘要总结完成 输出：' + (result.length > 0 ? result.length + '字' : '空'));
    }
    if (result) {
      // 从前往后：用新总结替换前rounds条，保留后面的
      if (rounds && rounds > 0 && rounds < all.length) {
        data.summaries = [result, ...all.slice(rounds)];
      } else {
        data.summaries = [result];
      }
      saveAll();
      // 直接更新 DOM（避免跨文件函数调用失败）
      const sl = document.getElementById('summaryList');
      if (sl) { sl.innerHTML = data.summaries.map((s, i) => '<div class="flex items-start gap-2 rounded-xl px-4 py-3 bg-[rgba(15,15,35,.25)] border border-[rgba(100,90,180,.05)]"><span class="text-[rgba(180,180,220,.2)] text-xs shrink-0">#' + (i + 1) + '</span><span class="text-xs text-[rgba(200,200,230,.5)] flex-1">' + esc(s) + '</span></div>').join(''); }
      dismissSumToast('✓ 摘要总结完成（' + su.length + '条→1条，耗时' + sumSec + '秒）');
      addLog('✓ 摘要总结完成 · ' + su.length + '条合并为1条（' + result.length + '字）');
    } else {
      dismissSumToast('⚠ 摘要返回内容为空');
      addLog('⚠ 摘要总结失败：API返回空内容（token: ' + (usage?.completion_tokens||'?') + '）');
    }
  } catch (err) {
    dismissSumToast('⚠ 摘要总结失败');
    addLog('⚠ 摘要总结失败: ' + err.message);
  }
}
