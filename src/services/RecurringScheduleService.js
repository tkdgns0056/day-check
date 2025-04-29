import axios from "axios";

// 개발
const API_URL = 'http://localhost:8080/api/schedules/recurring';

// 인증 토큰 가져오기
const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return {
        headers : {
            'Authorization': `Bearer ${token}`,
            'Content-Type' : 'application/json'
        }
    };
};

// 모든 반복 일정 조회
export const getAllRecurringSchedules = async () => {
    try {
        const response = await axios.get(API_URL, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`반복 일정 조회 오류:`, error);
        throw error;
    }
};

// 특정 ID의 반복 일정 조회
export const getRecurringScheduleById = async (id) => {
    try{
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
        return response.data;
    } catch (error){
        console.error(`반복 일정 상세 조회 오류(ID: ${id}):`, error);
        throw error;
    }
};

// 새 반복 일정 생성
export const createRecurringSchedule = async (scheduleData) => {
    try {
        // 백엔드 API 요구 사항에 맞게 데이터 변환 (body에 담는다.)
        const apiData = {
            content: scheduleData.content,
            patternType: scheduleData.patternType || 'DAILY',
            interval: scheduleData.interval || 1,
            daysOfWeek: scheduleData.daysOfWeek || [],
            dayOfMonth: scheduleData.dayOfMonth,
            weekOfMonth: scheduleData.weekOfMonth,
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            priority: scheduleData.priority || 'medium',
            description: scheduleData.description
        };
        
        const response = await axios.post(API_URL, apiData, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('반복 일정 생성 오류:', error);
        throw error;
    }
};

// 반복 일정 수정
export const updateRecurringSchedule = async (id, scheduleData) => {
    try {
        // 백엔드 API 요구 사항에 맞게 데이터 변환
        const apiData = {
            content: scheduleData.content,
            patternType: scheduleData.patternType,
            interval: scheduleData.interval,
            daysOfWeek: scheduleData.daysOfWeek,
            dayOfMonth: scheduleData.dayOfMonth,
            weekOfMonth: scheduleData.weekOfMonth,
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            priority: scheduleData.priority,
            description: scheduleData.description
        };
      
        // null이나 undefined인 필드 제거
        Object.keys(apiData).forEach(key => {
            if(apiData[key] === undefined || apiData[key] === null) {
                delete apiData[key];
            }
        });

        const response = await axios.put(`${API_URL}/${id}`, apiData, getAuthHeader());
        return response.data;      
    } catch(error) {
        console.error(`반복 일정 수정 오류(ID: ${id}:`, error);
        throw error;
    }
};

// 반복 일정 삭제
export const deleteRecurringSchedule = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`반복 일정 삭제 오류(ID: ${id}):`, error);
        throw error;
    }
};

// 특정 날짜의 반복 일정 조회
export const getRecurringSchedulesByDate = async (date) => {
    try {
        // ISO 형식으로 변환 (YYYY-MM-DD)
        const formattedDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        const response = await axios.get(`${API_URL}/date/${formattedDate}`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`특정 날짜의 반복 일정 조회 오류(날짜: ${date}):`, error);
        throw error;
    }
};
  
// 반복 일정 예외 생성
export const createRecurringException = async (exceptionData) => {
    try {
        const response = await axios.post(`${API_URL}/exceptions`, exceptionData, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('반복 일정 예외 생성 오류:', error);
        throw error;
    }
};
  
// 반복 일정의 예외 조회
export const getRecurringExceptions = async (recurringScheduleId) => {
    try {
        const response = await axios.get(`${API_URL}/${recurringScheduleId}/exceptions`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`반복 일정 예외 조회 오류(ID: ${recurringScheduleId}):`, error);
        throw error;
    }
};
  
// 특정 예외 삭제
export const deleteRecurringException = async (exceptionId) => {
    try {
        const response = await axios.delete(`${API_URL}/exceptions/${exceptionId}`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`반복 일정 예외 삭제 오류(ID: ${exceptionId}):`, error);
        throw error;
    }
};

// 내보내기 방식 변경
const recurringScheduleService = {
    getAllRecurringSchedules,
    getRecurringScheduleById,
    createRecurringSchedule,
    updateRecurringSchedule,
    deleteRecurringSchedule,
    getRecurringSchedulesByDate,
    createRecurringException,
    getRecurringExceptions,
    deleteRecurringException
};

export default recurringScheduleService;