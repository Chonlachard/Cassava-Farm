import { TestBed } from '@angular/core/testing';

import { HarvestsService } from './harvests.service';

describe('HarvestsService', () => {
  let service: HarvestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HarvestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
