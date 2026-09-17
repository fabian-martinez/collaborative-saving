/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import LoginView from '../src/features/auth/views/LoginView.vue';
import apiClient from '../src/api/client';

/**
 * @vitest-environment jsdom
 */

const mockPush = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
let mockQuery: Record<string, string> = {};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: mockQuery }),
}));

vi.mock('../src/features/auth/stores/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    logout: mockLogout,
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock('../src/shared/firebase/config', () => ({
  auth: {},
}));

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('LoginView.vue with Email & Password Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {};
  });

  it('renders email and password inputs and submit button', () => {
    const wrapper = mount(LoginView);

    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.find('#password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toContain('Iniciar Sesión');
  });

  it('logs in successfully and redirects to /dashboard by default', async () => {
    // ARRANGE
    mockLogin.mockResolvedValue({ uid: 'user-123' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('admin@fondo.com');
    await wrapper.find('#password').setValue('Password123!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(mockLogin).toHaveBeenCalledWith('admin@fondo.com', 'Password123!');
    expect(apiClient.get).toHaveBeenCalledWith('/v2/dashboard');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to the query redirect path if provided after successful login', async () => {
    // ARRANGE
    mockQuery = { redirect: '/members' };
    mockLogin.mockResolvedValue({ uid: 'user-123' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('admin@fondo.com');
    await wrapper.find('#password').setValue('Password123!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(mockPush).toHaveBeenCalledWith('/members');
  });

  it('displays error when credentials are invalid', async () => {
    // ARRANGE
    const invalidCredError = { code: 'auth/invalid-credential' };
    mockLogin.mockRejectedValue(invalidCredError);

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('admin@fondo.com');
    await wrapper.find('#password').setValue('wrongpassword');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(wrapper.text()).toContain('Correo electrónico o contraseña incorrectos.');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays error and logs out if backend returns 401 unauthorized (user not registered or inactive)', async () => {
    // ARRANGE
    mockLogin.mockResolvedValue({ uid: 'user-123' });
    const error401 = { response: { status: 401 } };
    vi.mocked(apiClient.get).mockRejectedValue(error401);

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('inactivo@fondo.com');
    await wrapper.find('#password').setValue('Password123!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(mockLogout).toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.',
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays error when rate limited by Firebase', async () => {
    // ARRANGE
    const rateLimitError = { code: 'auth/too-many-requests' };
    mockLogin.mockRejectedValue(rateLimitError);

    // ACT
    const wrapper = mount(LoginView);
    await wrapper.find('#email').setValue('admin@fondo.com');
    await wrapper.find('#password').setValue('Password123!');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(wrapper.text()).toContain(
      'Demasiados intentos fallidos. Por favor, espere un momento antes de intentar de nuevo.',
    );
  });
});
