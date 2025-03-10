import { useState } from 'react';
import axios from 'axios';
import '../styles/RecurringAddForm.css';

const RecurringAddForm = ({ onClose, onComplete }) => {
    const [formData, setFormData] = useState({
        content: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '10:00',
        recurrencePattern: 'DAILY',
        priority: 'medium',
        color: '#3788d8',
        description: ''  // 설명 필드 추가
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 입력 값 변경 처리
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 폼 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 유효성 검사
        if (!formData.content || !formData.startDate || !formData.endDate) {
            setError('제목과 시작/종료 날짜는 필수 입력 항목입니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // API 요청 데이터 준비 - 백엔드 API와 정확히 일치하는 포맷으로 날짜 변환
            // 백엔드는 yyyy-MM-dd'T'HH:mm 포맷을 기대함 (초 없이)
            const requestData = {
                content: formData.content,
                startDate: `${formData.startDate}T${formData.startTime}`,
                endDate: `${formData.endDate}T${formData.endTime}`,
                recurrencePattern: formData.recurrencePattern,
                priority: formData.priority,
                description: formData.description  // 설명 필드 전송
            };
            
            console.log('전송 데이터:', requestData);  // 디버깅용
            
            // API 호출로 반복 일정 생성
            await axios.post('http://localhost:8080/api/schedules/recurring', requestData);
            
            // 완료 콜백 호출
            onComplete();
        } catch (err) {
            console.error('반복 일정 생성 오류:', err);
            setError('반복 일정을 생성하는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
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
                        <label htmlFor="recurrencePattern">반복 패턴</label>
                        <select
                            id="recurrencePattern"
                            name="recurrencePattern"
                            value={formData.recurrencePattern}
                            onChange={handleChange}
                        >
                            <option value="DAILY">매일</option>
                            <option value="WEEKLY">매주</option>
                            <option value="WEEKDAY">평일</option>
                        </select>
                    </div>

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

                    {/* 설명 입력 - 강조 표시 */}
                    <div className="form-group highlighted-field">
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