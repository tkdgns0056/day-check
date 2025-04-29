import { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Header from "../components/Header";
import "../styles/Home.css";
import "../styles/RecurringSchedule.css";
import "../styles/RecurringManager.css";
import RecurringScheduleManager from "./RecurringScheduleManager";
import { getRecurringSchedulesByDate } from "../services/RecurringScheduleService";
import { debounce } from "lodash";
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

  // 날짜가 변경되거나 컴포넌트가 마운트 될 때 알정 로드
  useEffect(() => {
    console.log("날짜 변경 감지:", formattedDate);
    loadSchedules();
  }, [selectedDate]); // selectedDate가 변경 될 때마다 실행

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
      case "MONTHLY": return "매월";
      case "YEARLY": return "매년";
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


  // 일정 로드 함수 (일반 일정 + 반복 일정)
const loadSchedules = async () => {
  try {
    // 토큰 가져오기
    const token = localStorage.getItem('accessToken');

    // 토큰이 있을 경우만 요청에 포함
    if (!token) {
      console.error(`인증 토큰이 없습니다.`);
      return;
    }

    // 1. 일반 일정 로드
    const regularSchedulesResponse = await axios.get(
      `http://localhost:8080/api/schedules/${formattedDate}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    let allSchedules = [...regularSchedulesResponse.data];

    // 2. 반복 일정 로드 - getRecurringSchedulesByDate 함수 사용
    try {
      const recurringSchedulesResponse = await getRecurringSchedulesByDate(formattedDate);

      // 반복 일정이 있으면 처리
      if (recurringSchedulesResponse && recurringSchedulesResponse.length > 0) {
        // 반복 일정에는 특별한 구분자 추가 (isRecurring)
        const formattedRecurringSchedules = recurringSchedulesResponse.map(schedule => ({
          ...schedule,
          isRecurring: true
        }));

        // 모든 일정에 추가
        allSchedules = [...allSchedules, ...formattedRecurringSchedules];
      }
    } catch (recurringError) {
      console.error('반복 일정 로드 오류:', recurringError);
    }

    // 모든 일정 정렬 후 상태 업데이트
    setSchedules(sortSchedules(allSchedules));

  } catch (error) {
    console.error('일정 로드 오류:', error);
  }
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

  // 일정 완료 상태 변경을 처리하는 함수
const handleToggleComplete = (id, e) => {
  // 이벤트 전파 중지 (설명 토글과 충돌 방지)
  e.stopPropagation();

  // 반복 일정인 경우 완료 상태 변경 불가
  const schedule = schedules.find(s => s.id === id);
  if (schedule?.isRecurring) {
    alert("반복 일정의 완료 상태는 변경할 수 없습니다. 해당 날짜에 대한 예외를 추가해주세요.");
    return;
  }
  
  // 낙관적 업데이트(먼저 UI 상태 변경)
  const updatedSchedules = schedules.map(schedule => 
    schedule.id === id 
      ? { ...schedule, completed: !schedule.completed }
      : schedule
  );
  setSchedules(updatedSchedules);

  debouncedUpdateComplete(id);
};

  // 디바운스 함수 생성
  const debouncedUpdateComplete = useCallback(
    debounce((id) => {

      // 토큰 가져오기
      const token = localStorage.getItem('accessToken');

      axios.patch(`http://localhost:8080/api/schedules/${id}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
        .then(response => {
          console.log('완료 상태 변경 응답:', response);
          // 서버 응답 후 최종 상태 확정
          const updatedSchedules = schedules.map(schedule =>
                schedule.id === id ? response.data : schedule
          );
          setSchedules(sortSchedules(updatedSchedules));
        })
        .catch(error => {
          
          console.error("토글 오류 전체 정보: ", error);
          console.error("에러 응답:", error.response);
          console.error("에러 요청:", error.request);
          console.error("에러 메시지:", error.message);

          setSchedules(prevScheules => 
            prevScheules.map(schedule =>
                schedule.id === id
                    ? { ...schedule, completed: !schedule.completed }
                    : schedule
              )
            );
            alert("일정 상태 변경에 실패했습니다. 다시 시도해주세요.");
        });
    }, 300),
    [schedules]
  );

  //   // 완료 상태 토글을 위한 별도 엔드포인트 호출
  //   axios.patch(`http://localhost:8080/api/schedules/${id}/complete`)
  //     .then(response => {
  //       const updatedSchedules = schedules.map(schedule =>
  //         schedule.id === id ? response.data : schedule
  //       );
  //       // 완료 상태 변경 후 다시 정렬
  //       setSchedules(sortSchedules(updatedSchedules));
  //     })
  //     .catch(error => {
  //       console.log("토글 오류: ", error);
  //     });
  // };

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
    className={`schedule-item priority-${schedule.priority || 'medium'} ${schedule.completed ? "completed" : ''} ${schedule.isRecurring ? "recurring" : ''}`}
    onClick={(e) => toggleExpandSchedule(schedule.id, e)}
  >
    {/* 일정 표시 내용 */}
    <input
      type="checkbox"
      checked={schedule.completed || false}
      onChange={(e) => handleToggleComplete(schedule.id, e)}
      onClick={(e) => e.stopPropagation()}
      disabled={schedule.isRecurring} // 반복 일정은 체크박스 비활성화
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
      
      {/* 반복 일정 표시 */}
      {schedule.isRecurring && (
        <span className="recurring-indicator">
          🔄 <span className="recurring-pattern">{getRecurrenceLabel(schedule.patternType)}</span>
        </span>
      )}
    </span>
    
    {/* 반복 일정이 아닐 때만 편집/삭제 버튼 표시 */}
    {!schedule.isRecurring && (
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