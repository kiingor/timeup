<#
  TimeUp — local PostgreSQL (portable binaries) control script.
  Usage:
    pwsh scripts/pg-dev.ps1 init     # initdb a fresh data dir + start + create db "timeup"
    pwsh scripts/pg-dev.ps1 start
    pwsh scripts/pg-dev.ps1 stop
    pwsh scripts/pg-dev.ps1 status
  Dev-only: trust auth on localhost, superuser "postgres", port 5432.
  On the VPS this is replaced by the dockerized postgres (see docker-compose.yml).
#>
param([Parameter(Position = 0)][ValidateSet("init", "start", "stop", "status")] [string]$cmd = "status")

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $root ".postgres\pgsql\bin"
$data = Join-Path $root ".postgres\data"
$logFile = Join-Path $root ".postgres\pg.log"
$port = 5432

function Initdb {
  if (Test-Path (Join-Path $data "PG_VERSION")) {
    Write-Host "Data dir already initialized at $data"
    return
  }
  $pwfile = Join-Path $env:TEMP "pgpw.txt"
  "postgres" | Out-File -FilePath $pwfile -Encoding ascii -NoNewline
  & "$bin\initdb.exe" -D $data -U postgres --pwfile=$pwfile --auth-host=trust --auth-local=trust --encoding=UTF8 --locale=C
  Remove-Item $pwfile -Force
  Write-Host "initdb done."
}

function Start-Pg {
  & "$bin\pg_ctl.exe" -D $data -l $logFile -o "-p $port" -w start
}

function Stop-Pg {
  & "$bin\pg_ctl.exe" -D $data -m fast stop
}

function Status-Pg {
  & "$bin\pg_ctl.exe" -D $data status
}

function Ensure-Db {
  $exists = & "$bin\psql.exe" -U postgres -h 127.0.0.1 -p $port -tAc "SELECT 1 FROM pg_database WHERE datname='timeup'"
  if ($exists -ne "1") {
    & "$bin\createdb.exe" -U postgres -h 127.0.0.1 -p $port timeup
    Write-Host "Database 'timeup' created."
  }
  else {
    Write-Host "Database 'timeup' already exists."
  }
}

switch ($cmd) {
  "init" { Initdb; Start-Pg; Ensure-Db; Status-Pg }
  "start" { Start-Pg; Status-Pg }
  "stop" { Stop-Pg }
  "status" { Status-Pg }
}
