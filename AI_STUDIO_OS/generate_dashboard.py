#!/usr/bin/env python3
"""AI Studio OS 驾驶舱生成器 — 读取 AI_WORKSPACE 目录生成自包含 HTML 看板"""
import json, os, re, subprocess
from pathlib import Path
from datetime import datetime

BASE = Path('C:/Users/admin/AI_WORKSPACE')
OUTPUT = BASE / 'AI_STUDIO_OS' / 'src' / 'index.html'

# ── 读取所有项目 ──────────────────────────────
projects_info = {}
for d in sorted(BASE.iterdir()):
    if not d.is_dir() or d.name.startswith('.'):
        continue
    info = {
        'id': d.name, 'name': d.name, 'status': 'pending',
        'icon': '📁', 'tasks_todo': 0, 'tasks_done': 0,
        'goal': '', 'next_step': '', 'git_log': ''
    }
    icons = {
        '01_出租率系统': '📊', '02_合同整理系统': '📝', '03_58运营系统': '🏠',
        '04_商业地产获客平台': '🎯', '05_AI工作流系统': '🤖', '06_REITs研究': '💰',
        'AI_STUDIO_OS': '⚡'
    }
    info['icon'] = icons.get(d.name, '📁')

    # PROJECT_CONTEXT
    ctxf = d / 'PROJECT_CONTEXT.md'
    if ctxf.exists():
        content = ctxf.read_text(encoding='utf-8')
        for line in content.split('\n'):
            if line.startswith('## 项目目标'):
                for l2 in content.split('\n')[content.split('\n').index(line)+1:]:
                    if l2.startswith('## ') or not l2.strip():
                        break
                    info['goal'] += l2.strip() + ' '
        info['goal'] = info['goal'].strip()
        checked = len(re.findall(r'- \[x\]', content))
        unchecked = len(re.findall(r'- \[ \]', content))
        if unchecked == 0 and checked > 0:
            info['status'] = 'completed'
        elif checked > 0 or unchecked > 0:
            info['status'] = 'active'

    # TASKS
    tsf = d / 'TASKS.md'
    if tsf.exists():
        content = tsf.read_text(encoding='utf-8')
        info['tasks_todo'] = len(re.findall(r'- \[ \]', content))
        info['tasks_done'] = len(re.findall(r'- \[x\]', content))

    # HANDOFF - 提取"下一步"
    hf = d / 'HANDOFF.md'
    if hf.exists():
        content = hf.read_text(encoding='utf-8')
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if '下一步' in line:
                for l2 in lines[i+1:]:
                    stripped = l2.strip()
                    if stripped.startswith('- ') or stripped.startswith('-'):
                        info['next_step'] += stripped.lstrip('- ').strip() + '；'
                    elif not stripped or stripped.startswith('#'):
                        break
                break

    # Git log
    try:
        r = subprocess.run(
            ['git', '-C', str(BASE), 'log', '--oneline', '-1', '--', d.name],
            capture_output=True, text=True, timeout=5
        )
        info['git_log'] = r.stdout.strip()[:120]
    except:
        pass

    projects_info[d.name] = info

# ── Git 全局 ──────────────────────────────────
try:
    r = subprocess.run(['git', '-C', str(BASE), 'log', '--oneline', '-8'],
                      capture_output=True, text=True, timeout=5)
    git_log_global = r.stdout.strip()
except:
    git_log_global = ''

try:
    r = subprocess.run(['git', '-C', str(BASE), 'rev-list', '--count', 'HEAD'],
                      capture_output=True, text=True, timeout=5)
    commit_count = r.stdout.strip()
except:
    commit_count = '1'

try:
    r = subprocess.run(['git', '-C', str(BASE), 'remote', '-v'],
                      capture_output=True, text=True, timeout=5)
    git_remote = r.stdout.strip().split('\n')[0] if r.stdout.strip() else '未连接'
except:
    git_remote = '未连接'

INLINE_DATA = json.dumps(projects_info, ensure_ascii=False)

# ── 写入日志，避免 f-string 冲突 ──────────
now_str = datetime.now().strftime('%Y-%m-%d %H:%M')

html = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Studio OS — 驾驶舱</title>
<link rel="icon" href="data:,">
<style>
:root{{--bg:#0d1117;--surface:#161b22;--border:#30363d;--ink:#e6edf3;--muted:#8b949e;--green:#3fb950;--cyan:#58a6ff;--amber:#d29922;--red:#f85149;--purple:#bc8cff}}
*{{box-sizing:border-box;margin:0}}
body{{background:var(--bg);color:var(--ink);font-family:"Microsoft YaHei","PingFang SC","Segoe UI",Arial,sans-serif;font-size:14px;line-height:1.5}}
.wrap{{max-width:1600px;margin:0 auto;padding:24px}}
header{{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid var(--border)}}
h1{{font-size:22px;font-weight:700;display:flex;align-items:center;gap:8px}}
h1 small{{font-size:12px;color:var(--muted);font-weight:400}}
.hr{{text-align:right;font-size:12px;color:var(--muted)}}
.hr .rmt{{color:var(--cyan);font-size:11px}}

.stats{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:24px}}
.stat{{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;text-align:center}}
.stat .num{{font-size:28px;font-weight:700;line-height:1.2;margin:2px 0}}
.stat .lbl{{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}}
.gn{{color:var(--green)}}.cy{{color:var(--cyan)}}.am{{color:var(--amber)}}.rd{{color:var(--red)}}.pl{{color:var(--purple)}}

.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:12px;margin-bottom:24px}}
.card{{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0;overflow:hidden;transition:border-color .2s}}
.card:hover{{border-color:var(--muted)}}
.card.active{{border-left:3px solid var(--green)}}
.card.pending{{border-left:3px solid var(--muted)}}
.card.completed{{border-left:3px solid var(--purple)}}
.c-hd{{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px}}
.c-hd .ti{{font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px;flex:1}}
.c-hd .ic{{font-size:20px;margin-right:4px}}
.c-hd .bdg{{font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600}}
.bdg.act{{background:#0a2e1a;color:var(--green);border:1px solid rgba(63,185,80,.3)}}
.bdg.pen{{background:#1c1c1c;color:var(--muted);border:1px solid var(--border)}}
.bdg.cmp{{background:#1c1124;color:var(--purple);border:1px solid rgba(188,140,255,.3)}}
.c-bd{{padding:8px 16px 14px}}
.goal{{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.nxt{{font-size:11px;color:var(--amber);margin-bottom:4px}}
.nxt b{{color:var(--ink)}}
.bar{{display:flex;align-items:center;gap:8px;margin:6px 0}}
.bt{{flex:1;height:3px;background:var(--border);border-radius:2px;overflow:hidden}}
.bf{{height:100%;border-radius:2px;transition:width .5s}}
.bf.gn{{background:var(--green)}}.bf.am{{background:var(--amber)}}.bf.pl{{background:var(--purple)}}
.btx{{font-size:10px;color:var(--muted);min-width:40px;text-align:right}}
.gitl{{font-size:10px;color:var(--muted);margin-top:4px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}

.tl{{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px}}
.tl h2{{font-size:14px;font-weight:600;color:var(--cyan);margin-bottom:14px}}
.tli{{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);align-items:start}}
.tli:last-child{{border:0}}
.tld{{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0}}
.tld.g{{background:var(--green)}}.tld.c{{background:var(--cyan)}}.tld.a{{background:var(--amber)}}
.tlc{{flex:1}}
.tlc .msg{{font-size:12px;color:var(--ink2)}}

@media(max-width:768px){{.stats{{grid-template-columns:repeat(3,1fr)}}.grid{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <div>
    <h1>⚡ AI Studio OS <small>驾驶舱</small></h1>
    <span style="font-size:11px;color:var(--muted)">你 · Hermes · Codex · Claude · DeepSeek · ChatGPT</span>
  </div>
  <div class="hr">{now_str}<br><span class="rmt">{git_remote}</span></div>
</header>

<div class="stats" id="sRow">
  <div class="stat"><span class="lbl">项目总数</span><div class="num cy" id="sT">--</div></div>
  <div class="stat"><span class="lbl">进行中</span><div class="num gn" id="sA">--</div></div>
  <div class="stat"><span class="lbl">待启动</span><div class="num am" id="sP">--</div></div>
  <div class="stat"><span class="lbl">已完成</span><div class="num pl" id="sC">--</div></div>
  <div class="stat"><span class="lbl">待办任务</span><div class="num rd" id="sTk">--</div></div>
  <div class="stat"><span class="lbl">提交次数</span><div class="num gn">{commit_count}</div></div>
</div>

<div class="grid" id="pGrid"></div>

<div class="tl">
  <h2>📋 Git 最近提交</h2>
  <div id="tlBody"></div>
</div>
</div>

<script>
const D = {INLINE_DATA};
const P = Object.values(D);
document.getElementById('sT').textContent = P.length;
document.getElementById('sA').textContent = P.filter(p=>p.status==='active').length;
document.getElementById('sP').textContent = P.filter(p=>p.status==='pending').length;
document.getElementById('sC').textContent = P.filter(p=>p.status==='completed').length;
document.getElementById('sTk').textContent = P.reduce((s,p)=>s+p.tasks_todo,0);

const g = document.getElementById('pGrid');
P.forEach(p => {{
  const al = p.tasks_done + p.tasks_todo;
  const pc = al > 0 ? Math.round(p.tasks_done/al*100) : 0;
  const bc = pc >= 80 ? 'gn' : pc >= 30 ? 'am' : '';
  const bd = p.status==='active'?'act':p.status==='completed'?'cmp':'pen';
  const bt = p.status==='active'?'● 进行中':p.status==='completed'?'● 已完成':'○ 待启动';
  const nx = p.next_step ? '<div class="nxt">→ <b>下一步:</b> '+p.next_step+'</div>' : '';
  const gl = p.git_log ? '<div class="gitl">'+p.git_log+'</div>' : '';
  const gl2 = p.goal ? '<div class="goal">'+p.goal.slice(0,120)+'</div>' : '';
  g.innerHTML += '<div class="card '+p.status+'"><div class="c-hd"><div class="ti"><span class="ic">'+p.icon+'</span>'+p.name+'</div><span class="bdg '+bd+'">'+bt+'</span></div><div class="c-bd">'+gl2+nx+'<div class="bar"><div class="bt"><div class="bf '+bc+'" style="width:'+pc+'%"></div></div><span class="btx">'+p.tasks_done+'/'+al+' ('+pc+'%)</span></div>'+gl+'</div></div>';
}});

// Timeline
const commits = `{git_log_global}`;
const tlb = document.getElementById('tlBody');
if (commits.trim()) {{
  tlb.innerHTML = commits.split('\\n').filter(Boolean).map(l => {{
    const m = l.match(/^([a-f0-9]+) (.+)$/);
    return m ? '<div class="tli"><div class="tld c"></div><div class="tlc"><div class="msg"><code style="color:var(--amber)">'+m[1]+'</code> '+m[2]+'</div></div></div>' : '';
  }}).join('');
}}
</script>
</body>
</html>'''

OUTPUT.write_text(html, encoding='utf-8')
print(f"驾驶舱已生成: {OUTPUT}")
print(f"大小: {OUTPUT.stat().st_size/1024:.1f} KB")
