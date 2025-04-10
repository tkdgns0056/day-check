import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
// import { useAuth } from "../context/AuthContext";
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState({
    loading: true,
    success: false,
    message: ''
  });
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setVerificationStatus({
        loading: false,
        success: false,
        message: '유효하지 않은 인증 요청입니다. 토큰이 제공되지 않았습니다.'
      });
      return;
    }
    
    const verifyToken = async () => {
      try {
        const result = await verifyEmail(token);
        setVerificationStatus({
          loading: false,
          success: result.success,
          message: result.message
        });
      } catch (error) {
        setVerificationStatus({
          loading: false,
          success: false,
          message: '이메일 인증 중 오류가 발생했습니다. 다시 시도해주세요.'
        });
      }
    };
    
    verifyToken();
  }, [searchParams, verifyEmail]);

  return (
    <div>
      <Header />
      <div className="auth-container">
        <div className="auth-form-container">
          <h2>이메일 인증</h2>
          
          <div className="verification-content">
            {verificationStatus.loading ? (
              <div className="loading-message">
                <p>인증 확인 중입니다...</p>
                <div className="spinner"></div>
              </div>
            ) : (
              <div className={`verification-result ${verificationStatus.success ? 'success' : 'error'}`}>
                <p>{verificationStatus.message}</p>
                
                {verificationStatus.success ? (
                  <Link to="/login" className="auth-button">
                    로그인 페이지로 이동
                  </Link>
                ) : (
                  <div className="auth-links">
                    <Link to="/" className="auth-link">
                      홈으로 돌아가기
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;