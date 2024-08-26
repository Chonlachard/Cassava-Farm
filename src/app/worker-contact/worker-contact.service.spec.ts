import { TestBed } from '@angular/core/testing';

import { WorkerContactService } from './worker-contact.service';

describe('WorkerContactService', () => {
  let service: WorkerContactService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkerContactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
