import { TestBed } from '@angular/core/testing';

import { CassavaAreaServiceService } from './cassava-area-service.service';

describe('CassavaAreaServiceService', () => {
  let service: CassavaAreaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CassavaAreaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
