<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api/client';
import { formatDateTime } from '../utils/format';

const loading = ref(false);
const error = ref('');
const appointments = ref([]);

const from = ref('');
const to = ref('');
const status = ref('');

async function loadAppointments() {
  loading.value = true;
  error.value = '';
  try {
    const params = {};
    if (from.value) params.from = from.value;
    if (to.value) params.to = to.value;
    if (status.value) params.status = status.value;

    const resp = await api.get('/appointments', { params });
    appointments.value = resp.data.appointments;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha ao carregar painel';
  } finally {
    loading.value = false;
  }
}

async function updateStatus(id, nextStatus) {
  error.value = '';
  try {
    await api.patch(`/appointments/${id}/status`, { status: nextStatus });
    await loadAppointments();
  } catch (e) {
    error.value = e?.response?.data?.message || 'Falha ao atualizar status';
  }
}

onMounted(loadAppointments);
</script>

<template>
  <div style="max-width: 980px; margin: 24px auto; padding: 16px;">
    <h2>Painel Administrativo</h2>

    <div style="margin-top: 16px; border: 1px solid #e5e4e7; border-radius: 10px; padding: 14px;">
      <h3 style="margin: 0 0 10px;">Filtros</h3>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
        <label style="display: flex; flex-direction: column; gap: 6px;">
          <span>De</span>
          <input type="date" v-model="from" />
        </label>

        <label style="display: flex; flex-direction: column; gap: 6px;">
          <span>Até</span>
          <input type="date" v-model="to" />
        </label>

        <label style="display: flex; flex-direction: column; gap: 6px;">
          <span>Status</span>
          <select v-model="status">
            <option value="">Todos</option>
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>

        <button type="button" :disabled="loading" @click="loadAppointments">
          {{ loading ? 'Carregando...' : 'Aplicar' }}
        </button>
      </div>
    </div>

    <p v-if="error" style="color: #b91c1c; margin-top: 14px;">{{ error }}</p>
    <div v-if="loading" style="color: #6b7280; margin-top: 14px;">Carregando agendamentos...</div>

    <div v-if="!loading && appointments.length === 0" style="margin-top: 18px; color: #6b7280;">
      Nenhum agendamento encontrado.
    </div>

    <div v-for="a in appointments" :key="a._id" style="margin-top: 14px; border: 1px solid #e5e4e7; border-radius: 10px; padding: 14px;">
      <p style="margin: 0 0 6px;"><strong>Consulta:</strong> {{ formatDateTime(a.appointmentAt) }}</p>
      <p style="margin: 0 0 6px;">
        <strong>Paciente:</strong> {{ a.patientId?.name }} ({{ a.patientId?.email }})
      </p>
      <p style="margin: 0 0 6px;">
        <strong>Endereço:</strong> {{ a.address.localidade }}/{{ a.address.uf }} - {{ a.address.bairro }}
      </p>
      <p style="margin: 0 0 10px;"><strong>Status:</strong> {{ a.status }}</p>

      <p style="margin: 0 0 10px;">
        <strong>Clima:</strong>
        <span v-if="a.weather.willRain === true" style="color: #b91c1c;">Possível chuva no dia.</span>
        <span v-else-if="a.weather.willRain === false" style="color: #166534;">Sem previsão de chuva relevante.</span>
        <span v-else style="color: #6b7280;">Sem dados de clima.</span>
      </p>

      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button type="button" @click="updateStatus(a._id, 'scheduled')" :disabled="a.status === 'scheduled'">
          Marcar scheduled
        </button>
        <button type="button" @click="updateStatus(a._id, 'completed')" :disabled="a.status === 'completed'">
          Marcar completed
        </button>
        <button type="button" @click="updateStatus(a._id, 'cancelled')" :disabled="a.status === 'cancelled'">
          Marcar cancelled
        </button>
      </div>
    </div>
  </div>
</template>

