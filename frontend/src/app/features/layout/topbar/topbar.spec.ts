import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Topbar } from './topbar';
import { AuthService } from '../../../core/services/auth-service';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('redirige al inicio de sesión después de cerrar sesión', () => {
    const router = TestBed.inject(Router);
    const authService = TestBed.inject(AuthService);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const logout = vi.spyOn(authService, 'logout');

    component.logout();

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/auth/sign-in'], {
      replaceUrl: true,
    });
  });
});
