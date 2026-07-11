/* ============================================================
   core.js — 对话核心逻辑（prompt构建、API调用、状态解析）
   依赖: data.js, storage.js, ui.js
   ============================================================ */

function enforceMsgLimit() { const m = data.chatHistory || []; if (m.length > MAX_MSGS) { const r = m.length - MAX_MSGS; data.chatHistory = m.slice(r); addLog('自动清理 ' + r + ' 条旧记录'); saveAll(); } }

function buildPrompt(u) {
  const cfg = getConfig();
  const realmTable = '【境界-数据对照表（强制使用，违反则状态无效）】\n' + REALM_ORDER.map(r => { const d = REALM_HPMP[r] || {}; return r + ' → expMax:' + calcExpMax(r) + ' hpMax:' + (d.hpMax||'?') + ' mpMax:' + (d.mpMax||'?'); }).join('\n');
  const bioLocked = cfg.bioLocked || {};
  const bioLockNote = Object.keys(bioLocked).length ? '\n【角色生平锁状态】以下角色生平已锁定，只可读取不可修改：' + Object.keys(bioLocked).filter(k => bioLocked[k]).join('、') : '';
  const fixed = realmTable + '\n\n【最高优先级指令】请严格遵循下方世界书中"一、"到"五、"的全部规则。realm必须从上方对照表中选取，expMax/hpMax/mpMax必须严格等于对照表数值。允许受伤/法力亏空/修为瓶颈。\n\nTemperature: ' + cfg.temperature + ' | TopP: ' + cfg.topP + ' | 重复惩罚: ' + cfg.penalty + '\n\n' + (data.worldBook || defaultWorldBook()) + bioLockNote;
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
  let st = rt.replace(/```[\s\S]*?```/g, '').trim();
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
  } catch (err) {
    removeStreamBubble();
    const em = '请求失败：' + err.message;
    if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'assistant', content:em, statusNotice:'' }); saveAll();
    appendMsg('assistant', em); addRegenBtn();
    addLog('⚠ 请求失败: ' + err.message);
  }
  isLoading = false; sendBtn.disabled = false; sendBtn.textContent = '发送';
}
