# Instalador NO destructivo para las 11 skills upstream.
# Requiere Git y conexión a GitHub. NO ejecuta el código de terceros.
$ErrorActionPreference = 'Stop'
$projectRoot = (Get-Location).Path
$destination = Join-Path $projectRoot '.agents\skills'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ('codex-replica-' + [guid]::NewGuid().ToString('N'))
try {
  git clone --depth 1 https://github.com/Jakeschincariol/replica-skill.git $temp
  if ($LASTEXITCODE -ne 0) { throw 'Git clone falló. No se instaló nada.' }
  $skills = @(Get-ChildItem -Path $temp -Directory -Filter 'replica-*' | Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') })
  if ($skills.Count -ne 11) { throw "Se esperaban 11 skills, se encontraron $($skills.Count). Revisa el repositorio antes de continuar." }
  foreach ($skill in $skills) {
    $target = Join-Path $destination $skill.Name
    if (Test-Path $target) {
      Write-Host "Omitida: $($skill.Name) (ya existe)"
      continue
    }
    Copy-Item -Path $skill.FullName -Destination $target -Recurse
    Write-Host "Instalada: $($skill.Name)"
  }
  Write-Host 'Listo. Revisa el contenido y abre Codex para usar $holo-replica y las skills $replica-*.'
}
finally {
  if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
