<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/client';
import { decodeToken, getToken } from '../auth';
import { formatDateTime } from '../utils/format';

const router = useRouter();

const role = computed(() => {
  const token = getToken();
  const decoded = token ? decodeToken(token) : null;
  return decoded?.role || null;
});

// Form de agendamento
const appointmentAtLocal = ref('');
const cep = ref('');
const address = ref({ logradouro: '', bairro: '', localidade: '', uf: '' });
const addressLoading = ref(false);
const addressError = ref('');

const loading = ref(false);
const error = ref('');
const createdAppointment = ref(null);

// Para secretários: busca do paciente
const patientSearchEmail = ref('');
const patientResults = ref([]);
const patientSearchLoading = ref(false);
const patientId = ref('');

async function fetchAddress() {
  addressError.value = '';
  const cepValue = cep.value;
  if (!cepValue || cepValue.replace(/\D/g, '').length < 8) return;

  addressLoading.value = true;
  try {
    const resp = await api.get('/appointments/address', { params: { cep: cepValue } });
    address.value = resp.data.address;
  } catch (e) {
    addressError.value = e?.response?.data?.message || 'CEP inválido';
    address.value = { logradouro: '', bairro: '', localidade: '', uf: '' };
  } finally {
    addressLoading.value = false;
  }
}

async function searchPatients() {
  patientSearchLoading.value = true;
  try {
    const resp = await api.get('/auth/patients/search', { params: { email: patientSearchEmail.value } });
    patientResults.value = resp.data.patients;
  } catch (e) {
    patientResults.value = [];
  } finally {
    patientSearchLoading.value = false;
  }
}

function localToIso(localValue) {
  // type="datetime-local" vem como "YYYY-MM-DDTHH:mm" (sem timezone). new Date assume local.
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function submit() {
  error.value = '';
  createdAppointment.value = null;
  loading.value = true;

  try {
    const iso = localToIso(appointmentAtLocal.value);
    if (!iso) throw new Error('Data/hora inválida');
    if (!cep.value) throw new Error('Informe o CEP');

    const payload = {
      appointmentAt: iso,
      cep: cep.value,
    };

    if (role.value === 'secretary') {
      if (!patientId.value) throw new Error('Selecione um paciente');
      payload.patientId = patientId.value;
    }

    const resp = await api.post('/appointments', payload);
    createdAppointment.value = resp.data.appointment;
    if (role.value === 'patient') router.push('/me');
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Falha ao agendar';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="max-width: 760px; margin: 24px auto; padding: 16px;">
    <h2>Agendar Consulta</h2>

    <div v-if="role === 'secretary'" style="margin-top: 18px; border: 1px solid #e5e4e7; border-radius: 10px; padding: 14px;">
      <h3 style="margin: 0 0 10px;">Secretário: selecione um paciente</h3>

      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <input
          v-model="patientSearchEmail"
          type="email"
          placeholder="Buscar por e-mail"
          style="flex: 1; min-width: 220px;"
        />
        <button type="button" :disabled="patientSearchLoading" @click="searchPatients">
          {{ patientSearchLoading ? 'Buscando...' : 'Buscar' }}
        </button>
      </div>

      <div v-if="patientResults.length" style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button
          v-for="p in patientResults"
          :key="p.id"
          type="button"
          @click="patientId = p.id"
          :style="{
            border: patientId === p.id ? '2px solid #6d28d9' : '1px solid #e5e4e7',
            padding: '8px 10px',
            borderRadius: '10px',
            background: patientId === p.id ? 'rgba(109,40,217,0.08)' : 'transparent',
            cursor: 'pointer',
          }"
        >
          {{ p.name }} ({{ p.email }})
        </button>
      </div>

      <p v-if="patientId" style="margin-top: 10px; color: #166534;">Paciente selecionado.</p>
    </div>

    <form @submit.prevent="submit" style="margin-top: 18px;">
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <label style="display: flex; flex-direction: column; gap: 6px;">
          <span>Data e hora</span>
          <input v-model="appointmentAtLocal" type="datetime-local" required />
        </label>

        <label style="display: flex; flex-direction: column; gap: 6px;">
          <span>CEP</span>
          <input
            v-model="cep"
            type="text"
            placeholder="Somente números ou com hífen"
            required
            @blur="fetchAddress"
          />
        </label>

        <div v-if="addressLoading" style="color: #6b7280;">Buscando endereço...</div>
        <p v-if="addressError" style="color: #b91c1c; margin: 0;">{{ addressError }}</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span>Logradouro</span>
            <input v-model="address.logradouro" type="text" readonly />
          </label>
          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span>Bairro</span>
            <input v-model="address.bairro" type="text" readonly />
          </label>
          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span>Cidade</span>
            <input v-model="address.localidade" type="text" readonly />
          </label>
          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span>UF</span>
            <input v-model="address.uf" type="text" readonly />
          </label>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Criando...' : 'Confirmar Agendamento' }}
        </button>

        <p v-if="error" style="color: #b91c1c; margin: 0;">{{ error }}</p>
      </div>
    </form>

    <div v-if="createdAppointment" style="margin-top: 18px; border: 1px solid #e5e4e7; border-radius: 10px; padding: 14px;">
      <h3 style="margin: 0 0 10px;">Agendamento criado</h3>
      <p style="margin: 0 0 6px;">
        <strong>Data:</strong> {{ formatDateTime(createdAppointment.appointmentAt) }}
      </p>
      <p style="margin: 0 0 6px;">
        <strong>Endereço:</strong>
        {{ createdAppointment.address.logradouro }}, {{ createdAppointment.address.bairro }} - {{ createdAppointment.address.localidade }}/{{ createdAppointment.address.uf }}
      </p>
      <p style="margin: 0;">
        <strong>Clima:</strong>
        <span v-if="createdAppointment.weather.willRain === true" style="color: #b91c1c;">Possível chuva no dia.</span>
        <span v-else-if="createdAppointment.weather.willRain === false" style="color: #166534;">Sem previsão de chuva relevante.</span>
        <span v-else style="color: #6b7280;">Sem dados de clima.</span>
      </p>
    </div>
  </div>
</template>

