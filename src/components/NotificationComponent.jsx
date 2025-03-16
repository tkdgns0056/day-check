// src/components/NotificationComponent.js
import React, { useState, useEffect } from 'react';
import '../styles/Notification.css';
import axios from 'axios';

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // SSE 연결 관련 상태
  const [eventSource, setEventSource] = useState(null);

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/notifications/unread');
      setNotifications(response.data);
    } catch (error) {
      console.error('알림 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림을 읽음으로 표시
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.patch(`http://localhost:8080/api/notifications/${id}/read`);
      // 알림 목록에서 해당 알림 제거
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };
  
  // 모든 알림을 읽음으로 표시
  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('http://localhost:8080/api/notifications/read-all');
      setNotifications([]);
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // SSE 연결 설정
  useEffect(() => {
    // 기존 연결이 있다면 종료
    if (eventSource) {
      eventSource.close();
    }
    
    // SSE 연결 설정
    const newEventSource = new EventSource('http://localhost:8080/api/sse/connect', { 
      withCredentials: true 
    });
    
    // 연결 성공 이벤트
    newEventSource.onopen = () => {
      console.log('SSE 연결이 열렸습니다.');
    };
    
    // 연결 오류 이벤트
    newEventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error);
    };
    
    // 'connect' 이벤트 리스너 (초기 연결 확인)
    newEventSource.addEventListener('connect', (event) => {
      console.log('SSE 초기 연결 메시지:', event.data);
    });
    
    // 'notification' 이벤트 리스너 (알림 수신)
    newEventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('새로운 알림 수신:', notification);
        
        // 알림 목록 업데이트
        setNotifications(prev => [notification, ...prev]);
        
        // 토스트 알림 표시 (커스텀 이벤트로 처리)
        const notificationEvent = new CustomEvent('notification', { 
          detail: notification 
        });
        window.dispatchEvent(notificationEvent);
        
        // 알림 소리 재생 (선택 사항)
        playNotificationSound();
      } catch (error) {
        console.error('알림 데이터 파싱 오류:', error);
      }
    });
    
    setEventSource(newEventSource);
    
    // 컴포넌트 마운트 시 알림 데이터 가져오기
    fetchNotifications();
    
    // 컴포넌트 언마운트 시 SSE 연결 종료
    return () => {
      if (newEventSource) {
        newEventSource.close();
      }
    };
  }, []);

  // 알림 토글
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // 알림 목록을 열 때 최신 데이터 가져오기
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  // 알림 소리 재생
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play();
    } catch (error) {
      console.error('알림 소리 재생 오류:', error);
    }
  };

  // 상대적 시간 표시 (예: "5분 전")
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${month}월 ${day}일`;
  };

  return (
    <div className="notification-container">
      <div 
        className={`notification-icon ${notifications.length > 0 ? 'has-notifications' : ''}`}
        onClick={toggleNotifications}
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </div>
      
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>알림</h3>
            {notifications.length > 0 && (
              <button onClick={handleMarkAllAsRead} className="read-all-button">
                모두 읽음
              </button>
            )}
            <button onClick={() => setShowNotifications(false)} className="close-button">×</button>
          </div>
          
          {loading ? (
            <div className="notification-loading">로딩 중...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">새로운 알림이 없습니다</div>
          ) : (
            <ul className="notification-list">
              {notifications.map(notification => (
                <li key={notification.id} className="notification-item">
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <small className="notification-time">
                      {getTimeAgo(notification.notificationTime)}
                    </small>
                  </div>
                  <button 
                    className="read-button"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  >
                    ✓
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationComponent;