import * as env from '../environment';

//Bring up the api key and controls//
const API_KEY = '345a78d07f57356c5ddf8042e295cfc2';

//Location Object// Sample DATA
const sydneyWeather = {
    city: "Sydney",
    lat: -33.8688,
    lon: 151.2093,
    temperature: 22.3,
    clouds: 25,
    weatherMain: "Clear",
    rain: null,
    snow: null
};

const melbourneWeather = {
    city: "Melbourne",
    lat: -37.8136,
    lon: 144.9631,
    temperature: 16.8,
    clouds: 60,
    weatherMain: "Clouds",
    rain: { "1h": 0.3 }, // 1시간 강우량 (mm)
    snow: null
};

const tokyoWeather = {
    city: "Tokyo",
    lat: 35.6895,
    lon: 139.6917,
    temperature: 27.1,
    clouds: 10,
    weatherMain: "Clear",
    rain: null,
    snow: null
};

const seoulWeather = {
    city: "Seoul",
    lat: 37.5665,
    lon: 126.9780,
    temperature: 24.5,
    clouds: 40, // 흐림 정도 (%)
    weatherMain: "Clouds", // 또는 "Clear", "Rain", "Snow" 등
    rain: { "1h": 0.2 }, // 1시간 강우량 (mm), 없으면 null
    snow: null // 눈이 오지 않으면 null
};
///This const object will be updated as getting API responses

navigator.geolocation.getCurrentPosition(success, fail);



function success(position) {

    //Test run
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    //fetch the current locaiton data

    getWeather(lat, lon);
}

//Fail
function fail() {
    alert('위치 정보를 가져올 수 없습니다. Failed to get location data');
}
//실패했을때

//Api 호출로 const 오브젝트 형성


function getWeather(lat, lon) {
    fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
        //현재위치 넣기

    )
        .then(response => response.json())
        .then(json => {
            const weatherData = {
                city: json.name || "Unknown",
                lat: lat,
                lon: lon,
                temperature: json.main?.temp ?? null,
                clouds: json.clouds?.all ?? null,
                weatherMain: json.weather?.[0]?.main ?? null,
                rain: json.rain ?? null,
                snow: json.snow ?? null
            };

            //json files 에서 정보를 줄것임.
            //참고용 웹사이트 https://openweathermap.org/current


            console.log("🌤️ 현재 날씨 정보:", weatherData);

            // 여기서 다른 곳에 전달하거나 저장 가능
            // 예: updateWeatherUI(weatherData);
        })
        .catch(error => {
            alert('날씨 정보를 불러오는 중 오류 발생: ' + error);
        });
}


// season sync utility

let currentDate = new Date();
let currentSeason = null;

// (1) 날짜 → 계절 자동 계산 함수
export function getSeasonByDate(date, latitude = 37) {
    const month = date.getMonth() + 1;
    const isNorth = latitude >= 0;
    if (isNorth) {
        if ([3,4,5].includes(month)) return 'spring';
        if ([6,7,8].includes(month)) return 'summer';
        if ([9,10,11].includes(month)) return 'autumn';
        return 'winter';
    } else {
        if ([9,10,11].includes(month)) return 'spring';
        if ([12,1,2].includes(month)) return 'summer';
        if ([3,4,5].includes(month)) return 'autumn';
        return 'winter';
    }
}

// (2) 실시간 날짜/계절 동기화 루프
export function syncDateAndSeason({
                                      getDate = () => new Date(),
                                      latitude = 37,
                                      onSeasonChange = (season, date) => {}
                                  } = {}) {
    let lastSeason = null;
    function update() {
        const date = getDate();
        const season = getSeasonByDate(date, latitude);
        if (season !== lastSeason) {
            lastSeason = season;
            onSeasonChange(season, date); // 계절 바뀔 때마다 콜백 실행
        }
        requestAnimationFrame(update);
    }
    update();
}

// (3) 날짜/계절 상태를 외부에서 직접 갱신하고 싶을 때
export function setDate(newDate) {
    currentDate = newDate;
    currentSeason = getSeasonByDate(currentDate);
    return currentSeason;
}

// (4) 현재 계절 반환
export function getCurrentSeason() {
    return currentSeason;
}

// Update clock
function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');

    timeElement.textContent = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    dateElement.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update season
export function updateSeason() {
    const now = new Date();
    const month = now.getMonth();
    const seasons = document.querySelectorAll('.season-mark');

    let currentSeason;
    if (month >= 2 && month <= 4) currentSeason = 0; // Spring
    else if (month >= 5 && month <= 7) currentSeason = 1; // Summer
    else if (month >= 8 && month <= 10) currentSeason = 2; // Fall
    else currentSeason = 3; // Winter

    seasons.forEach((season, index) => {
        if (index === currentSeason) {
            season.classList.add('current-season');
            const marker = document.createElement('div');
            marker.className = 'season-marker';
            season.appendChild(marker);
        }
    });
}

// Mock weather data
export function getRandomTemp() {
    return Math.floor(Math.random() * 35) + 10;
}

export function getRandomCondition() {
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Snowy'];
    return conditions[Math.floor(Math.random() * conditions.length)];
}

// Update forecast
export function updateForecast() {
    const forecastContainer = document.getElementById('forecast');
    const timeRuler = document.getElementById('timeRuler');
    const now = new Date();

    // Clear existing content
    forecastContainer.innerHTML = '';
    timeRuler.innerHTML = '';

    // Generate 7 days of forecast (3 past, today, 3 future)
    for (let i = -3; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);

        // Forecast item
        const forecastItem = document.createElement('div');
        forecastItem.className = `forecast-item${i === 0 ? ' today' : ''}`;

        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        forecastItem.innerHTML = `
      <div class="forecast-date">${dateStr}</div>
      <div class="forecast-temp">${getRandomTemp()}°C</div>
      <div class="forecast-condition">${getRandomCondition()}</div>
    `;
        forecastContainer.appendChild(forecastItem);

        // Time ruler mark
        const timeMark = document.createElement('div');
        timeMark.className = `time-mark${i === 0 ? ' today' : ''}`;
        timeMark.innerHTML = `<span class="time-label">${dateStr}</span>`;
        timeRuler.appendChild(timeMark);
    }
}

// Initialize
export function initClock() {
    updateClock();
    updateSeason();
    updateForecast();

    // Update mock weather data
    document.getElementById('temperature').textContent = `${getRandomTemp()}°C`;
    document.getElementById('condition').textContent = getRandomCondition();
    document.getElementById('humidity').textContent = `${Math.floor(Math.random() * 100)}%`;
    document.getElementById('wind').textContent = `${Math.floor(Math.random() * 30)} km/h`;

    // Update clock every second
    setInterval(updateClock, 1000);
}

