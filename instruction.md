# Project Instructions

## Project Context

This repository is a Flask/Python Sudoku application being refactored from legacy starter code. The application includes a browser-based user interface implemented with HTML, CSS, and JavaScript.

## Required Features

Preserve or implement these requirements throughout the project:

- Generate Sudoku puzzles with exactly one unique solution.
- Support Easy, Medium, and Hard difficulty levels.
- Keep prefilled cells locked so users cannot edit them.
- Give immediate feedback for invalid moves.
- Provide Check Solution functionality.
- Provide Hint functionality.
- Include a game timer.
- Maintain a Top 10 leaderboard using browser `localStorage`.
- Support light mode and dark mode.
- Provide a responsive desktop and mobile layout.
- Use alternating colors for the 3x3 Sudoku regions.

## Coding Priorities

Favor the following qualities, in this order when trade-offs arise:

1. Readable Python and JavaScript.
2. Small, focused, reusable functions.
3. Clear separation between game logic and UI behavior.
4. Minimal unnecessary dependencies.
5. Maintainable code that is easy to test and extend.
6. Defensive error handling at application and browser boundaries.
7. Accessible UI behavior and semantics wherever practical.

## Architecture Guidelines

- Keep Sudoku generation, validation, solving, difficulty handling, and game-state rules independent from Flask routes and browser UI code.
- Treat the backend and frontend as separate responsibilities with clear data contracts.
- Keep DOM manipulation, event handling, rendering, and persistence separate from Sudoku algorithms.
- Prefer existing project patterns and standard-library or platform capabilities before adding dependencies.
- Do not introduce global mutable state unless the existing design requires it and the scope is clear.
- Make randomness testable where puzzle generation depends on it.
- Ensure puzzle generation verifies that the final puzzle has exactly one solution rather than assuming uniqueness.
- Validate data received from the client and handle malformed or unexpected input without exposing sensitive internals.
- Preserve public behavior and existing functionality unless a requested change intentionally alters it.

## Change Workflow

Before making any application-code change:

1. Inspect the relevant files and identify the code path that owns the behavior.
2. State the concrete change you intend to make and why.
3. Describe the smallest useful validation or test for that change.
4. Wait for approval when the change is significant, cross-cutting, destructive, dependency-related, or likely to alter public behavior.

For each approved change:

- Modify only the files necessary for the requested behavior.
- Prefer small, testable edits over broad rewrites.
- Keep unrelated user changes intact.
- Explain unfamiliar code, algorithms, or design decisions briefly.
- Call out trade-offs, assumptions, and residual risks when they matter.
- Run the narrowest relevant validation after editing, then broaden validation only as needed.
- Report what changed and what was verified.

A significant change includes, but is not limited to:

- Changing puzzle-generation or solution-counting algorithms.
- Changing the backend/frontend data contract.
- Adding or replacing a dependency.
- Restructuring multiple modules.
- Changing persistence, leaderboard behavior, or user-visible game rules.
- Making broad styling or accessibility changes across the application.

## Testing Expectations

When adding or changing behavior, prefer focused tests for:

- Sudoku validity and solution uniqueness.
- Difficulty-specific puzzle characteristics.
- Locked-cell enforcement.
- Move validation and immediate invalid-move feedback.
- Check Solution and Hint behavior.
- Timer state transitions.
- Leaderboard sorting, limiting to 10 entries, and malformed `localStorage` data.
- Light/dark mode and responsive behavior where practical.
- Flask route responses and invalid request handling.

Do not claim a behavior is verified unless an appropriate test, static check, or manual validation was actually performed.

## Communication Format

For every proposed change:

1. **Intent:** What will change.
2. **Reason:** Why it is needed and which requirement it supports.
3. **Scope:** Files or components expected to change.
4. **Validation:** The focused check that will be run.
5. **Trade-offs:** Any meaningful alternatives, limitations, or risks.

Keep explanations concise, but explain unfamiliar algorithms such as backtracking, solution counting, puzzle removal, or difficulty scoring when they are introduced or modified.

## Scope Boundary

This file defines how assistance should be provided for this Sudoku refactoring project. Do not modify application code, tests, configuration, dependencies, or unrelated documentation unless the user explicitly requests and approves that work.
