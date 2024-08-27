import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddexpensesComponent } from './addexpenses.component';

describe('AddexpensesComponent', () => {
  let component: AddexpensesComponent;
  let fixture: ComponentFixture<AddexpensesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddexpensesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddexpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
