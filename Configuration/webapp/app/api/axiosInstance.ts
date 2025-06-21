import axios from 'axios';

const API_URL = "http://localhost:8080/api/api/"

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

export default axiosInstance;
