import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Board } from '../../../core/types/sudoku.types';

@Component({
  selector: 'app-sudoku-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sudoku-board.component.html',
  styleUrl: './sudoku-board.component.scss'
})
export class SudokuBoardComponent {
  board = input.required<Board>();
  initialBoard = input.required<Board>();
  disabled = input(false);

  cellChange = output<{ row: number; col: number; value: number }>();

  readonly selectedCell = signal<{ row: number; col: number } | null>(null);

  readonly rows = computed(() => {
    const b = this.board();
    return Array.from({ length: 9 }, (_, i) => i);
  });

  readonly cols = computed(() => Array.from({ length: 9 }, (_, i) => i));

  isFixed(row: number, col: number): boolean {
    const initial = this.initialBoard();
    return (initial[row]?.[col] ?? 0) !== 0;
  }

  getCellValue(row: number, col: number): number {
    return this.board()[row]?.[col] ?? 0;
  }

  selectCell(row: number, col: number): void {
    if (this.disabled() || this.isFixed(row, col)) return;
    this.selectedCell.set({ row, col });
  }

  onInput(event: Event, row: number, col: number): void {
    if (this.disabled() || this.isFixed(row, col)) return;
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    const value = raw === '' ? 0 : Math.min(9, Math.max(1, parseInt(raw, 10)));
    input.value = value === 0 ? '' : String(value);
    this.cellChange.emit({ row, col, value });
  }

  onKeydown(event: KeyboardEvent, row: number, col: number): void {
    if (this.disabled()) return;
    const key = event.key;
    if (key >= '1' && key <= '9') return;
    if (key === 'Backspace' || key === 'Delete') {
      if (!this.isFixed(row, col)) {
        this.cellChange.emit({ row, col, value: 0 });
      }
      event.preventDefault();
      return;
    }
    if (key === 'ArrowUp' && row > 0) {
      this.selectCell(row - 1, col);
      event.preventDefault();
    } else if (key === 'ArrowDown' && row < 8) {
      this.selectCell(row + 1, col);
      event.preventDefault();
    } else if (key === 'ArrowLeft' && col > 0) {
      this.selectCell(row, col - 1);
      event.preventDefault();
    } else if (key === 'ArrowRight' && col < 8) {
      this.selectCell(row, col + 1);
      event.preventDefault();
    }
  }
}
