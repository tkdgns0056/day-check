import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Header from "../components/Header";
import '../styles/Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error, setError } = useAuth();
    const navigate = useNavigate();
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 입력값 검증
        if(!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        // 버튼 활성화 시키는거임.
        setIsSubmitting(true);

        try {
            const success = await login(email, password);

            if(success){
                // 로그인 성공 시 메인 페이지로 이동
                navigate('/');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <Header/>
            <div className="auth-container">
                <div className="auth-form-container">
                    <h2> 로그인 </h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">이메일</label>
                            <input 
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <p>
                            계정이 없으신가요? <Link to="/register">회원가입</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;