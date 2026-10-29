import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPluginForm } from './admin-plugin-form';

describe('AdminPluginForm', () => {
  let component: AdminPluginForm;
  let fixture: ComponentFixture<AdminPluginForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPluginForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPluginForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
