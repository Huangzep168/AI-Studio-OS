$task = Get-ScheduledTask -TaskName "AI-Watchdog-Test"
Write-Output "Triggers: $($task.Triggers)"
Start-ScheduledTask -TaskName "AI-Watchdog-Test"
Write-Output "started"
