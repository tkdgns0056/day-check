// SSE 연결 상태
let eventSource = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3초

// 알림 콜백 함수 저장
let notificationCallback = null;

// SSE 연결 시작
export const startSseConnection = (onNotification) => {
    if (isConnected || eventSource !== null) {
        console.log('SSE 연결이 이미 활성화되어 있습니다.');
        return;
    }

    // 알림 콜백 저장
    notificationCallback = onNotification;

    // EventSource 인스턴스 생성
    eventSource = new EventSource('http://localhost:8080/api/sse/connect', { withCredentials: true});

    // 연결 성공 이벤트
    eventSource.onopen = () => {
        console.log(`SSE 연결이 열렸습니다.`);
        isConnected = true;
        reconnectAttempts = 0;
    };

    // 연결 오류 이벤트
    eventSource.onerror = (error) => {
        console.error('SSE 연결 오류: ', error);
        isConnected = false;

        // EventSource 인스턴스 정리
        eventSource.close();
        eventSource = null;

        // 재연결 시도 (최대 시도 횟수  이내인 경우)
        if(reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`SSE 재연결 시도 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);

            setTimeout(() => {
                startSseConnection(onNotification);
            }, RECONNECT_DELAY);
        } else {
            console.log(`최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS})를 초과했습니다.`);
        }
    };

    // 'connect' 이벤트 리스너(초기 연결 확인)
    eventSource.addEventListener('connect', (event) => {
        console.log(`SSE 초기 연결 메시지:`, event.data);
    });

    // 'notification' 이벤트 리스너 (알림 수신)
    eventSource.addEventListener('notification', (event) => {
        try{
            const notification = JSON.parse(event.data);
            console.log('새로운 알림 수신:', notification);

            // 알림 콜백 함수 호출
            if(notificationCallback) {
                notificationCallback(notification);
            }
        } catch(error) {
            console.log('알림 데이터 파싱 오류:', error);
        }
    });

    return () => stopSseConnection();
 };

 // SSE 연결 종료
 export const stopSseConnection = () => {
    if(eventSource !== null) {
        eventSource.close();
        eventSource = null;
        isConnected = false;
        console.log('SSE 연결이 종료되었습니다.');
    }
 };

 // 연결 상태 확인
 export const isSseConnected = () => {
    return isConnected;
 };
