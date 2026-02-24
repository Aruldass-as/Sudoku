# Sudoku

A production-ready Sudoku solving application built with Angular 19, featuring the Sugoku API for puzzle generation, validation, and solving.

## Features

- **Difficulty selection**: Easy, Medium, Hard, or Random
- **Interactive board**: Enter numbers in empty cells (pre-filled cells are read-only)
- **Validate**: Check if your solution is correct
- **Solve**: Auto-solve the puzzle
- **Reset**: Clear your entries and start over
- **Responsive design**: Optimized for desktop and mobile
- **Dark mode**: Automatically follows system preference

## API

Uses the [Sugoku API](https://github.com/bertoort/sugoku):

- `GET https://sugoku.onrender.com/board?difficulty={easy|medium|hard|random}` - Generate a new puzzle
- `POST https://sugoku.onrender.com/validate` - Validate the current board
- `POST https://sugoku.onrender.com/solve` - Solve the puzzle

> **Note**: The API is hosted on Render's free tier. The first request after inactivity may take ~50 seconds while the server spins up.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Build

```bash
npm run build
```

Output is in `dist/sudoku-app/`.

## Testing

```bash
npm test
```

## Tech Stack

- Angular 19 (standalone components, signals)
- RxJS for async operations
- SCSS with CSS variables for theming
- Sugoku API for puzzle logic
