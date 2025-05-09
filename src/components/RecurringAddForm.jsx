import { useState } from 'react';
import { createRecurringSchedule } from '../services/RecurringScheduleService';
import '../styles/RecurringAddForm.css';

const RecurringAddForm = ({ onClose, onComplete }) => {
    const [formData, setFormData] = useState({
        content: '',
        patternType: 'DAILY',  
        interval: 1,
        daysOfWeek: [], // 변경: dayOfWeek 문자열에서 daysOfWeek 배열로 변경
        dayOfMonth: null,
        weekOfMonth: null,
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '10:00',
        priority: 'medium',
        description: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [additionalFields, setAdditionalFields] = useState(false);

    // 입력 값 변경 처리
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // 패턴 타입 변경 시 관련 필드 초기화
        if (name === 'patternType') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                daysOfWeek: value === 'WEEKLY' ? ['MONDAY'] : [], // 변경: 기본값으로 월요일 배열 설정
                dayOfMonth: value === 'MONTHLY' ? 1 : null,
                weekOfMonth: null
            }));
        } else if (name === 'dayOfWeek') {
            // 단일 요일 선택 처리
            setFormData(prev => ({
                ...prev,
                daysOfWeek: [value] // 단일 요일을 배열로 변환
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // 다중 요일 선택 처리 (체크박스 방식)
    const handleDayOfWeekChange = (day) => {
        setFormData(prev => {
            const currentDays = [...prev.daysOfWeek];
            
            // 이미 선택된 요일인 경우 제거, 아니면 추가
            if (currentDays.includes(day)) {
                return {
                    ...prev,
                    daysOfWeek: currentDays.filter(d => d !== day)
                };
            } else {
                return {
                    ...prev,
                    daysOfWeek: [...currentDays, day]
                };
            }
        });
    };

    // 폼 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 유효성 검사
        if (!formData.content) {
            setError('제목은 필수 입력 항목입니다.');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            setError('시작 날짜와 종료 날짜는 필수 입력 항목입니다.');
            return;
        }

        // WEEKLY 패턴이지만 요일을 선택하지 않은 경우
        if (formData.patternType === 'WEEKLY' && formData.daysOfWeek.length === 0) {
            setError('주간 반복 패턴에는 최소 하나의 요일을 선택해야 합니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // API 요청 데이터 준비
            const requestData = {
                ...formData,
                // ISO 형식으로 변환 (YYYY-MM-DDTHH:mm)
                startDate: `${formData.startDate}T${formData.startTime}`,
                endDate: `${formData.endDate}T${formData.endTime}`
            };
            
            // patternType에 따라 필요한 필드만 포함
            if (formData.patternType !== 'WEEKLY') {
                delete requestData.daysOfWeek;
            }
            
            if (formData.patternType !== 'MONTHLY') {
                delete requestData.dayOfMonth;
                delete requestData.weekOfMonth;
            }
            
            console.log('전송 데이터:', requestData);
            
            // 반복 일정 생성 서비스 호출
            await createRecurringSchedule(requestData);
            
            // 완료 콜백 호출
            onComplete();
        } catch (err) {
            console.error('반복 일정 생성 오류:', err);
            setError('반복 일정을 생성하는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 요일 선택 UI 랜더링 - 체크박스 방식으로 변경
    const renderDaysOfWeekSelection = () => {
        const days = [
            { value: 'MONDAY', label: '월' },
            { value: 'TUESDAY', label: '화' },
            { value: 'WEDNESDAY', label: '수' },
            { value: 'THURSDAY', label: '목' },
            { value: 'FRIDAY', label: '금' },
            { value: 'SATURDAY', label: '토' },
            { value: 'SUNDAY', label: '일' }
        ];
        
        return (
            <div className="days-of-week-selection">
                {days.map(day => (
                    <label key={day.value} className="day-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.daysOfWeek.includes(day.value)}
                            onChange={() => handleDayOfWeekChange(day.value)}
                        />
                        {day.label}
                    </label>
                ))}
            </div>
        );
    };

    // 월 옵션 렌더링 (1일~31일)
    const renderDayOfMonthOptions = () => {
        const options = [];
        for (let i = 1; i <= 31; i++) {
            options.push(
                <option key={i} value={i}>{i}일</option>
            );
        }
        return options;
    };

    // 주차 옵션 렌더링 (1주~5주)
    const renderWeekOfMonthOptions = () => {
        const options = [];
        for (let i = 1; i <= 5; i++) {
            options.push(
                <option key={i} value={i}>{i}주차</option>
            );
        }
        return options;
    };

    return (
        <div className="recurring-form-overlay">
            <div className="recurring-form-container">
                <div className="recurring-form-header">
                    <h2>새 반복 일정 추가</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="recurring-form">
                    {/* 제목 입력 */}
                    <div className="form-group">
                        <label htmlFor="content">일정 제목</label>
                        <input
                            type="text"
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="일정 제목을 입력하세요"
                            required
                        />
                    </div>

                    {/* 날짜 및 시간 입력 */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">시작 날짜</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="startTime">시작 시간</label>
                            <input
                                type="time"
                                id="startTime"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="endDate">종료 날짜</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endTime">종료 시간</label>
                            <input
                                type="time"
                                id="endTime"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* 반복 패턴 선택 */}
                    <div className="form-group">
                        <label htmlFor="patternType">반복 패턴</label>
                        <select
                            id="patternType"
                            name="patternType"
                            value={formData.patternType}
                            onChange={handleChange}
                        >
                            <option value="DAILY">매일</option>
                            <option value="WEEKLY">매주</option>
                            <option value="MONTHLY">매월</option>
                            <option value="YEARLY">매년</option>
                        </select>
                    </div>

                    {/* 반복 간격 */}
                    <div className="form-group">
                        <label htmlFor="interval">반복 간격</label>
                        <select
                            id="interval"
                            name="interval"
                            value={formData.interval}
                            onChange={handleChange}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 14, 21, 28].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    {/* 패턴 타입에 따른 추가 필드 */}
                    {formData.patternType === 'WEEKLY' && (
                        <div className="form-group">
                            <label>반복 요일</label>
                            {renderDaysOfWeekSelection()}
                        </div>
                    )}

                    {formData.patternType === 'MONTHLY' && (
                        <div className="form-group">
                            <label htmlFor="dayOfMonth">매월 반복일</label>
                            <select
                                id="dayOfMonth"
                                name="dayOfMonth"
                                value={formData.dayOfMonth || ''}
                                onChange={handleChange}
                            >
                                {renderDayOfMonthOptions()}
                            </select>
                        </div>
                    )}

                    {/* 우선순위 선택 */}
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

                    {/* 추가 필드 토글 버튼 */}
                    <div className="form-group toggle-section">
                        <button
                            type="button"
                            className="toggle-button"
                            onClick={() => setAdditionalFields(!additionalFields)}
                        >
                            {additionalFields ? '추가 옵션 숨기기 ▲' : '추가 옵션 보기 ▼'}
                        </button>
                    </div>

                    {/* 추가 필드 (토글) */}
                    {additionalFields && (
                        <div className="additional-fields">
                            {/* 설명 입력 */}
                            <div className="form-group">
                                <label htmlFor="description">설명 (선택사항)</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="일정에 대한 추가 설명을 입력하세요"
                                    rows="3"
                                />
                            </div>
                        </div>
                    )}

                    {/* 오류 메시지 */}
                    {error && <div className="error-message">{error}</div>}

                    {/* 제출 버튼 */}
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-button" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? '생성 중...' : '일정 생성'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecurringAddForm;