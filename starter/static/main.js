// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudokuLeaderboard';
const THEME_KEY = 'sudokuTheme';
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
let puzzle = [];
let board = [];
let solution = [];
let hintCount = 0;
let currentDifficulty = 'medium';
let gameCompleted = false;
let timerId = null;
let timerStartedAt = 0;
let elapsedSeconds = 0;
const hintedCells = new Set();

function loadSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    // The theme still applies for this page even when storage is unavailable.
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  saveTheme(theme);
  const toggle = document.getElementById('theme-toggle');
  toggle.innerText = theme === 'dark' ? 'Light mode' : 'Dark mode';
  toggle.setAttribute('aria-pressed', theme === 'dark');
}

function initializeTheme() {
  const savedTheme = loadSavedTheme();
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systemTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme;
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function isValidScore(score) {
  return score &&
    typeof score.name === 'string' && score.name.trim() !== '' &&
    Number.isFinite(score.timeSeconds) && score.timeSeconds >= 0 &&
    DIFFICULTIES.has(score.difficulty) &&
    Number.isInteger(score.hints) && score.hints >= 0 &&
    typeof score.completedAt === 'string';
}

function compareScores(first, second) {
  return first.timeSeconds - second.timeSeconds ||
    first.hints - second.hints ||
    first.completedAt.localeCompare(second.completedAt);
}

function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (!stored) return [];
    const scores = JSON.parse(stored);
    if (!Array.isArray(scores)) return [];
    return scores.filter(isValidScore).sort(compareScores).slice(0, 10);
  } catch (error) {
    return [];
  }
}

function saveLeaderboard(scores) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores.slice(0, 10)));
  } catch (error) {
    // Storage can be unavailable or full; gameplay should still work.
  }
}

function addLeaderboardScore(score) {
  const scores = loadLeaderboard();
  scores.push(score);
  scores.sort(compareScores);
  saveLeaderboard(scores);
  return scores.slice(0, 10);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function renderLeaderboard() {
  const leaderboard = document.getElementById('leaderboard');
  const body = leaderboard.querySelector('tbody');
  const emptyState = document.getElementById('leaderboard-empty');
  body.innerHTML = '';
  const scores = loadLeaderboard();
  emptyState.hidden = scores.length !== 0;
  scores.forEach((score, index) => {
    const row = document.createElement('tr');
    [
      index + 1,
      score.name,
      formatTime(score.timeSeconds),
      score.difficulty,
      score.hints,
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

function recordCompletedGame() {
  if (gameCompleted) return;
  const name = window.prompt('Enter your name for the leaderboard:');
  if (!name || !name.trim()) return;

  addLeaderboardScore({
    name: name.trim(),
    timeSeconds: elapsedSeconds,
    difficulty: currentDifficulty,
    hints: hintCount,
    completedAt: new Date().toISOString(),
  });
  gameCompleted = true;
  renderLeaderboard();
}

function cellKey(row, col) {
  return `${row},${col}`;
}

function hasConflict(row, col) {
  const value = board[row][col];
  if (!value) return false;

  for (let index = 0; index < SIZE; index++) {
    if (index !== col && board[row][index] === value) return true;
    if (index !== row && board[index][col] === value) return true;
  }

  const boxRow = row - row % 3;
  const boxCol = col - col % 3;
  for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
    for (let colOffset = 0; colOffset < 3; colOffset++) {
      const boxRowIndex = boxRow + rowOffset;
      const boxColIndex = boxCol + colOffset;
      if ((boxRowIndex !== row || boxColIndex !== col) &&
          board[boxRowIndex][boxColIndex] === value) {
        return true;
      }
    }
  }
  return false;
}

function updateCellClasses(input, row, col) {
  const region = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const classes = ['sudoku-cell', `region-${region}`];
  const key = cellKey(row, col);
  if (puzzle[row][col] !== 0) {
    classes.push('prefilled');
  } else if (hintedCells.has(key)) {
    classes.push('hinted');
  } else if (board[row][col] !== 0) {
    classes.push('player-entry');
  }
  if (hasConflict(row, col)) classes.push('invalid');
  input.className = classes.join(' ');
}

function updateBoardFeedback() {
  const inputs = document.getElementById('sudoku-board').getElementsByTagName('input');
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      updateCellClasses(inputs[row * SIZE + col], row, col);
    }
  }
}

function updateHintCount() {
  document.getElementById('hint-count').innerText = `Hints: ${hintCount}`;
}

function showMessage(text, type = '') {
  const message = document.getElementById('message');
  message.innerText = text;
  message.className = type ? `message-${type}` : '';
}

function updateTimerDisplay() {
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
  document.getElementById('timer').innerText = `Time: ${minutes}:${seconds}`;
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  timerStartedAt = Date.now();
  updateTimerDisplay();
  timerId = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - timerStartedAt) / 1000);
    updateTimerDisplay();
  }, 250);
}

function readBoardFromInputs() {
  const inputs = document.getElementById('sudoku-board').getElementsByTagName('input');
  const currentBoard = [];
  for (let row = 0; row < SIZE; row++) {
    currentBoard[row] = [];
    for (let col = 0; col < SIZE; col++) {
      const value = inputs[row * SIZE + col].value;
      currentBoard[row][col] = value ? Number(value) : 0;
    }
  }
  return currentBoard;
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        const row = Number(e.target.dataset.row);
        const col = Number(e.target.dataset.col);
        if (puzzle[row][col] !== 0) {
          e.target.value = puzzle[row][col];
          board[row][col] = puzzle[row][col];
          return;
        }
        if (hintedCells.has(cellKey(row, col))) {
          e.target.value = solution[row][col];
          board[row][col] = solution[row][col];
          return;
        }
        board[row][col] = val ? Number(val) : 0;
        updateBoardFeedback();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  board = puzzle.map((row) => [...row]);
  hintedCells.clear();
  hintCount = 0;
  gameCompleted = false;
  updateHintCount();
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
      } else {
        inp.value = '';
        inp.disabled = false;
      }
      updateCellClasses(inp, i, j);
    }
  }
}

function giveHint() {
  const message = document.getElementById('message');
  if (!solution.length) {
    showMessage('Start a game before requesting a hint.');
    return;
  }

  const emptyCells = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) emptyCells.push([row, col]);
    }
  }

  if (emptyCells.length === 0) {
    showMessage('There are no empty cells left.');
    return;
  }

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const key = cellKey(row, col);
  board[row][col] = solution[row][col];
  hintedCells.add(key);
  hintCount += 1;

  const input = document.querySelector(
    `input[data-row="${row}"][data-col="${col}"]`
  );
  input.value = solution[row][col];
  input.disabled = true;
  updateCellClasses(input, row, col);
  updateHintCount();
  showMessage('A hint has been added.');
}

async function newGame() {
  const difficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  if (data.error) {
    showMessage(data.error, 'error');
    return;
  }
  renderPuzzle(data.puzzle);
  solution = data.solution;
  currentDifficulty = data.difficulty;
  resetTimer();
  showMessage('');
}

async function checkSolution() {
  const inputs = document.getElementById('sudoku-board').getElementsByTagName('input');
  board = readBoardFromInputs();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    showMessage(data.error, 'error');
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  updateBoardFeedback();
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    if (incorrect.has(idx)) {
      inp.classList.add('incorrect');
    }
  }
  if (incorrect.size === 0) {
    stopTimer();
    recordCompletedGame();
    showMessage('Congratulations! You solved it!', 'success');
  } else {
    showMessage('Some cells are incorrect or incomplete.', 'error');
  }
}

// Wire buttons
window.addEventListener('load', () => {
  initializeTheme();
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint').addEventListener('click', giveHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  renderLeaderboard();
  // initialize
  newGame();
});