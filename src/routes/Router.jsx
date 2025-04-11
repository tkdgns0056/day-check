import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import { AuthProvider } from "../context/AuthContext";

const AppRouter = () => {
    return (
        <AuthProvider>
        <Router>
            <Routes>
                <Route path ="/"  element={<Home />} />
                <Route path ="/login" element={<Login />} />
                <Route path="/register" element={<Register/>} />
                <Route path="/verify-email" element={<VerifyEmail/>}/>
            </Routes>
        </Router>
        </AuthProvider>
    );
};

export default AppRouter;