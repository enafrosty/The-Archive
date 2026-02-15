import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const resolveAvatarUrl = (url) => {
        if (!url) return url;
        // Replace localhost with current hostname to fix existing DB records
        return url.replace('localhost', window.location.hostname);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            const resolvedUsers = data.map(u => ({
                ...u,
                avatar: resolveAvatarUrl(u.avatar)
            }));
            setUsers(resolvedUsers);
            // Auto-login if only one user or check localStorage
            const savedUserId = localStorage.getItem('userId');
            if (savedUserId) {
                const found = resolvedUsers.find(u => u.id == savedUserId);
                if (found) setUser(found);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const login = (selectedUser) => {
        setUser(selectedUser);
        localStorage.setItem('userId', selectedUser.id);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userId');
    };

    const register = async (username, avatar) => {
        try {
            const { data } = await api.post('/users', { username, avatar });
            setUsers([...users, data]);
            login(data);
        } catch (error) {
            console.error("Failed to register", error);
        }
    };

    const verifyPin = async (userId, pin) => {
        try {
            const { data } = await api.post(`/users/${userId}/verify-pin`, { pin });
            return data.success;
        } catch (error) {
            console.error("PIN verification failed", error);
            return false;
        }
    };

    const setPin = async (userId, oldPin, newPin) => {
        try {
            const { data } = await api.post(`/users/${userId}/set-pin`, { oldPin, newPin });
            if (data.success) {
                // Update local users list with new PIN status if needed
                await fetchUsers();
            }
            return data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to set PIN' };
        }
    };

    const updateAvatar = async (userId, formData) => {
        try {
            const { data } = await api.post(`/users/${userId}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                await fetchUsers();
                if (user && user.id === userId) {
                    setUser({ ...user, avatar: resolveAvatarUrl(data.avatarUrl) });
                }
            }
            return data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to update avatar' };
        }
    };

    return (
        <AuthContext.Provider value={{
            user, users, login, logout, register, loading,
            verifyPin, setPin, updateAvatar, fetchUsers
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
