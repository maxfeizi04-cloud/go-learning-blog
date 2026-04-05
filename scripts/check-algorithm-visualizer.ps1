param(
  [string]$Destination = '.site-check-visualizer',
  [string]$BootstrapDir = '.codex-run/visualizer-self-test'
)

function Get-HugoExecutable {
  $hugo = Get-Command hugo -ErrorAction SilentlyContinue
  if ($hugo) {
    return $hugo.Source
  }

  $wingetHugo = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter hugo.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

  if ($wingetHugo) {
    return $wingetHugo
  }

  throw 'Hugo is not installed or not available in PATH. Run: winget install --id Hugo.Hugo.Extended -e'
}

function Resolve-SafePath([string]$BaseDir, [string]$RelativePath) {
  $basePath = [System.IO.Path]::GetFullPath($BaseDir)
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $basePath $RelativePath))
  $baseWithSeparator = if ($basePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) { $basePath } else { $basePath + [System.IO.Path]::DirectorySeparatorChar }

  if ($targetPath -ne $basePath -and -not $targetPath.StartsWith($baseWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved path escapes workspace: $targetPath"
  }

  return $targetPath
}

$ErrorActionPreference = 'Stop'
$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$destinationPath = Resolve-SafePath $workspace $Destination
$bootstrapPath = Resolve-SafePath $workspace $BootstrapDir
$bootstrapPackage = Join-Path $bootstrapPath 'package.json'
$bootstrapNodeModules = Join-Path $bootstrapPath 'node_modules\jsdom\package.json'
$nodeScriptPath = Join-Path $bootstrapPath 'run-visualizer-self-test.cjs'
$hugoExe = Get-HugoExecutable

if (-not (Test-Path $bootstrapPath)) {
  New-Item -ItemType Directory -Path $bootstrapPath -Force | Out-Null
}

Push-Location $bootstrapPath
try {
  if (-not (Test-Path $bootstrapPackage)) {
    Write-Host 'Bootstrapping temporary test workspace...' -ForegroundColor Cyan
    npm init -y | Out-Host
  }

  if (-not (Test-Path $bootstrapNodeModules)) {
    Write-Host 'Installing jsdom into the temporary test workspace...' -ForegroundColor Cyan
    npm install jsdom --no-save | Out-Host
  }
}
finally {
  Pop-Location
}

Write-Host 'Running fresh Hugo build for visualizer self-check...' -ForegroundColor Cyan
& $hugoExe '--cleanDestinationDir' '--gc' '--minify' '--destination' $destinationPath | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw 'Hugo build failed during algorithm visualizer self-check.'
}

$nodeScript = @'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const workspace = process.argv[2];
const destination = process.argv[3];
const scriptPath = path.join(workspace, 'assets/js/algorithm-visualizer.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
const cases = [
  { file: 'posts/two-sum-hash-table/index.html', name: 'two-sum' },
  { file: 'posts/binary-search-boundary/index.html', name: 'binary-search' },
  { file: 'posts/sliding-window-longest-substring/index.html', name: 'sliding-window' },
];

function click(window, selector) {
  const element = window.document.querySelector(selector);
  assert.ok(element, `missing element: ${selector}`);
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

function snapshot(window) {
  const active = window.document.querySelector('[data-step-index].is-active');
  const progress = window.document.querySelector('[data-progress]');
  const playButton = window.document.querySelector('[data-action="play"]');
  return {
    stepLabel: window.document.querySelector('[data-step-label]')?.textContent?.trim() || '',
    stepTitle: window.document.querySelector('[data-step-title]')?.textContent?.trim() || '',
    progressValue: progress?.value || '',
    activeIndex: active ? Number(active.getAttribute('data-step-index')) : -1,
    playText: playButton?.textContent?.trim() || '',
    playPressed: playButton?.getAttribute('aria-pressed') || 'false',
    nextDisabled: Boolean(window.document.querySelector('[data-action="next"]')?.disabled),
    prevDisabled: Boolean(window.document.querySelector('[data-action="prev"]')?.disabled),
    resetDisabled: Boolean(window.document.querySelector('[data-action="reset"]')?.disabled),
  };
}

async function runCase(testCase) {
  const htmlPath = path.join(destination, testCase.file);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: `http://example.test/${testCase.file.replace(/\\/g, '/')}`,
  });

  const { window } = dom;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.requestAnimationFrame = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
  window.cancelAnimationFrame = window.cancelAnimationFrame || ((handle) => window.clearTimeout(handle));
  window.eval(scriptContent);

  const totalSteps = window.document.querySelectorAll('[data-step-index]').length;
  assert.ok(totalSteps > 1, `${testCase.name}: expected multiple steps`);

  const initial = snapshot(window);
  assert.equal(initial.activeIndex, 0, `${testCase.name}: initial active step`);
  assert.equal(initial.progressValue, '0', `${testCase.name}: initial progress value`);
  assert.equal(initial.prevDisabled, true, `${testCase.name}: prev should start disabled`);
  assert.equal(initial.resetDisabled, true, `${testCase.name}: reset should start disabled`);

  click(window, '[data-action="next"]');
  const afterNext = snapshot(window);
  assert.equal(afterNext.activeIndex, 1, `${testCase.name}: next should advance one step`);
  assert.equal(afterNext.progressValue, '1', `${testCase.name}: next should sync slider`);
  assert.equal(afterNext.prevDisabled, false, `${testCase.name}: prev should enable after step`);
  assert.notEqual(afterNext.stepTitle, initial.stepTitle, `${testCase.name}: step title should change after next`);

  click(window, '[data-action="prev"]');
  const afterPrev = snapshot(window);
  assert.equal(afterPrev.activeIndex, 0, `${testCase.name}: prev should return to the first step`);
  assert.equal(afterPrev.progressValue, '0', `${testCase.name}: prev should sync slider`);

  const progress = window.document.querySelector('[data-progress]');
  progress.value = progress.max;
  progress.dispatchEvent(new window.Event('input', { bubbles: true }));
  const afterSlider = snapshot(window);
  assert.equal(afterSlider.activeIndex, totalSteps - 1, `${testCase.name}: slider should jump to last step`);
  assert.equal(afterSlider.progressValue, String(totalSteps - 1), `${testCase.name}: slider should reflect last step`);
  assert.equal(afterSlider.nextDisabled, true, `${testCase.name}: next should disable on last step`);

  click(window, '[data-action="reset"]');
  const afterReset = snapshot(window);
  assert.equal(afterReset.activeIndex, 0, `${testCase.name}: reset should return to first step`);
  assert.equal(afterReset.progressValue, '0', `${testCase.name}: reset should sync slider`);

  click(window, '[data-action="play"]');
  await new Promise((resolve) => window.setTimeout(resolve, 1700));
  const duringPlay = snapshot(window);
  assert.ok(Number(duringPlay.progressValue) > 0, `${testCase.name}: autoplay should advance progress`);
  assert.equal(duringPlay.playPressed, 'true', `${testCase.name}: play should set pressed state`);
  assert.notEqual(duringPlay.playText, initial.playText, `${testCase.name}: play label should change while autoplay runs`);

  click(window, '[data-action="play"]');
  const paused = snapshot(window);
  assert.equal(paused.playPressed, 'false', `${testCase.name}: second click should pause autoplay`);
  const pausedValue = paused.progressValue;
  await new Promise((resolve) => window.setTimeout(resolve, 1700));
  const afterPauseWait = snapshot(window);
  assert.equal(afterPauseWait.progressValue, pausedValue, `${testCase.name}: paused autoplay should stop progressing`);

  dom.window.close();
  console.log(`PASS ${testCase.name}: ${totalSteps} steps`);
}

(async () => {
  for (const testCase of cases) {
    await runCase(testCase);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
'@

[System.IO.File]::WriteAllText($nodeScriptPath, $nodeScript, [System.Text.Encoding]::UTF8)

Push-Location $bootstrapPath
try {
  Write-Host 'Running algorithm visualizer page-level self-check...' -ForegroundColor Cyan
  node $nodeScriptPath $workspace $destinationPath | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw 'Algorithm visualizer page-level self-check failed.'
  }
}
finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Algorithm visualizer page-level self-check passed.' -ForegroundColor Green
Write-Host "Checked build output: $destinationPath" -ForegroundColor DarkGray
