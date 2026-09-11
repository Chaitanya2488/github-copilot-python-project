import app as app_module


def test_index_serves_game_page(client):
    response = client.get('/')

    assert response.status_code == 200
    assert b'<title>Sudoku Game</title>' in response.data
    assert b'id="sudoku-board"' in response.data


def test_new_returns_default_puzzle_with_35_clues(client):
    response = client.get('/new')

    assert response.status_code == 200
    data = response.get_json()
    puzzle = data['puzzle']
    assert sum(value != 0 for row in puzzle for value in row) == 35
    assert data['solution'] == app_module.CURRENT['solution']


def test_new_honors_clues_query_parameter(client):
    response = client.get('/new?clues=40')

    assert response.status_code == 200
    puzzle = response.get_json()['puzzle']
    assert sum(value != 0 for row in puzzle for value in row) == 40


def test_new_honors_difficulty_query_parameter(client):
    response = client.get('/new?difficulty=easy')

    assert response.status_code == 200
    data = response.get_json()
    assert data['difficulty'] == 'easy'
    assert data['clues'] == 40


def test_new_rejects_unknown_difficulty(client):
    response = client.get('/new?difficulty=expert')

    assert response.status_code == 400
    assert response.get_json() == {'error': 'Unknown difficulty'}


def test_check_without_game_returns_error(client):
    response = client.post('/check', json={'board': [[0] * 9 for _ in range(9)]})

    assert response.status_code == 400
    assert response.get_json() == {'error': 'No game in progress'}


def test_check_reports_no_incorrect_cells_for_solution(client):
    solution = [[1, 2, 3, 4, 5, 6, 7, 8, 9] for _ in range(9)]
    puzzle = [[0] * 9 for _ in range(9)]
    app_module.CURRENT['puzzle'] = puzzle
    app_module.CURRENT['solution'] = solution

    response = client.post('/check', json={'board': solution})

    assert response.status_code == 200
    assert response.get_json() == {'incorrect': []}


def test_check_reports_coordinates_that_differ_from_solution(client):
    solution = [[1] * 9 for _ in range(9)]
    board = [[1] * 9 for _ in range(9)]
    board[2][4] = 9
    app_module.CURRENT['puzzle'] = [[0] * 9 for _ in range(9)]
    app_module.CURRENT['solution'] = solution

    response = client.post('/check', json={'board': board})

    assert response.status_code == 200
    assert response.get_json() == {'incorrect': [[2, 4]]}