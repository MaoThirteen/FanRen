/* ============================================================
   data.js — 修仙境界数据、品阶常量、默认状态、工具函数
   ============================================================ */

const STORAGE_KEY = 'xiuxian_tavern';
const MAX_MSGS = 500, RECENT = 10, SUM_LIMIT = 800;

/* ---- 品阶常量 ---- */
const ARTIFACT_GRADES = ['仙器','混沌灵宝','玄天灵宝','上品法器','中品法器','下品法器','凡器'];
const SKILL_GRADES = ['仙阶功法','混沌功法','玄天功法','上品功法','中品功法','下品功法','凡间功法'];
const GRADE_COLORS = {
  '仙器':'#e8c860','混沌灵宝':'#c05050','玄天灵宝':'#50c0a0','上品法器':'#d0a050','中品法器':'#a060d0','下品法器':'#60a060','凡器':'#c0c0c0',
  '仙阶功法':'#e8c860','混沌功法':'#c05050','玄天功法':'#50c0a0','上品功法':'#d0a050','中品功法':'#a060d0','下品功法':'#60a060','凡间功法':'#c0c0c0'
};

function gradeTag(g) {
  const c = GRADE_COLORS[g] || '#888';
  return '<span class="grade-tag" style="background:'+c+'22;border:1px solid '+c+'44;color:'+c+'">'+g+'</span>';
}

/* ---- 境界经验阈值 ---- */
const CUMULATIVE_THRESHOLDS = {炼气一层:825,炼气二层:1650,炼气三层:2475,炼气四层:3300,炼气五层:4125,炼气六层:4950,炼气七层:5775,炼气八层:6600,炼气九层:7425,炼气十层:8250,炼气十一层:9075,炼气十二层:9900,筑基前期:30000,筑基中期:60000,筑基后期:120000,结丹前期:360000,结丹中期:720000,结丹后期:1440000,元婴前期:4320000,元婴中期:8640000,元婴后期:17280000,化神前期:51840000,化神中期:104000000,化神后期:207000000,炼虚前期:622000000,炼虚中期:1244000000,炼虚后期:2488000000,合体前期:7465000000,合体中期:14930000000,合体后期:29860000000,大乘前期:89580000000,大乘中期:179159000000,大乘后期:358318000000,渡劫期:1064204697600,谪仙前期:3190000000000,谪仙中期:6390000000000,谪仙后期:12770000000000,真仙前期:38310000000000,真仙中期:76620000000000,真仙后期:153250000000000,金仙前期:459740000000000,金仙中期:919470000000000,金仙后期:1838950000000000,太乙金仙前期:5516840000000000,太乙金仙中期:11033400000000000,太乙金仙后期:22071000000000000,大罗金仙前期:66203000000000000,大罗金仙中期:132403000000000000,大罗金仙后期:264811000000000000,道祖前期:794427000000000000,道祖中期:1588850000000000000,道祖后期:3177700000000000000};

const REALM_ORDER = ['炼气一层','炼气二层','炼气三层','炼气四层','炼气五层','炼气六层','炼气七层','炼气八层','炼气九层','炼气十层','炼气十一层','炼气十二层','筑基前期','筑基中期','筑基后期','结丹前期','结丹中期','结丹后期','元婴前期','元婴中期','元婴后期','化神前期','化神中期','化神后期','炼虚前期','炼虚中期','炼虚后期','合体前期','合体中期','合体后期','大乘前期','大乘中期','大乘后期','渡劫期','谪仙前期','谪仙中期','谪仙后期','真仙前期','真仙中期','真仙后期','金仙前期','金仙中期','金仙后期','太乙金仙前期','太乙金仙中期','太乙金仙后期','大罗金仙前期','大罗金仙中期','大罗金仙后期','道祖前期','道祖中期','道祖后期'];

const REALM_HPMP = {'炼气一层':{hp:100,hpMax:100,mp:50,mpMax:50},'炼气二层':{hp:150,hpMax:150,mp:75,mpMax:75},'炼气三层':{hp:200,hpMax:200,mp:100,mpMax:100},'炼气四层':{hp:250,hpMax:250,mp:125,mpMax:125},'炼气五层':{hp:300,hpMax:300,mp:150,mpMax:150},'炼气六层':{hp:350,hpMax:350,mp:175,mpMax:175},'炼气七层':{hp:400,hpMax:400,mp:200,mpMax:200},'炼气八层':{hp:450,hpMax:450,mp:225,mpMax:225},'炼气九层':{hp:500,hpMax:500,mp:250,mpMax:250},'炼气十层':{hp:550,hpMax:550,mp:275,mpMax:275},'炼气十一层':{hp:600,hpMax:600,mp:300,mpMax:300},'炼气十二层':{hp:650,hpMax:650,mp:325,mpMax:325},'筑基前期':{hp:1000,hpMax:1000,mp:400,mpMax:400},'筑基中期':{hp:1200,hpMax:1200,mp:600,mpMax:600},'筑基后期':{hp:1600,hpMax:1600,mp:800,mpMax:800},'结丹前期':{hp:2400,hpMax:2400,mp:1200,mpMax:1200},'结丹中期':{hp:3200,hpMax:3200,mp:1600,mpMax:1600},'结丹后期':{hp:4200,hpMax:4200,mp:2000,mpMax:2000},'元婴前期':{hp:6200,hpMax:6200,mp:3200,mpMax:3200},'元婴中期':{hp:8200,hpMax:8200,mp:4000,mpMax:4000},'元婴后期':{hp:10600,hpMax:10600,mp:5200,mpMax:5200},'化神前期':{hp:15800,hpMax:15800,mp:8000,mpMax:8000},'化神中期':{hp:20600,hpMax:20600,mp:10400,mpMax:10400},'化神后期':{hp:26800,hpMax:26800,mp:13400,mpMax:13400},'炼虚前期':{hp:40200,hpMax:40200,mp:20200,mpMax:20200},'炼虚中期':{hp:52400,hpMax:52400,mp:26200,mpMax:26200},'炼虚后期':{hp:68000,hpMax:68000,mp:34000,mpMax:34000},'合体前期':{hp:102000,hpMax:102000,mp:51000,mpMax:51000},'合体中期':{hp:132800,hpMax:132800,mp:66400,mpMax:66400},'合体后期':{hp:172600,hpMax:172600,mp:86200,mpMax:86200},'大乘前期':{hp:258800,hpMax:258800,mp:129400,mpMax:129400},'大乘中期':{hp:336400,hpMax:336400,mp:168200,mpMax:168200},'大乘后期':{hp:437400,hpMax:437400,mp:218600,mpMax:218600},'渡劫期':{hp:656000,hpMax:656000,mp:328000,mpMax:328000},'谪仙前期':{hp:984200,hpMax:984200,mp:492000,mpMax:492000},'谪仙中期':{hp:1279400,hpMax:1279400,mp:639600,mpMax:639600},'谪仙后期':{hp:1663200,hpMax:1663200,mp:831600,mpMax:831600},'真仙前期':{hp:2494800,hpMax:2494800,mp:1247400,mpMax:1247400},'真仙中期':{hp:3243200,hpMax:3243200,mp:1621600,mpMax:1621600},'真仙后期':{hp:4216200,hpMax:4216200,mp:2108000,mpMax:2108000},'金仙前期':{hp:6324200,hpMax:6324200,mp:3162200,mpMax:3162200},'金仙中期':{hp:8221600,hpMax:8221600,mp:4110800,mpMax:4110800},'金仙后期':{hp:10688000,hpMax:10688000,mp:5344000,mpMax:5344000},'太乙金仙前期':{hp:16032000,hpMax:16032000,mp:8016000,mpMax:8016000},'太乙金仙中期':{hp:20841600,hpMax:20841600,mp:10420800,mpMax:10420800},'太乙金仙后期':{hp:27094200,hpMax:27094200,mp:13547000,mpMax:13547000},'大罗金仙前期':{hp:40641200,hpMax:40641200,mp:20320600,mpMax:20320600},'大罗金仙中期':{hp:52833600,hpMax:52833600,mp:26416800,mpMax:26416800},'大罗金仙后期':{hp:68683600,hpMax:68683600,mp:34341800,mpMax:34341800},'道祖前期':{hp:103025600,hpMax:103025600,mp:51512800,mpMax:51512800},'道祖中期':{hp:133933200,hpMax:133933200,mp:66966600,mpMax:66966600},'道祖后期':{hp:174113200,hpMax:174113200,mp:87056600,mpMax:87056600}};

const REALM_STAGES = ['前期','中期','后期'];
const NARRATIVES = ['你盘膝而坐，灵力缓缓运转。','你沿山间小道前行，前方传来打斗声。','你步入破旧市集，摊位上摆满符箓和灵材。','溪流中水底有微光闪烁的灵石。','一只雪白小兽从灌木中探头张望。','天色渐暗，远处山洞透出荧光。','遇到游方老道，抚须笑称你根骨不错。','狂风卷过，风中夹杂血腥味。','废弃洞府中找到一卷残破竹简。','篝火噼啪，丹田灵力凝实几分。','溪边一条银鳞小鱼跃出水面。','前方传来低沉兽吼。','路过残破石碑，字迹模糊。','药香随风飘来，谷中长满灵草。','悬崖边发现枯骨和一枚储物戒。'];

function calcExpMax(realm) {
  const idx = REALM_ORDER.indexOf(realm); if (idx === -1) return 100;
  const cur = CUMULATIVE_THRESHOLDS[realm] || 0;
  const prev = idx > 0 ? (CUMULATIVE_THRESHOLDS[REALM_ORDER[idx - 1]] || 0) : 0;
  return Math.max(cur - prev, 100);
}
function getRealmDefaults(r) {
  const d = REALM_HPMP[r] || { hp:100, hpMax:100, mp:50, mpMax:50 };
  d.expMax = calcExpMax(r); return d;
}

function buildRealmOptions(sv) {
  const o = []; for (let i = 1; i <= 12; i++) { const v = '炼气' + i + '层'; o.push('<option value="' + v + '"' + (sv === v ? ' selected' : '') + '>' + v + '（默认0经验）</option>'); }
  const r = [['筑基',1,3],['结丹',1,3],['元婴',1,3],['化神',1,3],['炼虚',1,3],['合体',1,3],['大乘',1,3],['渡劫',0,0],['谪仙',1,3],['真仙',1,3],['金仙',1,3],['太乙金仙',1,3],['大罗金仙',1,3],['道祖',1,3]];
  r.forEach(([n,f,t])=>{if(f===0&&t===0){o.push('<option value="'+n+'"'+(sv===n?' selected':'')+'>'+n+'（默认0经验）</option>');}else{for(let i=f;i<=t;i++){const v=n+REALM_STAGES[i-1];o.push('<option value="'+v+'"'+(sv===v?' selected':'')+'>'+v+'（默认0经验）</option>');}}});
  return o.join('');
}

/* ---- 默认数据 ---- */
function defaultState() {
  return {
    protagonist: { name:'猫十三', realm:'炼气一层', exp:10, expMax:calcExpMax('炼气一层'), hp:100, hpMax:100, mp:50, mpMax:50, bloodline:['无'], daoRoot:'金、木、水、火（伪灵根，主金系）', gender:'男', sect:'无', sectTitle:'散修', artifacts:[], skills:[], spiritStones:100, inventory:[] },
    timeLocation: { time:'1年初春', location:'人界天南·放牛村', detail:'', day:'' },
    companions: [{ name:'王铁', realm:'炼气三层', gender:'男', bloodline:['金'], daoRoot:'天灵根，主金系', sect:'无', sectTitle:'散修', relation:'好友', exp:45, expMax:calcExpMax('炼气三层'), hp:85, hpMax:200, mp:35, mpMax:100, artifacts:[{ name:'开山斧', grade:'凡器', desc:'势大力沉' }], skills:[{ name:'铁布衫', grade:'凡间功法', desc:'淬炼肉身' }], spiritStones:20, inventory:[], status:'同行身旁' }],
    tempCharacters: [{ name:'内舍', realm:'炼气四层', gender:'男', bloodline:['无'], daoRoot:'', sect:'无', sectTitle:'散修', relation:'同行', tag:'同行', exp:50, expMax:calcExpMax('炼气四层'), hp:250, hpMax:250, mp:125, mpMax:125, artifacts:[], skills:[], spiritStones:5, inventory:[], status:'游荡中' }] };
}
function defaultConfig() { return { apiBase:'', apiBase2:'', apiModel:'', apiModel2:'', apiKey:'', apiKey2:'', simMode:true, sidebarFold:{}, lastRaw:'', temperature:0.7, topP:0.9, penalty:1.0 }; }

/* ---- 通用工具 ---- */
function esc(s) { return (typeof s !== 'string' ? '' : s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')); }
let toastTimer;
function showToast(m) {
  const e = document.getElementById('toast') || (function() { const d = document.createElement('div'); d.id = 'toast'; d.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] px-5 py-2.5 rounded-xl bg-[rgba(25,28,60,.94)] border border-[rgba(100,90,180,.16)] text-sm text-[#c0c0e0] tracking-wider opacity-0 transition-all duration-400 pointer-events-none backdrop-blur'; document.body.appendChild(d); return d; })();
  e.textContent = m; e.classList.add('opacity-100'); clearTimeout(toastTimer); toastTimer = setTimeout(() => e.classList.remove('opacity-100'), 2200);
}
function bar(l, v, m, c) { const p = m > 0 ? Math.min(v / m * 100, 100) : 0; const g = c || 'from-[#4a7aff] to-[#58d6ff]'; const lb = l ? '<span class="text-[rgba(180,180,220,.3)] w-7 shrink-0 text-right">' + l + '</span>' : ''; return '<div class="flex items-center gap-1 text-xs">' + lb + '<div class="progress-outer overflow-hidden"><div class="progress-fill rounded-full bg-gradient-to-r ' + g + '" style="width:' + p + '%"></div></div><span class="text-[rgba(200,200,230,.35)] w-10 text-right shrink-0 text-[10px]">' + p.toFixed(0) + '%</span></div>'; }
function getExpStage(p) { return p < 10 ? '初入' : p < 40 ? '稳固' : p < 60 ? '小成' : p < 90 ? '大成' : p < 99 ? '圆满' : '巅峰'; }
function getHpStage(p) { return p < 10 ? '濒死' : p < 40 ? '重创' : p < 70 ? '轻伤' : p < 90 ? '无碍' : '充盈'; }
function getMpStage(p) { return p < 10 ? '枯竭' : p < 40 ? '亏空' : p < 70 ? '不足' : p < 90 ? '充沛' : '盈满'; }
function renderInvItem(i) { return typeof i === 'string' ? esc(i) + '×1' : esc(i.name || '?') + '×' + (i.count || 1); }

/* ---- JSON修复 ---- */
function repairJSON(str) {
  let r = str.trim(), inS = false, esc = false, stk = [];
  for (let i = 0; i < r.length; i++) { const c = r[i]; if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === '"') { inS = !inS; continue; } if (inS) continue; if (c === '{' || c === '[') stk.push(c); if (c === '}' || c === ']') stk.pop(); }
  if (inS) r += '"'; r = r.replace(/[,\s]+$/, ''); if (/:\s*$/.test(r)) r += 'null';
  while (stk.length > 0) { const o = stk.pop(); r += (o === '{' ? '}' : ']'); }
  return r;
}
