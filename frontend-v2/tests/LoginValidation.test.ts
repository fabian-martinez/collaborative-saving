/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import LoginView from '../src/features/auth/views/LoginView.vue';
import { authApi } from '../src/api/auth.api';
import apiClient from '../src/api/client';

/**
 * @vitest-environment jsdom
 */

const mockPush = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {} }),
}));

vi.mock('../src/features/auth/stores/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    logout: mockLogout,
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
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

describe('LoginView.vue with Email Pre-Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks login and displays error if email is not registered or not active', async () => {
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: false,
      active: false,
    });

    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('invalido@fondo.com');
    await wrapper.find('#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authApi.validateEmail).toHaveBeenCalledWith('invalido@fondo.com');
    expect(mockLogin).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.',
    );
  });

  it('blocks login and displays error if member exists but is inactive', async () => {
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: true,
      active: false,
    });

    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('inactivo@fondo.com');
    await wrapper.find('#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authApi.validateEmail).toHaveBeenCalledWith('inactivo@fondo.com');
    expect(mockLogin).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.',
    );
  });

  it('proceeds with login when email belongs to an active member', async () => {
    vi.mocked(authApi.validateEmail).mockResolvedValue({
      exists: true,
      active: true,
    });
    mockLogin.mockResolvedValue(undefined);
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('activo@fondo.com');
    await wrapper.find('#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authApi.validateEmail).toHaveBeenCalledWith('activo@fondo.com');
    expect(mockLogin).toHaveBeenCalledWith('activo@fondo.com', 'password123');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles rate limiting (429) gracefully', async () => {
    const error429 = { response: { status: 429 } };
    vi.mocked(authApi.validateEmail).mockRejectedValue(error429);

    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('activo@fondo.com');
    await wrapper.find('#password').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authApi.validateEmail).toHaveBeenCalledWith('activo@fondo.com');
    expect(mockLogin).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.',
    );
  });
});
