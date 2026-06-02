$action = New-ScheduledTaskAction -Execute "C:\Users\admin\AppData\Local\Microsoft\WindowsApps\python.exe" -Argument "C:\Users\admin\AI_WORKSPACE\AI_STUDIO_OS\watchdog_test.py"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
Register-ScheduledTask -TaskName "AI-Watchdog-Test" -Action $action -Trigger $trigger -Force
Write-Output "created"
