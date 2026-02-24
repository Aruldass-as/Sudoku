import { Injectable, signal, computed } from '@angular/core';
import type { Board, Difficulty } from '../types/sudoku.types';
import { SugokuApiService } from './sugoku-api.service';

export type GameStatus = 'idle' | 'loading' | 'playing' | 'solved' | 'broken' | 'unsolvable';

export type PlayerId = 1 | 2;

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly boardSignal = signal<Board>([]);
  private readonly initialBoardSignal = signal<Board>([]);
  private readonly difficultySignal = signal<Difficulty>('random');
  private readonly statusSignal = signal<GameStatus>('idle');
  private readonly messageSignal = signal<string>('');
  private readonly isMultiplayerSignal = signal(false);
  private readonly cellOwnersSignal = signal<Record<string, PlayerId>>({});
  private readonly currentPlayerSignal = signal<PlayerId>(1);
  private readonly player1ScoreSignal = signal(0);
  private readonly player2ScoreSignal = signal(0);
  private readonly scoredRowsSignal = signal<Set<number>>(new Set());
  private readonly scoredColsSignal = signal<Set<number>>(new Set());

  readonly board = this.boardSignal.asReadonly();
  readonly initialBoard = this.initialBoardSignal.asReadonly();
  readonly difficulty = this.difficultySignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();
  readonly isMultiplayer = this.isMultiplayerSignal.asReadonly();
  readonly cellOwners = this.cellOwnersSignal.asReadonly();
  readonly currentPlayer = this.currentPlayerSignal.asReadonly();
  readonly player1Score = this.player1ScoreSignal.asReadonly();
  readonly player2Score = this.player2ScoreSignal.asReadonly();

  readonly isPlaying = computed(() => this.statusSignal() === 'playing');
  readonly isSolved = computed(() => this.statusSignal() === 'solved');
  readonly isLoading = computed(() => this.statusSignal() === 'loading');

  constructor(private api: SugokuApiService) {}

  loadBoard(difficulty: Difficulty, multiplayer = false): void {
    this.statusSignal.set('loading');
    this.messageSignal.set('');
    this.difficultySignal.set(difficulty);
    this.isMultiplayerSignal.set(multiplayer);
    if (multiplayer) {
      this.cellOwnersSignal.set({});
      this.currentPlayerSignal.set(1);
      this.player1ScoreSignal.set(0);
      this.player2ScoreSignal.set(0);
      this.scoredRowsSignal.set(new Set());
      this.scoredColsSignal.set(new Set());
    }

    this.api.getBoard(difficulty).subscribe({
      next: (board) => {
        const valid =
          Array.isArray(board) &&
          board.length === 9 &&
          board.every((row) => Array.isArray(row) && row.length === 9);
        if (!valid) {
          this.statusSignal.set('idle');
          this.messageSignal.set('Failed to load board. Please try again.');
          return;
        }
        this.boardSignal.set(board.map((row) => [...row]));
        this.initialBoardSignal.set(board.map((row) => [...row]));
        this.statusSignal.set('playing');
        this.messageSignal.set('');
      },
      error: () => {
        this.statusSignal.set('idle');
        this.messageSignal.set('Failed to load board. Please try again.');
      }
    });
  }

  updateCell(row: number, col: number, value: number): void {
    if (this.statusSignal() !== 'playing') return;
    const initial = this.initialBoardSignal();
    if (initial[row]?.[col] !== 0) return;

    const multiplayer = this.isMultiplayerSignal();
    const player = multiplayer ? this.currentPlayerSignal() : null;

    this.boardSignal.update((board) => {
      const next = board.map((r) => [...r]);
      next[row] = [...next[row]];
      next[row][col] = value;
      return next;
    });

    if (multiplayer && player) {
      const key = `${row},${col}`;
      if (value > 0) {
        this.cellOwnersSignal.update((owners) => ({ ...owners, [key]: player }));
        this.checkAndUpdateScores(row, col, player);
      } else {
        this.cellOwnersSignal.update((owners) => {
          const next = { ...owners };
          delete next[key];
          return next;
        });
      }
      this.currentPlayerSignal.set(player === 1 ? 2 : 1);
    }

    this.statusSignal.set('playing');
    this.messageSignal.set('');
  }

  private checkAndUpdateScores(row: number, col: number, player: PlayerId): void {
    const board = this.boardSignal();
    const scoredRows = new Set(this.scoredRowsSignal());
    const scoredCols = new Set(this.scoredColsSignal());

    const isValidSet = (values: number[]): boolean => {
      const filtered = values.filter((v) => v >= 1 && v <= 9);
      return filtered.length === 9 && new Set(filtered).size === 9;
    };

    if (!scoredRows.has(row)) {
      const rowValues = board[row] ?? [];
      if (isValidSet(rowValues)) {
        scoredRows.add(row);
        this.scoredRowsSignal.set(scoredRows);
        this.player1ScoreSignal.update((s) => (player === 1 ? s + 1 : s));
        this.player2ScoreSignal.update((s) => (player === 2 ? s + 1 : s));
      }
    }

    if (!scoredCols.has(col)) {
      const colValues = Array.from({ length: 9 }, (_, r) => board[r]?.[col] ?? 0);
      if (isValidSet(colValues)) {
        scoredCols.add(col);
        this.scoredColsSignal.set(scoredCols);
        this.player1ScoreSignal.update((s) => (player === 1 ? s + 1 : s));
        this.player2ScoreSignal.update((s) => (player === 2 ? s + 1 : s));
      }
    }
  }

  validate(): void {
    const board = this.boardSignal();
    if (board.length === 0) {
      this.messageSignal.set('No board loaded.');
      return;
    }

    this.statusSignal.set('loading');
    this.api.validate(board).subscribe((res) => {
      this.statusSignal.set(res.status);
      this.messageSignal.set(
        res.status === 'solved' ? 'Congratulations! You solved it!' : 'Some cells are incorrect.'
      );
    });
  }

  solve(): void {
    const board = this.boardSignal();
    if (board.length === 0) {
      this.messageSignal.set('No board loaded.');
      return;
    }

    this.statusSignal.set('loading');
    this.api.solve(board).subscribe((res) => {
      if (res.status === 'solved') {
        this.boardSignal.set(res.solution.map((row) => [...row]));
        this.statusSignal.set('solved');
        this.messageSignal.set('Puzzle solved!');
      } else {
        this.statusSignal.set('broken');
        this.messageSignal.set(
          res.status === 'unsolvable' ? 'Puzzle is unsolvable.' : 'Could not solve the puzzle.'
        );
      }
    });
  }

  reset(): void {
    const initial = this.initialBoardSignal();
    this.boardSignal.set(initial.map((row) => [...row]));
    this.statusSignal.set('playing');
    this.messageSignal.set('');
    if (this.isMultiplayerSignal()) {
      this.cellOwnersSignal.set({});
      this.currentPlayerSignal.set(1);
      this.player1ScoreSignal.set(0);
      this.player2ScoreSignal.set(0);
      this.scoredRowsSignal.set(new Set());
      this.scoredColsSignal.set(new Set());
    }
  }

  clearBoard(): void {
    this.boardSignal.set([]);
    this.initialBoardSignal.set([]);
    this.statusSignal.set('idle');
    this.messageSignal.set('');
    this.isMultiplayerSignal.set(false);
    this.cellOwnersSignal.set({});
    this.currentPlayerSignal.set(1);
    this.player1ScoreSignal.set(0);
    this.player2ScoreSignal.set(0);
  }

  clearMessage(): void {
    this.messageSignal.set('');
  }

  setMessage(msg: string): void {
    this.messageSignal.set(msg);
  }

}
