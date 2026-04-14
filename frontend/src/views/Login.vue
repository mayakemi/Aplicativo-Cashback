<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/client';
import { setToken } from '../auth';

const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const resp = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    });

    setToken(resp.data.token);
    const role = resp.data.user.role;
    router.push(role === 'secretary' ? '/admin' : '/schedule');
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha no login';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="max-width: 520px; margin: 24px auto; padding: 16px;">
    <h2>Login</h2>
    <form @submit.prevent="onSubmit">
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
        <input v-model="email" type="email" placeholder="E-mail" required />
        <input v-model="password" type="password" placeholder="Senha" required />

        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <p v-if="error" style="color: #b91c1c;">{{ error }}</p>
      </div>
    </form>

    <p style="margin-top: 14px;">
      Não tem conta?
      <router-link to="/register">Cadastre-se</router-link>
    </p>
  </div>
</template>

