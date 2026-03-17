// background.js - 출퇴근 알림 관리

// =========================
// Alarm Helper Functions
// =========================

const ALARM_SCHEDULE = {
    'morning-checkin': { hour: 8, minute: 58 },
    'evening-prepare': { hour: 17, minute: 50 },
    'evening-checkout': { hour: 18, minute: 0 }
};

// 예약 시각 기준 10분이 지나면 오래된 알람으로 간주
const STALE_ALARM_GRACE_MS = 10 * 60 * 1000;

// 다음 평일(월~금) 지정 시:분의 타임스탬프
function getNextWeekdayTime(hour, minute) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

    // 이미 지났으면 +1일
    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }
    // 토(6), 일(0) 제외하고 평일까지 이동
    while (target.getDay() === 0 || target.getDay() === 6) {
        target.setDate(target.getDate() + 1);
    }
    return target.getTime();
}

// 주말 여부
function isWeekend(d = new Date()) {
    const day = d.getDay(); // 0:일, 6:토
    return day === 0 || day === 6;
}

// 주말이면 다음 평일 시각으로 재예약만 하고 true 반환(= 알림 스킵)
function skipWeekendAndReschedule(name, hour, minute) {
    if (!isWeekend()) return false; // 평일 → 스킵 안 함
    chrome.alarms.create(name, { when: getNextWeekdayTime(hour, minute) });
    console.log(`주말이므로 "${name}" 알람을 다음 평일로 재예약`);
    return true; // 주말이라 재예약만
}

function isStaleAlarm(alarm) {
    if (typeof alarm.scheduledTime !== 'number') return false;
    return (Date.now() - alarm.scheduledTime) >= STALE_ALARM_GRACE_MS;
}

// =========================
// Alarm Initialization
// =========================

// 확장프로그램 설치 또는 업데이트 시 알람 설정
chrome.runtime.onInstalled.addListener(() => {
    console.log('SSABAP 확장프로그램 설치됨 - 알람 설정 시작');
    setupAlarms();
});

// 확장프로그램 시작 시에도 알람 설정
chrome.runtime.onStartup.addListener(() => {
    console.log('SSABAP 확장프로그램 시작됨 - 알람 설정');
    setupAlarms();
});

// 알람 설정 함수
function setupAlarms() {
    // 기존 알람 모두 제거
    chrome.alarms.clearAll(() => {
        console.log('기존 알람 모두 제거됨');

        // 평일 알람 3종
        chrome.alarms.create('morning-checkin', { when: getNextWeekdayTime(ALARM_SCHEDULE['morning-checkin'].hour, ALARM_SCHEDULE['morning-checkin'].minute) });
        chrome.alarms.create('evening-prepare', { when: getNextWeekdayTime(ALARM_SCHEDULE['evening-prepare'].hour, ALARM_SCHEDULE['evening-prepare'].minute) });
        chrome.alarms.create('evening-checkout', { when: getNextWeekdayTime(ALARM_SCHEDULE['evening-checkout'].hour, ALARM_SCHEDULE['evening-checkout'].minute) });

        console.log('모든 알람 설정 완료');
    });
}

// =========================
// Alarm Handler
// =========================

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('알람 발생:', alarm.name);

    const schedule = ALARM_SCHEDULE[alarm.name];
    if (!schedule) return; // 등록되지 않은 알람은 무시

    // 브라우저/확장 재시작 직후 과거 알람이 늦게 들어오면 스킵하고 다음 평일로 재예약
    if (isStaleAlarm(alarm)) {
        chrome.alarms.create(alarm.name, { when: getNextWeekdayTime(schedule.hour, schedule.minute) });
        console.log(`오래된 알람 스킵: "${alarm.name}" (${new Date(alarm.scheduledTime).toLocaleString()})`);
        return;
    }

    let title = '';
    let message = '';
    let iconUrl = 'icons/icon128.png';
    let notificationId = '';

    if (alarm.name === 'morning-checkin') {
        // 주말 무음: 재예약만
        if (skipWeekendAndReschedule('morning-checkin', schedule.hour, schedule.minute)) return;

        // 다음 평일 재예약
        chrome.alarms.create('morning-checkin', { when: getNextWeekdayTime(schedule.hour, schedule.minute) });
        title = '☀️ 입실 체크';
        message = '입실하셨나요? 좋은 하루 되세요! 😊';
        notificationId = 'morning-noti';
    } else if (alarm.name === 'evening-prepare') {
        if (skipWeekendAndReschedule('evening-prepare', schedule.hour, schedule.minute)) return;

        chrome.alarms.create('evening-prepare', { when: getNextWeekdayTime(schedule.hour, schedule.minute) });
        title = '⏰ 퇴실 준비';
        message = '곧 퇴실 시간입니다! 준비하세요~ 🎒';
        notificationId = 'evening-prepare-noti';
    } else if (alarm.name === 'evening-checkout') {
        if (skipWeekendAndReschedule('evening-checkout', schedule.hour, schedule.minute)) return;

        chrome.alarms.create('evening-checkout', { when: getNextWeekdayTime(schedule.hour, schedule.minute) });
        title = '🌙 퇴실 체크';
        message = '퇴실하세요!! 오늘도 수고하셨습니다! 👏';
        notificationId = 'evening-checkout-noti';
    }

    if (!notificationId) return; // 방어

    // 알림 표시
    chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: iconUrl,
        title: title,
        message: message,
        priority: 2
    }, (notificationId) => {
        console.log('알림 표시됨:', notificationId);
    });
});

// 알림 클릭 시 처리 (선택사항)
chrome.notifications.onClicked.addListener((notificationId) => {
    console.log('알림 클릭됨:', notificationId);
    // 필요시 확장프로그램 팝업 열기 등의 동작 추가 가능
});
