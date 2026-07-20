import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Camera, Lock, User, Check, AlertCircle } from 'lucide-react';

const ProfileManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users, setPin, updateAvatar, logout } = useAuth();
    const profile = users.find(u => u.id == id);

    const [username, setUsername] = useState(profile?.username || '');
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);

    if (!profile) return <div className="text-white p-10">Profile not found</div>;

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setUploading(true);
            await updateAvatar(profile.id, formData);
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.error || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdatePin = async (e) => {
        e.preventDefault();
        if (newPin !== confirmPin) {
            setMessage({ type: 'error', text: 'New PINs do not match' });
            return;
        }
        if (newPin.length !== 4 && newPin !== '') {
            setMessage({ type: 'error', text: 'PIN must be 4 digits (or empty to remove)' });
            return;
        }

        try {
            await setPin(profile.id, oldPin, newPin);
            setMessage({ type: 'success', text: 'Security settings updated!' });
            setOldPin('');
            setNewPin('');
            setConfirmPin('');
        } catch (err) {
            setMessage({ type: 'error', text: err.error || 'Failed to update PIN' });
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-6 md:p-12">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white mb-12 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Profiles
            </button>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12">Edit Profile</h1>

                <div className="grid md:grid-cols-3 gap-12">
                    {/* Left: Avatar Column */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative group w-48 h-48">
                            <div className="w-full h-full rounded-md bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                                {profile.avatar ? (
                                    <img src={profile.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-zinc-600">
                                        {profile.username[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer rounded-md">
                                <Camera className="mb-2" />
                                <span className="text-xs font-bold uppercase tracking-wider">Change</span>
                                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                            </label>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-zinc-500 text-sm text-center">Custom images make your profile unique.</p>
                    </div>

                    {/* Right: Settings Column */}
                    <div className="md:col-span-2 space-y-12">
                        {/* Status Message */}
                        {message.text && (
                            <div className={`p-4 rounded-md flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                                }`}>
                                {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        {/* Profile Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-zinc-400 mb-4 border-b border-zinc-800 pb-2">
                                <User size={18} />
                                <h2 className="text-lg font-bold uppercase tracking-widest">Profile Info</h2>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:border-primary outline-none transition-colors"
                                    disabled // For now let's disable username change until we add backend support
                                />
                                <p className="text-[10px] text-zinc-600 mt-1">Username changes are currently disabled.</p>
                            </div>
                        </section>

                        {/* Security */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-zinc-400 mb-4 border-b border-zinc-800 pb-2">
                                <Lock size={18} />
                                <h2 className="text-lg font-bold uppercase tracking-widest">Security</h2>
                            </div>

                            <form onSubmit={handleUpdatePin} className="space-y-4">
                                {profile.hasPin && (
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Original PIN</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={oldPin}
                                            onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:border-primary outline-none transition-colors font-mono"
                                            placeholder="Enter 4-digit PIN"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
                                            {profile.hasPin ? 'New PIN' : 'Set PIN'}
                                        </label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={newPin}
                                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:border-primary outline-none transition-colors font-mono"
                                            placeholder="4 digits"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Confirm PIN</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={confirmPin}
                                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:border-primary outline-none transition-colors font-mono"
                                            placeholder="Repeat PIN"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-primary hover:text-white transition-all uppercase text-sm tracking-widest"
                                >
                                    Save Security Settings
                                </button>
                            </form>
                        </section>

                        <div className="pt-12 border-t border-zinc-800">
                            <button
                                onClick={() => navigate('/')}
                                className="border border-zinc-700 text-zinc-400 px-8 py-3 rounded font-bold hover:border-white hover:text-white transition-all uppercase text-sm tracking-widest"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileManagement;
