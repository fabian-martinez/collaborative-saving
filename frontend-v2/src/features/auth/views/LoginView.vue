<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import ErrorMessage from '@/shared/components/ErrorMessage.vue';
import { Eye, EyeClosed } from 'iconoir-vue/regular';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showPassword = ref(false);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

async function handleLogin() {
  if (!email.value || !password.value) return;

  loading.value = true;
  error.value = '';

  try {
    await authStore.login(email.value, password.value);
    const redirect = route.query.redirect as string || '/dashboard';
    router.push(redirect);
  } catch (e: any) {
    if (e.code === 'auth/invalid-credential') {
      error.value = 'Invalid email or password';
    } else {
      error.value = 'An error occurred during login';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title justify-center text-2xl font-bold mb-4">Login</h2>

        <form @submit.prevent="handleLogin">
          <div class="form-control w-full">
            <label class="label" for="email">
              <span class="label-text">Email</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="email@example.com"
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control w-full mt-4">
            <label class="label" for="password">
              <span class="label-text">Password</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-3 flex items-center text-base-content/60 hover:text-base-content"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeClosed v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <ErrorMessage
            v-if="error"
            :error="error"
            title="Login Failed"
            class="mt-4"
          />

          <div class="card-actions justify-end mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
