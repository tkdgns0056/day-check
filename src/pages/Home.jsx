import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Header from "../components/Header";
import ScheduleList from "../components/ScheduleList";
import "../styles/Home.css";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handlePrevDate = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
  };
  
  const handleNextDate = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
  };
  
  const handleDateChange = (date) => {
    const adjustedDate = new Date(date);
    // 시간 보정 하는 이유
    // 달력 선택 시 UTC 기준으로 들어오기 떄문에 전날로 잡힘 계속 (9시간 차이)
    // (!2,0,0,0) 적용해서 시간 보정 하였음. 
    adjustedDate.setHours(12, 0, 0, 0);  
  
    setSelectedDate(adjustedDate);
    setShowCalendar(false);
  };
  // 날짜 포맷 변경 (YYYY-MM-DD)
  const formattedDate = selectedDate.toISOString().split("T")[0];

  // 일정 추가
  const handleAddSchedule = () => {
    if (newSchedule.trim() === "") return;
    setSchedules([...schedules, { id: Date.now(), title: newSchedule, date: formattedDate }]);
    setNewSchedule("");
    setIsAdding(false);
  };

  // 선택한 날짜에 해당하는 일정만 필터링
  const filteredSchedules = schedules.filter((schedule) => schedule.date === formattedDate);

  return (
    <div>
      <Header />
      <div className="home-container">
        {/* 날짜 네비게이션 */}
        <div className="date-container">
          <button onClick={handlePrevDate} className="date-button">{"<"}</button>
          <span className="date-display">
            📅 <span onClick={() => setShowCalendar(!showCalendar)}>{formattedDate}</span>
          </span>
          <button onClick={handleNextDate} className="date-button">{">"}</button>
        </div>

        {/* 달력 표시 */}
        {showCalendar && (
          <div className="calendar-container">
            <Calendar onChange={handleDateChange} value={selectedDate} />
          </div>
        )}

        {/* 일정 추가 버튼 */}
        {!isAdding ? (
          <button className="add-button" onClick={() => setIsAdding(true)}>
            + 일정 추가하기
          </button>
        ) : (
          <div className="schedule-input-container">
            <input
              type="text"
              value={newSchedule}
              onChange={(e) => setNewSchedule(e.target.value)}
              placeholder="일정을 입력하세요"
              autoFocus
            />
            <button onClick={handleAddSchedule}>등록</button>
          </div>
        )}

        {/* 일정 리스트 */}
        <ScheduleList schedules={filteredSchedules} setSchedules={setSchedules} />
      </div>
    </div>
  );
};

export default Home;