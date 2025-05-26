import * as env from '../environment';

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
export function init() {
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

