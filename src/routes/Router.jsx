import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from '../pages/Home';
import Login from '../pages/Login';
import Scheduler from '../pages//Scheduler';


const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path ="/"  element={<Home />} />
                <Route path ="/login" element={<Login />} />
                <Route path = "/scheduler" element={<Scheduler />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;