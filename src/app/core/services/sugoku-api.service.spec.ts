import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SugokuApiService } from './sugoku-api.service';

describe('SugokuApiService', () => {
  let service: SugokuApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SugokuApiService]
    });
    service = TestBed.inject(SugokuApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch board for given difficulty', () => {
    const mockBoard = [[0, 0, 0, 0, 0, 0, 0, 0, 0]];
    service.getBoard('easy').subscribe((board) => {
      expect(board).toEqual(mockBoard);
    });

    const req = httpMock.expectOne(
      (r) => r.url.includes('/board') && r.url.includes('difficulty=easy')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ board: mockBoard });
  });

  it('should validate board', () => {
    const board = [[1, 2, 3, 4, 5, 6, 7, 8, 9]];
    service.validate(board).subscribe((res) => {
      expect(res.status).toBe('solved');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/validate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe(
      'application/x-www-form-urlencoded'
    );
    req.flush({ status: 'solved' });
  });

  it('should solve board', () => {
    const board = [[0, 0, 0, 0, 0, 0, 0, 0, 0]];
    const solution = [[1, 2, 3, 4, 5, 6, 7, 8, 9]];
    service.solve(board).subscribe((res) => {
      expect(res.status).toBe('solved');
      expect(res.solution).toEqual(solution);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/solve'));
    expect(req.request.method).toBe('POST');
    req.flush({ difficulty: 'easy', solution, status: 'solved' });
  });
});
