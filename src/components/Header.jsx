import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Header.css";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* 왼쪽 공간을 확보해 로고가 중앙에 위치하도록 함 */}
      </div>
      
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 className="logo">📅DayCheck</h1>
      </Link>
      
      <nav>
        {currentUser ? (
          <button onClick={handleLogout} className="nav-button">로그아웃</button>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="nav-button">로그인</Link>
            <Link to="/register" className="nav-button" style={{ marginLeft: '10px' }}>회원가입</Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;