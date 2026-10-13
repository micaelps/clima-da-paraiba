"use strict";

// Tradução dos códigos meteorológicos WMO: [condição, ícone].
const WEATHER_CODES = {
  0: ["Céu limpo", "☀️"],
  1: ["Predominantemente limpo", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Neblina", "🌫️"],
  48: ["Neblina com geada", "🌫️"],
  51: ["Chuvisco leve", "🌦️"],
  53: ["Chuvisco moderado", "🌦️"],
  55: ["Chuvisco forte", "🌦️"],
  56: ["Chuvisco congelante leve", "🌧️"],
  57: ["Chuvisco congelante forte", "🌧️"],
  61: ["Chuva leve", "🌧️"],
  63: ["Chuva moderada", "🌧️"],
  65: ["Chuva forte", "🌧️"],
  66: ["Chuva congelante leve", "🌧️"],
  67: ["Chuva congelante forte", "🌧️"],
  71: ["Neve leve", "🌨️"],
  73: ["Neve moderada", "🌨️"],
  75: ["Neve forte", "🌨️"],
  77: ["Grãos de neve", "🌨️"],
  80: ["Aguaceiros leves", "🌦️"],
  81: ["Aguaceiros moderados", "🌧️"],
  82: ["Aguaceiros fortes", "⛈️"],
  85: ["Aguaceiros de neve leves", "🌨️"],
  86: ["Aguaceiros de neve fortes", "🌨️"],
  95: ["Trovoada", "⛈️"],
  96: ["Trovoada com granizo leve", "⛈️"],
  99: ["Trovoada com granizo forte", "⛈️"],
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const el = (id) => document.getElementById(id);
const input = el("city-input");
const options = el("city-options");
const status = el("status");
const current = el("current");
const forecast = el("forecast");

function normalize(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function conditionHtml(code) {
  const [label, icon] = WEATHER_CODES[code] ?? ["Condição desconhecida", "❓"];
  return `<span aria-hidden="true">${icon}</span> ${label}`;
}

function weekday(dateString, index) {
  if (index === 0) return "Hoje";
  return WEEKDAYS[new Date(`${dateString}T00:00:00Z`).getUTCDay()];
}

function updateOptions(query) {
  const normalized = normalize(query);
  options.innerHTML = CITIES.filter((city) => normalize(city.name).includes(normalized))
    .map((city) => `<option value="${city.name}">`)
    .join("");
}

async function loadCity(city) {
  current.hidden = true;
  status.textContent = "Carregando dados do clima…";
  status.classList.remove("error");

  const params = new URLSearchParams({
    latitude: city.lat,
    longitude: city.lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "America/Sao_Paulo",
    forecast_days: "7",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.current || !data.daily) throw new Error("resposta inválida");

    const [date, time] = data.current.time.split("T");
    const [year, month, day] = date.split("-");

    el("city-name").textContent = city.name;
    el("condition").innerHTML = conditionHtml(data.current.weather_code);
    el("temp").textContent = `${Math.round(data.current.temperature_2m)}°C`;
    el("details").textContent =
      `Sensação ${Math.round(data.current.apparent_temperature)}°C · ` +
      `Umidade ${Math.round(data.current.relative_humidity_2m)}% · ` +
      `Vento ${Math.round(data.current.wind_speed_10m)} km/h`;
    el("updated").textContent = `${day}/${month}/${year} ${time}`;

    forecast.innerHTML = data.daily.time
      .map(
        (dateString, i) => `<li>
          <span>${weekday(dateString, i)}</span>
          <span>${conditionHtml(data.daily.weather_code[i])}</span>
          <span>${Math.round(data.daily.temperature_2m_min[i])}° / ${Math.round(data.daily.temperature_2m_max[i])}°</span>
          <span>💧 ${data.daily.precipitation_probability_max[i]}%</span>
        </li>`
      )
      .join("");

    status.textContent = "";
    current.hidden = false;
  } catch {
    status.textContent = `Não foi possível carregar o clima de ${city.name}.`;
    status.classList.add("error");
  }
}

input.addEventListener("input", (event) => {
  const value = event.target.value;
  updateOptions(value);
  const city = CITIES.find((c) => normalize(c.name) === normalize(value));
  if (city) loadCity(city);
});
input.addEventListener("focus", () => input.select());

updateOptions("");
const defaultCity = CITIES.find((c) => c.name === "João Pessoa");
input.value = defaultCity.name;
loadCity(defaultCity);
