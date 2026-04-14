<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import { formatDateTime } from '../utils/format';

const loading = ref(false);
const error = ref('');
const appointments = ref([]);

async function loadAppointments() {
  loading.value = true;
  error.value = '';
  try {
    const resp = await api.get('/appointments/me');
    appointments.value = resp.data.appointments;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha ao carregar agendamentos';
  } finally {
    loading.value = false;
  }
}

async function cancelAppointment(id) {
  error.value = '';
  try {
    await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
    await loadAppointments();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha ao cancelar';
  }
}

onMounted(loadAppointments);
</script>

<template>
  <div style="max-width: 860px; margin: 24px auto; padding: 16px;">
    <h2>Meus Agendamentos</h2>

    <div v-if="loading" style="color: #6b7280;">Carregando...</div>
    <p v-if="error" style="color: #b91c1c;">{{ error }}</p>

    <div v-if="!loading && appointments.length === 0" style="margin-top: 18px; color: #6b7280;">
      Nenhum agendamento encontrado.
    </div>

    <div v-for="a in appointments" :key="a._id" style="margin-top: 14px; border: 1px solid #e5e4e7; border-radius: 10px; padding: 14px;">
      <p style="margin: 0 0 6px;"><strong>Data:</strong> {{ formatDateTime(a.appointmentAt) }}</p>
      <p style="margin: 0 0 6px;">
        <strong>Endereço:</strong> {{ a.address.localidade }}/{{ a.address.uf }} - {{ a.address.bairro }}
      </p>
      <p style="margin: 0 0 10px;"><strong>Status:</strong> {{ a.status }}</p>

      <p style="margin: 0;">
        <strong>Clima:</strong>
        <span v-if="a.weather.willRain === true" style="color: #b91c1c;">Possível chuva no dia.</span>
        <span v-else-if="a.weather.willRain === false" style="color: #166534;">Sem previsão de chuva relevante.</span>
        <span v-else style="color: #6b7280;">Sem dados de clima.</span>
      </p>

      <button
        v-if="a.status === 'scheduled'"
        type="button"
        style="margin-top: 12px;"
        @click="cancelAppointment(a._id)"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>

