<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/client';
import { setToken } from '../auth';

const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('patient'); // patient | secretary
const secretaryCode = ref('');

const loading = ref(false);
const error = ref('');

const needsSecretaryCode = computed(() => role.value === 'secretary');

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const resp = await api.post('/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value,
      secretaryCode: needsSecretaryCode.value ? secretaryCode.value : undefined,
    });

    setToken(resp.data.token);
    router.push(role.value === 'secretary' ? '/admin' : '/schedule');
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha no cadastro';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="max-width: 560px; margin: 24px auto; padding: 16px;">
    <h2>Cadastro</h2>

    <form @submit.prevent="onSubmit">
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
        <input v-model="name" type="text" placeholder="Nome" required />
        <input v-model="email" type="email" placeholder="E-mail" required />
        <input v-model="password" type="password" placeholder="Senha (min 8)" required />

        <div style="display: flex; gap: 14px; align-items: center; margin-top: 6px;">
          <label style="display: flex; gap: 8px; align-items: center;">
            <input type="radio" value="patient" v-model="role" /> Paciente
          </label>
          <label style="display: flex; gap: 8px; align-items: center;">
            <input type="radio" value="secretary" v-model="role" /> Secretário
          </label>
        </div>

        <input
          v-if="needsSecretaryCode"
          v-model="secretaryCode"
          type="password"
          placeholder="Código de secretário"
          required
        />

        <button type="submit" :disabled="loading">
          {{ loading ? 'Criando...' : 'Criar conta' }}
        </button>

        <p v-if="error" style="color: #b91c1c;">{{ error }}</p>
      </div>
    </form>

    <p style="margin-top: 14px;">
      Já tem conta?
      <router-link to="/login">Faça login</router-link>
    </p>
  </div>
</template>

