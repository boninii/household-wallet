# Amostra CPU% e memoria do processo node que escuta a porta alvo, 1x/segundo.
# Saida: CSV epoch_ms,pid,cpu_pct,ws_mb — usado para correlacionar com os
# niveis de carga do run.mjs (que registra t_start/t_end por nivel).
param(
  [int]$Port = 3000,
  [string]$OutFile = "load-samples.csv",
  [int]$DurationSec = 600
)

$logical = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors

"epoch_ms,pid,cpu_pct,ws_mb" | Out-File -FilePath $OutFile -Encoding utf8

$prev = @{}

$deadline = (Get-Date).AddSeconds($DurationSec)

while ((Get-Date) -lt $deadline) {

  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

  if ($conn) {

    $p = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue

    if ($p) {

      $now = Get-Date

      $cpu_now = $p.TotalProcessorTime.TotalMilliseconds

      $key = $p.Id

      $pct = 0

      if ($prev.ContainsKey($key)) {

        $dt_ms = ($now - $prev[$key].t).TotalMilliseconds

        if ($dt_ms -gt 0) {

          $pct = [math]::Round((($cpu_now - $prev[$key].cpu) / $dt_ms) * 100 / $logical, 1)

        }

      }

      $prev[$key] = @{ t = $now; cpu = $cpu_now }

      $epoch = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

      $ws = [math]::Round($p.WorkingSet64 / 1MB, 1)

      "$epoch,$($p.Id),$pct,$ws" | Out-File -FilePath $OutFile -Encoding utf8 -Append

    }

  }

  Start-Sleep -Milliseconds 1000

}
