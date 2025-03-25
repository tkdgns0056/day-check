import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Header from "../components/Header";
import "../styles/Home.css";
import "../styles/RecurringSchedule.css";
import "../styles/RecurringManager.css";
import RecurringScheduleManager from "./RecurringScheduleManager";
import axios from "axios";

const Home = () => {
  // 날짜 관련
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  //일정 관련
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  // 편집 모드 관련
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [editedPriority, setEditedPriority] = useState("medium");
  
  //추가 기능 토글 관련
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [newDescription, setNewDescription] = useState("");

  // 시간 관련
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);
  const [startTime, setStartTime] = useState("09:00"); // 기본값 9시
  const [endTime, setEndTime] = useState("10:00");   // 기본값 10시
  const [showTimeInputs, setShowTimeInputs] = useState(false); // 시간 입력 표시 여부

  // 우선순위 가중치 부여 함수 (정렬용)
  const getPriorityWeight = (priority) => { 
    switch(priority) {
      case "high": return 1;
      case "medium": return 2;
      case "low": return 3;
      default: return 2;
    }
  };

  // 반복 패턴 라벨
  const getRecurrenceLabel = (pattern) => {
    switch(pattern) {
      case "DAILY": return "매일";
      case "WEEKLY": return "매주";
      case "WEEKDAY": return "평일";
      default: return "";
    }
  };

  // 일정 정렬 함수
  const sortSchedules = (items) => {
    return [...items].sort((a, b) => {
      // 1. 우선순위로 정렬
      const priorityA = getPriorityWeight(a.priority || 'medium');
      const priorityB = getPriorityWeight(b.priority || 'medium');
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 2. ID로 정렬 (최근 추가된 일정이 위로)
      return b.id - a.id;
    });
  };

  // 일정 클릭 시 설명 토글
  const toggleExpandSchedule = (id, e) => {
    // 클릭 이벤트가 버튼이나 체크박스에서 발생한 경우 설명 토글 방지
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
      return;
    }
    
    if (expandedScheduleId === id) {
      setExpandedScheduleId(null);
    } else {
      setExpandedScheduleId(id);
    }
  };

  const handlePrevDate = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      newDate.setHours(12, 0, 0, 0);
      return newDate;
    });
  };
  
  const handleNextDate = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      newDate.setHours(12, 0, 0, 0);
      return newDate;
    });
  };
  
  const handleDateChange = (date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    setSelectedDate(adjustedDate);
    setShowCalendar(false);
  };

  const formattedDate = selectedDate.toISOString().split("T")[0];


  const loadSchedules = () => {
    axios.get(`http://localhost:8080/api/schedules/${formattedDate}`)
      .then(response => {
        // 받아온 데이터를 우선순위에 따라 정렬
        setSchedules(sortSchedules(response.data));
      })
      .catch(error => console.log(error));
  };

  // 일반 일정 등록
  const handleAddSchedule = () => {
    if (newSchedule.trim() === "") return;
    
    // 선택한 날짜와 입력한 시간 결합
    const startDate = new Date(selectedDate);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    startDate.setHours(startHour, startMinute, 0);
    
    const endDate = new Date(selectedDate);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    endDate.setHours(endHour, endMinute, 0);
    
    // ISO 형식으로 변환 - 백엔드 DTO 포맷과 일치시킴 (yyyy-MM-dd'T'HH:mm)
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    axios.post("http://localhost:8080/api/schedules", {
      content: newSchedule,
      startDate: startDateStr,
      endDate: endDateStr,
      priority: newPriority,
      description: newDescription,
      completed: false
    })
    .then(response => {
      setSchedules(sortSchedules([...schedules, response.data]));
      setNewSchedule("");
      setNewPriority("medium");
      setNewDescription("");
      setShowDescription(false);
      setShowTimeInputs(false);
      setStartTime("09:00"); // 기본값으로 초기화
      setEndTime("10:00");
      setIsAdding(false);
    })
    .catch(error => console.error(error));
  };

  const handleDeleteSchedule = (id) => {
    // 일반 일정만 이 함수로 삭제 (반복 일정은 모달에서 처리)
    axios.delete(`http://localhost:8080/api/schedules/${id}`)
      .then(() => {
        setSchedules(schedules.filter(schedule => schedule.id !== id));
      })
      .catch(error => console.error(error));
  };

  const handleEditSchedule = (id, content, priority) => {
    setEditingId(id);
    setEditedText(content);
    setEditedPriority(priority || "medium");
  };

  const handleSaveEdit = (id) => {
    axios.put(`http://localhost:8080/api/schedules/${id}`, {
      content: editedText,
      priority: editedPriority
    })
    .then(response => {
      const updatedSchedules = schedules.map(schedule => 
        schedule.id === id ? response.data : schedule
      );
      // 수정 후 다시 정렬
      setSchedules(sortSchedules(updatedSchedules));
      setEditingId(null);
    })
    .catch(error => console.error(error));
  };

  // 우선순위 변경 함수
  const handleChangePriority = (id, priority) => {
    axios.patch(`http://localhost:8080/api/schedules/${id}/priority`, { priority })
      .then(response => {
        const updatedSchedules = schedules.map(schedule =>
          schedule.id === id ? response.data : schedule
        );
        // 우선순위 변경 후 다시 정렬
        setSchedules(sortSchedules(updatedSchedules));
      })
      .catch(error => {
        console.log("우선순위 변경 오류: ", error);
      });
  };

  // 일정 완료 상태 변경을 처리하는 함수 (별도 엔드포인트 사용)
  const handleToggleComplete = (id, e) => {
    // 이벤트 전파 중지 (설명 토글과 충돌 방지)
    e.stopPropagation();
    
    // 완료 상태 토글을 위한 별도 엔드포인트 호출
    axios.patch(`http://localhost:8080/api/schedules/${id}/complete`)
      .then(response => {
        const updatedSchedules = schedules.map(schedule =>
          schedule.id === id ? response.data : schedule
        );
        // 완료 상태 변경 후 다시 정렬
        setSchedules(sortSchedules(updatedSchedules));
      })
      .catch(error => {
        console.log("토글 오류: ", error);
      });
  };

  // 우선순위별 아이콘
  const getPriorityIcon = (priority) => {
    switch(priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🔵";
      default: return "🟡";
    }
  };

  // 반복 일정 관리 후 상태 업데이트
  const handleRecurringChange = () => {
    // 현재 날짜의 일정 다시 불러오기
    loadSchedules();
  };

  // 시간 포맷팅 함수 추가 - 컴포넌트 내 적절한 위치에 배치
  const formatTimeDisplay = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    // yyyy-MM-ddTHH:mm 형식의 문자열에서 시간만 추출
    const time = dateTimeStr.split('T')[1];
    if (!time) return '';
    
    return time; // HH:mm 형식으로 반환
  };

  return (
    <div>
      <Header />
      <div className="home-container">
        <div className="date-container">
          <button onClick={handlePrevDate} className="date-button">{"<"}</button>
          <span className="date-display" onClick={() => setShowCalendar(!showCalendar)}>
            📅 {formattedDate}
          </span>
          <button onClick={handleNextDate} className="date-button">{">"}</button>
        </div>

        {showCalendar && (
          <div className="calendar-container">
            <Calendar onChange={handleDateChange} value={selectedDate} />
          </div>
        )}

        <div className="action-buttons">
          <div className="main-actions">
            {!isAdding ? (
              <button className="add-button" onClick={() => setIsAdding(true)}>
                일정 추가하기
              </button>
            ) : (
              <div className="schedule-input-container">
                <input
                  type="text"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  placeholder="일정을 입력하세요"
                  autoFocus
                  className="schedule-input"
                />
                <select 
                  value={newPriority} 
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="priority-select"
                >
                  <option value="high">🔴 높음</option>
                  <option value="medium">🟡 중간</option>
                  <option value="low">🔵 낮음</option>
                </select>
                
                <div className="toggle-container">
                  <button 
                    type="button"
                    onClick={() => setShowTimeInputs(!showTimeInputs)}
                    className="toggle-button time-toggle-btn"
                  >
                    {showTimeInputs ? '시간 접기' : '시간 설정'}
                  </button>

                  
                  <button 
                    type="button"
                    onClick={() => setShowDescription(!showDescription)}
                    className="toggle-button description-toggle-btn"
                  >
                    {showDescription ? '설명 접기' : '설명 추가'}
                  </button>
                </div>
                
                {/* 시간 입력 필드 (토글됨) */}
                {showTimeInputs && (
                  <div className="time-input-container">
                    <div className="time-field">
                      <label>시작 시간</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="time-input"
                      />
                    </div>
                    <div className="time-field">
                      <label>종료 시간</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="time-input"
                      />
                    </div>
                  </div>
                )}
                                
                {/* 설명 입력 필드 (토글됨) */}
                {showDescription && (
                  <div className="description-input-container">
                    <textarea
                      placeholder="일정에 대한 설명을 입력하세요 (선택사항)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="description-textarea"
                      rows="3"
                    />
                  </div>
                )}
                
                <div className="input-buttons">
                  <button onClick={() => setIsAdding(false)} className="cancel-button">취소</button>
                  <button onClick={handleAddSchedule} className="submit-button">등록</button>
                </div>
              </div>
            )}
          </div>
          
          {/* 반복 일정 관리 버튼 */}
          <button 
            className="recurring-manage-button" 
            onClick={() => setShowRecurringManager(true)}
            title="반복 일정 관리"
          >
            🔄 반복 일정 관리
          </button>
        </div>

        {schedules.length > 0 ? (
          <ul className="schedule-list">
            {schedules.map((schedule) => (
              <li 
                key={schedule.id} 
                className={`schedule-item priority-${schedule.priority || 'medium'} ${schedule.completed ? "completed" : ''} ${schedule.recurrencePattern ? "recurring" : ''}`}
                onClick={(e) => toggleExpandSchedule(schedule.id, e)}
              >
                {editingId === schedule.id ? (
                  // 편집 모드 (반복 일정은 편집 모드에서 제외)
                  <>
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="edit-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <select 
                      value={editedPriority} 
                      onChange={(e) => setEditedPriority(e.target.value)}
                      className="priority-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="high">🔴 높음</option>
                      <option value="medium">🟡 중간</option>
                      <option value="low">🔵 낮음</option>
                    </select>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(schedule.id);
                      }}
                    >
                      ✔️
                    </button>
                  </>
                ) : (
                  // 보기 모드
                  <>
                    <input
                      type="checkbox"
                      checked={schedule.completed}
                      onChange={(e) => handleToggleComplete(schedule.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="schedule-content">
                      {schedule.content}
                      {/* 시간 정보 표시 */}
                      {schedule.startDate && schedule.endDate && (
                        <span className="schedule-time">
                          {" "}
                          <small className="time-display">
                            {formatTimeDisplay(schedule.startDate)} - {formatTimeDisplay(schedule.endDate)}
                          </small>
                        </span>
                      )}
                      {/* 설명이 있으면 아이콘 표시 */}
                      {schedule.description && 
                        <span className="has-description-icon" title="설명 보기">📝</span>
                      }
                      {schedule.recurrencePattern && (
                        <span className="recurring-indicator">
                          🔄 <span className="recurring-pattern">{getRecurrenceLabel(schedule.recurrencePattern)}</span>
                        </span>
                      )}
                    </span>
                    {/* 반복 일정이 아닐 때만 편집/삭제 버튼 표시 */}
                    {!schedule.recurrencePattern && (
                      <div className="button-group">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSchedule(schedule.id, schedule.content, schedule.priority);
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchedule(schedule.id);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {/* 설명 표시 영역 (확장 시에만 표시) */}
                {expandedScheduleId === schedule.id && schedule.description && (
                  <div className="schedule-description">
                    <p>{schedule.description}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-schedule">
            <p>등록된 일정이 없습니다</p>
            <p>+ 버튼을 눌러 새 일정을 추가해보세요</p>
          </div>
        )}
        
        {/* 반복 일정 관리 모달 */}
        {showRecurringManager && (
          <RecurringScheduleManager
            onClose={() => setShowRecurringManager(false)}
            onUpdate={handleRecurringChange}
          />
        )}
      </div>
      
    </div>
  );
};

export default Home;