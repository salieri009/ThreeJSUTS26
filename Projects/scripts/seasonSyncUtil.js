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