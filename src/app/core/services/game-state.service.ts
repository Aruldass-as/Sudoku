import { Injectable, signal, computed } from '@angular/core';
import type { Board, Difficulty } from '../types/sudoku.types';
import { SugokuApiService } from './sugoku-api.service';

export type GameStatus = 'idle' | 'loading' | 'playing' | 'solved' | 'broken' | 'unsolvable';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly boardSignal = signal<Board>([]);
  private readonly initialBoardSignal = signal<Board>([]);
  private readonly difficultySignal = signal<Difficulty>('random');
  private readonly statusSignal = signal<GameStatus>('idle');
  private readonly messageSignal = signal<string>('');

  readonly board = this.boardSignal.asReadonly();
  readonly initialBoard = this.initialBoardSignal.asReadonly();
  readonly difficulty = this.difficultySignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();

  readonly isPlaying = computed(() => this.statusSignal() === 'playing');
  readonly isSolved = computed(() => this.statusSignal() === 'solved');
  readonly isLoading = computed(() => this.statusSignal() === 'loading');

  constructor(private api: SugokuApiService) {}

  loadBoard(difficulty: Difficulty): void {
    this.statusSignal.set('loading');
    this.messageSignal.set('');
    this.difficultySignal.set(difficulty);

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

    this.boardSignal.update((board) => {
      const next = board.map((r) => [...r]);
      next[row] = [...next[row]];
      next[row][col] = value;
      return next;
    });
    this.statusSignal.set('playing');
    this.messageSignal.set('');
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
  }

  clearMessage(): void {
    this.messageSignal.set('');
  }
}
