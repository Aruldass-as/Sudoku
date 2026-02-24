import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, timeout } from 'rxjs';
import type {
  Board,
  BoardResponse,
  Difficulty,
  SolveResponse,
  ValidateResponse
} from '../types/sudoku.types';

const API_BASE = 'https://sugoku.onrender.com';

@Injectable({ providedIn: 'root' })
export class SugokuApiService {
  constructor(private http: HttpClient) {}

  private encodeBoard(board: Board): string {
    return board.reduce(
      (result, row, i) =>
        result + `%5B${encodeURIComponent(row.toString())}%5D${i === board.length - 1 ? '' : '%2C'}`,
      ''
    );
  }

  private encodeParams(params: { board: Board }): string {
    return `board=%5B${this.encodeBoard(params.board)}%5D`;
  }

  getBoard(difficulty: Difficulty = 'random'): Observable<Board> {
    return this.http
      .get<BoardResponse>(`${API_BASE}/board?difficulty=${difficulty}`)
      .pipe(
        timeout(90000),
        map((res) => (Array.isArray(res?.board) ? res.board : [])),
        catchError((err) => {
          console.error('Failed to fetch board:', err);
          return of([]);
        })
      );
  }

  validate(board: Board): Observable<ValidateResponse> {
    const body = this.encodeParams({ board });
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http
      .post<ValidateResponse>(`${API_BASE}/validate`, body, { headers })
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Validation failed:', err);
          return of({ status: 'broken' as const });
        })
      );
  }

  solve(board: Board): Observable<SolveResponse> {
    const body = this.encodeParams({ board });
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    return this.http
      .post<SolveResponse>(`${API_BASE}/solve`, body, { headers })
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Solve failed:', err);
          return of({
            difficulty: 'random' as Difficulty,
            solution: board,
            status: 'unsolvable' as const
          });
        })
      );
  }
}
