(() => {
  const COPY_RESET_MS = 1500;
  const COPY_LABEL = '\u590d\u5236\u5168\u90e8';
  const COPY_SUCCESS_LABEL = '\u5df2\u590d\u5236';
  const COPY_FAILURE_LABEL = '\u590d\u5236\u5931\u8d25';
  const COPY_ARIA_LABEL = '\u590d\u5236\u5168\u90e8\u4ee3\u7801';
  const OPEN_MENU_LABEL = '\u6253\u5f00\u5bfc\u822a';
  const CLOSE_MENU_LABEL = '\u5173\u95ed\u5bfc\u822a';

  async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function extractCodeText(container) {
    const lines = Array.from(container.querySelectorAll('.line .cl'));
    if (lines.length) {
      return lines
        .map((line) => line.textContent.replace(/\u00a0/g, ' '))
        .join('\n')
        .replace(/\n$/, '');
    }

    const code = container.querySelector('code');
    return (code ? code.textContent : container.textContent || '').trimEnd();
  }

  function enhanceCodeBlocks() {
    const blocks = document.querySelectorAll('.prose .highlight');
    for (const block of blocks) {
      if (block.querySelector('[data-code-copy]')) {
        continue;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = COPY_LABEL;
      button.setAttribute('data-code-copy', 'true');
      button.setAttribute('aria-label', COPY_ARIA_LABEL);

      button.addEventListener('click', async () => {
        const originalLabel = button.textContent;
        button.disabled = true;

        try {
          await copyTextToClipboard(extractCodeText(block));
          button.textContent = COPY_SUCCESS_LABEL;
        } catch (error) {
          button.textContent = COPY_FAILURE_LABEL;
        }

        window.setTimeout(() => {
          button.textContent = originalLabel;
          button.disabled = false;
        }, COPY_RESET_MS);
      });

      block.insertBefore(button, block.firstChild);
    }
  }

  function enhanceTableOfContents() {
    const toc = document.getElementById('TableOfContents');
    const prose = document.querySelector('.prose');
    if (!toc || !prose) {
      return;
    }

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    const entries = links
      .map((link) => {
        const targetId = decodeURIComponent(link.getAttribute('href').slice(1));
        const heading = document.getElementById(targetId);
        return heading ? { id: targetId, link, heading } : null;
      })
      .filter(Boolean);

    if (!entries.length) {
      return;
    }

    let activeId = '';
    let ticking = false;

    function shouldKeepActiveTocLinkInView() {
      const tocAside = toc.closest('.article-toc');
      if (!tocAside) {
        return false;
      }

      return window.getComputedStyle(tocAside).position === 'sticky';
    }

    function clearTocState() {
      for (const link of links) {
        link.classList.remove('is-active', 'is-trail');
        link.removeAttribute('aria-current');
        const item = link.parentElement;
        item?.classList.remove('is-active', 'is-trail');
      }
    }

    function getDirectLink(listItem) {
      const candidate = listItem.firstElementChild;
      return candidate?.tagName === 'A' ? candidate : null;
    }

    function setActiveTocEntry(id) {
      if (!id || activeId === id) {
        return;
      }

      activeId = id;
      clearTocState();

      const currentEntry = entries.find((entry) => entry.id === id);
      if (!currentEntry) {
        return;
      }

      let currentItem = currentEntry.link.parentElement;
      let isPrimary = true;
      while (currentItem && currentItem !== toc) {
        currentItem.classList.add(isPrimary ? 'is-active' : 'is-trail');
        const directLink = getDirectLink(currentItem);
        if (directLink) {
          directLink.classList.add(isPrimary ? 'is-active' : 'is-trail');
          if (isPrimary) {
            directLink.setAttribute('aria-current', 'true');
          }
        }
        currentItem = currentItem.parentElement?.closest('li');
        isPrimary = false;
      }

      if (shouldKeepActiveTocLinkInView()) {
        currentEntry.link.scrollIntoView({ block: 'nearest' });
      }
    }

    function updateActiveHeading() {
      const threshold = Math.max(120, window.innerHeight * 0.24);
      let currentEntry = entries[0];

      for (const entry of entries) {
        if (entry.heading.getBoundingClientRect().top <= threshold) {
          currentEntry = entry;
        } else {
          break;
        }
      }

      setActiveTocEntry(currentEntry.id);
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateActiveHeading);
    }

    for (const entry of entries) {
      entry.link.addEventListener('click', () => setActiveTocEntry(entry.id));
    }

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  function addMediaQueryListener(queryList, listener) {
    if (typeof queryList.addEventListener === 'function') {
      queryList.addEventListener('change', listener);
      return;
    }

    if (typeof queryList.addListener === 'function') {
      queryList.addListener(listener);
    }
  }

  function enhanceMobileMenu() {
    const header = document.querySelector('[data-site-header]');
    const toggle = header?.querySelector('[data-menu-toggle]');
    const panel = header?.querySelector('[data-menu-panel]');
    const backdrop = header?.querySelector('[data-menu-backdrop]');
    const menuLinks = panel ? Array.from(panel.querySelectorAll('[data-menu-link]')) : [];
    if (!header || !toggle || !panel) {
      return;
    }

    const desktopQuery = window.matchMedia('(min-width: 981px)');
    let isOpen = false;

    toggle.hidden = false;
    header.dataset.menuReady = 'true';

    function setMenuState(nextState, options = {}) {
      const shouldOpen = !desktopQuery.matches && Boolean(nextState);
      if (isOpen === shouldOpen && !options.force) {
        return;
      }

      isOpen = shouldOpen;
      header.dataset.menuOpen = isOpen ? 'true' : 'false';
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? CLOSE_MENU_LABEL : OPEN_MENU_LABEL);
      panel.setAttribute('aria-hidden', String(!isOpen && !desktopQuery.matches));
      document.body.classList.toggle('has-open-menu', isOpen);

      if (backdrop) {
        backdrop.hidden = !isOpen;
      }

      if (!isOpen && options.restoreFocus) {
        window.requestAnimationFrame(() => toggle.focus());
      }
    }

    setMenuState(false, { force: true });

    toggle.addEventListener('click', () => {
      setMenuState(!isOpen);
    });

    backdrop?.addEventListener('click', () => {
      setMenuState(false);
    });

    for (const link of menuLinks) {
      link.addEventListener('click', () => {
        if (!desktopQuery.matches) {
          setMenuState(false);
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) {
        setMenuState(false, { restoreFocus: true });
      }
    });

    addMediaQueryListener(desktopQuery, () => {
      setMenuState(false, { force: true });
    });
  }

  function enhanceReadingProgress() {
    const articleBody = document.querySelector('.article-body');
    if (!articleBody) {
      return;
    }

    const progressBar = document.createElement('div');
    progressBar.id = 'reading-progress';
    document.body.appendChild(progressBar);

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollableHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100)) : 0;
      progressBar.style.width = `${progress}%`;
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  enhanceCodeBlocks();
  enhanceTableOfContents();
  enhanceMobileMenu();
  enhanceReadingProgress();
})();
