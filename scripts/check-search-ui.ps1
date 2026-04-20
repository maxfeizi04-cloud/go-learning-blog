param(
  [string]$Destination = '.site-check-search',
  [string]$BootstrapDir = '.codex-run/search-self-test'
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
$nodeScriptPath = Join-Path $bootstrapPath 'run-search-self-test.cjs'
$hugoExe = Get-HugoExecutable

if (-not (Test-Path $bootstrapPath)) {
  New-Item -ItemType Directory -Path $bootstrapPath -Force | Out-Null
}

Push-Location $bootstrapPath
try {
  if (-not (Test-Path $bootstrapPackage)) {
    Write-Host 'Bootstrapping temporary search test workspace...' -ForegroundColor Cyan
    npm init -y | Out-Host
  }

  if (-not (Test-Path $bootstrapNodeModules)) {
    Write-Host 'Installing jsdom into the temporary search test workspace...' -ForegroundColor Cyan
    npm install jsdom --no-save | Out-Host
  }
}
finally {
  Pop-Location
}

Write-Host 'Running fresh Hugo build for search UI self-check...' -ForegroundColor Cyan
& $hugoExe '--cleanDestinationDir' '--gc' '--minify' '--destination' $destinationPath | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw 'Hugo build failed during search UI self-check.'
}

$nodeScript = @"
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const workspace = process.argv[2];
const destination = process.argv[3];
const scriptPath = path.join(workspace, 'assets/js/search.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
const indexData = JSON.parse(fs.readFileSync(path.join(destination, 'index.json'), 'utf8'));

function createFetch(baseUrl) {
  return async (input) => {
    const href = typeof input === 'string' ? input : input.url;
    const url = new URL(href, baseUrl);
    if (url.pathname.endsWith('/index.json') || url.pathname === '/index.json') {
      return {
        ok: true,
        status: 200,
        json: async () => indexData,
      };
    }

    throw new Error('Unexpected fetch URL: ' + url.href);
  };
}

function setViewport(window, width) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
}

function pressKey(window, target, key) {
  const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
}

function click(window, selector) {
  const element = window.document.querySelector(selector);
  assert.ok(element, 'missing element: ' + selector);
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

async function waitFor(window, predicate, message) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 4000) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error(message);
}

function getResults(container) {
  return Array.from(container.querySelectorAll('.search-result'));
}

function assertResultCards(results, label) {
  assert.ok(results.length > 0, label + ': expected at least one search result');
  for (const result of results) {
    assert.ok(result.querySelector('.search-result__title'), label + ': result missing title');
    assert.equal(result.querySelector('.search-result__meta'), null, label + ': result should not render meta');
    assert.equal(result.querySelector('.search-result__summary'), null, label + ': result should not render summary');
  }
}

function assertHighlights(results, label) {
  const hasHighlight = results.some((result) => result.querySelector('.search-result__highlight'));
  assert.ok(hasHighlight, label + ': expected highlighted query fragments');
}

async function loadPage(relativePath, url, width) {
  const html = fs.readFileSync(path.join(destination, relativePath), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url,
  });

  const { window } = dom;
  setViewport(window, width);
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.requestAnimationFrame = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
  window.cancelAnimationFrame = window.cancelAnimationFrame || ((handle) => window.clearTimeout(handle));
  window.fetch = createFetch(window.location.href);
  window.eval(scriptContent);
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  return dom;
}

async function runIconSearchSmoke() {
  const dom = await loadPage('posts/two-sum-hash-table/index.html', 'http://example.test/posts/two-sum-hash-table/', 1280);
  const { window } = dom;
  const root = window.document.querySelector('[data-search-root].site-search--icon');
  const toggle = root?.querySelector('[data-search-toggle]');
  const input = root?.querySelector('[data-search-input]');
  const dropdown = root?.querySelector('[data-search-dropdown]');
  const resultsContainer = root?.querySelector('[data-search-results]');

  assert.ok(root && toggle && input && dropdown && resultsContainer, 'icon search: missing DOM nodes');

  click(window, '[data-search-toggle]');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true', 'icon search: toggle should open panel');

  input.value = 'writer';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await waitFor(window, () => getResults(resultsContainer).length > 0, 'icon search: results did not render');

  const results = getResults(resultsContainer);
  assertResultCards(results, 'icon search');
  assertHighlights(results, 'icon search');

  pressKey(window, input, 'ArrowDown');
  await waitFor(window, () => Boolean(window.document.querySelector('.search-result.search-selectable--active')), 'icon search: ArrowDown did not activate a result');
  const active = window.document.querySelector('.search-result.search-selectable--active');
  assert.equal(active?.getAttribute('aria-selected'), 'true', 'icon search: active result should expose aria-selected=true');

  let activatedHref = '';
  resultsContainer.addEventListener('click', (event) => {
    const result = event.target.closest('.search-result');
    if (result) {
      activatedHref = result.getAttribute('href') || '';
      event.preventDefault();
    }
  });
  pressKey(window, input, 'Enter');
  assert.ok(activatedHref.length > 0, 'icon search: Enter should activate the selected result');

  pressKey(window, input, 'Escape');
  await waitFor(window, () => toggle.getAttribute('aria-expanded') === 'false', 'icon search: Escape did not close the panel');
  assert.equal(root.classList.contains('site-search--open'), false, 'icon search: root should leave open state after Escape');

  dom.window.close();
  console.log('PASS icon search smoke');
}

async function runFullSearchSmoke() {
  const dom = await loadPage('search/index.html', 'http://example.test/search/?q=writer', 390);
  const { window } = dom;
  const input = window.document.querySelector('#search-page-input');
  const resultsContainer = window.document.querySelector('[data-search-page-results]');
  const status = window.document.querySelector('[data-search-page-status]');

  assert.ok(input && resultsContainer && status, 'search page: missing DOM nodes');

  await waitFor(window, () => getResults(resultsContainer).length > 0, 'search page: results did not render');
  const results = getResults(resultsContainer);
  assertResultCards(results, 'search page');
  assertHighlights(results, 'search page');
  assert.ok((status.textContent || '').trim() !== '', 'search page: status should not be empty');
  assert.notEqual(status.textContent?.trim(), '输入关键词开始搜索，支持单字。', 'search page: status should move past the default prompt');

  pressKey(window, input, 'ArrowDown');
  await waitFor(window, () => Boolean(window.document.querySelector('.search-result.search-selectable--active')), 'search page: ArrowDown did not activate a result');
  const active = window.document.querySelector('.search-result.search-selectable--active');
  assert.equal(active?.getAttribute('aria-selected'), 'true', 'search page: active result should expose aria-selected=true');

  dom.window.close();
  console.log('PASS full search smoke');
}

(async () => {
  await runIconSearchSmoke();
  await runFullSearchSmoke();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
"@

[System.IO.File]::WriteAllText($nodeScriptPath, $nodeScript, [System.Text.Encoding]::UTF8)

Push-Location $bootstrapPath
try {
  Write-Host 'Running search UI page-level self-check...' -ForegroundColor Cyan
  node $nodeScriptPath $workspace $destinationPath | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw 'Search UI page-level self-check failed.'
  }
}
finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Search UI page-level self-check passed.' -ForegroundColor Green
Write-Host "Checked build output: $destinationPath" -ForegroundColor DarkGray
