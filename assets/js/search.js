(() => {
  const body = document.body;
  const indexUrl = body?.dataset.searchIndexUrl;
  const searchPageUrl = body?.dataset.searchPageUrl || '/search/';
  const searchRoots = Array.from(document.querySelectorAll('[data-search-root]'));
  const searchPage = document.querySelector('[data-search-page]');
  const searchPageResults = searchPage?.querySelector('[data-search-page-results]');
  const searchPageStatus = searchPage?.querySelector('[data-search-page-status]');
  const searchPageHistory = searchPage?.querySelector('[data-search-page-history]');
  const url = new URL(window.location.href);
  const initialQuery = url.searchParams.get('q')?.trim() || '';
  const HISTORY_KEY = 'go-learning-blog.search.history';
  const HISTORY_LIMIT = 6;
  const MIN_QUERY_LENGTH = 1;
  const DEFAULT_PROMPT = '输入关键词开始搜索，支持单字。';
  const PANEL_TRANSITION_MS = 220;

  let loadIndexPromise;

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[`~!@#$%^&*()_=+\[\]{}\\|;:'",.<>/?。，、；：！？“”‘’（）《》【】—-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactText(value) {
    return normalizeText(value).replace(/\s+/g, '');
  }

  function tokenize(value) {
    return normalizeText(value).split(' ').filter(Boolean);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function buildHighlightTerms(query) {
    const rawQuery = String(query || '').trim();
    if (rawQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const terms = tokenize(rawQuery).filter((term) => term.length >= MIN_QUERY_LENGTH);
    if (!terms.length) {
      terms.push(rawQuery);
    }

    if (!terms.some((term) => compactText(term) === compactText(rawQuery)) && compactText(rawQuery).length >= MIN_QUERY_LENGTH) {
      terms.push(rawQuery);
    }

    return [...new Set(terms.map((term) => term.trim()).filter(Boolean))].sort((left, right) => right.length - left.length);
  }

  function createBigrams(value) {
    const compact = compactText(value);
    if (!compact) {
      return [];
    }

    if (compact.length === 1) {
      return [compact];
    }

    const grams = [];
    for (let index = 0; index < compact.length - 1; index += 1) {
      grams.push(compact.slice(index, index + 2));
    }
    return grams;
  }

  function diceCoefficient(left, right) {
    const leftBigrams = createBigrams(left);
    const rightBigrams = createBigrams(right);
    if (!leftBigrams.length || !rightBigrams.length) {
      return 0;
    }

    const rightMap = new Map();
    for (const gram of rightBigrams) {
      rightMap.set(gram, (rightMap.get(gram) || 0) + 1);
    }

    let matches = 0;
    for (const gram of leftBigrams) {
      const remaining = rightMap.get(gram) || 0;
      if (remaining > 0) {
        matches += 1;
        rightMap.set(gram, remaining - 1);
      }
    }

    return (2 * matches) / (leftBigrams.length + rightBigrams.length);
  }

  function levenshteinDistance(left, right) {
    if (!left) {
      return right.length;
    }
    if (!right) {
      return left.length;
    }

    const rows = left.length + 1;
    const columns = right.length + 1;
    const matrix = Array.from({ length: rows }, () => new Array(columns).fill(0));

    for (let row = 0; row < rows; row += 1) {
      matrix[row][0] = row;
    }

    for (let column = 0; column < columns; column += 1) {
      matrix[0][column] = column;
    }

    for (let row = 1; row < rows; row += 1) {
      for (let column = 1; column < columns; column += 1) {
        const cost = left[row - 1] === right[column - 1] ? 0 : 1;
        matrix[row][column] = Math.min(
          matrix[row - 1][column] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column - 1] + cost
        );
      }
    }

    return matrix[left.length][right.length];
  }

  function similarityRatio(left, right) {
    const maxLength = Math.max(left.length, right.length);
    if (!maxLength) {
      return 0;
    }
    return 1 - levenshteinDistance(left, right) / maxLength;
  }

  function preprocessDocument(documentItem) {
    const tags = Array.isArray(documentItem.tags) ? documentItem.tags : [];
    const series = Array.isArray(documentItem.series) ? documentItem.series : [];
    const keywords = [...tags, ...series].join(' ');
    const summary = documentItem.summary || '';
    const content = documentItem.content || '';
    const title = documentItem.title || '';

    return {
      ...documentItem,
      tags,
      series,
      _titleNormalized: normalizeText(title),
      _titleCompact: compactText(title),
      _summaryNormalized: normalizeText(summary),
      _summaryCompact: compactText(summary),
      _contentNormalized: normalizeText(content),
      _contentCompact: compactText(content),
      _keywordsNormalized: normalizeText(keywords),
      _keywordsCompact: compactText(keywords),
      _keywordTokens: tokenize(keywords),
      _titleTokens: tokenize(title),
      _summaryTokens: tokenize(summary),
      _contentTokens: tokenize(content).slice(0, 160)
    };
  }

  async function loadIndex() {
    if (!indexUrl) {
      return [];
    }

    if (!loadIndexPromise) {
      loadIndexPromise = fetch(indexUrl, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Search index request failed: ${response.status}`);
          }
          return response.json();
        })
        .then((items) => items.map(preprocessDocument));
    }

    return loadIndexPromise;
  }

  function scoreDocument(documentItem, query) {
    const queryNormalized = normalizeText(query);
    const queryCompact = compactText(query);
    const queryTokens = tokenize(query).filter((token) => token.length >= MIN_QUERY_LENGTH);
    if (!queryCompact) {
      return 0;
    }

    const isSingleCharacterQuery = queryCompact.length === 1;
    let score = 0;
    const titleIndex = documentItem._titleCompact.indexOf(queryCompact);
    const keywordIndex = documentItem._keywordsCompact.indexOf(queryCompact);
    const summaryIndex = documentItem._summaryCompact.indexOf(queryCompact);
    const contentIndex = documentItem._contentCompact.indexOf(queryCompact);

    if (titleIndex >= 0) {
      score += isSingleCharacterQuery ? 360 : 220;
      if (isSingleCharacterQuery) {
        score += Math.max(0, 60 - titleIndex * 10);
      }
    }
    if (keywordIndex >= 0) {
      score += isSingleCharacterQuery ? 160 : 150;
      if (isSingleCharacterQuery) {
        score += Math.max(0, 24 - keywordIndex * 4);
      }
    }
    if (summaryIndex >= 0) {
      score += isSingleCharacterQuery ? 52 : 110;
    }
    if (contentIndex >= 0) {
      score += isSingleCharacterQuery ? 14 : 55;
    }

    for (const token of queryTokens) {
      if (documentItem._titleTokens.some((candidate) => candidate.includes(token))) {
        score += isSingleCharacterQuery ? 72 : 34;
      }
      if (documentItem._keywordTokens.some((candidate) => candidate.includes(token))) {
        score += isSingleCharacterQuery ? 36 : 26;
      }
      if (documentItem._summaryTokens.some((candidate) => candidate.includes(token))) {
        score += isSingleCharacterQuery ? 6 : 14;
      }
      if (documentItem._contentTokens.some((candidate) => candidate.includes(token))) {
        score += isSingleCharacterQuery ? 2 : 6;
      }
    }

    if (!isSingleCharacterQuery) {
      const titleDice = diceCoefficient(queryCompact, documentItem._titleCompact);
      if (titleDice > 0.24) {
        score += Math.round(titleDice * 70);
      }

      const keywordDice = diceCoefficient(queryCompact, documentItem._keywordsCompact);
      if (keywordDice > 0.24) {
        score += Math.round(keywordDice * 48);
      }
    }

    if (!isSingleCharacterQuery && /^[a-z0-9-\s]+$/.test(queryNormalized) && queryNormalized.length <= 24) {
      const candidates = [...documentItem._titleTokens, ...documentItem._keywordTokens];
      let bestRatio = 0;
      for (const candidate of candidates) {
        if (!candidate) {
          continue;
        }
        bestRatio = Math.max(bestRatio, similarityRatio(queryNormalized, candidate));
      }
      if (bestRatio > 0.68) {
        score += Math.round(bestRatio * 42);
      }
    }

    return score;
  }

  async function searchDocuments(query, limit) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const isSingleCharacterQuery = compactText(trimmedQuery).length === 1;
    const minimumScore = isSingleCharacterQuery ? 48 : 22;
    const documents = await loadIndex();
    return documents
      .map((documentItem) => ({ documentItem, score: scoreDocument(documentItem, trimmedQuery) }))
      .filter((entry) => entry.score > minimumScore)
      .sort((left, right) => right.score - left.score || right.documentItem.date.localeCompare(left.documentItem.date))
      .slice(0, limit)
      .map((entry) => entry.documentItem);
  }

  function sectionLabel(section) {
    if (section === 'posts') {
      return '学习记录';
    }
    if (section === 'snippets') {
      return '代码片段';
    }
    return section;
  }

  function appendHighlightedText(target, text, query) {
    const source = String(text || '');
    const terms = buildHighlightTerms(query);
    if (!source || !terms.length) {
      target.textContent = source;
      return;
    }

    const matcher = new RegExp(terms.map((term) => escapeRegExp(term)).join('|'), 'gi');
    let cursor = 0;
    let match = matcher.exec(source);

    while (match) {
      const matchedText = match[0];
      const start = match.index;
      if (start > cursor) {
        target.appendChild(document.createTextNode(source.slice(cursor, start)));
      }

      const mark = document.createElement('mark');
      mark.className = 'search-result__highlight';
      mark.textContent = matchedText;
      target.appendChild(mark);
      cursor = start + matchedText.length;
      match = matcher.exec(source);
    }

    if (cursor < source.length) {
      target.appendChild(document.createTextNode(source.slice(cursor)));
    }
  }

  function createResultCard(documentItem, query) {
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = documentItem.permalink;
    link.setAttribute('data-search-selectable', 'true');
    link.setAttribute('role', 'option');
    link.setAttribute('aria-selected', 'false');

    const title = document.createElement('strong');
    title.className = 'search-result__title';
    appendHighlightedText(title, documentItem.title, query);

    link.append(title);
    return link;
  }

  function clearChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function groupResultsBySection(results) {
    return results.reduce((groups, documentItem) => {
      const key = documentItem.section || 'other';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(documentItem);
      return groups;
    }, new Map());
  }

  function renderGroupedResults(container, results, query, options = {}) {
    clearChildren(container);
    if (!results.length) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = options.emptyText || '没有匹配结果。';
      container.appendChild(empty);
      return;
    }

    const groups = groupResultsBySection(results);
    const preferredOrder = ['posts', 'snippets'];
    const sectionKeys = [...groups.keys()].sort((left, right) => preferredOrder.indexOf(left) - preferredOrder.indexOf(right));

    for (const section of sectionKeys) {
      const items = groups.get(section) || [];
      const wrapper = document.createElement('section');
      wrapper.className = options.compact ? 'search-group search-group--compact' : 'search-group';

      const heading = document.createElement(options.compact ? 'p' : 'div');
      heading.className = 'search-group__head';

      const title = document.createElement(options.compact ? 'strong' : 'h2');
      title.className = 'search-group__title';
      title.textContent = sectionLabel(section);

      const count = document.createElement('span');
      count.className = 'search-group__count';
      count.textContent = `${items.length} 条`;

      heading.append(title, count);

      const list = document.createElement('div');
      list.className = 'search-group__list';
      for (const documentItem of items) {
        list.appendChild(createResultCard(documentItem, query));
      }

      wrapper.append(heading, list);
      container.appendChild(wrapper);
    }
  }

  function readHistory() {
    try {
      const rawValue = window.localStorage.getItem(HISTORY_KEY);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      return Array.isArray(parsedValue) ? parsedValue.filter((item) => typeof item === 'string' && item.trim()) : [];
    } catch (error) {
      return [];
    }
  }

  function writeHistory(items) {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
    } catch (error) {
      // Ignore localStorage errors so search keeps working in strict environments.
    }
  }

  function addHistory(query) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return;
    }

    const normalizedQuery = normalizeText(trimmedQuery);
    const nextHistory = [trimmedQuery, ...readHistory().filter((item) => normalizeText(item) !== normalizedQuery)];
    writeHistory(nextHistory);
  }

  function clearHistory() {
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      // Ignore localStorage errors.
    }
  }

  function renderHistory(container, onSelect, onClear) {
    if (!container) {
      return;
    }

    const historyItems = readHistory();
    clearChildren(container);

    if (!historyItems.length) {
      container.hidden = true;
      return;
    }

    const title = document.createElement('p');
    title.className = 'search-history__title';
    title.textContent = '最近搜索';

    const chips = document.createElement('div');
    chips.className = 'search-history__chips';

    for (const item of historyItems) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-chip';
      button.setAttribute('data-search-selectable', 'true');
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.textContent = item;
      button.addEventListener('click', () => onSelect(item));
      chips.appendChild(button);
    }

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'search-history__clear';
    clearButton.textContent = '清空记录';
    clearButton.addEventListener('click', () => {
      clearHistory();
      renderHistory(container, onSelect, onClear);
      onClear?.();
    });

    container.append(title, chips, clearButton);
    container.hidden = false;
  }

  function debounce(callback, delay = 120) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  }

  function syncQueryAcrossInputs(query, exceptInput) {
    for (const root of searchRoots) {
      const input = root.querySelector('[data-search-input]');
      if (input && input !== exceptInput) {
        input.value = query;
      }
    }
  }

  async function updateSearchPage(query) {
    if (!searchPage || !searchPageResults || !searchPageStatus) {
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      searchPageStatus.textContent = DEFAULT_PROMPT;
      clearChildren(searchPageResults);
      renderHistory(searchPageHistory, (historyQuery) => {
        syncQueryAcrossInputs(historyQuery);
        void updateSearchPage(historyQuery);
      }, () => {
        searchPageStatus.textContent = DEFAULT_PROMPT;
      });
      return;
    }

    if (searchPageHistory) {
      searchPageHistory.hidden = true;
    }

    searchPageStatus.textContent = `正在搜索 “${trimmedQuery}” ...`;
    try {
      const results = await searchDocuments(trimmedQuery, 24);
      searchPageStatus.textContent = results.length
        ? `找到 ${results.length} 条结果。`
        : `没有找到与 “${trimmedQuery}” 相关的内容。`;
      renderGroupedResults(searchPageResults, results, trimmedQuery, { emptyText: '没有匹配结果。' });
    } catch (error) {
      searchPageStatus.textContent = '搜索索引加载失败，请稍后再试。';
      clearChildren(searchPageResults);
    }
  }

  for (const root of searchRoots) {
    const input = root.querySelector('[data-search-input]');
    const form = root.querySelector('form');
    const dropdown = root.querySelector('[data-search-dropdown]');
    const status = root.querySelector('[data-search-status]');
    const resultsContainer = root.querySelector('[data-search-results]');
    const moreLink = root.querySelector('[data-search-more]');
    const historyContainer = root.querySelector('[data-search-history]');
    const panel = root.querySelector('[data-search-panel]');
    const toggle = root.querySelector('[data-search-toggle]');
    const isCollapsible = root.classList.contains('site-search--icon');
    const isInsideSearchPage = Boolean(root.closest('[data-search-page]'));

    if (!input || !form || !dropdown || !status || !resultsContainer || !moreLink || !panel) {
      continue;
    }

    let activeIndex = -1;
    let closeTimer = 0;

    function openPanel({ focusInput = false } = {}) {
      if (isCollapsible) {
        window.clearTimeout(closeTimer);
        panel.hidden = false;
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'true');
        }
        window.requestAnimationFrame(() => {
          root.classList.add('site-search--open');
        });
      }

      if (focusInput) {
        window.requestAnimationFrame(() => input.focus());
      }
    }

    function closePanel({ focusToggle = false } = {}) {
      clearActiveSelection();
      dropdown.hidden = true;
      if (isCollapsible) {
        window.clearTimeout(closeTimer);
        root.classList.remove('site-search--open');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
        }
        closeTimer = window.setTimeout(() => {
          if (!root.classList.contains('site-search--open')) {
            panel.hidden = true;
            if (focusToggle) {
              window.requestAnimationFrame(() => toggle?.focus());
            }
          }
        }, PANEL_TRANSITION_MS);
      }
    }

    function getSelectableItems() {
      const containers = isInsideSearchPage ? [searchPageHistory, searchPageResults] : [historyContainer, resultsContainer];
      return containers.flatMap((container) => {
        if (!container || container.hidden) {
          return [];
        }
        return Array.from(container.querySelectorAll('[data-search-selectable]'));
      });
    }

    function clearActiveSelection() {
      const items = getSelectableItems();
      for (const item of items) {
        item.classList.remove('search-selectable--active');
        item.setAttribute('aria-selected', 'false');
      }
      activeIndex = -1;
    }

    function setActiveSelection(nextIndex) {
      const items = getSelectableItems();
      if (!items.length) {
        activeIndex = -1;
        return false;
      }

      const normalizedIndex = ((nextIndex % items.length) + items.length) % items.length;
      items.forEach((item, index) => {
        const isActive = index === normalizedIndex;
        item.classList.toggle('search-selectable--active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      items[normalizedIndex].scrollIntoView({ block: 'nearest' });
      activeIndex = normalizedIndex;
      return true;
    }

    function moveActiveSelection(direction) {
      const items = getSelectableItems();
      if (!items.length) {
        activeIndex = -1;
        return false;
      }

      const nextIndex = activeIndex === -1 ? (direction > 0 ? 0 : items.length - 1) : activeIndex + direction;
      return setActiveSelection(nextIndex);
    }

    function activateActiveSelection() {
      const items = getSelectableItems();
      const activeItem = items[activeIndex];
      if (!activeItem) {
        return false;
      }

      activeItem.click();
      return true;
    }

    const selectHistoryQuery = (query) => {
      input.value = query;
      syncQueryAcrossInputs(query, input);
      clearActiveSelection();
      openPanel();

      if (isInsideSearchPage) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('q', query);
        window.history.replaceState({}, '', nextUrl);
        void updateSearchPage(query);
        return;
      }

      dropdown.hidden = false;
      void performLiveSearchNow(query);
    };

    const showHistoryDropdown = () => {
      if (isInsideSearchPage) {
        return;
      }

      openPanel();
      renderHistory(historyContainer, selectHistoryQuery, () => {
        status.textContent = DEFAULT_PROMPT;
        clearActiveSelection();
      });
      clearChildren(resultsContainer);
      clearActiveSelection();
      moreLink.hidden = true;
      dropdown.hidden = historyContainer?.hidden ?? true;
      status.textContent = historyContainer?.hidden ? DEFAULT_PROMPT : '最近搜索';
    };

    async function performLiveSearchNow(forcedQuery) {
      const query = (forcedQuery ?? input.value).trim();
      syncQueryAcrossInputs(query, input);
      clearActiveSelection();

      if (isInsideSearchPage) {
        const nextUrl = new URL(window.location.href);
        if (query.length >= MIN_QUERY_LENGTH) {
          nextUrl.searchParams.set('q', query);
        } else {
          nextUrl.searchParams.delete('q');
        }
        window.history.replaceState({}, '', nextUrl);
        await updateSearchPage(query);
        return;
      }

      if (query.length < MIN_QUERY_LENGTH) {
        showHistoryDropdown();
        return;
      }

      openPanel();
      status.textContent = `正在搜索 “${query}” ...`;
      dropdown.hidden = false;
      if (historyContainer) {
        historyContainer.hidden = true;
      }

      try {
        const results = await searchDocuments(query, 5);
        if (!results.length) {
          status.textContent = `没有找到与 “${query}” 相关的内容。`;
          clearChildren(resultsContainer);
          moreLink.hidden = true;
          return;
        }

        status.textContent = `匹配到 ${results.length} 条结果。`;
        renderGroupedResults(resultsContainer, results, query, { compact: true, emptyText: '没有匹配结果。' });
        moreLink.hidden = false;
        moreLink.href = `${searchPageUrl}?q=${encodeURIComponent(query)}`;
      } catch (error) {
        status.textContent = '搜索索引加载失败，请稍后再试。';
        clearChildren(resultsContainer);
        moreLink.hidden = true;
      }
    }

    const performLiveSearch = debounce((forcedQuery) => {
      void performLiveSearchNow(forcedQuery);
    }, 120);

    toggle?.addEventListener('click', () => {
      if (panel.hidden) {
        openPanel({ focusInput: true });
        if (input.value.trim().length >= MIN_QUERY_LENGTH) {
          performLiveSearch(input.value.trim());
        } else {
          showHistoryDropdown();
        }
      } else {
        closePanel({ focusToggle: false });
      }
    });

    input.addEventListener('input', () => performLiveSearch());
    input.addEventListener('focus', () => {
      openPanel();
      const query = input.value.trim();
      if (query.length >= MIN_QUERY_LENGTH) {
        performLiveSearch(query);
      } else if (!isInsideSearchPage) {
        showHistoryDropdown();
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (isCollapsible) {
          closePanel({ focusToggle: true });
        } else {
          clearActiveSelection();
          if (!isInsideSearchPage) {
            dropdown.hidden = true;
          }
        }
        return;
      }

      if (event.key === 'Enter') {
        if (activateActiveSelection()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      const query = input.value.trim();
      if (!isInsideSearchPage) {
        if (query.length < MIN_QUERY_LENGTH) {
          showHistoryDropdown();
        } else {
          openPanel();
          dropdown.hidden = false;
        }
      }

      const moved = moveActiveSelection(event.key === 'ArrowDown' ? 1 : -1);
      if (moved || (!isInsideSearchPage && !dropdown.hidden)) {
        event.preventDefault();
      }
    });

    form.addEventListener('submit', (event) => {
      const query = input.value.trim();
      if (!query) {
        event.preventDefault();
        return;
      }

      addHistory(query);
      clearActiveSelection();

      if (isInsideSearchPage) {
        event.preventDefault();
        syncQueryAcrossInputs(query, input);
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('q', query);
        window.history.replaceState({}, '', nextUrl);
        dropdown.hidden = true;
        void updateSearchPage(query);
        return;
      }

      event.preventDefault();
      window.location.href = `${searchPageUrl}?q=${encodeURIComponent(query)}`;
    });

    const interactiveResultsContainer = isInsideSearchPage ? searchPageResults : resultsContainer;
    interactiveResultsContainer?.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (link && input.value.trim().length >= MIN_QUERY_LENGTH) {
        addHistory(input.value.trim());
      }
    });

    moreLink.addEventListener('click', () => {
      if (input.value.trim().length >= MIN_QUERY_LENGTH) {
        addHistory(input.value.trim());
      }
    });
  }

  document.addEventListener('click', (event) => {
    for (const root of searchRoots) {
      if (!root.contains(event.target)) {
        const dropdown = root.querySelector('[data-search-dropdown]');
        const panel = root.querySelector('[data-search-panel]');
        const toggle = root.querySelector('[data-search-toggle]');
        const isCollapsible = root.classList.contains('site-search--icon');

        if (isCollapsible && panel && toggle) {
          panel.hidden = true;
          root.classList.remove('site-search--open');
          toggle.setAttribute('aria-expanded', 'false');
          if (dropdown) {
            dropdown.hidden = true;
          }
          continue;
        }

        if (dropdown && !root.closest('[data-search-page]')) {
          dropdown.hidden = true;
        }
      }
    }
  });

  if (initialQuery.length >= MIN_QUERY_LENGTH) {
    syncQueryAcrossInputs(initialQuery);
    void updateSearchPage(initialQuery);
  } else if (searchPage) {
    void updateSearchPage('');
  }
})();

