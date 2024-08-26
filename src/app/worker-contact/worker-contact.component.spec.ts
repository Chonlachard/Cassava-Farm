import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerContactComponent } from './worker-contact.component';

describe('WorkerContactComponent', () => {
  let component: WorkerContactComponent;
  let fixture: ComponentFixture<WorkerContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkerContactComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
