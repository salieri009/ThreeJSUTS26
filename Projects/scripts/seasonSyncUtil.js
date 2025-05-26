import * as env from '../environment';

// API 키 설정 (API 키는 보통 env에서 관리하는 게 안전합니다)
const API_KEY = '345a78d07f57356c5ddf8042e295cfc2';

// 샘플 날씨 데이터 (참고용)
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
    rain: { "1h": 0.3 },
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
    lon: 126.978,
    temperature: 24.5,
    clouds: 40,
    weatherMain: "Clouds",
    rain: { "1h": 0.2 },
    snow: null
};

// 현재 날짜 및 계절 상태 전역 변수
let currentDate = new Date();
let currentSeason = null;

// 위치 정보 가져오기 (성공시 getWeather 호출)
navigator.geolocation.getCurrentPosition(success, fail);

function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    getWeather(lat, lon);
}

function fail() {
    alert('위치 정보를 가져올 수 없습니다. Failed to get location data');
}

// API 호출하여 날씨 데이터 가져오기 (비동기 함수)
async function getWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
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

        console.log("🌤️ 현재 날씨 정보:", weatherData);

        // UI 업데이트 함수 호출 예시
        updateWeatherUI(weatherData);

    } catch (error) {
        alert('날씨 정보를 불러오는 중 오류 발생: ' + error.message);
    }
}

// UI 업데이트 예시 함수
function updateWeatherUI(weather) {
    document.getElementById('temperature').textContent = weather.temperature !== null ? `${weather.temperature}°C` : 'N/A';
    document.getElementById('condition').textContent = weather.weatherMain || 'Unknown';
    // 강수량, 구름, 눈 등 추가 업데이트 가능
}

// 날짜로부터 계절 계산 (북반구/남반구 고려)
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

// 날짜/계절 상태 동기화 (애니메이션 프레임 루프 사용)
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
            onSeasonChange(season, date);
        }
        requestAnimationFrame(update);
    }
    update();
}

// 외부에서 날짜 직접 설정하기
export function setDate(newDate) {
    currentDate = newDate;
    currentSeason = getSeasonByDate(currentDate);
    return currentSeason;
}

// 현재 계절 반환
export function getCurrentSeason() {
    return currentSeason;
}

// 시계 업데이트 (시, 분, 초, 날짜 등)
function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');

    if (timeElement)
        timeElement.textContent = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

    if (dateElement)
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
}

// 계절 표시 업데이트 (season-mark 클래스 대상)
export function updateSeason(latitude = 37) {
    const now = new Date();
    const seasonName = getSeasonByDate(now, latitude);

    const seasons = document.querySelectorAll('.season-mark');

    const seasonIndexMap = {
        spring: 0,
        summer: 1,
        autumn: 2,
        winter: 3
    };

    const currentSeasonIndex = seasonIndexMap[seasonName];

    seasons.forEach((season, index) => {
        season.classList.remove('current-season');
        // remove the
        const oldMarker = season.querySelector('.season-marker');
        if (oldMarker) oldMarker.remove();

        if (index === currentSeasonIndex) {
            season.classList.add('current-season');
            const marker = document.createElement('div');
            marker.className = 'season-marker';
            season.appendChild(marker);
        }
    });
}

// 랜덤 온도 생성 (10~44도 사이)
export function getRandomTemp() {
    return Math.floor(Math.random() * 35) + 10;
}

// 랜덤 날씨 상태 생성
export function getRandomCondition() {
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Snowy', 'Stormy'];
    return conditions[Math.floor(Math.random() * conditions.length)];
}

// 예측 일기 업데이트 (7일 간, 과거 3일, 현재, 미래 3일)
export function updateForecast() {
    const forecastContainer = document.getElementById('forecast');
    const timeRuler = document.getElementById('timeRuler');
    const now = new Date();

    if (!forecastContainer || !timeRuler) return;

    forecastContainer.innerHTML = '';
    timeRuler.innerHTML = '';

    for (let i = -3; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);

        const forecastItem = document.createElement('div');
        forecastItem.className = `forecast-item${i === 0 ? ' today' : ''}`;

        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        forecastItem.innerHTML = `
      <div class="forecast-date">${dateStr}</div>
      <div class="forecast-temp">${getRandomTemp()}°C</div>
      <div class="forecast-condition">${getRandomCondition()}</div>
    `;
        forecastContainer.appendChild(forecastItem);

        const timeMark = document.createElement('div');
        timeMark.className = `time-mark${i === 0 ? ' today' : ''}`;
        timeMark.innerHTML = `<span class="time-label">${dateStr}</span>`;
        timeRuler.appendChild(timeMark);
    }
}

// 위치 기반 날씨 데이터 비동기 호출 (initClock 내 사용)
async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();

        return {
            temperature: json.main?.temp ?? null,
            condition: json.weather?.[0]?.main ?? null,
            humidity: json.main?.humidity ?? null,
            wind: json.wind?.speed ?? null,
        };
    } catch (error) {
        throw error;
    }
}

// 랜덤 날씨 UI 대체 (위치 정보 없을 때)
function setRandomWeatherUI() {
    document.getElementById('temperature').textContent = `${getRandomTemp()}°C`;
    document.getElementById('condition').textContent = getRandomCondition();
    document.getElementById('humidity').textContent = `${Math.floor(Math.random() * 100)}%`;
    document.getElementById('wind').textContent = `${Math.floor(Math.random() * 50)} km/h`;
}

// 초기화 함수 (시계, 계절, 예보, 날씨)
export async function initClock() {
    updateClock();
    updateSeason();
    updateForecast();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            try {
                const weather = await fetchWeather(lat, lon);
                document.getElementById('temperature').textContent = weather.temperature !== null ? `${weather.temperature}°C` : 'N/A';
                document.getElementById('condition').textContent = weather.condition || 'Unknown';
                document.getElementById('humidity').textContent = weather.humidity !== null ? `${weather.humidity}%` : 'N/A';
                document.getElementById('wind').textContent = weather.wind !== null ? `${weather.wind} km/h` : 'N/A';
            } catch (error) {
                console.error('날씨 데이터를 가져오는 데 실패했습니다:', error);
                setRandomWeatherUI();
            }
        }, (err) => {
            console.warn('위치 접근 거부됨. 랜덤 날씨로 대체합니다.');
            setRandomWeatherUI();
        });
    } else {
        console.warn('Geolocation 미지원. 랜덤 날씨로 대체합니다.');
        setRandomWeatherUI();
    }

    // 매초 시계 갱신
    setInterval(updateClock, 1000);
}
