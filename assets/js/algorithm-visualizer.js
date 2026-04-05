(() => {
  const AUTOPLAY_INTERVAL_MS = 1400
  const roots = document.querySelectorAll('[data-algorithm-visualizer]')

  if (!roots.length) {
    return
  }

  const generators = {
    'two-sum': createTwoSumModel,
    'binary-search': createBinarySearchModel,
    'sliding-window': createSlidingWindowModel,
  }

  const boardRenderers = {
    'two-sum': renderTwoSumBoard,
    'binary-search': renderBinarySearchBoard,
    'sliding-window': renderSlidingWindowBoard,
  }

  for (const root of roots) {
    initVisualizer(root)
  }

  function initVisualizer(root) {
    const config = readConfig(root)
    if (!config || !config.key) {
      setFallbackState(root, '缺少可视化配置，无法生成步骤。')
      return
    }

    const buildModel = generators[config.key]
    if (!buildModel) {
      setFallbackState(root, `暂不支持 ${config.key} 这种可视化类型。`)
      return
    }

    const model = buildModel(config)
    if (!model.steps.length) {
      setFallbackState(root, '当前示例没有生成任何可视化步骤。')
      return
    }

    const elements = {
      board: root.querySelector('[data-board]'),
      metrics: root.querySelector('[data-metrics]'),
      stepTitle: root.querySelector('[data-step-title]'),
      stepDescription: root.querySelector('[data-step-description]'),
      progress: root.querySelector('[data-progress]'),
      stepLabel: root.querySelector('[data-step-label]'),
      railStatus: root.querySelector('[data-rail-status]'),
      timeline: root.querySelector('[data-timeline]'),
      resetButton: root.querySelector('[data-action="reset"]'),
      prevButton: root.querySelector('[data-action="prev"]'),
      playButton: root.querySelector('[data-action="play"]'),
      nextButton: root.querySelector('[data-action="next"]'),
    }

    const state = {
      currentStep: 0,
      timerId: 0,
    }

    elements.progress.max = String(model.steps.length - 1)
    renderTimeline(elements.timeline, model.steps)

    elements.progress.addEventListener('input', (event) => {
      stopAutoplay()
      setStep(Number(event.target.value), true)
    })

    elements.timeline.addEventListener('click', (event) => {
      const button = event.target.closest('[data-step-index]')
      if (!button) {
        return
      }

      stopAutoplay()
      setStep(Number(button.dataset.stepIndex), true)
    })

    elements.resetButton.addEventListener('click', () => {
      stopAutoplay()
      setStep(0, true)
    })

    elements.prevButton.addEventListener('click', () => {
      stopAutoplay()
      setStep(state.currentStep - 1, true)
    })

    elements.nextButton.addEventListener('click', () => {
      stopAutoplay()
      setStep(state.currentStep + 1, true)
    })

    elements.playButton.addEventListener('click', () => {
      if (state.timerId) {
        stopAutoplay()
        return
      }

      if (state.currentStep >= model.steps.length - 1) {
        setStep(0)
      }

      state.timerId = window.setInterval(() => {
        if (state.currentStep >= model.steps.length - 1) {
          stopAutoplay()
          return
        }

        setStep(state.currentStep + 1)
      }, AUTOPLAY_INTERVAL_MS)

      elements.playButton.textContent = '暂停'
      elements.playButton.setAttribute('aria-pressed', 'true')
    })

    function stopAutoplay() {
      if (!state.timerId) {
        return
      }

      window.clearInterval(state.timerId)
      state.timerId = 0
      elements.playButton.textContent = '播放'
      elements.playButton.setAttribute('aria-pressed', 'false')
    }

    function setStep(nextIndex, keepTimelineInView) {
      state.currentStep = clamp(nextIndex, 0, model.steps.length - 1)
      const step = model.steps[state.currentStep]
      const renderBoard = boardRenderers[model.type]

      elements.progress.value = String(state.currentStep)
      elements.stepLabel.textContent = `步骤 ${state.currentStep + 1} / ${model.steps.length}`
      elements.railStatus.textContent = `${state.currentStep + 1} / ${model.steps.length}`
      elements.stepTitle.textContent = step.title
      elements.stepDescription.textContent = step.description
      elements.metrics.innerHTML = renderMetrics(step.metrics)
      elements.board.innerHTML = renderBoard ? renderBoard(step.board) : ''
      updateTimeline(elements.timeline, state.currentStep, keepTimelineInView)
      updateControls(elements, state.currentStep, model.steps.length)
    }

    setStep(0)

    root.addEventListener('mouseleave', () => {
      if (!state.timerId) {
        return
      }

      stopAutoplay()
    })
  }

  function readConfig(root) {
    const element = root.querySelector('[data-algorithm-visualizer-config]')
    if (!element) {
      return null
    }

    try {
      const parsed = JSON.parse(element.textContent)
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
    } catch (error) {
      return null
    }
  }

  function setFallbackState(root, message) {
    const board = root.querySelector('[data-board]')
    const metrics = root.querySelector('[data-metrics]')
    const description = root.querySelector('[data-step-description]')
    const controls = root.querySelector('.algorithm-visualizer__toolbar')
    const rail = root.querySelector('.algorithm-visualizer__rail')

    if (controls) {
      controls.hidden = true
    }

    if (rail) {
      rail.hidden = true
    }

    if (board) {
      board.innerHTML = `<div class="algorithm-visualizer__empty">${escapeHTML(message)}</div>`
    }

    if (metrics) {
      metrics.innerHTML = ''
    }

    if (description) {
      description.textContent = message
    }
  }

  function renderTimeline(container, steps) {
    container.innerHTML = steps
      .map((step, index) => {
        return `
          <li>
            <button class="algorithm-visualizer__timeline-button" type="button" data-step-index="${index}">
              <span>步骤 ${index + 1}</span>
              <strong>${escapeHTML(step.label)}</strong>
            </button>
          </li>
        `
      })
      .join('')
  }

  function updateTimeline(container, currentStep, keepTimelineInView) {
    const buttons = container.querySelectorAll('[data-step-index]')
    for (const button of buttons) {
      const isActive = Number(button.dataset.stepIndex) === currentStep
      button.classList.toggle('is-active', isActive)
      button.setAttribute('aria-current', isActive ? 'step' : 'false')
      if (isActive && !keepTimelineInView) {
        button.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }
    }
  }

  function updateControls(elements, currentStep, totalSteps) {
    elements.resetButton.disabled = currentStep === 0
    elements.prevButton.disabled = currentStep === 0
    elements.nextButton.disabled = currentStep === totalSteps - 1
    if (!elements.playButton.matches('[aria-pressed="true"]')) {
      elements.playButton.textContent = currentStep === totalSteps - 1 ? '重播' : '播放'
    }
  }

  function renderMetrics(metrics) {
    const safeMetrics = Array.isArray(metrics) ? metrics.filter(Boolean) : []
    if (!safeMetrics.length) {
      return '<p class="algorithm-visualizer__empty">当前步骤没有额外状态。</p>'
    }

    return safeMetrics
      .map((metric) => {
        const toneClass = metric.tone ? ` algorithm-visualizer__metric--${escapeHTML(metric.tone)}` : ''
        return `
          <div class="algorithm-visualizer__metric${toneClass}">
            <span>${escapeHTML(metric.label)}</span>
            <strong>${escapeHTML(metric.value)}</strong>
          </div>
        `
      })
      .join('')
  }

  function createTwoSumModel(config) {
    const numbers = normalizeNumberList(config.numbers, [2, 7, 11, 15])
    const target = normalizeNumber(config.target, 9)
    const steps = []
    const seen = new Map()

    steps.push({
      label: '准备输入',
      title: '初始化遍历',
      description: `目标和是 ${target}。从左到右扫描数组，每一步都先计算补数，再检查哈希表里是否已经出现过。`,
      metrics: [
        metric('数组长度', numbers.length),
        metric('目标和', target, 'accent'),
        metric('哈希表', '空'),
      ],
      board: {
        numbers,
        target,
        seen: [],
      },
    })

    for (let index = 0; index < numbers.length; index += 1) {
      const value = numbers[index]
      const need = target - value
      const matchIndex = seen.has(need) ? seen.get(need) : null
      const seenBefore = snapshotMap(seen, { matchKey: need })

      steps.push({
        label: `检查 ${value}`,
        title: `检查索引 ${index} 的元素 ${value}`,
        description: matchIndex === null
          ? `当前元素是 ${value}，需要的补数是 ${need}。先在哈希表里查补数是否出现过。`
          : `当前元素是 ${value}，补数 ${need} 已经在索引 ${matchIndex} 出现，可以直接构成答案。`,
        metrics: [
          metric('当前索引', index),
          metric('当前值', value),
          metric('需要的补数', need, matchIndex === null ? '' : 'accent'),
          metric('哈希表条目', seenBefore.length),
        ],
        board: {
          numbers,
          target,
          currentIndex: index,
          need,
          seen: seenBefore,
          matchIndex,
          foundPair: matchIndex === null ? null : [matchIndex, index],
        },
      })

      if (matchIndex !== null) {
        steps.push({
          label: '命中答案',
          title: `找到答案 [${matchIndex}, ${index}]`,
          description: `因为 nums[${matchIndex}] + nums[${index}] = ${numbers[matchIndex]} + ${value} = ${target}，所以可以立刻返回。`,
          metrics: [
            metric('答案索引', `[${matchIndex}, ${index}]`, 'success'),
            metric('答案数值', `${numbers[matchIndex]} + ${value}`),
            metric('目标和', target),
          ],
          board: {
            numbers,
            target,
            currentIndex: index,
            need,
            seen: seenBefore,
            matchIndex,
            foundPair: [matchIndex, index],
          },
        })

        return {
          type: 'two-sum',
          steps,
        }
      }

      seen.set(value, index)
      steps.push({
        label: `记录 ${value}`,
        title: `把 ${value} 写入哈希表`,
        description: `这一步还没有命中答案，所以把值 ${value} 对应的索引 ${index} 存起来，供后面的元素反查补数。`,
        metrics: [
          metric('写入键值', `${value} -> ${index}`, 'accent'),
          metric('哈希表条目', seen.size),
          metric('下一步', '继续向右扫描'),
        ],
        board: {
          numbers,
          target,
          currentIndex: index,
          need,
          seen: snapshotMap(seen, { newKey: value }),
        },
      })
    }

    steps.push({
      label: '遍历结束',
      title: '没有找到可行解',
      description: `数组已经遍历完，但没有找到和为 ${target} 的一对索引。`,
      metrics: [
        metric('结果', '无解', 'warning'),
        metric('已扫描元素', numbers.length),
      ],
      board: {
        numbers,
        target,
        seen: snapshotMap(seen),
      },
    })

    return {
      type: 'two-sum',
      steps,
    }
  }

  function createBinarySearchModel(config) {
    const numbers = normalizeNumberList(config.numbers, [1, 3, 5, 7, 9, 11, 13])
      .slice()
      .sort((left, right) => left - right)
    const target = normalizeNumber(config.target, 11)
    const intervalMode = config.interval === 'half-open' ? 'half-open' : 'closed'
    const steps = []

    let left = 0
    let right = intervalMode === 'half-open' ? numbers.length : numbers.length - 1

    steps.push({
      label: '初始化区间',
      title: '建立候选区间',
      description: intervalMode === 'half-open'
        ? `当前使用左闭右开区间 [left, right)。初始时整段数组都还是候选答案。`
        : `当前使用左闭右闭区间 [left, right]。初始时整段数组都还是候选答案。`,
      metrics: [
        metric('区间模型', intervalMode === 'half-open' ? '[left, right)' : '[left, right]'),
        metric('目标值', target, 'accent'),
        metric('候选长度', numbers.length),
      ],
      board: {
        numbers,
        target,
        left,
        right,
        intervalMode,
      },
    })

    while (intervalMode === 'half-open' ? left < right : left <= right) {
      const mid = left + Math.floor((right - left) / 2)
      const value = numbers[mid]

      steps.push({
        label: `mid = ${mid}`,
        title: `取中点 mid = ${mid}`,
        description: `当前候选区间是 ${formatInterval(left, right, intervalMode)}，中点值为 ${value}。接下来比较 ${value} 和目标值 ${target}。`,
        metrics: [
          metric('left', left),
          metric('mid', mid, 'accent'),
          metric('right', right),
          metric('nums[mid]', value),
        ],
        board: {
          numbers,
          target,
          left,
          right,
          mid,
          intervalMode,
        },
      })

      if (value === target) {
        steps.push({
          label: '找到答案',
          title: `命中索引 ${mid}`,
          description: `因为 nums[${mid}] = ${target}，所以直接返回索引 ${mid}。`,
          metrics: [
            metric('答案索引', mid, 'success'),
            metric('答案值', value),
            metric('剩余区间', formatInterval(left, right, intervalMode)),
          ],
          board: {
            numbers,
            target,
            left,
            right,
            mid,
            foundIndex: mid,
            intervalMode,
          },
        })

        return {
          type: 'binary-search',
          steps,
        }
      }

      if (value < target) {
        const nextLeft = mid + 1
        steps.push({
          label: '丢弃左半边',
          title: `left 更新为 ${nextLeft}`,
          description: `因为 ${value} < ${target}，所以 mid 及其左侧都不可能再是答案。下一轮只保留右半边区间。`,
          metrics: [
            metric('丢弃范围', intervalMode === 'half-open' ? `[${left}, ${mid + 1})` : formatRange(left, mid), 'warning'),
            metric('新的 left', nextLeft, 'accent'),
            metric('新区间', formatInterval(nextLeft, right, intervalMode)),
          ],
          board: {
            numbers,
            target,
            left: nextLeft,
            right,
            mid,
            intervalMode,
          },
        })
        left = nextLeft
      } else {
        const nextRight = intervalMode === 'half-open' ? mid : mid - 1
        steps.push({
          label: '丢弃右半边',
          title: `right 更新为 ${nextRight}`,
          description: `因为 ${value} > ${target}，所以 mid 及其右侧都可以排除。下一轮只保留左半边区间。`,
          metrics: [
            metric('丢弃范围', intervalMode === 'half-open' ? `[${mid}, ${right})` : formatRange(mid, right), 'warning'),
            metric('新的 right', nextRight, 'accent'),
            metric('新区间', formatInterval(left, nextRight, intervalMode)),
          ],
          board: {
            numbers,
            target,
            left,
            right: nextRight,
            mid,
            intervalMode,
          },
        })
        right = nextRight
      }
    }

    steps.push({
      label: '区间为空',
      title: '搜索结束但未命中',
      description: '候选区间已经收缩为空，说明目标值不在数组中。',
      metrics: [
        metric('结果', '未找到', 'warning'),
        metric('最终区间', formatInterval(left, right, intervalMode)),
      ],
      board: {
        numbers,
        target,
        left,
        right,
        intervalMode,
      },
    })

    return {
      type: 'binary-search',
      steps,
    }
  }

  function createSlidingWindowModel(config) {
    const source = normalizeString(config.string || config.text || config.s, 'abcabcbb')
    const chars = Array.from(source)
    const steps = []
    const counter = new Map()

    let left = 0
    let bestStart = 0
    let bestLen = 0

    steps.push({
      label: '准备输入',
      title: '初始化窗口',
      description: '左右指针都从起点开始。右指针负责扩张窗口，左指针只在出现重复字符时收缩窗口。',
      metrics: [
        metric('字符串长度', chars.length),
        metric('当前窗口', '空'),
        metric('最佳长度', bestLen),
      ],
      board: {
        chars,
        left,
        right: null,
        bestStart,
        bestLen,
        counts: [],
      },
    })

    for (let right = 0; right < chars.length; right += 1) {
      const currentChar = chars[right]
      counter.set(currentChar, (counter.get(currentChar) || 0) + 1)

      steps.push({
        label: `扩张到 ${right}`,
        title: `右指针纳入 '${currentChar}'`,
        description: `窗口扩张到 [${left}, ${right}]。字符 '${currentChar}' 的出现次数变为 ${counter.get(currentChar)}。`,
        metrics: [
          metric('left', left),
          metric('right', right, 'accent'),
          metric('窗口长度', right - left + 1),
          metric('当前字符计数', `${currentChar}: ${counter.get(currentChar)}`),
        ],
        board: {
          chars,
          left,
          right,
          bestStart,
          bestLen,
          counts: snapshotCounts(counter),
          focusIndex: right,
          duplicateChar: currentChar,
          duplicateCount: counter.get(currentChar),
        },
      })

      while ((counter.get(currentChar) || 0) > 1) {
        const dropChar = chars[left]
        steps.push({
          label: '收缩窗口',
          title: `重复出现 '${currentChar}'，移动 left`,
          description: `因为 '${currentChar}' 在当前窗口里重复了，所以要移出索引 ${left} 的 '${dropChar}'，直到窗口重新合法。`,
          metrics: [
            metric('重复字符', currentChar, 'warning'),
            metric('准备移出', `${dropChar} @ ${left}`),
            metric('当前窗口', `[${left}, ${right}]`),
          ],
          board: {
            chars,
            left,
            right,
            bestStart,
            bestLen,
            counts: snapshotCounts(counter),
            focusIndex: left,
            duplicateChar: currentChar,
            duplicateCount: counter.get(currentChar),
          },
        })

        const nextCount = (counter.get(dropChar) || 0) - 1
        if (nextCount <= 0) {
          counter.delete(dropChar)
        } else {
          counter.set(dropChar, nextCount)
        }
        left += 1

        steps.push({
          label: `left = ${left}`,
          title: '窗口恢复合法',
          description: `左边界移动到 ${left}。如果重复还存在，就继续收缩；否则当前窗口重新满足“无重复字符”。`,
          metrics: [
            metric('新的 left', left, 'accent'),
            metric('窗口长度', right - left + 1),
            metric('重复计数', counter.get(currentChar) || 0),
          ],
          board: {
            chars,
            left,
            right,
            bestStart,
            bestLen,
            counts: snapshotCounts(counter),
            focusIndex: left,
            duplicateChar: currentChar,
            duplicateCount: counter.get(currentChar) || 0,
          },
        })
      }

      const width = right - left + 1
      if (width > bestLen) {
        bestStart = left
        bestLen = width
        steps.push({
          label: '刷新答案',
          title: `更新最长长度为 ${bestLen}`,
          description: `当前合法窗口是 "${chars.slice(left, right + 1).join('')}"，长度 ${bestLen} 超过历史最好值，所以刷新答案。`,
          metrics: [
            metric('最佳长度', bestLen, 'success'),
            metric('最佳区间', formatRange(bestStart, bestStart + bestLen - 1)),
            metric('最佳子串', chars.slice(bestStart, bestStart + bestLen).join('')),
          ],
          board: {
            chars,
            left,
            right,
            bestStart,
            bestLen,
            counts: snapshotCounts(counter),
            focusIndex: right,
          },
        })
      }
    }

    steps.push({
      label: '遍历结束',
      title: '得到最终答案',
      description: `整段字符串都扫描完成后，最长无重复子串长度为 ${bestLen}，对应的子串是 "${chars.slice(bestStart, bestStart + bestLen).join('')}"。`,
      metrics: [
        metric('最终长度', bestLen, 'success'),
        metric('最佳区间', bestLen > 0 ? formatRange(bestStart, bestStart + bestLen - 1) : '空'),
        metric('最佳子串', bestLen > 0 ? chars.slice(bestStart, bestStart + bestLen).join('') : '空'),
      ],
      board: {
        chars,
        left,
        right: chars.length - 1,
        bestStart,
        bestLen,
        counts: snapshotCounts(counter),
      },
    })

    return {
      type: 'sliding-window',
      steps,
    }
  }

  function renderTwoSumBoard(board) {
    const cells = board.numbers
      .map((value, index) => {
        const classes = ['algo-cell']
        const markers = []

        if (board.currentIndex === index) {
          classes.push('algo-cell--current')
          markers.push('i')
        }

        if (board.matchIndex === index) {
          classes.push('algo-cell--match')
          markers.push('need')
        }

        if (Array.isArray(board.foundPair) && board.foundPair.includes(index)) {
          classes.push('algo-cell--found')
        }

        return `
          <div class="${classes.join(' ')}">
            <span class="algo-cell__index">idx ${index}</span>
            <strong class="algo-cell__value">${escapeHTML(value)}</strong>
            ${renderMarkers(markers)}
          </div>
        `
      })
      .join('')

    return `
      <div class="algo-board">
        <div class="algo-board__lane">
          <div class="algo-board__head">
            <strong>数组扫描</strong>
            <span>${escapeHTML(board.foundPair ? `答案索引 [${board.foundPair[0]}, ${board.foundPair[1]}]` : `target = ${board.target}`)}</span>
          </div>
          <div class="algo-strip">${cells}</div>
        </div>
        <div class="algo-board__grid">
          <section class="algo-board__panel">
            <div class="algo-board__head">
              <strong>当前关注</strong>
              <span>${escapeHTML(board.need == null ? '准备开始' : `need = ${board.need}`)}</span>
            </div>
            <div class="algo-board__summary">
              <p>${escapeHTML(board.currentIndex == null ? '遍历从最左侧开始。每一步都要先算补数，再看哈希表里是否已经见过它。' : `现在正在检查索引 ${board.currentIndex} 的元素。`)}</p>
            </div>
          </section>
          <section class="algo-board__panel">
            <div class="algo-board__head">
              <strong>哈希表</strong>
              <span>${escapeHTML(`${board.seen.length} 项`)}</span>
            </div>
            ${renderPairs(board.seen, '哈希表还没有记录任何元素。')}
          </section>
        </div>
      </div>
    `
  }

  function renderBinarySearchBoard(board) {
    const activeRight = board.intervalMode === 'half-open' ? board.right - 1 : board.right
    const cells = board.numbers
      .map((value, index) => {
        const classes = ['algo-cell']
        const markers = []
        const inRange = activeRight >= board.left && index >= board.left && index <= activeRight

        if (inRange) {
          classes.push('algo-cell--range')
        } else {
          classes.push('algo-cell--inactive')
        }

        if (board.mid === index) {
          classes.push('algo-cell--mid')
          markers.push('mid')
        }

        if (board.left === index) {
          markers.push('left')
        }

        if (board.intervalMode === 'closed' && board.right === index) {
          markers.push('right')
        }

        if (board.foundIndex === index) {
          classes.push('algo-cell--found')
        }

        return `
          <div class="${classes.join(' ')}">
            <span class="algo-cell__index">idx ${index}</span>
            <strong class="algo-cell__value">${escapeHTML(value)}</strong>
            ${renderMarkers(markers)}
          </div>
        `
      })
      .join('')

    return `
      <div class="algo-board">
        <div class="algo-board__lane">
          <div class="algo-board__head">
            <strong>区间收缩</strong>
            <span>${escapeHTML(board.foundIndex == null ? formatInterval(board.left, board.right, board.intervalMode) : `命中索引 ${board.foundIndex}`)}</span>
          </div>
          <div class="algo-strip">${cells}</div>
        </div>
        <div class="algo-board__grid">
          <section class="algo-board__panel">
            <div class="algo-board__head">
              <strong>区间模型</strong>
              <span>${escapeHTML(board.intervalMode === 'half-open' ? '[left, right)' : '[left, right]')}</span>
            </div>
            <div class="algo-board__summary">
              <p>${escapeHTML(board.intervalMode === 'half-open' ? '右边界 right 本身不参与比较，真正的候选元素是 left 到 right-1。' : '左右边界都还在候选区间里，循环条件是 left <= right。')}</p>
            </div>
          </section>
          <section class="algo-board__panel">
            <div class="algo-board__head">
              <strong>搜索目标</strong>
              <span>${escapeHTML(`target = ${board.target}`)}</span>
            </div>
            <div class="algo-board__summary">
              <p>${escapeHTML(board.mid == null ? '下一步会在当前区间里取中点继续比较。' : `当前比较的是 nums[${board.mid}]。根据大小关系决定丢弃哪一半区间。`)}</p>
            </div>
          </section>
        </div>
      </div>
    `
  }

  function renderSlidingWindowBoard(board) {
    const bestEnd = board.bestLen > 0 ? board.bestStart + board.bestLen - 1 : -1
    const cells = board.chars
      .map((value, index) => {
        const classes = ['algo-cell']
        const markers = []
        const inCurrentWindow = board.right !== null && index >= board.left && index <= board.right
        const inBestWindow = board.bestLen > 0 && index >= board.bestStart && index <= bestEnd

        if (inCurrentWindow) {
          classes.push('algo-cell--window')
        }

        if (inBestWindow) {
          classes.push('algo-cell--best')
        }

        if (board.focusIndex === index) {
          classes.push('algo-cell--current')
        }

        if (board.left === index && board.right !== null) {
          classes.push('algo-cell--left')
          markers.push('left')
        }

        if (board.right === index) {
          classes.push('algo-cell--right')
          markers.push('right')
        }

        if (inCurrentWindow && board.duplicateChar && board.duplicateCount > 1 && value === board.duplicateChar) {
          classes.push('algo-cell--duplicate')
        }

        return `
          <div class="${classes.join(' ')}">
            <span class="algo-cell__index">idx ${index}</span>
            <strong class="algo-cell__value">${escapeHTML(value)}</strong>
            ${renderMarkers(markers)}
          </div>
        `
      })
      .join('')

    const currentWindowText = board.right === null || board.left > board.right
      ? '空窗口'
      : board.chars.slice(board.left, board.right + 1).join('')
    const bestWindowText = board.bestLen > 0
      ? board.chars.slice(board.bestStart, board.bestStart + board.bestLen).join('')
      : '尚未产生'

    return `
      <div class="algo-board">
        <div class="algo-board__lane">
          <div class="algo-board__head">
            <strong>窗口变化</strong>
            <span>${escapeHTML(board.right === null ? '等待扩张' : `[${board.left}, ${board.right}]`)}</span>
          </div>
          <div class="algo-strip">${cells}</div>
        </div>
        <div class="algo-board__grid">
          <section class="algo-board__panel">
            <div class="algo-board__head">
              <strong>窗口摘要</strong>
              <span>${escapeHTML(`best = ${board.bestLen}`)}</span>
            </div>
            <div class="algo-board__summary">
              <p>${escapeHTML(`当前窗口：${currentWindowText}`)}</p>
              <p>${escapeHTML(`最佳子串：${bestWindowText}`)}</p>
            </div>
          </section>
          <section class="algo-board__panel">
            <div class="algo-board__head">
              <strong>字符计数</strong>
              <span>${escapeHTML(`${board.counts.length} 项`)}</span>
            </div>
            ${renderPairs(board.counts, '窗口内还没有任何字符。')}
          </section>
        </div>
      </div>
    `
  }

  function renderPairs(entries, emptyText) {
    if (!entries || !entries.length) {
      return `<p class="algorithm-visualizer__empty">${escapeHTML(emptyText)}</p>`
    }

    return `
      <div class="algo-pair-list">
        ${entries
          .map((entry) => {
            const classes = ['algo-pair']
            if (entry.isNew) {
              classes.push('algo-pair--new')
            }
            if (entry.isMatch) {
              classes.push('algo-pair--match')
            }

            return `
              <div class="${classes.join(' ')}">
                <span>${escapeHTML(entry.key)}</span>
                <strong>${escapeHTML(entry.value)}</strong>
              </div>
            `
          })
          .join('')}
      </div>
    `
  }

  function renderMarkers(markers) {
    if (!markers.length) {
      return ''
    }

    return `
      <div class="algo-cell__markers">
        ${markers.map((marker) => `<span class="algo-cell__marker">${escapeHTML(marker)}</span>`).join('')}
      </div>
    `
  }

  function snapshotMap(map, options) {
    const safeOptions = options || {}
    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      value,
      isNew: safeOptions.newKey === key,
      isMatch: safeOptions.matchKey === key,
    }))
  }

  function snapshotCounts(map) {
    return Array.from(map.entries())
      .sort((left, right) => String(left[0]).localeCompare(String(right[0]), 'zh-Hans-CN'))
      .map(([key, value]) => ({ key, value }))
  }

  function metric(label, value, tone) {
    if (value === undefined || value === null || value === '') {
      return null
    }

    return {
      label,
      value: String(value),
      tone,
    }
  }

  function normalizeNumberList(value, fallback) {
    if (!Array.isArray(value)) {
      return fallback.slice()
    }

    const numbers = value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))

    return numbers.length ? numbers : fallback.slice()
  }

  function normalizeNumber(value, fallback) {
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
  }

  function normalizeString(value, fallback) {
    return typeof value === 'string' && value.length ? value : fallback
  }

  function formatInterval(left, right, intervalMode) {
    return intervalMode === 'half-open' ? `[${left}, ${right})` : `[${left}, ${right}]`
  }

  function formatRange(left, right) {
    return left <= right ? `[${left}, ${right}]` : '空区间'
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
})()

