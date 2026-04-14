<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { decodeToken, getToken, logout } from './auth';

const router = useRouter();

const role = computed(() => {
  const token = getToken();
  const decoded = token ? decodeToken(token) : null;
  return decoded?.role || null;
});

function doLogout() {
  logout();
  router.push('/login');
}
</script>

<template>
  <div>
    <header
      style="border-bottom: 1px solid #e5e4e7; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;"
    >
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <router-link to="/">Clínica</router-link>
        <router-link v-if="role" to="/schedule">Agendar</router-link>
        <router-link v-if="role === 'secretary'" to="/admin">Painel</router-link>
        <router-link v-if="role === 'patient'" to="/me">Meus Agendamentos</router-link>
      </div>

      <div style="display: flex; gap: 12px; align-items: center;">
        <router-link v-if="!role" to="/login">Login</router-link>
        <router-link v-if="!role" to="/register">Cadastro</router-link>
        <button v-if="role" type="button" @click="doLogout">Sair</button>
      </div>
    </header>

    <router-view />
  </div>
</template>
