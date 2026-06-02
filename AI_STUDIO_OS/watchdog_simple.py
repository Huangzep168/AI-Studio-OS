#!/usr/bin/env python3
"""
AI_WORKSPACE Watchdog - 只检测真正的新项目，跳过缓存目录
"""
import sys, os, json, hashlib, subprocess
from pathlib import Path
from datetime import datetime

os.chdir('C:\\Users\\admin\\AI_WORKSPACE')
AI_WORKSPACE = Path('C:\\Users\\admin\\AI_WORKSPACE')
STATE_FILE = AI_WORKSPACE / '.watchdog_state.json'

LOG = []
def log(msg):
    LOG.append(f'[{datetime.now().strftime("%H:%M:%S")}] {msg}')

# 只监控 Claude 用户工作文件目录（Codex 按日期分目录，不是项目）
# 用户手工在 Codex/Claude 中创建的项目文件，后面会手动同步
# 这个 watchdog 主要确保驾驶舱保持更新
WATCH_DIRS = [
    Path('C:/Users/admin/Claude'),
]

# 跳过这些目录名（不是项目）
SKIP_NAMES = {'__pycache__', 'node_modules', '.git', '.venv', 'venv', 
              '.mypy_cache', '.pytest_cache', '__MACOSX', '.tmp', '.cache'}

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

def detect_changes():
    state = {}
    if STATE_FILE.exists():
        state = json.loads(STATE_FILE.read_text(encoding='utf-8'))
    
    changes = []
    now = datetime.now().isoformat()
    
    for watch_dir in WATCH_DIRS:
        if not watch_dir.exists():
            log(f'目录不存在: {watch_dir}')
            continue
        for child in sorted(watch_dir.iterdir()):
            name = child.name
            if not child.is_dir() or name.startswith('.') or name in SKIP_NAMES:
                continue
            # 跳过典型的非项目目录
            if name.lower() in {'logs', 'temp', 'tmp', 'cache', 'backup', 'archive', 'templates', 'assets', 'images', 'fonts'}:
                continue
            # 跳过纯数字/日期名（Codex 的日期工作目录）
            parts = name.replace('-', '').replace('_', '')
            if parts.isdigit() and len(parts) >= 6:
                continue
                
            key = f'claude:{name}'
            current_hash = hash_dir(child)
            prev_hash = state.get(key, {})
            
            if current_hash and current_hash != prev_hash:
                proj_name = name.replace(' ', '_').replace('-', '_')
                proj_path = AI_WORKSPACE / proj_name
                
                if not proj_path.exists():
                    proj_path.mkdir(parents=True, exist_ok=True)
                    log(f'新增项目: {proj_name}')
                
                (proj_path / 'PROJECT_CONTEXT.md').write_text(
                    f'# {proj_name}\n\n## 项目目标\n来自 Claude 工作目录\n\n## 源路径\n- {child}\n\n## 当前状态\n- [ ] 人工确认项目描述\n\n## 备注\n由 AI_WORKSPACE Watchdog 自动发现\n', encoding='utf-8')
                (proj_path / 'TASKS.md').write_text(
                    '# TASKS.md\n\n## 待办\n- [ ] 了解项目需求 @Hermes\n\n## 进行中\n- (无)\n\n## 已完成\n- (无)\n\n## 暂停\n- (无)\n', encoding='utf-8')
                
                changes.append(f'项目: {proj_name}')
                state[key] = current_hash
    
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False), encoding='utf-8')
    return changes

# 执行检测
changes = detect_changes()
for c in changes:
    print(f'  -> {c}')
if not changes:
    print('  无变化')

# Git commit
if changes:
    try:
        subprocess.run(['git', '-C', str(AI_WORKSPACE), 'add', '-A'], capture_output=True, timeout=10)
        r = subprocess.run(['git', '-C', str(AI_WORKSPACE), 'diff', '--cached', '--quiet'], capture_output=True, timeout=10)
        if r.returncode != 0:
            msg = f'chore: watchdog auto-sync - {"; ".join(changes[:2])}'
            subprocess.run(['git', '-C', str(AI_WORKSPACE), 'commit', '-m', msg], capture_output=True, text=True, timeout=10)
            print('  Git committed')
    except Exception as e:
        print(f'  Git error: {e}')

print('完成')
