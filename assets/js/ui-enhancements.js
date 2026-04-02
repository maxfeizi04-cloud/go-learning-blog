(() => {
  const COPY_RESET_MS = 1500;

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
      return lines.map((line) => line.textContent.replace(/\u00a0/g, ' ')).join('\n').replace(/\n$/, '');
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
      button.textContent = '复制全部';
      button.setAttribute('data-code-copy', 'true');
      button.setAttribute('aria-label', '复制全部代码');

      button.addEventListener('click', async () => {
        const originalLabel = button.textContent;
        button.disabled = true;
        try {
          await copyTextToClipboard(extractCodeText(block));
          button.textContent = '已复制';
        } catch (error) {
          button.textContent = '复制失败';
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

      currentEntry.link.scrollIntoView({ block: 'nearest' });
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

  enhanceCodeBlocks();
  enhanceTableOfContents();
})();