// hooks/useAuth.js 파일 생성
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';    
    
    // 커스텀 훅 - 인증 컨텍스트 사용 간편화
    export const useAuth = () => {
      return useContext(AuthContext);
    };
