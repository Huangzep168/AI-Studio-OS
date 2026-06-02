#!/usr/bin/env python3
"""
AI_WORKSPACE Watchdog - Auto-detect Codex/Claude project changes
"""
import json, os, re, subprocess, hashlib
from pathlib import Path
from datetime import datetime

AI_WORKSPACE = Path('C:/Users/admin/AI_WORKSPACE')
WATCHLIST = {
    'codex': Path('C:/Users/admin/Documents/Codex'),
    'claude': Path('C:/Users/admin/Claude'),
}
STATE_FILE = AI_WORKSPACE / '.watchdog_state.json'


def hash_dir(path):
    if not path.exists():
        return {}
    h = {}
    for f in sorted(path.rglob('*')):
        if f.is_file() and not f.name.startswith('.'):
            try:
                if f.stat().st_size < 500 * 1024:
                    h[str(f.relative_to(path))] = hashlib.md5(f.read_bytes()[:4096]).hexdigest()
            except:
                pass
    return h


def detect_new_projects():
    state = {}
    if STATE_FILE.exists():
        state = json.loads(STATE_FILE.read_text(encoding='utf-8'))

    changes = []
    now = datetime.now().isoformat()

    for source, watch_dir in WATCHLIST.items():
        if not watch_dir.exists():
            continue
        for child in sorted(watch_dir.iterdir()):
            if not child.is_dir() or child.name.startswith('.'):
                continue
            key = f'{source}:{child.name}'
            current_hash = hash_dir(child)
            prev_hash = state.get(key, {})

            if current_hash != prev_hash:
                proj_name = f'{source}_{child.name}' if source == 'codex' else child.name.replace(' ', '_')
                proj_path = AI_WORKSPACE / proj_name

                if not proj_path.exists():
                    proj_path.mkdir(parents=True, exist_ok=True)

                ctx = f'''# {proj_name}

## 项目目标
来自 {source} 工作目录 {child.name}

## 源路径
- 原始目录: {child}
- 同步到: {proj_path}

## 当前状态
- [ ] 人工确认项目描述

## 备注
由 AI_WORKSPACE Watchdog 自动发现于 {now}
'''
                (proj_path / 'PROJECT_CONTEXT.md').write_text(ctx, encoding='utf-8')

                tasks = '''# TASKS.md

## 待办
- [ ] 了解项目需求 @Hermes

## 进行中
- (无)

## 已完成
- (无)

## 暂停
- (无)
'''
                (proj_path / 'TASKS.md').write_text(tasks, encoding='utf-8')

                ho = f'''# HANDOFF.md

## 日期: {datetime.now().strftime('%Y-%m-%d %H:%M')}

### 本次完成
- 自动发现项目 ({source}: {child.name})

### 下一步
- 人工确认项目范围和目标
'''
                (proj_path / 'HANDOFF.md').write_text(ho, encoding='utf-8')

                cl = f'''# CHANGELOG.md

## [0.0.1] - {datetime.now().strftime('%Y-%m-%d')}

### Added
- 自动发现于 {source}: {child.name}
'''
                (proj_path / 'CHANGELOG.md').write_text(cl, encoding='utf-8')

                # Copy source files
                src_dir = proj_path / 'src'
                for src_file in child.rglob('*'):
                    if src_file.is_file():
                        rel = src_file.relative_to(child)
                        parts = rel.parts
                        if any(p.startswith('.') for p in parts):
                            continue
                        if any(x in parts for x in ['node_modules', '__pycache__', '.git']):
                            continue
                        if src_file.stat().st_size > 1024 * 1024:
                            continue
                        try:
                            dst = src_dir / rel
                            dst.parent.mkdir(parents=True, exist_ok=True)
                            dst.write_bytes(src_file.read_bytes())
                        except:
                            pass

                changes.append(f'新项目: {proj_name} ({source})')
                state[key] = current_hash

    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
    return changes


def generate_dashboard():
    projs = {}
    for d in sorted(AI_WORKSPACE.iterdir()):
        if not d.is_dir() or d.name.startswith('.'):
            continue
        info = {'id': d.name, 'name': d.name, 'status': 'pending',
                'icon': '📁', 'tasks_todo': 0, 'tasks_done': 0,
                'goal': '', 'next_step': '', 'git_log': ''}
        icons = {'01_出租率系统': '📊', '02_合同整理系统': '📝', '03_58运营系统': '🏠',
                 '04_商业地产获客平台': '🎯', '05_AI工作流系统': '🤖', '06_REITs研究': '💰', 'AI_STUDIO_OS': '⚡'}
        for k, v in icons.items():
            if d.name.lower() == k.lower():
                info['icon'] = v
                break

        ctxf = d / 'PROJECT_CONTEXT.md'
        if ctxf.exists():
            c = ctxf.read_text(encoding='utf-8')
            lines = c.split('\n')
            ing = False
            for line in lines:
                if line.startswith('## 项目目标'):
                    ing = True
                elif ing:
                    if line.startswith('## ') or not line.strip():
                        break
                    info['goal'] += line.strip() + ' '
            info['goal'] = info['goal'].strip()
            ck = len(re.findall(r'- \[x\]', c))
            un = len(re.findall(r'- \[ \]', c))
            if un == 0 and ck > 0:
                info['status'] = 'completed'
            elif ck > 0 or un > 0:
                info['status'] = 'active'

        tsf = d / 'TASKS.md'
        if tsf.exists():
            c = tsf.read_text(encoding='utf-8')
            info['tasks_todo'] = len(re.findall(r'- \[ \]', c))
            info['tasks_done'] = len(re.findall(r'- \[x\]', c))

        hf = d / 'HANDOFF.md'
        if hf.exists():
            c = hf.read_text(encoding='utf-8')
            lines = c.split('\n')
            for i, line in enumerate(lines):
                if '下一步' in line:
                    for l2 in lines[i+1:]:
                        s = l2.strip()
                        if s.startswith('- ') or s.startswith('-'):
                            info['next_step'] += s.lstrip('- ').strip() + '; '
                        elif not s or s.startswith('#'):
                            break
                    break

        try:
            r = subprocess.run(['git', '-C', str(AI_WORKSPACE), 'log', '--oneline', '-1', '--', d.name],
                              capture_output=True, text=True, timeout=5)
            info['git_log'] = r.stdout.strip()[:120]
        except:
            pass

        projs[d.name] = info

    try:
        r = subprocess.run(['git', '-C', str(AI_WORKSPACE), 'log', '--oneline', '-8'],
                          capture_output=True, text=True, timeout=5)
        git_log = r.stdout.strip()
    except:
        git_log = ''

    try:
        r = subprocess.run(['git', '-C', str(AI_WORKSPACE), 'rev-list', '--count', 'HEAD'],
                          capture_output=True, text=True, timeout=5)
        cc = r.stdout.strip()
    except:
        cc = '1'

    try:
        r = subprocess.run(['git', '-C', str(AI_WORKSPACE), 'remote', '-v'],
                          capture_output=True, text=True, timeout=5)
        gr = r.stdout.strip().split('\n')[0] if r.stdout.strip() else '未连接'
    except:
        gr = '未连接'

    now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
    DATA_JSON = json.dumps(projs, ensure_ascii=False)

    html = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Studio OS - 驾驶舱</title>
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
.tld.c{{background:var(--cyan)}}
.tlc{{flex:1}}
.tlc .msg{{font-size:12px;color:var(--ink2)}}
@media(max-width:768px){{.stats{{grid-template-columns:repeat(3,1fr)}}.grid{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <div><h1>&#x26A1; AI Studio OS <small>驾驶舱</small></h1><span style="font-size:11px;color:var(--muted)">你 - Hermes - Codex - Claude - DeepSeek - ChatGPT</span></div>
  <div class="hr">{now_str}<br><span class="rmt">{gr}</span></div>
</header>
<div class="stats" id="sRow">
  <div class="stat"><span class="lbl">项目总数</span><div class="num cy" id="sT">--</div></div>
  <div class="stat"><span class="lbl">进行中</span><div class="num gn" id="sA">--</div></div>
  <div class="stat"><span class="lbl">待启动</span><div class="num am" id="sP">--</div></div>
  <div class="stat"><span class="lbl">已完成</span><div class="num pl" id="sC">--</div></div>
  <div class="stat"><span class="lbl">待办任务</span><div class="num rd" id="sTk">--</div></div>
  <div class="stat"><span class="lbl">提交次数</span><div class="num gn">{cc}</div></div>
</div>
<div class="grid" id="pGrid"></div>
<div class="tl"><h2>&#x1F4CB; Git 最近提交</h2><div id="tlBody"></div></div>
</div>
<script>
const D = {DATA_JSON};
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
  const nx = p.next_step ? '<div class="nxt">&#x2192; <b>下一步:</b> '+p.next_step+'</div>' : '';
  const gl = p.git_log ? '<div class="gitl">'+p.git_log+'</div>' : '';
  const gl2 = p.goal ? '<div class="goal">'+p.goal.slice(0,120)+'</div>' : '';
  g.innerHTML += '<div class="card '+p.status+'"><div class="c-hd"><div class="ti"><span class="ic">'+p.icon+'</span>'+p.name+'</div><span class="bdg '+bd+'">'+bt+'</span></div><div class="c-bd">'+gl2+nx+'<div class="bar"><div class="bt"><div class="bf '+bc+'" style="width:'+pc+'%"></div></div><span class="btx">'+p.tasks_done+'/'+al+' ('+pc+'%)</span></div>'+gl+'</div></div>';
}});
const commits = `{git_log}`;
const tlb = document.getElementById('tlBody');
if (commits.trim()) {{
  tlb.innerHTML = commits.split('\n').filter(Boolean).map(l => {{
    const m = l.match(/^([a-f0-9]+) (.+)$/);
    return m ? '<div class="tli"><div class="tld c"></div><div class="tlc"><div class="msg"><code style="color:var(--amber)">'+m[1]+'</code> '+m[2]+'</div></div></div>' : '';
  }}).join('');
}}
</script>
</body>
</html>'''

    output = AI_WORKSPACE / 'AI_STUDIO_OS' / 'src' / 'index.html'
    output.write_text(html, encoding='utf-8')
    return output


def git_commit_push(changes):
    if not changes:
        changes = ['自动同步更新']
    msg = 'chore: AI_WORKSPACE 自动同步 - ' + '; '.join(changes[:3])
    subprocess.run(['git', '-C', str(AI_WORKSPACE), 'add', '-A'], capture_output=True, timeout=10)
    r = subprocess.run(['git', '-C', str(AI_WORKSPACE), 'diff', '--cached', '--quiet'], capture_output=True, timeout=10)
    if r.returncode == 0:
        return '无变更'
    subprocess.run(['git', '-C', str(AI_WORKSPACE), 'commit', '-m', msg], capture_output=True, text=True, timeout=10)
    subprocess.run(['git', '-C', str(AI_WORKSPACE), 'push'], capture_output=True, timeout=60)
    return f'已提交: {msg}'


if __name__ == '__main__':
    now = datetime.now().strftime('%H:%M:%S')
    print(f'[{now}] AI_WORKSPACE Watchdog 启动')

    changes = detect_new_projects()
    for c in changes:
        print(f'  -> {c}')
    if not changes:
        print('  无新项目')

    out = generate_dashboard()
    print(f'  驾驶舱: {out}')

    result = git_commit_push(changes)
    print(f'  Git: {result}')
    print('完成')
