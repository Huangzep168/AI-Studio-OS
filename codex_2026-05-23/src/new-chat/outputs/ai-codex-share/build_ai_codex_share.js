const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const outDir = __dirname;
const assetDir = path.join(outDir, "assets");
fs.mkdirSync(assetDir, { recursive: true });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "广州栗子谷孵化器有限公司";
pptx.company = "广州栗子谷孵化器有限公司";
pptx.subject = "AI / Codex 内部分享";
pptx.title = "AI 不只是聊天工具";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  lang: "zh-CN",
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

const C = {
  ink: "172033",
  muted: "64748B",
  faint: "E8EDF4",
  paper: "F8FAFC",
  white: "FFFFFF",
  green: "0F7A5A",
  teal: "14B8A6",
  blue: "2563EB",
  orange: "F59E0B",
  red: "EF4444",
  purple: "7C3AED",
  line: "CBD5E1",
};

function addBg(slide, title, kicker = "AI / Codex 内部分享") {
  slide.background = { color: C.paper };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.paper }, line: { color: C.paper } });
  slide.addText(kicker, { x: 0.55, y: 0.28, w: 3.6, h: 0.25, fontFace: "Microsoft YaHei", fontSize: 8.5, color: C.muted, bold: false, margin: 0 });
  slide.addText(title, { x: 0.55, y: 0.58, w: 8.6, h: 0.5, fontFace: "Microsoft YaHei", fontSize: 22, color: C.ink, bold: true, margin: 0 });
  slide.addShape(pptx.ShapeType.line, { x: 0.55, y: 1.22, w: 12.25, h: 0, line: { color: "D7DEE8", width: 1 } });
}

function title(slide, text, opts = {}) {
  slide.addText(text, { x: opts.x ?? 0.6, y: opts.y ?? 0.65, w: opts.w ?? 8.4, h: opts.h ?? 0.75, fontFace: "Microsoft YaHei", fontSize: opts.size ?? 25, bold: true, color: opts.color ?? C.ink, margin: 0, breakLine: false, fit: "shrink" });
}

function text(slide, s, x, y, w, h, opt = {}) {
  slide.addText(s, { x, y, w, h, fontFace: opt.face ?? "Microsoft YaHei", fontSize: opt.size ?? 13, color: opt.color ?? C.ink, bold: opt.bold ?? false, margin: opt.margin ?? 0.06, valign: opt.valign ?? "mid", align: opt.align ?? "left", fit: "shrink", breakLine: false, });
}

function pill(slide, s, x, y, w, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.34, rectRadius: 0.06, fill: { color }, line: { color }, });
  text(slide, s, x + 0.08, y + 0.06, w - 0.16, 0.16, { size: 8.5, color: C.white, bold: true, align: "center", margin: 0 });
}

function card(slide, x, y, w, h, fill = C.white, line = "D7DEE8") {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line, width: 1 } });
}

function sectionLabel(slide, label, x, y, color) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.1, h: 0.34, fill: { color }, line: { color } });
  text(slide, label, x + 0.18, y + 0.03, 2.0, 0.18, { size: 9, color: C.muted, bold: true, margin: 0 });
}

function metric(slide, label, value, note, x, y, w, color) {
  card(slide, x, y, w, 1.25);
  text(slide, label, x + 0.18, y + 0.18, w - 0.36, 0.18, { size: 9, color: C.muted, bold: true, margin: 0 });
  text(slide, value, x + 0.18, y + 0.47, w - 0.36, 0.36, { size: 25, color, bold: true, margin: 0 });
  text(slide, note, x + 0.18, y + 0.91, w - 0.36, 0.18, { size: 8.5, color: C.muted, margin: 0 });
}

function bulletList(slide, items, x, y, w, opt = {}) {
  items.forEach((item, i) => {
    const yy = y + i * (opt.gap ?? 0.55);
    slide.addShape(pptx.ShapeType.ellipse, { x, y: yy + 0.08, w: 0.12, h: 0.12, fill: { color: opt.dot ?? C.green }, line: { color: opt.dot ?? C.green } });
    text(slide, item, x + 0.23, yy, w - 0.23, 0.35, { size: opt.size ?? 12, color: opt.color ?? C.ink, margin: 0 });
  });
}

function simpleIcon(slide, label, x, y, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 0.56, h: 0.56, rectRadius: 0.06, fill: { color }, line: { color } });
  text(slide, label, x, y + 0.15, 0.56, 0.16, { size: 10, color: C.white, bold: true, align: "center", margin: 0 });
}

function addSpeaker(slide, lines) {
  if (typeof slide.addNotes === "function") slide.addNotes(lines.join("\n"));
}

async function makeDashboardPng() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#f8fafc"/>
    <rect x="0" y="0" width="1280" height="72" fill="#172033"/>
    <text x="44" y="45" font-family="Microsoft YaHei, Arial" font-size="24" font-weight="700" fill="#ffffff">楼宇经营与客户机会分析台</text>
    <text x="1040" y="44" font-family="Arial" font-size="13" fill="#94a3b8">Demo / AI generated</text>
    <rect x="36" y="100" width="258" height="584" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="58" y="136" font-family="Microsoft YaHei" font-size="17" font-weight="700" fill="#172033">筛选条件</text>
    <text x="58" y="176" font-family="Microsoft YaHei" font-size="13" fill="#64748b">区域</text>
    <rect x="58" y="190" width="208" height="36" rx="7" fill="#f1f5f9" stroke="#d7dee8"/>
    <text x="73" y="214" font-family="Microsoft YaHei" font-size="13" fill="#172033">白鹅潭 / 芳村 / 荔湾</text>
    <text x="58" y="259" font-family="Microsoft YaHei" font-size="13" fill="#64748b">目标行业</text>
    <rect x="58" y="274" width="92" height="30" rx="15" fill="#dcfce7"/><text x="81" y="294" font-family="Microsoft YaHei" font-size="12" fill="#166534">科技服务</text>
    <rect x="158" y="274" width="78" height="30" rx="15" fill="#dbeafe"/><text x="178" y="294" font-family="Microsoft YaHei" font-size="12" fill="#1d4ed8">投资</text>
    <rect x="58" y="313" width="84" height="30" rx="15" fill="#fef3c7"/><text x="78" y="333" font-family="Microsoft YaHei" font-size="12" fill="#92400e">文创</text>
    <text x="58" y="392" font-family="Microsoft YaHei" font-size="13" fill="#64748b">AI 任务</text>
    <rect x="58" y="410" width="208" height="48" rx="8" fill="#172033"/>
    <text x="82" y="440" font-family="Microsoft YaHei" font-size="15" font-weight="700" fill="#ffffff">生成本周客户清单</text>
    <rect x="58" y="474" width="208" height="48" rx="8" fill="#eef2ff"/>
    <text x="78" y="504" font-family="Microsoft YaHei" font-size="14" fill="#3730a3">分析竞品租金变化</text>
    <rect x="322" y="100" width="282" height="118" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="346" y="133" font-family="Microsoft YaHei" font-size="13" fill="#64748b">本月潜在客户</text>
    <text x="346" y="178" font-family="Arial" font-size="40" font-weight="700" fill="#0f7a5a">128</text>
    <text x="430" y="178" font-family="Microsoft YaHei" font-size="15" fill="#64748b">家</text>
    <text x="346" y="202" font-family="Microsoft YaHei" font-size="12" fill="#64748b">来自公开招聘、工商变更、政策名单、渠道线索</text>
    <rect x="628" y="100" width="282" height="118" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="652" y="133" font-family="Microsoft YaHei" font-size="13" fill="#64748b">重点跟进</text>
    <text x="652" y="178" font-family="Arial" font-size="40" font-weight="700" fill="#2563eb">24</text>
    <text x="710" y="178" font-family="Microsoft YaHei" font-size="15" fill="#64748b">家</text>
    <text x="652" y="202" font-family="Microsoft YaHei" font-size="12" fill="#64748b">扩招、融资、搬迁、成本优化信号较强</text>
    <rect x="934" y="100" width="282" height="118" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="958" y="133" font-family="Microsoft YaHei" font-size="13" fill="#64748b">预计面积需求</text>
    <text x="958" y="178" font-family="Arial" font-size="40" font-weight="700" fill="#f59e0b">6,800</text>
    <text x="1094" y="178" font-family="Microsoft YaHei" font-size="15" fill="#64748b">m²</text>
    <text x="958" y="202" font-family="Microsoft YaHei" font-size="12" fill="#64748b">按岗位规模、企业阶段、行业密度估算</text>
    <rect x="322" y="244" width="564" height="220" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="346" y="281" font-family="Microsoft YaHei" font-size="17" font-weight="700" fill="#172033">客户机会排序</text>
    <g font-family="Microsoft YaHei" font-size="13" fill="#172033">
      <text x="346" y="324">企业 A：AI 应用服务 / 扩招 18 人 / 预算中高</text>
      <rect x="346" y="338" width="470" height="12" rx="6" fill="#e2e8f0"/><rect x="346" y="338" width="404" height="12" rx="6" fill="#0f7a5a"/>
      <text x="346" y="377">企业 B：跨境电商 / 仓办一体 / 政策敏感</text>
      <rect x="346" y="391" width="470" height="12" rx="6" fill="#e2e8f0"/><rect x="346" y="391" width="338" height="12" rx="6" fill="#2563eb"/>
      <text x="346" y="430">企业 C：投资管理 / 小面积独立办公 / 决策快</text>
      <rect x="346" y="444" width="470" height="12" rx="6" fill="#e2e8f0"/><rect x="346" y="444" width="286" height="12" rx="6" fill="#f59e0b"/>
    </g>
    <rect x="910" y="244" width="306" height="220" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="934" y="281" font-family="Microsoft YaHei" font-size="17" font-weight="700" fill="#172033">AI 下一步建议</text>
    <text x="934" y="322" font-family="Microsoft YaHei" font-size="13" fill="#172033">1. 先约企业 A 做成本测算</text>
    <text x="934" y="356" font-family="Microsoft YaHei" font-size="13" fill="#172033">2. 给企业 B 准备园区政策包</text>
    <text x="934" y="390" font-family="Microsoft YaHei" font-size="13" fill="#172033">3. 向渠道同步 80-150m² 产品</text>
    <text x="934" y="424" font-family="Microsoft YaHei" font-size="13" fill="#172033">4. 每周自动更新竞品租金表</text>
    <rect x="322" y="492" width="894" height="192" rx="12" fill="#ffffff" stroke="#d7dee8"/>
    <text x="346" y="530" font-family="Microsoft YaHei" font-size="17" font-weight="700" fill="#172033">市场信号流：从公开信息到行动清单</text>
    <circle cx="386" cy="594" r="30" fill="#dcfce7"/><text x="365" y="601" font-family="Microsoft YaHei" font-size="14" font-weight="700" fill="#166534">线索</text>
    <path d="M420 594 L515 594" stroke="#94a3b8" stroke-width="3"/><path d="M515 594 l-10 -7 v14 z" fill="#94a3b8"/>
    <circle cx="565" cy="594" r="30" fill="#dbeafe"/><text x="544" y="601" font-family="Microsoft YaHei" font-size="14" font-weight="700" fill="#1d4ed8">清洗</text>
    <path d="M600 594 L694 594" stroke="#94a3b8" stroke-width="3"/><path d="M694 594 l-10 -7 v14 z" fill="#94a3b8"/>
    <circle cx="744" cy="594" r="30" fill="#fef3c7"/><text x="723" y="601" font-family="Microsoft YaHei" font-size="14" font-weight="700" fill="#92400e">评分</text>
    <path d="M779 594 L873 594" stroke="#94a3b8" stroke-width="3"/><path d="M873 594 l-10 -7 v14 z" fill="#94a3b8"/>
    <circle cx="923" cy="594" r="30" fill="#ede9fe"/><text x="902" y="601" font-family="Microsoft YaHei" font-size="14" font-weight="700" fill="#6d28d9">跟进</text>
    <path d="M958 594 L1052 594" stroke="#94a3b8" stroke-width="3"/><path d="M1052 594 l-10 -7 v14 z" fill="#94a3b8"/>
    <circle cx="1102" cy="594" r="30" fill="#fee2e2"/><text x="1081" y="601" font-family="Microsoft YaHei" font-size="14" font-weight="700" fill="#991b1b">复盘</text>
  </svg>`;
  const file = path.join(assetDir, "dashboard-demo.png");
  await sharp(Buffer.from(svg)).png().toFile(file);
  return file;
}

function buildHtmlDemo() {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>楼宇经营与客户机会分析台 - Demo</title>
  <style>
    body{margin:0;font-family:"Microsoft YaHei",Arial,sans-serif;background:#f8fafc;color:#172033}
    header{height:72px;background:#172033;color:white;display:flex;align-items:center;justify-content:space-between;padding:0 36px}
    h1{font-size:24px;margin:0}.tag{color:#94a3b8;font-size:13px}
    main{display:grid;grid-template-columns:280px 1fr;gap:28px;padding:28px 36px}
    aside,.card{background:white;border:1px solid #d7dee8;border-radius:12px}
    aside{padding:22px}.field{margin:22px 0 8px;color:#64748b;font-size:13px}.select{background:#f1f5f9;border:1px solid #d7dee8;border-radius:8px;padding:10px 14px}.chips span{display:inline-block;margin:6px 6px 0 0;padding:7px 14px;border-radius:20px;font-size:12px}
    button{width:100%;border:0;border-radius:8px;padding:14px;margin-top:16px;font-weight:700;font-size:15px;cursor:pointer}
    .primary{background:#172033;color:white}.secondary{background:#eef2ff;color:#3730a3}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.card{padding:22px}.label{font-size:13px;color:#64748b}.value{font-size:40px;font-weight:800;margin-top:10px}.green{color:#0f7a5a}.blue{color:#2563eb}.orange{color:#f59e0b}
    .wide{grid-column:span 2}.section{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:24px}.bar{height:12px;background:#e2e8f0;border-radius:999px;margin:10px 0 22px}.bar i{display:block;height:12px;border-radius:999px}
    .flow{display:flex;align-items:center;justify-content:space-between}.node{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}.arrow{height:3px;background:#94a3b8;flex:1;margin:0 14px}
  </style>
</head>
<body>
  <header><h1>楼宇经营与客户机会分析台</h1><div class="tag">Demo / AI generated</div></header>
  <main>
    <aside>
      <h2>筛选条件</h2>
      <div class="field">区域</div><div class="select">白鹅潭 / 芳村 / 荔湾</div>
      <div class="field">目标行业</div><div class="chips"><span style="background:#dcfce7;color:#166534">科技服务</span><span style="background:#dbeafe;color:#1d4ed8">投资</span><span style="background:#fef3c7;color:#92400e">文创</span></div>
      <div class="field">AI 任务</div><button class="primary">生成本周客户清单</button><button class="secondary">分析竞品租金变化</button>
    </aside>
    <section>
      <div class="grid">
        <div class="card"><div class="label">本月潜在客户</div><div class="value green">128</div><p>来自公开招聘、工商变更、政策名单、渠道线索</p></div>
        <div class="card"><div class="label">重点跟进</div><div class="value blue">24</div><p>扩招、融资、搬迁、成本优化信号较强</p></div>
        <div class="card"><div class="label">预计面积需求</div><div class="value orange">6,800m²</div><p>按岗位规模、企业阶段、行业密度估算</p></div>
      </div>
      <div class="section">
        <div class="card">
          <h2>客户机会排序</h2>
          <p>企业 A：AI 应用服务 / 扩招 18 人 / 预算中高</p><div class="bar"><i style="width:86%;background:#0f7a5a"></i></div>
          <p>企业 B：跨境电商 / 仓办一体 / 政策敏感</p><div class="bar"><i style="width:72%;background:#2563eb"></i></div>
          <p>企业 C：投资管理 / 小面积独立办公 / 决策快</p><div class="bar"><i style="width:61%;background:#f59e0b"></i></div>
        </div>
        <div class="card"><h2>AI 下一步建议</h2><p>1. 先约企业 A 做成本测算</p><p>2. 给企业 B 准备园区政策包</p><p>3. 向渠道同步 80-150m² 产品</p><p>4. 每周自动更新竞品租金表</p></div>
      </div>
      <div class="card" style="margin-top:24px"><h2>市场信号流：从公开信息到行动清单</h2><div class="flow"><div class="node" style="background:#dcfce7;color:#166534">线索</div><div class="arrow"></div><div class="node" style="background:#dbeafe;color:#1d4ed8">清洗</div><div class="arrow"></div><div class="node" style="background:#fef3c7;color:#92400e">评分</div><div class="arrow"></div><div class="node" style="background:#ede9fe;color:#6d28d9">跟进</div><div class="arrow"></div><div class="node" style="background:#fee2e2;color:#991b1b">复盘</div></div></div>
    </section>
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "building-ai-dashboard-demo.html"), html, "utf8");
}

async function buildDeck() {
  const dashboard = await makeDashboardPng();
  buildHtmlDemo();

  let s = pptx.addSlide();
  s.background = { color: "F8FAFC" };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "172033" }, line: { color: "172033" } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.2, h: 7.5, fill: { color: "0F7A5A" }, line: { color: "0F7A5A" }, transparency: 10 });
  s.addText("AI 不只是聊天工具", { x: 0.75, y: 1.4, w: 8.6, h: 0.85, fontFace: "Microsoft YaHei", fontSize: 36, bold: true, color: C.white, margin: 0 });
  s.addText("从普通员工到 AI 工作流搭建者：用 Codex 把想法变成可运行的工具", { x: 0.78, y: 2.42, w: 8.8, h: 0.48, fontFace: "Microsoft YaHei", fontSize: 17, color: "DDE7F0", margin: 0 });
  s.addText("广州栗子谷孵化器有限公司", { x: 0.78, y: 5.88, w: 4.4, h: 0.28, fontFace: "Microsoft YaHei", fontSize: 12.5, color: "C8D3DF", margin: 0 });
  s.addText("内部分享 / 2026", { x: 0.78, y: 6.22, w: 3.4, h: 0.24, fontFace: "Microsoft YaHei", fontSize: 10.5, color: "94A3B8", margin: 0 });
  card(s, 9.2, 1.03, 2.85, 4.8, "F8FAFC", "F8FAFC");
  text(s, "今天不讲概念堆砌，只讲三件事：", 9.55, 1.45, 2.15, 0.3, { size: 12, color: C.muted, bold: true });
  bulletList(s, ["它到底强在哪", "各岗位能怎么用", "如何从 0 到 1 落地"], 9.55, 2.02, 2.0, { size: 12, gap: 0.72, dot: C.green });
  addSpeaker(s, ["开场：用自己的经历带入，但不要讲成技术课。重点说：AI 的价值不是替人聊天，而是把人的想法变成流程、页面、表格、系统。"]);

  s = pptx.addSlide();
  addBg(s, "这次分享的核心观点");
  metric(s, "过去", "问答工具", "一次性回答，结果靠复制粘贴", 0.75, 1.6, 3.7, C.muted);
  metric(s, "现在", "工作伙伴", "能读文件、写代码、改页面、做 PPT", 4.85, 1.6, 3.7, C.blue);
  metric(s, "未来", "组织能力", "把经验沉淀成自动化流程和内部系统", 8.95, 1.6, 3.7, C.green);
  text(s, "真正的变化不是“多一个软件”，而是每个人都能用自然语言调动数字化能力。", 1.05, 4.08, 11.0, 0.42, { size: 19, bold: true, color: C.ink, align: "center" });
  bulletList(s, ["不会写代码，也可以先描述需求", "没有专业设计，也可以生成可视化页面和汇报材料", "不是替代岗位，而是让岗位的人更快完成复杂工作"], 2.0, 5.0, 9.2, { size: 13, gap: 0.5, dot: C.blue });

  s = pptx.addSlide();
  addBg(s, "从一次 AI 课程，到真正动手搭系统");
  const steps = [
    ["学习入门", "大模型、智能体、扣子等平台，让我们先理解“能对话、能生成”。", C.blue],
    ["遇到瓶颈", "单页 HTML、数据库、云端部署、权限和数据结构开始出现。", C.orange],
    ["发现 Codex", "不只是回答问题，而是能在本地工作区持续改文件、做验证、产出交付物。", C.green],
    ["形成判断", "未来核心能力不是会不会用某个按钮，而是会不会把业务问题拆成 AI 可执行的任务。", C.purple],
  ];
  steps.forEach((st, i) => {
    const x = 0.85 + i * 3.1;
    card(s, x, 1.75, 2.65, 3.6);
    simpleIcon(s, String(i + 1), x + 0.22, 2.05, st[2]);
    text(s, st[0], x + 0.22, 2.78, 2.15, 0.3, { size: 17, bold: true });
    text(s, st[1], x + 0.22, 3.32, 2.12, 1.0, { size: 11.5, color: C.muted, valign: "top" });
  });
  text(s, "分享重点：不是教大家复刻我的注册过程，而是把这段经历转化成可复制的工作方法。", 1.1, 6.0, 10.7, 0.32, { size: 13, color: C.ink, bold: true, align: "center" });

  s = pptx.addSlide();
  addBg(s, "Codex 可以被理解成：会动手的 AI 同事");
  card(s, 0.75, 1.55, 5.25, 4.6);
  text(s, "传统聊天式大模型", 1.05, 1.9, 4.0, 0.35, { size: 18, bold: true });
  bulletList(s, ["回答问题", "写一段文案", "给一个方案", "需要人手动复制、整理、验证"], 1.1, 2.55, 4.5, { size: 12.5, gap: 0.55, dot: C.muted });
  card(s, 7.3, 1.55, 5.25, 4.6);
  text(s, "Codex / Cloud Code 类工具", 7.6, 1.9, 4.3, 0.35, { size: 18, bold: true, color: C.green });
  bulletList(s, ["读懂项目文件和上下文", "直接生成 PPT、网页、脚本、表格", "运行命令、检查结果、继续修改", "把自然语言变成可交付成果"], 7.65, 2.55, 4.4, { size: 12.5, gap: 0.55, dot: C.green });
  s.addShape(pptx.ShapeType.chevron, { x: 6.2, y: 3.25, w: 0.78, h: 0.55, fill: { color: C.blue }, line: { color: C.blue } });
  text(s, "关键差别：从“给答案”升级为“完成任务”。", 2.2, 6.45, 8.9, 0.28, { size: 15, bold: true, align: "center" });

  s = pptx.addSlide();
  addBg(s, "它强大的地方，不在单点能力，而在组合能力");
  const powers = [
    ["写", "文案、方案、制度、邮件、脚本", C.blue],
    ["读", "资料、表格、代码、网页、会议纪要", C.green],
    ["算", "数据清洗、指标口径、预算测算", C.orange],
    ["做", "PPT、网页、Dashboard、自动化工具", C.purple],
    ["查", "官方资料、公开信息、内部文档", "0891B2"],
    ["验", "运行、截图、测试、修正错误", C.red],
  ];
  powers.forEach((p, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.9 + col * 4.1, y = 1.65 + row * 2.05;
    card(s, x, y, 3.55, 1.55);
    simpleIcon(s, p[0], x + 0.22, y + 0.25, p[2]);
    text(s, p[1], x + 0.95, y + 0.35, 2.2, 0.48, { size: 13, bold: true });
    text(s, "不是单独使用，而是串成完整工作流", x + 0.95, y + 0.9, 2.15, 0.22, { size: 9.5, color: C.muted });
  });
  text(s, "一个人说清楚目标，AI 负责把中间大量机械动作做完。", 2.05, 6.4, 9.2, 0.3, { size: 16, bold: true, align: "center" });

  s = pptx.addSlide();
  addBg(s, "不同岗位可以怎么用");
  const roles = [
    ["投资", "行业扫描、项目初筛、竞品对比、尽调问题清单、投资备忘录初稿", C.purple],
    ["人力", "岗位 JD、简历初筛维度、面试题库、培训课件、制度问答助手", C.green],
    ["财务", "费用归集、预算执行分析、报销规则解释、经营看板、异常波动说明", C.orange],
    ["招商 / 运营", "客户画像、空间产品包、渠道话术、市场信号追踪、租赁测算", C.blue],
  ];
  roles.forEach((r, i) => {
    const x = i % 2 === 0 ? 0.85 : 6.85;
    const y = i < 2 ? 1.58 : 4.25;
    card(s, x, y, 5.65, 2.05);
    simpleIcon(s, r[0].slice(0, 1), x + 0.28, y + 0.28, r[2]);
    text(s, r[0], x + 1.02, y + 0.32, 2.0, 0.3, { size: 17, bold: true });
    text(s, r[1], x + 1.02, y + 0.86, 4.15, 0.65, { size: 12, color: C.muted, valign: "top" });
  });

  s = pptx.addSlide();
  addBg(s, "一个完整 AI 工作流长什么样");
  const flow = [
    ["业务问题", "我要解决什么", C.blue],
    ["资料输入", "文档 / 表格 / 网页 / 经验", C.green],
    ["AI 处理", "整理 / 分析 / 生成 / 编码", C.purple],
    ["人工判断", "事实、口径、风险、风格", C.orange],
    ["交付输出", "PPT / 表格 / 页面 / 流程", C.red],
  ];
  flow.forEach((f, i) => {
    const x = 0.7 + i * 2.5;
    card(s, x, 2.2, 2.1, 1.45);
    simpleIcon(s, String(i + 1), x + 0.18, 2.48, f[2]);
    text(s, f[0], x + 0.85, 2.45, 1.0, 0.22, { size: 12.5, bold: true });
    text(s, f[1], x + 0.22, 3.1, 1.65, 0.18, { size: 8.8, color: C.muted, align: "center" });
    if (i < flow.length - 1) s.addShape(pptx.ShapeType.line, { x: x + 2.12, y: 2.94, w: 0.35, h: 0, line: { color: "94A3B8", width: 2, beginArrowType: "none", endArrowType: "triangle" } });
  });
  card(s, 1.05, 5.05, 11.2, 0.8, "ECFDF5", "BBF7D0");
  text(s, "最重要的不是会提问，而是会把工作拆成：输入是什么、规则是什么、输出长什么样、怎么验证。", 1.35, 5.28, 10.55, 0.26, { size: 14.5, bold: true, color: "14532D", align: "center" });

  s = pptx.addSlide();
  addBg(s, "现场案例：AI 生成一个业务分析界面");
  s.addImage({ path: dashboard, x: 0.78, y: 1.48, w: 11.85, h: 5.15 });
  text(s, "这个页面不是设计师手工画图，而是把业务需求描述给 AI 后生成的 HTML / 可视化原型。", 1.12, 6.75, 10.8, 0.26, { size: 11.8, color: C.muted, align: "center" });

  s = pptx.addSlide();
  addBg(s, "投资、人力、财务也可以做自己的“业务小系统”");
  const apps = [
    ["投资项目驾驶舱", "项目来源、阶段、估值、风险点、尽调问题、投后跟踪", C.purple],
    ["人力招聘助手", "岗位需求、简历标签、面试记录、候选人对比、入职清单", C.green],
    ["财务经营看板", "预算、收入、成本、现金流、报销异常、月度解释", C.orange],
  ];
  apps.forEach((a, i) => {
    const x = 0.85 + i * 4.15;
    card(s, x, 1.75, 3.55, 3.8);
    simpleIcon(s, String(i + 1), x + 0.25, 2.05, a[2]);
    text(s, a[0], x + 0.25, 2.78, 2.65, 0.35, { size: 17, bold: true });
    text(s, a[1], x + 0.25, 3.36, 2.9, 0.85, { size: 12, color: C.muted, valign: "top" });
    pill(s, "先做原型", x + 0.25, 4.75, 1.05, a[2]);
    pill(s, "再接数据", x + 1.45, 4.75, 1.05, C.ink);
  });
  text(s, "先用 AI 做“能看见的原型”，再决定是否投入开发、接数据库、固化流程。", 1.65, 6.35, 10.0, 0.28, { size: 15, bold: true, align: "center" });

  s = pptx.addSlide();
  addBg(s, "和扣子等平台相比，Codex 的优势与边界");
  card(s, 0.85, 1.55, 5.75, 4.85);
  text(s, "优势", 1.15, 1.9, 1.4, 0.32, { size: 20, bold: true, color: C.green });
  bulletList(s, ["更适合复杂交付：PPT、网页、脚本、数据处理", "能持续读写文件，反复修改和验证", "适合把“想法”推进到“可运行成果”", "对搭建内部工具、自动化流程更友好"], 1.2, 2.45, 4.9, { size: 12.5, gap: 0.55, dot: C.green });
  card(s, 6.95, 1.55, 5.55, 4.85);
  text(s, "边界", 7.25, 1.9, 1.4, 0.32, { size: 20, bold: true, color: C.orange });
  bulletList(s, ["不是所有信息都天然准确，关键事实必须核验", "涉及隐私、财务、合同数据要有权限和脱敏", "不是替代业务判断，而是提高整理、分析和制作效率", "工具会更新，具体功能和价格不要写死"], 7.3, 2.45, 4.65, { size: 12.5, gap: 0.55, dot: C.orange });

  s = pptx.addSlide();
  addBg(s, "从 0 到 1 上手：普通同事也能开始");
  const levels = [
    ["第 1 层", "让 AI 帮你整理", "会议纪要、制度解释、资料摘要、邮件初稿", C.blue],
    ["第 2 层", "让 AI 帮你制作", "PPT、Excel 模板、海报文案、页面原型", C.green],
    ["第 3 层", "让 AI 帮你分析", "数据清洗、异常解释、项目对比、客户评分", C.orange],
    ["第 4 层", "让 AI 帮你搭流程", "自动生成周报、线索库、看板、内部助手", C.purple],
  ];
  levels.forEach((l, i) => {
    const y = 1.55 + i * 1.22;
    card(s, 1.15, y, 10.95, 0.92);
    pill(s, l[0], 1.38, y + 0.28, 0.82, l[3]);
    text(s, l[1], 2.48, y + 0.27, 2.2, 0.22, { size: 14.5, bold: true });
    text(s, l[2], 4.75, y + 0.27, 6.4, 0.22, { size: 11.5, color: C.muted });
  });
  text(s, "建议从“每天重复 3 次以上、每次超过 20 分钟”的工作开始改造。", 1.85, 6.72, 9.65, 0.24, { size: 13.5, bold: true, align: "center" });

  s = pptx.addSlide();
  addBg(s, "一个好提示词，其实就是一份任务单");
  card(s, 0.85, 1.6, 11.65, 4.78);
  const promptLines = [
    "角色：你是公司内部经营分析助手。",
    "目标：把这份客户/项目/费用资料整理成一页汇报。",
    "输入：我会提供表格、截图、会议纪要或网页链接。",
    "规则：不要编造数据；不确定的地方标注“需核实”。",
    "输出：请给我 PPT 页结构、核心结论、图表建议和下一步行动。",
    "验证：检查数字口径是否一致，并列出你需要我补充的资料。"
  ];
  promptLines.forEach((l, i) => {
    text(s, l, 1.25, 2.02 + i * 0.58, 10.85, 0.25, { size: 13.5, color: i === 0 ? C.green : C.ink, bold: i === 0, margin: 0 });
  });
  text(s, "不要只问“帮我做一个 PPT”，要给 AI 明确的角色、目标、输入、规则、输出和验证方式。", 1.2, 6.65, 10.8, 0.28, { size: 13, color: C.muted, align: "center" });

  s = pptx.addSlide();
  addBg(s, "公司内部落地路线图");
  const roadmap = [
    ["1 周", "选 3 个真实场景", "投资项目摘要、人力招聘 JD、财务费用说明"],
    ["2-3 周", "做可视化原型", "用 HTML / 表格 / PPT 先让大家看见效果"],
    ["1-2 月", "接入稳定数据", "统一字段、权限、模板、人工复核流程"],
    ["长期", "沉淀公司知识库", "把经验、制度、案例变成可查询可复用资产"],
  ];
  roadmap.forEach((r, i) => {
    const x = 0.95 + i * 3.05;
    s.addShape(pptx.ShapeType.line, { x: x + 1.12, y: 2.28, w: 1.65, h: 0, line: { color: i < 3 ? "94A3B8" : C.paper, width: 2, endArrowType: i < 3 ? "triangle" : "none" } });
    s.addShape(pptx.ShapeType.ellipse, { x: x, y: 1.9, w: 0.75, h: 0.75, fill: { color: [C.blue, C.green, C.orange, C.purple][i] }, line: { color: [C.blue, C.green, C.orange, C.purple][i] } });
    text(s, String(i + 1), x, 2.13, 0.75, 0.16, { size: 11, color: C.white, bold: true, align: "center", margin: 0 });
    text(s, r[0], x, 2.95, 2.2, 0.25, { size: 17, bold: true });
    text(s, r[1], x, 3.45, 2.2, 0.25, { size: 13, bold: true, color: C.ink });
    text(s, r[2], x, 3.93, 2.2, 0.55, { size: 10.5, color: C.muted, valign: "top" });
  });
  card(s, 1.1, 5.85, 11.0, 0.62, "EFF6FF", "BFDBFE");
  text(s, "原则：先用小场景证明价值，再谈系统化；先有人复核，再谈自动化。", 1.45, 6.05, 10.2, 0.2, { size: 13.5, bold: true, color: "1E3A8A", align: "center" });

  s = pptx.addSlide();
  addBg(s, "必须讲清楚的风险边界");
  const risks = [
    ["数据安全", "客户、员工、财务、合同资料必须按权限处理，必要时脱敏。", C.red],
    ["事实核验", "AI 可能出错，公开数据、政策口径、价格信息必须二次确认。", C.orange],
    ["合规使用", "不要让 AI 代替最终审批、法律判断、财务签批或人事决定。", C.blue],
    ["成本控制", "先做低成本原型，确认价值后再决定是否采购或开发。", C.green],
  ];
  risks.forEach((r, i) => {
    const x = i % 2 === 0 ? 0.95 : 6.8;
    const y = i < 2 ? 1.72 : 4.15;
    card(s, x, y, 5.55, 1.75);
    simpleIcon(s, "!", x + 0.24, y + 0.35, r[2]);
    text(s, r[0], x + 0.95, y + 0.35, 1.8, 0.28, { size: 16, bold: true });
    text(s, r[1], x + 0.95, y + 0.85, 4.05, 0.42, { size: 11.5, color: C.muted, valign: "top" });
  });

  s = pptx.addSlide();
  addBg(s, "结尾：AI 能力会变成每个岗位的基础能力");
  text(s, "不会 AI 的人不会立刻被淘汰；但会用 AI 把复杂工作做快、做好、做成系统的人，会明显拉开差距。", 1.0, 1.65, 11.3, 0.9, { size: 24, bold: true, color: C.ink, align: "center" });
  card(s, 2.1, 3.25, 9.1, 1.25, "ECFDF5", "BBF7D0");
  text(s, "今天之后，建议每个部门各选 1 个真实问题：我可以帮你们把它变成提示词、表格模板、页面原型或自动化流程。", 2.45, 3.66, 8.4, 0.38, { size: 15.5, bold: true, color: "14532D", align: "center" });
  bulletList(s, ["先做小事", "用真实数据", "保留人工判断", "把可复用流程沉淀下来"], 3.0, 5.25, 7.4, { size: 14, gap: 0.5, dot: C.green });

  await pptx.writeFile({ fileName: path.join(outDir, "AI_Codex内部分享_广州栗子谷孵化器有限公司.pptx") });
}

buildDeck().catch((err) => {
  console.error(err);
  process.exit(1);
});
