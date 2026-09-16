/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import LoginView from '../src/features/auth/views/LoginView.vue';
import { authApi } from '../src/api/auth.api';
import apiClient from '../src/api/client';
import * as firebaseAuth from 'firebase/auth';

/**
 * @vitest-environment jsdom
 */

const mockPush = vi.fn();
const mockSendMagicLink = vi.fn();
const mockCompleteMagicLinkLogin = vi.fn();
const mockLogout = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {} }),
}));

vi.mock('../src/features/auth/stores/authStore', () => ({
  useAuthStore: () => ({
    sendMagicLink: mockSendMagicLink,
    completeMagicLinkLogin: mockCompleteMagicLinkLogin,
    logout: mockLogout,
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock('firebase/auth', () => ({
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../src/shared/firebase/config', () => ({
  auth: {},
}));

vi.mock('../src/api/auth.api', () => ({
  authApi: {
    validateEmail: vi.fn(),
  },
}));

vi.mock('../src/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('LoginView.vue with Magic Link Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(false);
  });

  it('blocks sending magic link and displays error if email is not registered or not active', async () => {
    // ARRANGE
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: false,
      active: false,
    });

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('invalido@fondo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(authApi.validateEmail).toHaveBeenCalledWith('invalido@fondo.com');
    expect(mockSendMagicLink).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.',
    );
  });

  it('blocks sending magic link and displays error if member exists but is inactive', async () => {
    // ARRANGE
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: true,
      active: false,
    });

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('inactivo@fondo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(authApi.validateEmail).toHaveBeenCalledWith('inactivo@fondo.com');
    expect(mockSendMagicLink).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.',
    );
  });

  it('sends magic link and shows confirmation view when email belongs to an active member', async () => {
    // ARRANGE
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: true,
      active: true,
    });
    mockSendMagicLink.mockResolvedValue(undefined);

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('activo@fondo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(authApi.validateEmail).toHaveBeenCalledWith('activo@fondo.com');
    expect(mockSendMagicLink).toHaveBeenCalledWith('activo@fondo.com');
    expect(wrapper.text()).toContain('Revisa tu correo');
    expect(wrapper.text()).toContain('activo@fondo.com');
    expect(wrapper.text()).toContain('Reenviar enlace en 60s');
  });

  it('handles rate limiting (429) gracefully when sending magic link', async () => {
    // ARRANGE
    const error429 = { response: { status: 429 } };
    vi.mocked(authApi.validateEmail).mockRejectedValue(error429);

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('activo@fondo.com');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(authApi.validateEmail).toHaveBeenCalledWith('activo@fondo.com');
    expect(mockSendMagicLink).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.',
    );
  });

  it('automatically completes login when landing on magic link with email in localStorage', async () => {
    // ARRANGE
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
    window.localStorage.setItem('emailForSignIn', 'activo@fondo.com');
    mockCompleteMagicLinkLogin.mockResolvedValue({ email: 'activo@fondo.com' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    // ACT
    mount(LoginView);
    await flushPromises();

    // ASSERT
    expect(mockCompleteMagicLinkLogin).toHaveBeenCalledWith(
      window.location.href,
      'activo@fondo.com',
    );
    expect(apiClient.get).toHaveBeenCalledWith('/v2/dashboard');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows confirmation modal when landing on magic link without email in localStorage and logs in after confirming', async () => {
    // ARRANGE
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
    // localStorage is empty
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: true,
      active: true,
    });
    mockCompleteMagicLinkLogin.mockResolvedValue({ email: 'otro@fondo.com' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    // ACT
    const wrapper = mount(LoginView);
    await flushPromises();

    // ASSERT modal is displayed
    expect(wrapper.text()).toContain('Confirmar Correo Electrónico');
    expect(mockCompleteMagicLinkLogin).not.toHaveBeenCalled();

    // Submit confirmation email
    await wrapper.find('#confirm-email').setValue('otro@fondo.com');
    await wrapper.find('dialog form').trigger('submit.prevent');
    await flushPromises();

    expect(authApi.validateEmail).toHaveBeenCalledWith('otro@fondo.com');
    expect(mockCompleteMagicLinkLogin).toHaveBeenCalledWith(
      window.location.href,
      'otro@fondo.com',
    );
    expect(apiClient.get).toHaveBeenCalledWith('/v2/dashboard');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles invalid or expired magic link on landing', async () => {
    // ARRANGE
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
    window.localStorage.setItem('emailForSignIn', 'activo@fondo.com');
    const expiredError = { code: 'auth/invalid-action-code' };
    mockCompleteMagicLinkLogin.mockRejectedValue(expiredError);

    // ACT
    const wrapper = mount(LoginView);
    await flushPromises();

    // ASSERT
    expect(wrapper.text()).toContain(
      'El enlace de acceso no es válido o ha expirado. Por favor, solicita uno nuevo.',
    );
  });
});

