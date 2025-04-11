import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import '../styles/Auth.css';

const Register = () => {
    const navigate = useNavigate();
    
    // 폼 데이터 상태
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        verificationCode: ''
    });
    
    // 유효성 검사 상태
    const [validation, setValidation] = useState({
        email: { isValid: false, message: '' },
        password: { isValid: false, message: '' },
        confirmPassword: { isValid: false, message: '' },
        name: { isValid: false, message: '' },
        verificationCode: { isValid: false, message: '' }
    });
    
    // 인증 코드 관련 상태
    const [codeSent, setCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [codeTimer, setCodeTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);
    
    // 제출 관련 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // 코드 전송 후 타이머 설정
    useEffect(() => {
        let interval;
        if (codeSent && codeTimer > 0) {
            interval = setInterval(() => {
                setCodeTimer(prev => prev - 1);
            }, 1000);
        } else if (codeTimer === 0 && codeSent) {
            // 시간 초과 시 재전송 가능하도록 설정
            setIsResending(true);
        }
        
        return () => clearInterval(interval);
    }, [codeSent, codeTimer]);

    // 입력값 변경 처리
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 실시간 유효성 검사
        validateField(name, value);
    };
    
    // 개별 필드 유효성 검사
    const validateField = (name, value) => {
        let isValid = false;
        let message = '';
        
        switch (name) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                isValid = emailRegex.test(value);
                message = isValid ? '유효한 이메일입니다.' : '유효한 이메일 주소를 입력해주세요.';
                break;
                
            case 'password':
                const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,20}$/;
                isValid = passwordRegex.test(value);
                message = isValid ? '안전한 비밀번호입니다.' : '영문, 숫자, 특수문자를 포함하여 8~20자여야 합니다.';
                
                // 비밀번호 확인 필드도 같이 검증
                if (formData.confirmPassword) {
                    const confirmIsValid = value === formData.confirmPassword;
                    setValidation(prev => ({
                        ...prev,
                        confirmPassword: {
                            isValid: confirmIsValid,
                            message: confirmIsValid ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'
                        }
                    }));
                }
                break;
                
            case 'confirmPassword':
                isValid = value === formData.password;
                message = isValid ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.';
                break;
                
            case 'name':
                isValid = value.trim().length >= 2 && value.trim().length <= 20;
                message = isValid ? '유효한 이름입니다.' : '이름은 2자 이상 20자 이하여야 합니다.';
                break;
                
            case 'verificationCode':
                isValid = value.length === 6 && /^\d+$/.test(value);
                message = isValid ? '유효한 형식입니다.' : '6자리 숫자 코드를 입력해주세요.';
                break;
                
            default:
                break;
        }
        
        setValidation(prev => ({
            ...prev,
            [name]: { isValid, message }
        }));
        
        return isValid;
    };
    
    // 인증 코드 전송
    const handleSendVerificationCode = async () => {
        // 이메일 유효성 재확인
        if (!validation.email.isValid) {
            setServerError('유효한 이메일 주소를 입력해주세요.');
            return;
        }
        
        setIsResending(false);
        setServerError('');
        
        try {
            // 인증 코드 요청 API 호출
            await axios.post('http://localhost:8080/api/auth/send-verification', {
                email: formData.email
            });
            
            // 코드 전송 성공
            setCodeSent(true);
            setCodeTimer(300); // 5분 타이머 설정
            setServerError('');
            
            // 인증 코드 입력 필드 초기화
            setFormData(prev => ({
                ...prev,
                verificationCode: ''
            }));
            setValidation(prev => ({
                ...prev,
                verificationCode: { isValid: false, message: '' }
            }));
            
        } catch (error) {
            console.error('인증 코드 전송 오류:', error);
            
            // 서버 오류 처리
            if (error.response) {
                // 중복 이메일 등의 오류 처리
                if (error.response.status === 409 || (error.response.data && error.response.data.code === 'M001')) {
                    setServerError('이미 사용 중인 이메일입니다.');
                } else if (error.response.data && error.response.data.message) {
                    setServerError(error.response.data.message);
                } else {
                    setServerError('인증 코드 전송 중 오류가 발생했습니다.');
                }
            } else {
                setServerError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        }
    };
    
    // 인증 코드 확인
    const handleVerifyCode = async () => {
        // 코드 유효성 확인
        if (!validation.verificationCode.isValid) {
            setServerError('유효한 인증 코드를 입력해주세요.');
            return;
        }
        
        setServerError('');
        
        try {
            // 인증 코드 확인 API 호출
            await axios.post('http://localhost:8080/api/auth/verify-code', {
                email: formData.email,
                code: formData.verificationCode
            });
            
            // 인증 성공
            setIsVerified(true);
            setValidation(prev => ({
                ...prev,
                verificationCode: { isValid: true, message: '이메일 인증이 완료되었습니다.' }
            }));
            
        } catch (error) {
            console.error('인증 코드 확인 오류:', error);
            
            // 서버 오류 처리
            if (error.response && error.response.data && error.response.data.code === 'A004') {
                setServerError('유효하지 않은 인증 코드입니다.');
            } else {
                setServerError('인증 코드 확인 중 오류가 발생했습니다.');
            }
            
            setValidation(prev => ({
                ...prev,
                verificationCode: { isValid: false, message: '유효하지 않은 인증 코드입니다.' }
            }));
        }
    };
    
    // 폼 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 모든 필드 유효성 재확인
        let isFormValid = true;
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'verificationCode' || codeSent) { // 인증 코드는 전송했을 때만 검사
                const fieldIsValid = validateField(key, value);
                isFormValid = isFormValid && fieldIsValid;
            }
        });
        
        // 이메일 인증 확인
        if (!isVerified) {
            setServerError('이메일 인증을 완료해주세요.');
            return;
        }
        
        // 폼 유효성 검사 실패
        if (!isFormValid) {
            setServerError('입력 정보를 다시 확인해주세요.');
            return;
        }
        
        setIsSubmitting(true);
        setServerError('');
        
        try {
            // 회원가입 API 호출
            const response = await axios.post('http://localhost:8080/api/auth/signup', {
                email: formData.email,
                password: formData.password,
                name: formData.name
            });
            
            // 회원가입 성공
            setSuccessMessage('회원가입이 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다.');
            
            // 폼 초기화
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                name: '',
                verificationCode: ''
            });
            
            // 3초 후 로그인 페이지로 이동
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (error) {
            console.error('회원가입 오류:', error);
            
            // 서버 오류 처리
            if (error.response && error.response.data && error.response.data.message) {
                setServerError(error.response.data.message);
            } else {
                setServerError('회원가입 중 오류가 발생했습니다.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // 회원가입 버튼 활성화 여부 확인
    const isSignupButtonEnabled = () => {
        return (
            validation.email.isValid &&
            validation.password.isValid &&
            validation.confirmPassword.isValid &&
            validation.name.isValid &&
            isVerified
        );
    };
    
    // 인증 코드 타이머 표시 형식
    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div>
            <Header />
            <div className="auth-container">
                <div className="auth-form-container">
                    <h2>회원가입</h2>

                    {successMessage ? (
                        <div className="success-message">
                            {successMessage}
                        </div>
                    ) : (
                        <>
                            {serverError && <div className="error-message">{serverError}</div>}
                            
                            <form onSubmit={handleSubmit} className="auth-form">
                                {/* 이메일 필드 */}
                                <div className="form-group">
                                    <label htmlFor="email">이메일</label>
                                    <div className="input-with-button">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={codeSent && !isResending}
                                            className={validation.email.isValid ? 'valid-input' : (formData.email ? 'invalid-input' : '')}
                                            placeholder="example@email.com"
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleSendVerificationCode}
                                            disabled={!validation.email.isValid || (codeSent && !isResending)}
                                            className="verification-button"
                                        >
                                            {isResending ? '재전송' : (codeSent ? '전송됨' : '인증코드 전송')}
                                        </button>
                                    </div>
                                    {formData.email && (
                                        <div className={`validation-message ${validation.email.isValid ? 'valid' : 'invalid'}`}>
                                            {validation.email.message}
                                        </div>
                                    )}
                                </div>
                                
                                {/* 인증 코드 필드 - 코드 전송 후에만 표시 */}
                                {codeSent && (
                                    <div className="form-group">
                                        <label htmlFor="verificationCode">인증 코드</label>
                                        <div className="input-with-button">
                                            <input
                                                type="text"
                                                id="verificationCode"
                                                name="verificationCode"
                                                value={formData.verificationCode}
                                                onChange={handleChange}
                                                disabled={isVerified}
                                                className={validation.verificationCode.isValid || isVerified ? 'valid-input' : (formData.verificationCode ? 'invalid-input' : '')}
                                                placeholder="6자리 인증 코드"
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleVerifyCode}
                                                disabled={!validation.verificationCode.isValid || isVerified}
                                                className="verification-button"
                                            >
                                                {isVerified ? '인증됨' : '확인'}
                                            </button>
                                        </div>
                                        <div className="code-timer">
                                            {isVerified ? (
                                                <span className="valid-message">이메일 인증이 완료되었습니다.</span>
                                            ) : (
                                                <>
                                                    <span>남은 시간: {formatTimer(codeTimer)}</span>
                                                    {codeTimer === 0 && <span className="timeout-message">인증 시간이 만료되었습니다. 코드를 재전송해주세요.</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 비밀번호 필드 */}
                                <div className="form-group">
                                    <label htmlFor="password">비밀번호</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={validation.password.isValid ? 'valid-input' : (formData.password ? 'invalid-input' : '')}
                                        placeholder="영문, 숫자, 특수문자 포함 8~20자"
                                        required
                                    />
                                    {formData.password && (
                                        <div className={`validation-message ${validation.password.isValid ? 'valid' : 'invalid'}`}>
                                            {validation.password.message}
                                        </div>
                                    )}
                                </div>

                                {/* 비밀번호 확인 필드 */}
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">비밀번호 확인</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={validation.confirmPassword.isValid ? 'valid-input' : (formData.confirmPassword ? 'invalid-input' : '')}
                                        placeholder="비밀번호를 다시 입력해주세요"
                                        required
                                    />
                                    {formData.confirmPassword && (
                                        <div className={`validation-message ${validation.confirmPassword.isValid ? 'valid' : 'invalid'}`}>
                                            {validation.confirmPassword.message}
                                        </div>
                                    )}
                                </div>

                                {/* 이름 필드 */}
                                <div className="form-group">
                                    <label htmlFor="name">이름</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={validation.name.isValid ? 'valid-input' : (formData.name ? 'invalid-input' : '')}
                                        placeholder="2자 이상 20자 이하"
                                        required
                                    />
                                    {formData.name && (
                                        <div className={`validation-message ${validation.name.isValid ? 'valid' : 'invalid'}`}>
                                            {validation.name.message}
                                        </div>
                                    )}
                                </div>

                                {/* 제출 버튼 */}
                                <button
                                    type="submit"
                                    className={`auth-button ${isSignupButtonEnabled() ? 'enabled' : 'disabled'}`}
                                    disabled={!isSignupButtonEnabled() || isSubmitting}
                                >
                                    {isSubmitting ? '처리 중...' : '회원가입'}
                                </button>
                            </form>

                            <div className="auth-links">
                                <p>
                                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;