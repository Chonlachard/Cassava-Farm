import { TestBed } from '@angular/core/testing';

import { ExpensesDetailService } from './expenses-detail.service';

describe('ExpensesDetailService', () => {
  let service: ExpensesDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpensesDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
