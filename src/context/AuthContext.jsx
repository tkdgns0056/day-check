import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      // 페이지 로드 시 로컬 스토리지에서 토큰 확인
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // 토큰이 있으면 사용자 정보 가져오기
        fetchUserData(token);
      } else {
        // 토큰이 없으면 명시적으로 상태 초기화
        setCurrentUser(null);
        setError(null);
        setLoading(false);
      }
    }, []);
  
    const fetchUserData = async (token) => {
      try {
        // 토큰 설정
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 사용자 정보 요청 - 백엔드 API 경로에 맞게 수정

        const response = await axios.get('http://localhost:8080/api/members/me');
        setCurrentUser(response.data);
      } catch (err) {
        console.error("사용자 정보 가져오기 실패:", err);
        // 토큰이 유효하지 않으면 로그아웃
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setError('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
      } finally {
        setLoading(false);
      }
    };
  
    // 로그인인
    const login = async (email, password) => {
      try {
        // 기존 실패 상태 초기화
        setError(null); // 이 부분 중요
        setLoading(true);

        // 백엔드 로그인 API 호출
        const response = await axios.post('http://localhost:8080/api/auth/login', {
          email,
          password
        });

          console.log('로그인 응답:', response.data); // 디버깅을 위한 응답 로깅
    
          
          const responseData = response.data;

          // 응답 구조 유연하게 처리(중첩 구조와 평면 구조 모두 지원)
          const tokenData =responseData.data || responseData;

          //응답 구조 확인
          if(tokenData.accessToken && tokenData.refreshToken){
              //응답 형식이 {success: true, data: {accessToken, refreshToken, ...}}
              const { accessToken, refreshToken } = tokenData;
      
            // 토큰 저장
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // 토큰 헤더 설정
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // 사용자 정보 가져오기
            await fetchUserData(accessToken);
            
            return true;
        } else {
          throw new Error('서버 응답 형식이 잘못되었습니다.');
        }
      } catch (err) {
        console.error("로그인 오류:", err);
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        
        if (err.response) {
          // 서버에서 오는 에러 메시지 처리
          if (err.response.status === 401) {
            errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
          } else if (err.response.status === 403 && err.response.data.code === 'M002') {
            // 백엔드 ErrorCode.EMAIL_NOT_VERIFIED에 맞게 변경
            errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
          } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        }
        
        // 오류 상태 설정
        setError(errorMessage);
        // 로딩 상태 초기화
        setLoading(false);

        return false;
      } finally {
        setLoading(false);
      }
    };
  
    const register = async (email, password, name) => {
      try {
        setError(null);
        // 이메일 인증코드 발송
        await axios.post('http://localhost:8080/api/auth/send-verification', {
          email
        });
        
        // 인증 코드 입력 프롬프트
        const verificationCode = prompt('이메일로 전송된 인증코드를 입력하세요:');
        
        if (!verificationCode) {
          return {
            success: false,
            message: '인증코드를 입력하지 않았습니다.'
          };
        }
        
        // 인증 코드 확인
        await axios.post('http://localhost:8080/api/auth/verify-code', {
          email,
          code: verificationCode
        });
        
        // 회원가입 요청
        const response = await axios.post('http://localhost:8080/api/auth/signup', {
          email,
          password,
          name
        });

        // response.data 제대로 확인
        console.log("성공 응답:", response.data);

        // 응답 구조 확인 후 적절히 처리
        if(response.data && response.data.success){
          return {
            success: true,
            message : response.data.message || '회원가입이 완료되었습니다.'
          };
        } else {
          // 응답이 success: true가 아니라면 오류로 처리
           throw new Error('서버 응답이 성공 형식이 아닙니다.');
        }

      } catch (err) {
        console.error("회원가입 오류:", err);
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        
        if (err.response) {
          if (err.response.status === 409 || (err.response.data && err.response.data.code === 'M001')) {
            errorMessage = '이미 사용 중인 이메일입니다.';
          } else if (err.response.data && err.response.data.code === 'A004') {
            errorMessage = '유효하지 않은 인증 코드입니다.';
          } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        }
        
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    };
  
    // 이메일 인증 확인 함수는 백엔드 API 호출 방식으로 변경
    const verifyEmail = async (code) => {
      try {
        setError(null);
        const email = prompt('인증코드에 연결된 이메일을 입력해주세요:');
        
        if (!email) {
          return {
            success: false,
            message: '이메일을 입력하지 않았습니다.'
          };
        }
        
        // 인증 코드 확인 API 호출
        await axios.post('http://localhost:8080/api/auth/verify-code', {
          email,
          code
        });
        
        return {
          success: true,
          message: '이메일 인증이 완료되었습니다. 로그인해주세요.'
        };
      } catch (err) {
        console.error("이메일 인증 오류:", err);
        const errorMessage = err.response?.data?.message || '이메일 인증 중 오류가 발생했습니다.';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    };
  
    const logout = () => {
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // 인증 헤더 제거
      delete axios.defaults.headers.common['Authorization'];
      
      // 사용자 정보 초기화
      setCurrentUser(null);

      // 오류 상태 명시적 초기화
      setError(null);
      setLoading(false);
    };
  
    const refreshToken = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        logout();
        return false;
      }
      
      try {
        // 토큰 갱신 API 호출
        const response = await axios.post('http://localhost:8080/api/auth/refresh', {
          refreshToken
        });
        
        // 응답 구조에 맞게 수정
        const { data } = response.data;
        const { accessToken, refreshToken: newRefreshToken } = data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        return true;
      } catch (err) {
        console.error("토큰 갱신 오류:", err);
        logout();
        return false;
      }
    };
  
    // 인증 코드 검증 함수 추가
    const verifyCode = async (email, code) => {
      try {
        await axios.post('http://localhost:8080/api/auth/verify-code', {
          email,
          code
        });
        return true;
      } catch (err) {
        console.error("인증 코드 검증 오류:", err);
        return false;
      }
    };
  
    const value = {
      currentUser,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      verifyEmail,
      refreshToken,
      verifyCode
    };
  
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export default AuthContext;