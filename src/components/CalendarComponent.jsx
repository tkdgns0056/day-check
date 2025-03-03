import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState } from "react";

const CalendarComponent = () => {
    const [data, setData] = useState(new Date());

    return (
        <div>
            <Calendar onChange={setData} valu={data} />
        </div>
    );
};

export default CalendarComponent;