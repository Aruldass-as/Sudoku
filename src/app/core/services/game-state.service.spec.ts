import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameStateService } from './game-state.service';
import { SugokuApiService } from './sugoku-api.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GameStateService, SugokuApiService]
    });
    service = TestBed.inject(GameStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial idle status', () => {
    expect(service.status()).toBe('idle');
  });

  it('should have empty board initially', () => {
    expect(service.board().length).toBe(0);
  });
});
