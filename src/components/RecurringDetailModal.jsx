import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RecurringDetailModal.css';

const RecurringDetailModal = ({ schedule, onClose, onUpdate, onDelete }) => {
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState(schedule);
    const [formData, setFormData] = useState({
        content: schedule.content || '',
        description: schedule.description || '',
        priority: schedule.priority || 'medium',
        color: schedule.color || '#3788d8'
    });


    // 요일 정보 표시 부분 수정
    const formatDaysOfWeek = (daysOfWeek) => {
    if (!daysOfWeek || daysOfWeek.length === 0) return '';
    
    const dayNames = {
        'MONDAY': '월', 
        'TUESDAY': '화', 
        'WEDNESDAY': '수', 
        'THURSDAY': '목', 
        'FRIDAY': '금', 
        'SATURDAY': '토', 
        'SUNDAY': '일'
    };
    
    return daysOfWeek.map(day => dayNames[day] || day).join(', ');
};


    // 수정 후 스케줄 데이터 다시 불러오기
    const refreshScheduleData = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/schedules/recurring/${schedule.id}`);
            if (response.data && response.data.length > 0) {
                // 부모 스케줄 정보 업데이트
                setCurrentSchedule(response.data[0]);
            }
        } catch (err) {
            console.error('스케줄 정보 조회 오류:', err);
        }
    };

    // 날짜 포맷팅 함수 - 다양한 형식의 날짜 처리
    const formatDate = (dateString) => {
        if (!dateString) return '날짜 없음';
        
        try {
            // 이미 YYYY-MM-DD 형식이면 그대로 반환
            if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }
            
            // ISO 형식인 경우 T 기준으로 분리
            if (typeof dateString === 'string' && dateString.includes('T')) {
                return dateString.split('T')[0];
            }
            
            // 다른 형식의 문자열이나 타임스탬프인 경우
            const date = new Date(dateString);
            
            // 날짜가 유효한지 확인
            if (isNaN(date.getTime())) {
                console.log("유효하지 않은 날짜:", dateString);
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

    // schedule 속성이 변경될 때 formData 업데이트
    useEffect(() => {
        setCurrentSchedule(schedule);
        setFormData({
            content: schedule.content || '',
            description: schedule.description || '',
            priority: schedule.priority || 'medium',
            color: schedule.color || '#3788d8'
        });
    }, [schedule]);

    // 반복 패턴 라벨
    const getRecurrenceLabel = (pattern) => {
        switch(pattern) {
            case "DAILY": return "매일";
            case "WEEKLY": return "매주";
            case "WEEKDAY": return "평일";
            default: return pattern;
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

    // 입력 값 변경 처리
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 수정 모드 전환
    const handleEditClick = () => {
        setIsEditing(true);
    };

    // 수정 취소
    const handleCancelEdit = () => {
        // 원래 데이터 되돌리기
        setFormData({
            content: currentSchedule.content || '',
            description: currentSchedule.description || '',
            priority: currentSchedule.priority || 'medium',
            color: currentSchedule.color || '#3788d8'
        });
        setIsEditing(false);
    };

    // 수정 사항 저장 (PUT 메서드 사용)
    const handleSaveEdit = async () => {
        if(!formData.content) {
            setError('제목은 필수 입력 항목입니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 서버가 기대하는 형식에 맞춘 데이터 준비
            const updateData = {
                content: formData.content,
                description: formData.description,
                priority: formData.priority,
                color: formData.color,
                // 기존 값들 유지 (서버에서 필요로 하는 필드들)
                recurrencePattern: currentSchedule.recurrencePattern,
                startDate: currentSchedule.startDate,
                endDate: currentSchedule.endDate
            };

            // PUT 메서드로 변경 (PATCH 대신)
            await axios.put(`http://localhost:8080/api/schedules/recurring/${currentSchedule.id}`, updateData);
            
            // 수정된 스케줄 데이터 바로 업데이트
            setCurrentSchedule(prev => ({
                ...prev,
                content: formData.content,
                description: formData.description,
                priority: formData.priority,
                color: formData.color
            }));

            // 서버에서 최신 데이터 다시 불러오기
            await refreshScheduleData();
            
            // 수정 완료 후 콜백 호출
            onUpdate();
            setIsEditing(false);
        } catch (err) {
            console.error(`반복 일정 수정 오류:`, err);
            setError(`반복 일정을 수정하는 중 오류가 발생했습니다.`);
        } finally {
            setLoading(false);
        }
    };

    // 반복 일정 삭제 처리
    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // 반복 일정 그룹 삭제 API 호출
            await axios.delete(`http://localhost:8080/api/schedules/recurring/${currentSchedule.id}`);
            
            // 삭제 완료 후 콜백 호출
            onDelete(currentSchedule.id);
            onClose();
        } catch (err) {
            console.error('반복 일정 삭제 오류:', err);
            setError('반복 일정을 삭제하는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recurring-detail-overlay">
            <div className="recurring-detail-container">
                <div className="recurring-detail-header">
                    <h2>반복 일정 상세</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="recurring-detail-content">
                    {isEditing ? (
                        // 수정 모드 UI
                        <div className="recurring-edit-form">
                            <div className="form-group">
                                <label htmlFor="content">일정 제목</label>
                                <input
                                    type="text"
                                    id="content"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="일정 제목을 입력하세요"
                                />
                            </div>

                            {schedule.patternType === 'WEEKLY' && schedule.daysOfWeek && (
                            <div className="detail-info-item">
                                <span className="info-label">반복 요일:</span>
                                <span className="info-value">{formatDaysOfWeek(schedule.daysOfWeek)}</span>
                            </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="description">설명</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="일정에 대한 설명을 입력하세요"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="priority">우선순위</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="high">높음 🔴</option>
                                    <option value="medium">중간 🟡</option>
                                    <option value="low">낮음 🔵</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="color">색상</label>
                                <input
                                    type="color"
                                    id="color"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="edit-actions">
                                <button 
                                    className="cancel-button"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    취소
                                </button>
                                <button 
                                    className="save-button"
                                    onClick={handleSaveEdit}
                                    disabled={loading}
                                >
                                    {loading ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // 조회 모드 UI
                        <>
                            <div className="recurring-detail-title">
                                <div className="priority-indicator">
                                    {getPriorityIcon(currentSchedule.priority)}
                                </div>
                                <h3>{currentSchedule.content}</h3>
                            </div>

                            <div className="recurring-detail-info">
                                <div className="detail-info-item">
                                    <span className="info-label">반복 패턴:</span>
                                    <span className="info-value">{getRecurrenceLabel(currentSchedule.recurrencePattern)}</span>
                                </div>
                                
                                <div className="detail-info-item">
                                    <span className="info-label">시작일:</span>
                                    <span className="info-value">{formatDate(currentSchedule.startDate)}</span>
                                </div>
                                
                                <div className="detail-info-item">
                                    <span className="info-label">종료일:</span>
                                    <span className="info-value">{formatDate(currentSchedule.endDate)}</span>
                                </div>
                                
                                {currentSchedule.description && (
                                    <div className="detail-description">
                                        <h4>설명</h4>
                                        <p>{currentSchedule.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="recurring-detail-actions">
                                <button 
                                    className="action-button edit-button"
                                    onClick={handleEditClick}
                                    disabled={loading}
                                >
                                    수정하기
                                </button>
                                
                                <button 
                                    className="action-button delete-button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    {confirmDelete ? '정말 삭제하시겠습니까?' : '반복 일정 삭제'}
                                </button>
                            </div>
                        </>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </div>
            </div>
        </div>
    );
};

export default RecurringDetailModal;