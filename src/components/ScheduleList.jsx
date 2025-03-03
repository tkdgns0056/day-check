import { useState } from "react";
import "../styles/ScheduleList.css";

// 구조분해 할당으로 스케줄 파라미터 받음
const ScheduleList = ({ schedules, setSchedules }) => {
    const handleDelete = (id) => {
        setSchedules(schedules.filter((schedule) => schedule.id !== id));
    };

    const toggleComplete = (id) => {
        setSchedules(
            schedules.map((schedule) => 
                schedule.id === id ? {...schedule, completed: !schedule.completed } : schedule
            )
        );
    };

    return (
        <ul className="schedule-list">
           {schedules.map((schedule) => (
                <li key={schedule.id} className="schedule-item">
                    <input
                        type="checkbox"
                        checked={schedule.completed || false}
                        onChange={() => toggleComplete(schedule.id)}
                        className="schedule-checkbox"
                    />
                    <spen className="schedule-text">{schedule.title}</spen>
                    <button className="delete-button" onClick={() => handleDelete(schedule.id)}>
                        🗑️
                    </button>
                </li>
           ))}
        </ul>
    );
};

export default ScheduleList;