import { useState } from "react";
import { Form, Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import Header from "../components/Header";
import '../styles/Auth.css';

const Register = () => {
    const [formatDate, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { register, error, setError } = useAuth();
    const navigate= useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formatDate,
            [name]: value
        });
    };

    const validateForm = () => {
        // 이메일 형식 검증
        const emailRegex=  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if(!emailRegex.test(formatDate.email)) {
            setError('유효한 이메일 주소를 입력해주세요.');
            return false;
        }

        // 비밀번호 일치 검즈
        if(formatDate.password !== formatDate.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return false;
        }

        if(formatDate.name.trim()) {
            setError('이름을 입력해주세요.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 폼 검증
        if(!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try{
            const result = await register(
                formatDate.email,
                formatDate.password,
                formatDate.name
            );

            if(result.success) {
                setSuccessMessage(result.message);

                //폼 초기화
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                });

                // 3초 후 로그인 페이지로 이동
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
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
                    <h2>회원가입</h2>

                    {successMessage && (
                        <div className="success-message">
                            {successMessage}
                            <p>잠시 후 로그인 페이지로 이동합니다...</p>
                        </div>
                    )}

                    {error && !successMessage && <div className="error-message">{error}</div>}
                    
                    {!successMessage && (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">이메일</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formatDate.email}
                                    onChange={handleChange}
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">비밀번호</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formatDate.password}
                                    onChange={handleChange}
                                    placeholder="8자 이상 입력해주세요"
                                    required
                                />
                            </div>

                            <div className="form-gorup">
                                <label htmlFor="confirmPassword">비밀번호 확인</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formatDate.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="비밀번호를 다시 입력해주세요"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="name">이름</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formatDate.name}
                                    onChange={handleChange}
                                    placeholder="이름을 입력해주세요"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="auth-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '처리 중...' : '회원가입'}
                            </button>
                        </form>
                    )}

                    <div className="auth-links">
                        <p>
                            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default  Register;