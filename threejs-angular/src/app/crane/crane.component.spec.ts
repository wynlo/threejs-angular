import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CraneComponent } from './crane.component';

describe('CraneComponent', () => {
  let component: CraneComponent;
  let fixture: ComponentFixture<CraneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CraneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CraneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
