import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlugins } from './admin-plugins';

describe('AdminPlugins', () => {
  let component: AdminPlugins;
  let fixture: ComponentFixture<AdminPlugins>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPlugins]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPlugins);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
