import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnScreenComponent } from './on-screen.component';

describe('OnScreenComponent', () => {
  let component: OnScreenComponent;
  let fixture: ComponentFixture<OnScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
