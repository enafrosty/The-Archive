import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { User, Shield, Plus, Trash2, Key, Image as ImageIcon, Check, X, AlertCircle, CheckCircle2, Download, HardDrive, RefreshCw, Play, Folder, UploadCloud, Activity, Cpu, Database, Clock, Users, Eye } from 'lucide-react';

const Admin = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'downloads', 'library'

    // System Stats
    const [systemStats, setSystemStats] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);

    // User State
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', avatar: '', pin: '' });
    const [userError, setUserError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null); // For management modal

    // Download State
    const [downloads, setDownloads] = useState([]);
    const [magnetLink, setMagnetLink] = useState('');
    const [downloadError, setDownloadError] = useState('');

    // Library State
    const [librarySeries, setLibrarySeries] = useState([]);
    const [libraryPaths, setLibraryPaths] = useState([]);
    const [newPath, setNewPath] = useState({ path: '', type: 'local', label: '' });
    const [isScanning, setIsScanning] = useState(false);

    // Upload State
    const [uploads, setUploads] = useState([]);

    useEffect(() => {
        if (!currentUser || currentUser.username !== 'Admin') {
            if (currentUser && currentUser.username !== 'frosty') { }
            if (currentUser && !['Admin', 'frosty'].includes(currentUser.username)) {
                navigate('/');
                return;
            }
        }

        if (activeTab === 'dashboard') {
            fetchSystemStats();
            const interval = setInterval(fetchSystemStats, 5000); // 5s refresh for stats
            return () => clearInterval(interval);
        }
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'downloads') {
            fetchDownloads();
            const interval = setInterval(fetchDownloads, 2000);
            return () => clearInterval(interval);
        }
        if (activeTab === 'library') {
            fetchLibrary();
            fetchLibraryPaths();
        }

    }, [currentUser, navigate, activeTab]);

    // --- System Functions ---
    const fetchSystemStats = async () => {
        try {
            const [statsRes, activeRes] = await Promise.all([
                api.get('/system/stats'),
                api.get('/users/active')
            ]);
            setSystemStats(statsRes.data);
            setActiveUsers(activeRes.data);
        } catch (err) {
            console.error('Failed to fetch system stats', err);
        }
    };

    // --- User Functions ---
    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setUserError('');
        try {
            await api.post('/users', newUser);
            setNewUser({ username: '', avatar: '', pin: '' });
            setIsCreatingUser(false);
            fetchUsers();
        } catch (err) {
            setUserError(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure? All data will be lost.')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
            if (selectedUser?.id === id) setSelectedUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearUserData = async (userId, type) => {
        if (!window.confirm(`Are you sure you want to clear this user's ${type}?`)) return;
        try {
            await api.delete(`/users/${userId}/data/${type}`);
            alert(`${type} cleared successfully.`);
        } catch (err) {
            alert('Failed to clear data');
        }
    };

    // --- Download Functions ---
    const fetchDownloads = async () => {
        try {
            const { data } = await api.get('/downloads');
            setDownloads(data);
        } catch (err) {
            console.error('Failed to fetch downloads', err);
        }
    };

    const handleAddDownload = async (e) => {
        e.preventDefault();
        try {
            await api.post('/downloads', { magnet: magnetLink });
            setMagnetLink('');
            fetchDownloads();
        } catch (err) {
            setDownloadError(err.response?.data?.error || 'Failed to add download');
        }
    };

    const handleRemoveDownload = async (infoHash) => {
        if (!window.confirm('Remove this download?')) return;
        try {
            await api.delete(`/downloads/${infoHash}`);
            fetchDownloads();
        } catch (err) {
            console.error(err);
        }
    };

    // --- Library Functions ---
    const fetchLibrary = async () => {
        try {
            const { data } = await api.get('/library/series');
            setLibrarySeries(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleScanLibrary = async () => {
        setIsScanning(true);
        try {
            await api.post('/library/scan');
            setTimeout(fetchLibrary, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setIsScanning(false), 2000);
        }
    };

    const handleClearLibrary = async () => {
        if (!window.confirm('WARNING: This will delete ALL anime and episodes from the database. This cannot be undone. Are you sure?')) return;
        try {
            await api.delete('/library/clear');
            fetchLibrary();
            alert('Library database cleared successfully.');
        } catch (err) {
            console.error('Failed to clear library', err);
            alert('Failed to clear library.');
        }
    };

    const fetchLibraryPaths = async () => {
        try {
            const { data } = await api.get('/library/paths');
            setLibraryPaths(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPath = async (e) => {
        e.preventDefault();
        try {
            await api.post('/library/paths', newPath);
            setNewPath({ path: '', type: 'local', label: '' });
            fetchLibraryPaths();
        } catch (err) {
            alert('Failed to add path');
        }
    };

    const handleRemovePath = async (id) => {
        if (!window.confirm('Remove this path?')) return;
        try {
            await api.delete(`/library/paths/${id}`);
            fetchLibraryPaths();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpload = async (file) => {
        const uploadId = Date.now() + Math.random();
        setUploads(prev => [{ id: uploadId, fileName: file.name, status: 'uploading' }, ...prev]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/library/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploads(prev => prev.map(u =>
                u.id === uploadId ? { ...u, status: 'success' } : u
            ));
            setTimeout(fetchLibrary, 1000);
        } catch (err) {
            setUploads(prev => prev.map(u =>
                u.id === uploadId ? { ...u, status: 'error', error: err.response?.data?.error || 'Failed' } : u
            ));
        }
    };

    const handleDeleteSeries = async (id) => {
        if (!window.confirm('Are you sure you want to delete this anime? THIS WILL PERMANENTLY DELETE THE FOLDER AND ALL DATA.')) return;
        try {
            await api.delete(`/series/${id}`);
            fetchLibrary();
        } catch (err) {
            console.error('Failed to delete series', err);
            alert('Failed to delete series');
        }
    };


    return (
        <div className="min-h-screen bg-background pb-32 animate-fade-in text-white">
            {/* Header */}
            <div className="container mx-auto px-6 md:px-12 pt-24 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">
                            System <span className="text-primary">Control</span>
                        </h1>
                        <p className="text-zinc-500 font-bold tracking-widest text-xs uppercase">
                            Media Server Administration
                        </p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl">
                        {[
                            { id: 'dashboard', icon: Activity, label: 'Monitor' },
                            { id: 'users', icon: User, label: 'Users' },
                            { id: 'downloads', icon: Download, label: 'Downloads' },
                            { id: 'library', icon: HardDrive, label: 'Library' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12">

                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                    <div className="animate-fade-in-up space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Cpu size={64} /></div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">CPU Load</div>
                                <div className="text-3xl font-black font-mono">
                                    {systemStats ? `${(systemStats.cpuLoad * 10).toFixed(1)}%` : '---'}
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Database size={64} /></div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Memory Usage</div>
                                <div className="text-3xl font-black font-mono">
                                    {systemStats ? `${((systemStats.memoryUsage.used / systemStats.memoryUsage.total) * 100).toFixed(1)}%` : '---'}
                                </div>
                                <div className="text-[10px] text-zinc-600 mt-1 font-mono">
                                    {systemStats ? `${(systemStats.memoryUsage.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(systemStats.memoryUsage.total / 1024 / 1024 / 1024).toFixed(1)} GB` : ''}
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={64} /></div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">System Uptime</div>
                                <div className="text-3xl font-black font-mono">
                                    {systemStats ? `${(systemStats.uptime / 3600).toFixed(1)}h` : '---'}
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={64} /></div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Online Users</div>
                                <div className="text-3xl font-black font-mono text-primary">
                                    {systemStats?.activeUsers || 0}
                                </div>
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                                <Activity size={16} className="text-green-500" /> Active Sessions
                            </h3>

                            {activeUsers.length === 0 ? (
                                <p className="text-zinc-600 font-mono text-sm">No active users in the last 5 minutes.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeUsers.map(u => (
                                        <div key={u.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-zinc-600">{u.username[0]}</div>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-sm truncate">{u.username}</div>
                                                <div className="text-[10px] text-green-400 font-mono truncate">{u.current_activity || 'Online'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black uppercase tracking-tight">Active Profiles</h2>
                            <button
                                onClick={() => setIsCreatingUser(true)}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Plus size={16} /> New Profile
                            </button>
                        </div>

                        {/* Create User Form */}
                        {isCreatingUser && (
                            <div className="mb-12 bg-zinc-900 border border-white/10 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                        <Plus size={16} className="text-primary" /> Create Profile
                                    </h3>
                                    <button onClick={() => setIsCreatingUser(false)}><X size={20} className="text-zinc-500 hover:text-white" /></button>
                                </div>
                                {userError && <div className="text-red-500 text-sm font-bold mb-4">{userError}</div>}
                                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input placeholder="Username" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none" />
                                    <input placeholder="Avatar URL" value={newUser.avatar} onChange={e => setNewUser({ ...newUser, avatar: e.target.value })} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none" />
                                    <input placeholder="PIN (Optional)" maxLength={4} value={newUser.pin} onChange={e => setNewUser({ ...newUser, pin: e.target.value })} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none" />
                                    <button type="submit" className="bg-primary hover:bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-xs">Create</button>
                                </form>
                            </div>
                        )}

                        {/* Users List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map(u => (
                                <div key={u.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-zinc-700">{u.username[0]}</div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-lg truncate">{u.username}</div>
                                            <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{u.hasPin ? 'Secured' : 'Open'}</div>
                                            {u.last_seen && <div className="text-[10px] text-zinc-500 mt-1">Last seen: {new Date(u.last_seen).toLocaleTimeString()}</div>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                                            className="bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                        >
                                            Manage
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* Management Panel (Expandable) */}
                                    {selectedUser?.id === u.id && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl p-4 z-10 shadow-2xl animate-fade-in-up">
                                            <h4 className="font-bold text-xs uppercase tracking-widest mb-3 text-zinc-400">User Data Actions</h4>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => handleClearUserData(u.id, 'history')}
                                                    className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-300 transition-colors"
                                                >
                                                    <Clock size={14} /> Clear Watch History
                                                </button>
                                                <button
                                                    onClick={() => handleClearUserData(u.id, 'favorites')}
                                                    className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-300 transition-colors"
                                                >
                                                    <CheckCircle2 size={14} /> Clear Favorites
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- DOWNLOADS TAB --- */}
                {activeTab === 'downloads' && (
                    <div className="animate-fade-in-up">
                        <div className="mb-12">
                            <form onSubmit={handleAddDownload} className="relative">
                                <input
                                    type="text"
                                    placeholder="Paste Magnet Link here..."
                                    value={magnetLink}
                                    onChange={(e) => setMagnetLink(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-6 pr-32 py-5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
                                />
                                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-orange-600 text-white px-6 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2">
                                    <Download size={16} /> Add
                                </button>
                            </form>
                            {downloadError && <p className="mt-2 text-red-500 text-xs font-bold">{downloadError}</p>}
                        </div>

                        <div className="space-y-4">
                            {downloads.length === 0 && (
                                <div className="text-center py-20 text-zinc-700 font-bold uppercase tracking-widest">No active downloads</div>
                            )}
                            {downloads.map(dl => (
                                <div key={dl.infoHash} className="bg-zinc-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${dl.progress}%` }}></div>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1 truncate max-w-2xl">{dl.name || 'Fetching Metadata...'}</h3>
                                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                                                <span>{(dl.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s</span>
                                                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                                <span>{dl.progress.toFixed(1)}%</span>
                                                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                                <span>{(dl.timeRemaining / 1000 / 60).toFixed(0)} min left</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveDownload(dl.infoHash)} className="text-zinc-600 hover:text-red-500 transition-colors"><X size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- LIBRARY TAB --- */}
                {activeTab === 'library' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Media Library</h2>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Manage Sources & Content</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleClearLibrary}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                                >
                                    <Trash2 size={16} /> Clear Database
                                </button>
                                <button
                                    onClick={handleScanLibrary}
                                    disabled={isScanning}
                                    className={`bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                                    {isScanning ? 'Scanning...' : 'Scan All Sources'}
                                </button>
                            </div>
                        </div>

                        {/* --- Smart Upload Section --- */}
                        <div className="md:col-span-2 bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <UploadCloud className="text-primary" />
                                <h2 className="text-xl font-bold text-white">Smart Upload</h2>
                            </div>

                            <div
                                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    const files = Array.from(e.dataTransfer.files);
                                    for (const file of files) {
                                        await handleUpload(file);
                                    }
                                }}
                            >
                                <div className="text-zinc-500 font-medium mb-2">Drag & Drop Video Files Here</div>
                                <div className="text-xs text-zinc-600">Auto-organizes into Series/Season folders based on filename</div>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    id="file-upload"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files);
                                        for (const file of files) {
                                            await handleUpload(file);
                                        }
                                    }}
                                />
                                <label htmlFor="file-upload" className="mt-4 inline-block px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white cursor-pointer transition-colors">
                                    Select Files
                                </label>
                            </div>

                            {/* Upload Status */}
                            {uploads.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    {uploads.map((u, i) => (
                                        <div key={i} className="bg-black/40 rounded-lg p-3 flex items-center justify-between">
                                            <span className="text-xs text-zinc-300 truncate max-w-[200px]">{u.fileName}</span>
                                            {u.status === 'uploading' && <div className="text-xs text-blue-400 animate-pulse">Uploading...</div>}
                                            {u.status === 'success' && <div className="text-xs text-green-500 font-bold">Organized!</div>}
                                            {u.status === 'error' && <div className="text-xs text-red-500 font-bold">{u.error}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Path Management */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mb-12">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                <Folder size={16} className="text-primary" /> Library Paths
                            </h3>

                            <div className="space-y-4 mb-6">
                                {libraryPaths.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${p.type === 'mega' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                {p.type === 'mega' ? <HardDrive size={16} /> : <Folder size={16} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{p.label || p.path}</div>
                                                <div className="text-[10px] font-mono text-zinc-500">{p.path}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] uppercase font-black tracking-widest bg-white/5 px-2 py-1 rounded text-zinc-500">{p.type}</span>
                                            <button onClick={() => handleRemovePath(p.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddPath} className="flex flex-col md:flex-row gap-4">
                                <select
                                    value={newPath.type}
                                    onChange={e => setNewPath({ ...newPath, type: e.target.value })}
                                    className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest focus:border-primary/50 outline-none"
                                >
                                    <option value="local">Local Folder</option>
                                    <option value="mega">Mega.nz Folder</option>
                                </select>
                                <input
                                    placeholder={newPath.type === 'mega' ? "Mega Folder URL..." : "Local Absolute Path..."}
                                    value={newPath.path}
                                    onChange={e => setNewPath({ ...newPath, path: e.target.value })}
                                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none text-sm font-mono"
                                    required
                                />
                                <input
                                    placeholder="Label (Optional)"
                                    value={newPath.label}
                                    onChange={e => setNewPath({ ...newPath, label: e.target.value })}
                                    className="md:w-48 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none text-sm"
                                />
                                <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-6 rounded-xl font-black uppercase tracking-widest text-xs">
                                    Add Path
                                </button>
                            </form>
                        </div>

                        <h3 className="font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Play size={16} className="text-primary" /> Discovered Series ({librarySeries.length})
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {librarySeries.map(series => (
                                <div key={series.id} className="group relative aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all">
                                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                        <Folder size={32} className="text-zinc-700 mb-2" />
                                        <span className="font-bold text-sm text-zinc-500">{series.title}</span>
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h3 className="font-bold text-sm md:text-base leading-tight mb-1">{series.title}</h3>
                                                <div className="text-[10px] uppercase tracking-widest text-zinc-400">Local Series</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSeries(series.id);
                                                }}
                                                className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                title="Delete Series"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
