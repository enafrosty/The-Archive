import axios from 'axios';

const api = axios.create({
    baseURL: `http://${window.location.hostname}:5000/api`,
});

// Attach the operator admin token (if configured) so destructive/admin API
// routes are authorized. Stored locally by the operator, never hard-coded.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers['x-admin-token'] = token;
    }
    return config;
});

export default api;
