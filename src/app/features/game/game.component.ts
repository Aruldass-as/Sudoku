import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import type { Difficulty } from '../../core/types/sudoku.types';
import { SudokuBoardComponent } from './sudoku-board/sudoku-board.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, SudokuBoardComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit {

  readonly gameState = inject(GameStateService);
  readonly board = this.gameState.board;
  readonly initialBoard = this.gameState.initialBoard;
  readonly status = this.gameState.status;
  readonly message = this.gameState.message;
  readonly isLoading = this.gameState.isLoading;
  readonly isPlaying = this.gameState.isPlaying;
  readonly isSolved = this.gameState.isSolved;

  readonly difficulties: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'random', label: 'Random' }
  ];

  selectedDifficulty: Difficulty = 'random';

  ngOnInit(): void {
    this.startGame();
  }

  startGame(): void {
    this.gameState.loadBoard(this.selectedDifficulty);
  }

  validate(): void {
    this.gameState.validate();
  }

  solve(): void {
    this.gameState.solve();
  }

  reset(): void {
    this.gameState.reset();
  }
}
