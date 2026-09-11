import sudoku_logic


def assert_complete_valid_board(board):
    expected_values = set(range(1, sudoku_logic.SIZE + 1))

    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(set(row) == expected_values for row in board)

    for column in range(sudoku_logic.SIZE):
        assert {board[row][column] for row in range(sudoku_logic.SIZE)} == expected_values

    for box_row in range(0, sudoku_logic.SIZE, 3):
        for box_col in range(0, sudoku_logic.SIZE, 3):
            values = {
                board[row][column]
                for row in range(box_row, box_row + 3)
                for column in range(box_col, box_col + 3)
            }
            assert values == expected_values


def test_create_empty_board_returns_nine_by_nine_zero_board():
    board = sudoku_logic.create_empty_board()

    assert board == [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]


def test_deep_copy_is_independent():
    board = [[1, 2], [3, 4]]

    copied_board = sudoku_logic.deep_copy(board)
    copied_board[0][0] = 9

    assert board[0][0] == 1
    assert copied_board[0][0] == 9


def test_is_safe_accepts_candidate_with_no_conflicts():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.is_safe(board, 0, 0, 1)


def test_is_safe_rejects_row_column_and_box_conflicts():
    board = sudoku_logic.create_empty_board()
    board[0][1] = 1
    assert not sudoku_logic.is_safe(board, 0, 0, 1)

    board = sudoku_logic.create_empty_board()
    board[1][0] = 1
    assert not sudoku_logic.is_safe(board, 0, 0, 1)

    board = sudoku_logic.create_empty_board()
    board[1][1] = 1
    assert not sudoku_logic.is_safe(board, 0, 0, 1)


def test_fill_board_creates_complete_valid_board():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.fill_board(board)
    assert_complete_valid_board(board)


def test_remove_cells_leaves_requested_number_of_clues():
    board = sudoku_logic.create_empty_board()
    assert sudoku_logic.fill_board(board)

    sudoku_logic.remove_cells(board, clues=35)

    assert sum(value != sudoku_logic.EMPTY for row in board for value in row) == 35


def test_count_solutions_stops_at_requested_limit():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.count_solutions(board, limit=2) == 2


def test_count_solutions_does_not_mutate_board():
    board = sudoku_logic.create_empty_board()
    original = sudoku_logic.deep_copy(board)

    sudoku_logic.count_solutions(board)

    assert board == original


def test_generate_puzzle_returns_matching_puzzle_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle()

    assert_complete_valid_board(solution)
    assert len(puzzle) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert sum(value != sudoku_logic.EMPTY for row in puzzle for value in row) == 35
    assert all(
        puzzle[row][column] in (sudoku_logic.EMPTY, solution[row][column])
        for row in range(sudoku_logic.SIZE)
        for column in range(sudoku_logic.SIZE)
    )
    assert sudoku_logic.count_solutions(puzzle) == 1


def test_generate_puzzle_supports_named_difficulties():
    expected_clues = {'easy': 40, 'medium': 35, 'hard': 30}

    for difficulty, clues in expected_clues.items():
        puzzle, _ = sudoku_logic.generate_puzzle(difficulty=difficulty)

        assert sum(value != sudoku_logic.EMPTY for row in puzzle for value in row) == clues
        assert sudoku_logic.count_solutions(puzzle) == 1


def test_generate_puzzle_rejects_unknown_difficulty():
    try:
        sudoku_logic.generate_puzzle(difficulty='expert')
    except ValueError as error:
        assert str(error) == 'Unknown difficulty'
    else:
        raise AssertionError('Expected unknown difficulty to raise ValueError')


def test_generate_puzzle_rejects_invalid_clue_count():
    for clues in (-1, sudoku_logic.SIZE * sudoku_logic.SIZE + 1):
        try:
            sudoku_logic.generate_puzzle(clues)
        except ValueError as error:
            assert str(error) == 'Clues must be between 0 and 81'
        else:
            raise AssertionError('Expected invalid clue count to raise ValueError')