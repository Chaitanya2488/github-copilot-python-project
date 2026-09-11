import copy
import random

SIZE = 9
EMPTY = 0

DIFFICULTY_CLUES = {
    'easy': 40,
    'medium': 35,
    'hard': 30,
}
MAX_GENERATION_ATTEMPTS = 5

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def _find_empty_cell_with_fewest_candidates(board):
    best_cell = None
    best_candidates = None

    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] != EMPTY:
                continue

            candidates = [
                num for num in range(1, SIZE + 1)
                if is_safe(board, row, col, num)
            ]
            if best_candidates is None or len(candidates) < len(best_candidates):
                best_cell = (row, col)
                best_candidates = candidates
                if not candidates:
                    return best_cell, best_candidates

    return best_cell, best_candidates

def count_solutions(board, limit=2):
    if limit < 1:
        raise ValueError('Solution count limit must be positive')

    row_col, candidates = _find_empty_cell_with_fewest_candidates(board)
    if row_col is None:
        return 1
    if not candidates:
        return 0

    row, col = row_col
    solution_count = 0
    for candidate in candidates:
        board[row][col] = candidate
        solution_count += count_solutions(board, limit)
        board[row][col] = EMPTY
        if solution_count >= limit:
            return limit

    return solution_count

def remove_cells(board, clues):
    coordinates = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(coordinates)
    remaining_clues = sum(value != EMPTY for row in board for value in row)

    for row, col in coordinates:
        if remaining_clues <= clues:
            break
        if board[row][col] == EMPTY:
            continue

        original_value = board[row][col]
        board[row][col] = EMPTY
        if count_solutions(board, limit=2) == 1:
            remaining_clues -= 1
        else:
            board[row][col] = original_value

def generate_puzzle(clues=35, difficulty=None):
    if difficulty is not None:
        try:
            clues = DIFFICULTY_CLUES[difficulty.lower()]
        except (AttributeError, KeyError):
            raise ValueError('Unknown difficulty')

    if not 0 <= clues <= SIZE * SIZE:
        raise ValueError('Clues must be between 0 and 81')

    for _ in range(MAX_GENERATION_ATTEMPTS):
        board = create_empty_board()
        fill_board(board)
        solution = deep_copy(board)
        remove_cells(board, clues)
        if sum(value != EMPTY for row in board for value in row) == clues:
            return deep_copy(board), solution

    raise RuntimeError('Unable to generate puzzle at requested difficulty')
