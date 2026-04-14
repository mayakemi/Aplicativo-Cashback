const axios = require('axios');
const { getEnv } = require('../config/env');

function isoDayUTC(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

async function getCoordinatesForCity(city, uf) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const q = [city, uf].filter(Boolean).join(',');
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${apiKey}`;

  const resp = await axios.get(url, { timeout: 8000 });
  const first = resp.data && resp.data[0];
  if (!first || typeof first.lat !== 'number' || typeof first.lon !== 'number') return null;

  return { lat: first.lat, lon: first.lon };
}

async function checkRainForecast({ appointmentAt, city, uf }) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!appointmentAt || !city) {
    return { willRain: null, rainProbabilityMax: null, checkedAt: new Date(), provider: '', note: 'Dados insuficientes' };
  }

  // Se não houver chave configurada, não bloqueamos o agendamento.
  if (!apiKey) {
    return { willRain: null, rainProbabilityMax: null, checkedAt: new Date(), provider: 'OpenWeatherMap', note: 'OPENWEATHERMAP_API_KEY ausente' };
  }

  const units = getEnv('OPENWEATHERMAP_UNITS', 'metric');

  try {
    const coords = await getCoordinatesForCity(city, uf);
    if (!coords) {
      return { willRain: null, rainProbabilityMax: null, checkedAt: new Date(), provider: 'OpenWeatherMap', note: 'Geocodificação não encontrada' };
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=${units}`;
    const resp = await axios.get(url, { timeout: 10000 });
    const list = resp.data && resp.data.list;
    if (!Array.isArray(list)) {
      return { willRain: null, rainProbabilityMax: null, checkedAt: new Date(), provider: 'OpenWeatherMap', note: 'Resposta inesperada do clima' };
    }

    const targetDay = isoDayUTC(appointmentAt);
    let maxPop = null; // 0..1
    let found = false;

    for (const item of list) {
      const dtTxt = item.dt_txt;
      const day = typeof dtTxt === 'string' ? dtTxt.slice(0, 10) : null;
      if (!day || day !== targetDay) continue;
      found = true;

      const pop = typeof item.pop === 'number' ? item.pop : null;
      if (pop !== null) {
        maxPop = maxPop === null ? pop : Math.max(maxPop, pop);
      }

      const hasRainWeather =
        Array.isArray(item.weather) && item.weather.some((w) => (w && typeof w.main === 'string' ? w.main.toLowerCase().includes('rain') : false));

      const hasRainField = item.rain && typeof item.rain === 'object';
      if (hasRainWeather || hasRainField) {
        // Se houver qualquer indício de chuva no dia, marcamos como provável.
        return {
          willRain: true,
          rainProbabilityMax: maxPop,
          checkedAt: new Date(),
          provider: 'OpenWeatherMap',
          note: 'Indícios de chuva na previsão',
        };
      }
    }

    if (!found) {
      return { willRain: null, rainProbabilityMax: null, checkedAt: new Date(), provider: 'OpenWeatherMap', note: 'Sem dados da previsão para a data' };
    }

    // Se não achou campos/clima de chuva, usa pop quando existir.
    const willRain = maxPop !== null ? maxPop >= 0.4 : false;
    return {
      willRain,
      rainProbabilityMax: maxPop,
      checkedAt: new Date(),
      provider: 'OpenWeatherMap',
      note: 'Avaliação por pop/ausência de indícios',
    };
  } catch (err) {
    return { willRain: null, rainProbabilityMax: null, checkedAt: new Date(), provider: 'OpenWeatherMap', note: 'Falha ao consultar API de clima' };
  }
}

module.exports = { checkRainForecast };

