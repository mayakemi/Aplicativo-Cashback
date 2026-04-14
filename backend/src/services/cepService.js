const axios = require('axios');

function normalizeCep(cep) {
  return String(cep).replace(/\D/g, '');
}

async function fetchAddressByCep(cep) {
  const normalizedCep = normalizeCep(cep);
  if (normalizedCep.length !== 8) {
    throw Object.assign(new Error('CEP inválido'), { statusCode: 400 });
  }

  const url = `https://viacep.com.br/ws/${normalizedCep}/json/`;
  const response = await axios.get(url, { timeout: 8000 });
  const data = response.data;

  if (!data || data.erro) {
    throw Object.assign(new Error('CEP não encontrado'), { statusCode: 400 });
  }

  return {
    cep: normalizedCep,
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    localidade: data.localidade || '',
    uf: data.uf || '',
  };
}

module.exports = { fetchAddressByCep, normalizeCep };

