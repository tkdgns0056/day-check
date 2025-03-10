import { useState, useEffect } from "react";
import axios from 'axios';
import '../styles/RecurringManager.css';
import RecurringAddForm from "../components/RecuringAddForm";
import RecurringDetailModal from "../components/RecurringDetailModal";

const RecurringScheduleManager = ({ onClose, onUpdate }) => {
    const [recurringGroups, setRecurringGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // 반복 패턴 라벨
    const getRecurrenceLabel = (pattern) => {
        switch(pattern) {
            case "DAILY": return "매일";
            case "WEEKLY": return "매주";
            case "WEEKDAY": return "평일";
            default: return "";
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

    // 모든 반복 일정 그룹 로드
    useEffect(() => {
        fetchRecurringGroups();
    }, []);

    const fetchRecurringGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('http://localhost:8080/api/schedules/recurring/groups');
            
            // 불러온 반복 일정 그룹 처리
            setRecurringGroups(response.data);
        } catch (err) {
            console.error("반복 일정 그룹 조회 오류:", err);
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
        // 반복 일정 그룹 다시 불러오기
        fetchRecurringGroups();
        // 상위 컴포넌트에 변경 알림
        onUpdate();
    };

    // 반복 일정 삭제 처리
    const handleRecurringDelete = (parentId) => {
        // 삭제된 그룹 제거
        setRecurringGroups(prevGroups => 
            prevGroups.filter(group => group.parentSchedule.id !== parentId)
        );
        // 상위 컴포넌트에 변경 알림
        onUpdate();
    };

    if (loading && recurringGroups.length === 0) {
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
                    <button className="retry-button" onClick={fetchRecurringGroups}>다시 시도</button>
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

                {recurringGroups.length === 0 ? (
                    <div className="no-recurring-message">
                        <p>등록된 반복 일정이 없습니다.</p>
                        <p>위의 '새 반복 일정 추가' 버튼을 클릭하여 반복 일정을 만들어보세요.</p>
                    </div>
                ) : (
                    <div className="recurring-groups-list">
                        {recurringGroups.map((group) => (
                            <div 
                                key={group.parentSchedule.id} 
                                className={`recurring-group-item priority-${group.parentSchedule.priority || 'medium'}`}
                                onClick={() => handleScheduleClick(group.parentSchedule)}
                            >
                                <div className="recurring-group-header">
                                    <div className="recurring-group-priority">
                                        {getPriorityIcon(group.parentSchedule.priority)}
                                    </div>
                                    <div className="recurring-group-title">
                                        {group.parentSchedule.content}
                                    </div>
                                    <div className="recurring-group-pattern">
                                        🔄 {getRecurrenceLabel(group.parentSchedule.recurrencePattern)}
                                    </div>
                                </div>
                                
                                <div className="recurring-group-details">
                                    <div className="recurring-group-dates">
                                        <span className="recurring-detail-label">기간:</span>
                                        <span className="recurring-detail-value">
                                            {group.startDate} ~ {group.endDate}
                                        </span>
                                    </div>
                                    <div className="recurring-group-count">
                                        <span className="recurring-detail-label">일정 수:</span>
                                        <span className="recurring-detail-value">{group.scheduleCount}개</span>
                                    </div>
                                </div>
                                
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
                        fetchRecurringGroups();
                        onUpdate();
                    }}
                />
            )}
        </div>
    );
};

export default RecurringScheduleManager;