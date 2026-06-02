#!/usr/bin/env python3
"""极简版 watchdog — 只写一个测试文件看是否能运行"""
import os
from pathlib import Path

# 写日志到固定路径
try:
    with open('C:\\Users\\admin\\AI_WORKSPACE\\.watchdog_debug.log', 'w') as f:
        f.write(f'PID: {os.getpid()}\n')
        f.write(f'CWD: {os.getcwd()}\n')
        f.write(f'USER: {os.environ.get("USERNAME", "?")}\n')
        f.write('OK\n')
except Exception as e:
    with open('C:\\Users\\admin\\AI_WORKSPACE\\.watchdog_debug.log', 'w') as f:
        f.write(f'ERROR: {e}\n')
