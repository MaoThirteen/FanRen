/* ============================================================
   core.js — 对话核心逻辑（prompt构建、API调用、流式传输、状态解析）
   依赖: data.js, storage.js, ui.js
   ============================================================ */

function enforceMsgLimit() { const m = data.chatHistory || []; if (m.length > MAX_MSGS) { const r = m.length - MAX_MSGS; data.chatHistory = m.slice(r); addLog('自动清理 ' + r + ' 条旧记录'); saveAll(); } }

function buildPrompt(u) {
  const cfg = getConfig();
  const params = 'Temperature: ' + cfg.temperature + ' | TopP: ' + cfg.topP + ' | 重复惩罚: ' + cfg.penalty + '\n';
  const fixed = '【⚠️ 最重要规则 — 违反则回复无效】\n你的回复必须包含两部分，缺一不可：\n1. 剧情正文（自然语言推进故事）\n2. 紧接正文末尾的状态JSON代码块（格式：三个反引号+status，然后JSON，然后三个反引号闭合）\n如果你只输出了剧情而没有在末尾附上status代码块，你的回复将被视为不完整并丢弃。\n\n示例格式：\n（正文内容...）\n\n\x60\x60\x60status\n{"protagonist":{...},"companions":[...],"tempCharacters":[...],"timeLocation":{...},"roundSummary":"..."}\n\x60\x60\x60\n\n【最高优先级指令】以输入的状态栏为第一准则，上下文故事仅为补充。若发现与此前回复的状态栏不一致，以本次收到的状态面板为准，立刻覆盖旧设定。\n\nTemperature: ' + cfg.temperature + ' | TopP: ' + cfg.topP + ' | 重复惩罚: ' + cfg.penalty + '\n\n【叙事文风强制规范】\n- 全程第二人称"你"叙事；战斗依靠灵力流动、法器异象、肉身变化体现效果，禁止喊技能名。\n- 文风贴合《凡人修仙传》冷峻写实基调；主角猫十三隐忍惜命、精于算计、凡事优先自保，习惯隐藏全部底牌。\n- 写实刻画法力损耗、肉身伤势、法宝损耗、神魂透支；拒绝浮夸炫技，依靠画面张力体现战力。\n- 人物对话层次分明：高阶修士傲慢疏离，同阶客套暗藏算计，魔修直白狠戾，正道多伪善藏私。\n- 剧情自由度极高，可自主设计妖兽、遗迹、血脉、法则、专属法宝及所有战斗情节。\n- 法器/功法数据格式：artifacts/skills 数组中每个元素为 {name, grade, desc}，desc 不超过15字。\n- 宝物品级：仙器＞混沌灵宝＞玄天法宝＞通天灵宝＞上品/中品/下品法宝＞凡器；法宝可损毁、置换、主动舍弃，本命法宝丢弃会重创道基；玄天及以上不会彻底损毁。\n- 血脉支持觉醒提纯、多血脉融合、秘术剥离、废弃；高阶法则克制低阶法则；悟道凝聚道印可大幅提升战力。\n- 世界位面：灵气稀薄人界、主线灵界、上界真仙界。\n- **临时角色 vs 同伴的区分规则**：AI 只能向 tempCharacters 添加新角色，**绝对禁止**自行向 companions 添加。同伴只能由玩家明确同意后，由前端代码迁移。NPC 路人、敌人、偶遇者全部放入 tempCharacters。\n- 临时角色每轮结束前检查：已退场/不再出现的角色**必须**从 tempCharacters 中移除。连续2次对话未提及 = 立即删除。\n- **遇到新角色/路人/敌人必须立刻加入 tempCharacters**并返回完整数据（name/realm/exp/hp/mp 等全部字段）。战斗中每轮更新所有参与者hp/mp。\n\n- timeLocation 格式为"时间·地点·细节·第X日"，参考："1569年初冬·灵界东域·荒域外围·临时洞府（洞顶已裂）·第七日"。\n- 所有角色的expMax必须与当前境界的经验上限严格一致。\n- NPC路过角色应有随机的合理修为经验值（对应其境界的50%-90%之间）。';
  const st = JSON.stringify(getState(), null, 2), ch = data.chatHistory || [], su = data.summaries || [];
  const rc = ch.slice(-RECENT * 2); let rl = []; rc.forEach(m => { if (m.role === 'user') rl.push('玩家：' + m.content); else rl.push('AI：' + (m.content || '')); }); const rs = rl.length ? '\n\n【最近对话】\n' + rl.join('\n') : '';
  let sl = []; su.forEach(s => { if (s) sl.push('- ' + s); }); let tc = sl.join('').length; while (tc > SUM_LIMIT && sl.length > 0) { sl.shift(); data.summaries.shift(); tc = sl.join('').length; } const ss = sl.length ? '\n\n【对话历史摘要】\n' + sl.join('\n') : '';
  return fixed + '\n\n【当前角色状态数据】\n' + st + rs + ss + '\n\n【玩家指令】\n' + u;
}

function genSim(s) {
  const st = NARRATIVES[Math.floor(Math.random() * NARRATIVES.length)];
  const ns = JSON.parse(JSON.stringify(s)); const p = ns.protagonist;
  p.exp = Math.min(p.exp + (3 + Math.floor(Math.random() * 6)), p.expMax);
  p.spiritStones += Math.floor(Math.random() * 5) + 1;
  if (Math.random() < 0.08 && !p.artifacts.find(a => a.name === '青铜古剑')) p.artifacts.push({ name:'青铜古剑', grade:'凡器', desc:'斩铁如泥' });
  if (Math.random() < 0.1 && p.skills.length < 5) { const n2 = ['吐纳术','火球诀','清风步','金刚罩','灵犀指']; const pk = n2[Math.floor(Math.random() * n2.length)]; if (!p.skills.find(s => s.name === pk)) p.skills.push({ name:pk, grade:'凡间功法', desc:'基础法门' }); }
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

async function sendMessage(u, isRegen) {
  if (isLoading || !u || !u.trim()) return;
  isLoading = true; sendBtn.disabled = true; sendBtn.textContent = '发送中';
  lastUserInput = u;
  if (!isRegen) { if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'user', content:u }); enforceMsgLimit(); saveAll(); appendMsg('user', u); inputBox.value = ''; }
  createStreamBubble();
  const cfg = getConfig();
  try {
    const parseAndSaveStatus = (rt) => {
      cfg.lastRaw = rt; saveAll();
      let js = null;
      // 尝试各种代码块格式：```status```、```json```、```status json```、以及无标记的```
      const m1 = rt.match(/```(?:status|json)?\s*(?:json)?\s*\n?([\s\S]*?)```/i);
      if (m1) js = m1[1].trim();
      if (!js) { const ab = rt.match(/```[\s\S]*?```/); if (ab) { const i = ab[0].replace(/^```\w*\n?/, '').replace(/```$/, '').trim(); try { JSON.parse(i); js = i; } catch (_) { /* 非JSON代码块，跳过 */ } } }
      if (!js) { const bm = rt.match(/\{[\s\S]*"protagonist"[\s\S]*\}/); if (bm) { try { JSON.parse(bm[0]); js = bm[0]; } catch (_) { /* 含protagonist字段但格式有问题 */ } } }
      let sn = '';
      if (js) { try { let p = JSON.parse(repairJSON(js));
        if (p.protagonist) {
          if (p.roundSummary) { if (!data.summaries) data.summaries = []; data.summaries.push(p.roundSummary); delete p.roundSummary; }
          if (p.timeLocation && p.timeLocation.time) data.state.timeLocation = p.timeLocation; data.state = p;
          if (!data.state.companions || !Array.isArray(data.state.companions)) data.state.companions = getState().companions || [];
          if (!data.state.tempCharacters || !Array.isArray(data.state.tempCharacters)) data.state.tempCharacters = getState().tempCharacters || [];
          saveAll(); renderSidebar(); sn = '✓ 状态已更新'; addLog('✓ 状态更新 · 同伴' + data.state.companions.length + ' · 临时' + data.state.tempCharacters.length);
        } else { sn = '⚠ 状态结构不完整'; addLog('⚠ 状态结构不完整'); }
      } catch (e) { sn = '⚠ JSON解析失败'; addLog('⚠ JSON解析失败'); } }
      else { sn = '⚠ 未检测到状态更新'; const tail = rt.slice(-200).replace(/[\n\r]+/g, '↵'); addLog('⚠ 未检测到状态代码块 → 末尾: ' + tail); }
      let st = rt.replace(/```[\s\S]*?```/g, '').trim();
      if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'assistant', content:st, statusNotice:sn }); saveAll();
      return { sn, st };
    };

    if (cfg.simMode) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
      const g = genSim(getState()); const wm = '\n\n（此为模拟回复，请先关闭设置中的模拟回复，连接API）';
      let fullText = ''; if (g.state) fullText = g.story + wm + '\n\n```status\n' + JSON.stringify(g.state, null, 2) + '\n```'; else fullText = g.story + wm;
      let i = 0; const chunk = 3, delay = 20;
      while (i < fullText.length) { const end = Math.min(i + chunk, fullText.length); appendStreamText(fullText.slice(i, end)); i = end; await new Promise(r => setTimeout(r, delay)); }
      const { sn, st } = parseAndSaveStatus(fullText); finalizeStreamBubble(sn, st);
    } else {
      const base = cfg.apiBase, model = cfg.apiModel, key = cfg.apiKey;
      if (!base || !model || !key) throw new Error('请填写 API 配置');
      const r = await fetch(base + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
        body: JSON.stringify({ model, messages:[{ role:'user', content:buildPrompt(u) }], temperature:cfg.temperature || 0.7, top_p:cfg.topP || 0.9, frequency_penalty:cfg.penalty ? cfg.penalty - 1 : 0, stream:true }) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const reader = r.body.getReader(); const decoder = new TextDecoder(); let fullText = '', buffer = '';
      while (true) { const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream:true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) { if (!line.startsWith('data: ')) continue; const data = line.slice(6).trim(); if (data === '[DONE]') continue;
          try { const j = JSON.parse(data); const delta = j.choices?.[0]?.delta?.content; if (delta) { fullText += delta; appendStreamText(delta); } } catch (_) {} }
      }
      // 检测是否缺少status代码块，若缺少则自动续写请求
      if (!fullText.match(/```(?:status|json)/i) && !fullText.includes('"protagonist"')) {
        appendStreamText('\n\n[自动获取状态更新中…]');
        addLog('⚠ 正文无status代码块，发送续写请求…');
        try {
          const r2 = await fetch(base + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
            body: JSON.stringify({ model, messages:[
              { role:'user', content:buildPrompt(u) },
              { role:'assistant', content:fullText.slice(-2000) },
              { role:'user', content:'你刚才的回复缺少末尾的status代码块。请立即只输出status代码块，包含protagonist、companions、tempCharacters、timeLocation、roundSummary全部字段，不要输出任何剧情或其他内容。' }
            ], temperature:0.3, stream:true }) });
          if (r2.ok) {
            const reader2 = r2.body.getReader(); let fullText2 = '', buffer2 = '';
            while (true) { const { value, done } = await reader2.read(); if (done) break;
              buffer2 += decoder.decode(value, { stream:true }); const lines2 = buffer2.split('\n'); buffer2 = lines2.pop() || '';
              for (const line2 of lines2) { if (!line2.startsWith('data: ')) continue; const data2 = line2.slice(6).trim(); if (data2 === '[DONE]') continue;
                try { const j2 = JSON.parse(data2); const delta2 = j2.choices?.[0]?.delta?.content; if (delta2) fullText2 += delta2; } catch (_) {} }
            }
            fullText += '\n' + fullText2;
          }
        } catch (e2) { addLog('⚠ 续写请求失败: ' + e2.message); }
      }
      const { sn, st } = parseAndSaveStatus(fullText); finalizeStreamBubble(sn, st);
    }
  } catch (err) { removeStreamBubble(); const em = '请求失败：' + err.message; if (!data.chatHistory) data.chatHistory = []; data.chatHistory.push({ role:'assistant', content:em, statusNotice:'' }); saveAll(); appendMsg('assistant', em); addRegenBtn(); }
  isLoading = false; sendBtn.disabled = false; sendBtn.textContent = '发送';
}
