import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import '../styles/Auth.css';

const Register = () => {
  // 회원가입 단계
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증 코드 입력, 3: 기타 정보 입력

  // 폼 데이터
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  // 인증 코드 관련 상태
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // 로딩 상태
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 메시지 상태
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  // 폼 검증 상태
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
  const navigate = useNavigate();

  // 입력 값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

  // 입력값 변경 시 해당 필드의 에러 메세지 초기화
  setFormErrors({
    ...formErrors,
    [name]: ''
  });
};

  // 인증 코드 입력 핸들러
  const handleCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  // 이메일 유효성 검사
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!email) {
        return '이메일은 필수 입력 항목입니다.';
    }
    if(!emailRegex.test(email)){
        return '유효한 이메일 주소를 입력해주세요.';
    }
    return '';
  };

  // 인증 코드 발송 핸들러
  const handleSendCode = async () => {
    // 이메일 검증
    const emailError = validateEmail(formData.email);
    if (emailError){
        setFormErrors({
            ...formErrors,
            email: emailError
        });
        setErrorMessage(errorMessage);
        return;
    }

    setIsSendingCode(true);
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/auth/send-verification', {
        email: formData.email
      });

      if(response.data && response.data.success){
            setIsCodeSent(true);
            setSuccessMessage(response.data.message || '인증 코드가 이메일로 발송되었습니다.');
            setStep(2);

            // 3초 후 성공 메시지 제거
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);

        } else {
            throw new Error(response.data?.message || '인증 코드 발송에 실패했습니다.');
        } 

    } catch (error) {
        const errorMsg = error.response?.data?.message || '인증 코드 발송 중 오류가 발생했습니다.';
        setErrorMessage(errorMsg);

        // 이메일 중복 오류 일 경우
        if(error.response?.data?.code === 'DUPLICATE_EMAIL') {
            setFormErrors({
                ...formErrors,
                email: '이미 사용 중인 이메일입니다.'
            });
        }

    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증 코드 확인 핸들러
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setErrorMessage('인증 코드를 필수 입력값입니다.');
      return;
    }
    
    setIsVerifyingCode(true);
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/auth/verify-code', {
        email: formData.email,
        code: verificationCode
      });

      if(response.data && response.data.success){
        setIsVerified(true);
        setSuccessMessage(response.data.message || '이메일 인증이 완료되었습니다.');
        setStep(3); // 회원가입 정보 입력 단계로 이동
            
        // 3초 후 성공 메시지 제거
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

      } else {
        throw new Error(response.data?.message || '인증 코드 확인에 실패하였습니다.');
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || '인증 코드 확인 중 오류가 발생하였습니다.';
      setErrorMessage(errorMsg);

      // 유효하지 않은 인증 코드인 경우
      if(error.response?.data?.code === 'INVALID_VERIFICATION_CODE') {
        setErrorMessage('유효하지 않은 인증 코드입니다. 다시 확인해주세요.');
      }

    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 비밀번호 유효성 검사
  const validatePassword = (passowrd) => {
    if(!passowrd){
        return '비밀번호는 필수 입력 항목입니다.';
    }
    if(passowrd.length < 8 || passowrd.length > 20) {
        return '비밀번호는 8자 이상 20자 이하로 입력해주세요.';
    }

    // 영문,숫자, 특수문자 포함 검사
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,20}$/;
    if(!passwordRegex.test(passowrd)){
        return '비밀번호는 영문,숫자,특수문자를 포함해야 합니다.';
    }

    return '';
  };

  // 회원가입 폼 검증
  const validateSignupForm =() => {
    let isValid = true;
    const errors = {
        password: '',
        confirmPassword: '',
        name: ''
    };

    // 비밀번호 검증
    const passwordError = validatePassword(formData.password);
    if(passwordError){
        errors.password = passwordError;
        isValid = false;
    }

    // 비밀번호 일치 검증
    if(formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        isValid = false;
    }

    // 이름 입력 검증
    if (!formData.name.trim()) {
        errors.name = '이름을 필수 입력 항목입니다.';
        isValid = false;
    } else if (formData.name.length < 2 || formData.name.length > 20) {
        errors.name = '이름은 2자 이상 20자 이하로 입력해주세요.';
        isValid = false;
    }

    setFormErrors({
        ...formErrors,
        ...errors
    });
    
    if(!isValid){
        // 첫 번째 발견된 에러 메시지를 표시
        for(const key in erros){
            if(errors[key]){
                setErrorMessage(errors[key]);
                break;
            }
        }
    }

    return isValid;

  };

  // 회원가입 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSignupForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/auth/signup', {
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      
      if(response.data & response.data.success) {
        setSuccessMessage(response.data.message || '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      

        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
            navigate('/login');
        }, 3000);
      } else {
        throw new Error(response.data?.message || '회원가입에 실패하였습니다.');
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);

      // 이메일 미인증 오류인 경우
      if(error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setErrorMessage('이메일 인증이 완료되지 않았습니다. 먼저 이메일 인증을 진행해주세요.');
        setStep(1); // 이메일 입력 단계로 리턴
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인증 코드 재발송 핸들러
  const handleResendCode = () => {
    handleSendCode();
  };

  return (
    <div>
      <Header />
      <div className="auth-container">
        <div className="auth-form-container">
          <h2>회원가입</h2>
          
          {/* 단계 표시 */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. 이메일 입력</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. 이메일 인증</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3. 정보 입력</div>
          </div>
          
          {/* 성공/에러 메시지 */}
          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          
          {/* 단계 1: 이메일 입력 */}
          {step === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
                {formErrors.email && <div className='field-error'>{formErrors.email}</div>}
              </div>
              
              <button 
                type="button" 
                className="auth-button"
                onClick={handleSendCode}
                disabled={isSendingCode || !formData.email}
              >
                {isSendingCode ? '발송 중...' : '인증 코드 발송'}
              </button>
            </div>
          )}
          
          {/* 단계 2: 인증 코드 입력 */}
          {step === 2 && (
            <div className="form-step">
              <p className="email-info">입력하신 이메일: <strong>{formData.email}</strong></p>
              
              <div className="form-group">
                <label htmlFor="verificationCode">인증 코드</label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  placeholder="인증 코드 6자리를 입력하세요"
                  maxLength="6"
                  required
                />
              </div>
              
              <div className="verification-buttons">
                <button 
                  type="button" 
                  className="auth-button"
                  onClick={handleVerifyCode}
                  disabled={isVerifyingCode || !verificationCode}
                >
                  {isVerifyingCode ? '확인 중...' : '인증 확인'}
                </button>
                
                <button 
                  type="button" 
                  className="auth-button outline"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? '발송 중...' : '코드 재발송'}
                </button>
              </div>
            </div>
          )}
          
          {/* 단계 3: 회원가입 정보 입력 */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="form-step">
              <p className="email-verified">
                <span className="verified-badge">✓</span> 
                <strong>{formData.email}</strong> (인증 완료)
              </p>
              
              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="8자 이상 입력해주세요"
                  required
                />
                {formErrors.password && <div className="field-error">{formErrors.password}</div>}
                <small className='form-hint'>
                    비밀번호는 8~20자 이내로 영문,숫자,특수문자를 포함해야 합니다.
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력해주세요"
                  required
                />
                {formErrors.confirmPassword && <div className="field-error">{formErrors.confirmPassword}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="name">이름</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="이름을 입력해주세요"
                  required
                />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
                <small className="form-hint">
                    이름은 2~20자 이내로 입력해주세요.
                </small>
              </div>
              
              <button
                type="submit"
                className="auth-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : '회원가입 완료'}
              </button>
            </form>
          )}
          
          {/* 로그인 링크 */}
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

export default Register;