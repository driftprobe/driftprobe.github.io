// The hero replays the repo's demo API: 42 of 50 prices become null while the status never changes.
const TOTAL_ITEMS = 50;
const SURVIVING_ITEMS = 8;
const CONTRACT_COVERAGE = 90;
const FLIP_INTERVAL_MS = 130;
const START_DELAY_MS = 700;
const COPY_FEEDBACK_MS = 1800;
const SHUFFLE_SEED = 7;

function shuffled(values, seed) {
  const result = [...values];
  let state = seed;
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function setupDemo() {
  const sheet = document.getElementById('sheet');
  const cells = [...document.querySelectorAll('#wall .cell')];
  const gauge = document.getElementById('gauge');
  const verdict = document.getElementById('verdict');
  const replay = document.getElementById('replay');
  if (cells.length !== TOTAL_ITEMS) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    replay.hidden = true;
    return;
  }

  const flipOrder = shuffled(cells.slice(SURVIVING_ITEMS), SHUFFLE_SEED);
  let timer = null;

  const show = (remaining) => {
    const coverage = Math.round((remaining / TOTAL_ITEMS) * 100);
    gauge.textContent = `${coverage}%`;
    sheet.classList.toggle('is-broken', coverage < CONTRACT_COVERAGE);
  };

  const reset = () => {
    clearTimeout(timer);
    cells.forEach((cell) => cell.classList.remove('is-null'));
    verdict.classList.add('is-hidden');
    show(TOTAL_ITEMS);
  };

  const flip = (index) => {
    if (index === flipOrder.length) {
      verdict.classList.remove('is-hidden');
      return;
    }
    flipOrder[index].classList.add('is-null');
    show(TOTAL_ITEMS - index - 1);
    timer = setTimeout(() => flip(index + 1), FLIP_INTERVAL_MS);
  };

  const play = () => {
    reset();
    timer = setTimeout(() => flip(0), START_DELAY_MS);
  };

  replay.addEventListener('click', play);

  if (!('IntersectionObserver' in window)) return;
  reset();
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    play();
  }, { threshold: 0.35 });
  observer.observe(document.getElementById('wall'));
}

function setupCopy() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const state = button.querySelector('.copy-state');
    const idleLabel = state.textContent;
    let timer = null;

    const say = (label, isDone) => {
      state.textContent = label;
      button.classList.toggle('is-done', isDone);
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.textContent = idleLabel;
        button.classList.remove('is-done');
      }, COPY_FEEDBACK_MS);
    };

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        say('copied', true);
      } catch {
        say('select it', false);
      }
    });
  });
}

setupDemo();
setupCopy();
