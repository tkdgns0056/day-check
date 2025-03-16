import axios from "axios";

const API_URL = 'http://localhost:8080/api/notifications';

// 읽지 않은 알림 가져오기
export const getUnreadNotifications = async () => {
    try{
        const response = await axios.get(`${API_URL}/unread`);
        return response.data;
    } catch(error) {
        console.log('알림 조회 실패:', error);
        return [];
    }
};

// 모든 알림 가져오기
export const getAllNotifications = async () => {
    try{
        const response = await axios.get(API_URL);
        return response.data;
    } catch(error) {
        console.error('모든 알림 조회 실패:', error);
        return [];
    }   
};

// 알림을 읽음으로 표시
export const markAsRead = async (id) => {
    try{
        const response = await axios.patch(`${API_URL}/${id}/read`);
        return response.data;
    } catch (error) {
        console.error(`알림 ${id} 읽음 처리 실패:`, error);
        throw error;
    }
};


// 모든 알림을 읽음으로 표시
export const markAllAsRead = async () => {
    try{
        const response = await axios.patch(`${API_URL}/read-all`);
        return response.data;
    } catch (error) {
        console.log('알림 상태 확인 실패:', error);
        throw error;
    }
};