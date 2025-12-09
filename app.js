const API = window.API_KEY;
const search = document.getElementById("search");
const btn = document.getElementById("searchBtn");
const geo = document.getElementById("geoBtn");
const currentBox = document.querySelector(".current");
const grid = document.getElementById("forecastGrid");
const slider = document.getElementById("hourSlider");
const hourData = document.getElementById("hourData");
const alertBar = document.getElementById("alertBar");
const units = document.getElementById("units");
const ctx = document.getElementById("tempChart");
let CHART, FORECAST;

function saveLocation(name, lat, lon){
  localStorage.setItem("savedCity", JSON.stringify({name,lat,lon}));
}

function alertCheck(data){
  alertBar.style.display = "none";
  if(data.main.temp > 35){alertBar.textContent="🔥 Extreme Heat Warning!";alertBar.style.display="block";}
  if(data.weather[0].main==="Rain" || data.weather[0].main==="Snow"){alertBar.textContent=`🌧 Weather Alert: ${data.weather[0].main}`;alertBar.style.display="block";}
}

async function getWeatherByCoords(lat,lon,name=""){
 const c = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units.value}&appid=${API}`);
 const f = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units.value}&appid=${API}`);
 const cd = await c.json(); const fd = await f.json();
 saveLocation(name||cd.name,lat,lon); render(cd,fd);
}

function render(c,f){
 alertCheck(c);
 currentBox.innerHTML=`<h2>${c.name}</h2><h3>${c.main.temp}°</h3><p>${c.weather[0].description}</p>
 <img src="https://openweathermap.org/img/wn/${c.weather[0].icon}@2x.png">`;

 FORECAST=f.list; slider.max=FORECAST.length-1; updateHour(0);
 grid.innerHTML=""; let days={};
 f.list.forEach(i=>{const d=new Date(i.dt*1000).toDateString(); if(!days[d])days[d]=i;});
 Object.values(days).slice(0,5).forEach(d=>{grid.innerHTML+=`<div>${new Date(d.dt*1000).toDateString()}<br>${d.main.temp}°</div>`;});

 const labels=f.list.slice(0,12).map(i=>new Date(i.dt*1000).getHours()+":00");
 const temps=f.list.slice(0,12).map(i=>i.main.temp);
 if(CHART)CHART.destroy();
 CHART=new Chart(ctx,{type:'line',data:{labels,datasets:[{data:temps,fill:false}]}});
 buildMap(c.coord.lat,c.coord.lon,c.name);
}

function updateHour(i){const h=FORECAST[i];hourData.innerHTML=`${new Date(h.dt*1000).toLocaleString()} | ${h.main.temp}° | ${h.weather[0].description}`;}
slider.oninput=()=>updateHour(slider.value);
btn.onclick=()=>fetchCity(search.value);
geo.onclick=()=>navigator.geolocation.getCurrentPosition(p=>getWeatherByCoords(p.coords.latitude,p.coords.longitude));

async function fetchCity(q){const r=await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${API}`);const d=await r.json();getWeatherByCoords(d.coord.lat,d.coord.lon,d.name);}

function buildMap(lat,lon,name){
 if(window.MAP)MAP.remove();
 MAP=L.map('map').setView([lat,lon],10);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(MAP);
 L.marker([lat,lon]).addTo(MAP).bindPopup(name).openPopup();
}

fetch("https://countriesnow.space/api/v0.1/countries/population/cities")
.then(r=>r.json()).then(d=>{
 const list=document.getElementById("cities");
 d.data.slice(0,500).forEach(c=>{const o=document.createElement("option");o.value=c.city;list.appendChild(o);});
});

const saved = JSON.parse(localStorage.getItem("savedCity")||"null");
if(saved) getWeatherByCoords(saved.lat,saved.lon, saved.name);
