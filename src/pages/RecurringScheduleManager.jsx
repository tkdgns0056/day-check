import { useState, useEffect } from "react";
import { getAllRecurringSchedules } from '../services/RecurringScheduleService';
import '../styles/RecurringManager.css';
import RecurringAddForm from "../components/RecurringAddForm";
import RecurringDetailModal from "../components/RecurringDetailModal";

const RecurringScheduleManager = ({ onClose, onUpdate }) => {
    const [recurringSchedules, setRecurringSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // 반복 패턴 라벨
    const getRecurrenceLabel = (pattern) => {
        switch(pattern) {
            case "DAILY": return "매일";
            case "WEEKLY": return "매주";
            case "MONTHLY": return "매월";
            case "YEARLY": return "매년";
            default: return pattern || "알 수 없음";
        }
    };

    // 우선순위 아이콘
    const getPriorityIcon = (priority) => {
        switch(priority) {
            case "high": return "🔴";
            case "medium": return "🟡";
            case "low": return "🔵";
            default: return "🟡";
        }
    };

    // 모든 반복 일정 로드
    useEffect(() => {
        fetchRecurringSchedules();
    }, []);

    const fetchRecurringSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllRecurringSchedules();
            
            // 불러온 반복 일정 처리
            setRecurringSchedules(response);
        } catch (err) {
            console.error("반복 일정 조회 오류:", err);
            setError("반복 일정을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 반복 일정 클릭 처리
    const handleScheduleClick = (schedule) => {
        setSelectedSchedule(schedule);
    };

    // 반복 일정 업데이트 처리
    const handleRecurringUpdate = () => {
        // 반복 일정 다시 불러오기
        fetchRecurringSchedules();
        // 상위 컴포넌트에 변경 알림
        onUpdate();
    };

    // 반복 일정 삭제 처리
    const handleRecurringDelete = (id) => {
        // 삭제된 반복 일정 제거
        setRecurringSchedules(prevSchedules => 
            prevSchedules.filter(schedule => schedule.id !== id)
        );
        // 상위 컴포넌트에 변경 알림
        onUpdate();
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        if (!dateString) return '날짜 없음';
        
        try {
            // ISO 형식인 경우 T 기준으로 분리
            if (typeof dateString === 'string' && dateString.includes('T')) {
                return dateString.split('T')[0];
            }
            
            // 다른 형식의 문자열이나 타임스탬프인 경우
            const date = new Date(dateString);
            
            // 날짜가 유효한지 확인
            if (isNaN(date.getTime())) {
                return '날짜 형식 오류';
            }
            
            // YYYY-MM-DD 형식으로 변환
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.error("날짜 형식 변환 오류:", e);
            return '날짜 변환 오류';
        }
    };

    if (loading && recurringSchedules.length === 0) {
        return (
            <div className="recurring-manager-overlay">
                <div className="recurring-manager-container">
                    <h2>반복 일정 관리</h2>
                    <div className="loading-indicator">반복 일정을 불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recurring-manager-overlay">
                <div className="recurring-manager-container">
                    <h2>반복 일정 관리</h2>
                    <div className="error-message">{error}</div>
                    <button className="retry-button" onClick={fetchRecurringSchedules}>다시 시도</button>
                    <button className="close-button" onClick={onClose}>닫기</button>
                </div>
            </div>
        );
    }

    return (
        <div className="recurring-manager-overlay">
            <div className="recurring-manager-container">
                <div className="recurring-manager-header">
                    <h2>반복 일정 관리</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {/* 반복 일정 추가 버튼 */}
                <div className="recurring-manager-actions">
                    <button 
                        className="add-recurring-button" 
                        onClick={() => setShowAddForm(true)}
                    >
                        + 새 반복 일정 추가
                    </button>
                </div>

                {recurringSchedules.length === 0 ? (
                    <div className="no-recurring-message">
                        <p>등록된 반복 일정이 없습니다.</p>
                        <p>위의 '새 반복 일정 추가' 버튼을 클릭하여 반복 일정을 만들어보세요.</p>
                    </div>
                ) : (
                    <div className="recurring-groups-list">
                        {recurringSchedules.map((schedule) => (
                            <div 
                                key={schedule.id} 
                                className={`recurring-group-item priority-${schedule.priority || 'medium'}`}
                                onClick={() => handleScheduleClick(schedule)}
                            >
                                <div className="recurring-group-header">
                                    <div className="recurring-group-priority">
                                        {getPriorityIcon(schedule.priority)}
                                    </div>
                                    <div className="recurring-group-title">
                                        {schedule.content}
                                    </div>
                                    <div className="recurring-group-pattern">
                                        🔄 {getRecurrenceLabel(schedule.patternType)}
                                        {schedule.interval > 1 && ` (${schedule.interval}${
                                            schedule.patternType === 'DAILY' ? '일' : 
                                            schedule.patternType === 'WEEKLY' ? '주' : 
                                            schedule.patternType === 'MONTHLY' ? '개월' : '년'
                                        } 간격)`}
                                    </div>
                                </div>
                                
                                <div className="recurring-group-details">
                                    <div className="recurring-group-dates">
                                        <span className="recurring-detail-label">기간:</span>
                                        <span className="recurring-detail-value">
                                            {formatDate(schedule.startDate)} ~ {formatDate(schedule.endDate)}
                                        </span>
                                    </div>
                                    <div className="recurring-group-time">
                                        <span className="recurring-detail-label">시간:</span>
                                        <span className="recurring-detail-value">
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>
                                </div>
                                
                                {schedule.description && (
                                    <div className="recurring-group-description">
                                        <span className="recurring-detail-label">설명:</span>
                                        <span className="recurring-detail-value description-text">
                                            {schedule.description.length > 50 
                                                ? `${schedule.description.substring(0, 50)}...` 
                                                : schedule.description}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedSchedule && (
                <RecurringDetailModal
                    schedule={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                    onUpdate={handleRecurringUpdate}
                    onDelete={handleRecurringDelete}
                />
            )}

            {showAddForm && (
                <RecurringAddForm
                    onClose={() => setShowAddForm(false)}
                    onComplete={() => {
                        setShowAddForm(false);
                        fetchRecurringSchedules();
                        onUpdate();
                    }}
                />
            )}
        </div>
    );
};

export default RecurringScheduleManager;