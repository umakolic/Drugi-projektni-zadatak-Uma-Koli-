
const API_KEY = "6d1bdc281734a452aae1e25f1189f4ae"
const BASE = "https://api.openweathermap.org/data/2.5";
const els = {
 form: document.getElementById("searchForm"),
 cityInput: document.getElementById("cityInput"),
 status: document.getElementById("status"),
 currentSection: document.getElementById("currentSection"),
 forecastSection: document.getElementById("forecastSection"),
 cityTitle: document.getElementById("cityTitle"),
 updatedAt: document.getElementById("updatedAt"),
 tempNow: document.getElementById("tempNow"),
 descNow: document.getElementById("descNow"),
 minMax: document.getElementById("minMax"),
 humidity: document.getElementById("humidity"),
 wind: document.getElementById("wind"),
 pressure: document.getElementById("pressure"),
 feelsLike: document.getElementById("feelsLike"),
 forecastGrid: document.getElementById("forecastGrid"),
 unitToggle: document.getElementById("unitToggle"),
 unitLabel: document.getElementById("unitLabel")
};
let units = "metric"; // metric (°C) ili imperial (°F)
// === POMOĆNE ===
const fmtTemp = t => `${Math.round(t)}°${units === "metric" ? "C" : "F"}`;
const fmtWind = s => units === "metric" ? `${(s).toFixed(1)} m/s` : `${(s).toFixed(1)} mph`;
const iconUrl = code => `https://openweathermap.org/img/wn/${code}@2x.png`;
function setStatus(type, msg) {
 els.status.innerHTML = msg ? `<div class="alert alert-${type} mb-0">${msg}</div>` : "";
}
function validateCity(value) {
 return typeof value === "string" && value.trim().length >= 2;
}
// Grupisanje forecast-a po danima (uzimamo po jedan termin/dan – podne)
function groupByDay(list) {
 const byDay = {};
 list.forEach(item => {
   const d = new Date(item.dt * 1000);
   const key = d.toISOString().slice(0,10);
   if (!byDay[key]) byDay[key] = [];
   byDay[key].push(item);
 });
 // izaberi unos najbliži 12:00
 return Object.entries(byDay).slice(0,5).map(([date, arr]) => {
   arr.sort((a,b) => Math.abs(new Date(a.dt*1000).getHours()-12) - Math.abs(new Date(b.dt*1000).getHours()-12));
   return { date, item: arr[0] };
 });
}

function renderCurrent(data) {
 const { name } = data;
 const w = data.weather[0];
 const m = data.main;
 const wind = data.wind;
 els.cityTitle.textContent = `${name}, ${data.sys.country}`;
 els.updatedAt.textContent = `Ažurirano: ${new Date().toLocaleString()}`;
 els.tempNow.innerHTML = `${fmtTemp(m.temp)} <img alt="${w.description}" src="${iconUrl(w.icon)}">`;
 els.descNow.textContent = w.description[0].toUpperCase() + w.description.slice(1);
 els.minMax.textContent = `Min ${fmtTemp(m.temp_min)} · Max ${fmtTemp(m.temp_max)}`;
 els.humidity.textContent = `${m.humidity}%`;
 els.wind.textContent = fmtWind(wind.speed);
 els.pressure.textContent = `${m.pressure} hPa`;
 els.feelsLike.textContent = fmtTemp(m.feels_like);
 els.currentSection.classList.remove("d-none");
}
function renderForecast(list) {
 els.forecastGrid.innerHTML = "";
 const days = groupByDay(list);
 days.forEach(({ date, item }) => {
   const d = new Date(date);
   const title = d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "2-digit" });
   const w = item.weather[0];
   const t = item.main;
   const col = document.createElement("div");
   col.className = "col-6 col-md-4 col-lg-2";
   col.innerHTML = `
<div class="card shadow-sm h-100">
<div class="card-body text-center">
<div class="fw-semibold mb-1">${title}</div>
<img alt="${w.description}" src="${iconUrl(w.icon)}" />
<div class="mt-1">${w.description}</div>
<div class="mt-2"><strong>${fmtTemp(t.temp)}</strong></div>
<div class="text-muted small">Min ${fmtTemp(t.temp_min)} · Max ${fmtTemp(t.temp_max)}</div>
</div>
</div>`;
   els.forecastGrid.appendChild(col);
 });
 els.forecastSection.classList.remove("d-none");
}

async function fetchWeather(city) {
 const q = encodeURIComponent(city.trim());
 const urlNow = `${BASE}/weather?q=${q}&appid=${API_KEY}&units=${units}&lang=hr`;
 const urlFc  = `${BASE}/forecast?q=${q}&appid=${API_KEY}&units=${units}&lang=hr`;
 setStatus("info", "Učitavam podatke…");
 const [nowRes, fcRes] = await Promise.all([fetch(urlNow), fetch(urlFc)]);
 if (!nowRes.ok) throw new Error("Grad nije pronađen.");
 if (!fcRes.ok) throw new Error("Prognoza trenutno nije dostupna.");
 const now = await nowRes.json();
 const fc  = await fcRes.json();
 setStatus("", "");
 renderCurrent(now);
 renderForecast(fc.list);
}

els.form.addEventListener("submit", async (e) => {
 e.preventDefault();
 const city = els.cityInput.value;
 if (!validateCity(city)) {
   els.cityInput.classList.add("is-invalid");
   setStatus("danger", "Molim unesi ispravan naziv grada (min 2 znaka).");
   return;
 }
 els.cityInput.classList.remove("is-invalid");
 try {
   await fetchWeather(city);
   localStorage.setItem("lastCity", city); // pamti posljednje pretraživanje
 } catch (err) {
   setStatus("danger", err.message || "Došlo je do greške.");
   els.currentSection.classList.add("d-none");
   els.forecastSection.classList.add("d-none");
 }
});

els.unitToggle.addEventListener("change", () => {
 units = els.unitToggle.checked ? "imperial" : "metric";
 els.unitLabel.textContent = els.unitToggle.checked ? "°F" : "°C";
 const last = localStorage.getItem("lastCity");
 if (last) fetchWeather(last).catch(()=>{});
});

window.addEventListener("DOMContentLoaded", () => {
 const last = localStorage.getItem("lastCity");
 if (last) {
   els.cityInput.value = last;
   fetchWeather(last).catch(()=>{});
 }

});
