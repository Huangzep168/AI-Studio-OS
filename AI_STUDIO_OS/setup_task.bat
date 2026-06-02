@echo off
schtasks /Delete /TN "AI-WORKSPACE-Watchdog" /F 2>nul
schtasks /Create /SC MINUTE /MO 30 /TN "AI-WORKSPACE-Watchdog" /TR "C:\Users\admin\AppData\Local\Microsoft\WindowsApps\python.exe C:\Users\admin\AI_WORKSPACE\AI_STUDIO_OS\watchdog_simple.py" /F /IT /RL LIMITED
echo OK
