import { Link } from "react-router-dom"
import "../styles/Header.css";

const Header = () => {
    return (
      <header className="header">
        <h1 className="logo">📅DayCheck</h1>
        <nav>
          <Link to="/login" className="nav-button">로그인</Link>
        </nav>
      </header>
    );
  };

export default Header;