import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';

const ProfileSelection = () => {
    const { users, login, verifyPin, loading } = useAuth();
    const navigate = useNavigate();

    // PIN states
    const [pinUser, setPinUser] = useState(null);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    const handleLogin = async (selectedUser) => {
        if (selectedUser.pin) {
            setPinUser(selectedUser);
            setPinInput('');
            setPinError('');
        } else {
            login(selectedUser);
            navigate('/');
        }
    };

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        const success = await verifyPin(pinUser.id, pinInput);
        if (success) {
            login(pinUser);
            navigate('/');
        } else {
            setPinError('Invalid PIN code');
            setPinInput('');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 font-black tracking-widest uppercase animate-pulse">Accessing Archives...</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4 animate-fade-in">
            <div className="mb-12 text-center">
                <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter uppercase">Identify yourself.</h1>
                <p className="text-zinc-500 font-bold tracking-[0.3em] uppercase text-xs">AUTHORIZED ACCESS ONLY</p>
            </div>

            <div className="flex flex-wrap gap-10 justify-center items-center">
                {users.map(u => (
                    <div
                        key={u.id}
                        className="group flex flex-col items-center gap-4 cursor-pointer transition-all hover:scale-110"
                        onClick={() => handleLogin(u)}
                    >
                        <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-zinc-900 flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-all overflow-hidden relative shadow-2xl">
                            {u.avatar ? (
                                <img src={u.avatar} alt={u.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <span className="text-5xl font-black text-zinc-600 group-hover:text-white transition-colors">{u.username[0].toUpperCase()}</span>
                            )}

                            {u.pin && (
                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                                    <Lock size={14} className="text-white" />
                                </div>
                            )}

                            {u.username === 'frosty' && (
                                <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-md p-1 rounded-full shadow-lg border border-white/20">
                                    <CheckCircle2 size={12} className="text-white fill-white/20" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-zinc-500 group-hover:text-primary text-lg transition-colors font-black uppercase tracking-tighter flex items-center gap-2">
                            {u.username}
                            {u.username === 'frosty' && (
                                <CheckCircle2 size={16} className="text-blue-500 fill-blue-500/10" />
                            )}
                        </span>
                    </div>
                ))}
            </div>

            {/* PIN Entry Modal */}
            {pinUser && (
                <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50 backdrop-blur-md">
                    <div className="flex flex-col items-center max-w-sm w-full p-8 animate-fade-in-up">
                        <div className="w-24 h-24 rounded-2xl bg-zinc-900 overflow-hidden mb-6 border-2 border-zinc-700 shadow-2xl">
                            {pinUser.avatar ? (
                                <img src={pinUser.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-zinc-600 bg-zinc-900">
                                    {pinUser.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Profile Locked</h2>
                        <p className="text-zinc-500 mb-8 text-center text-xs font-bold tracking-widest uppercase italic">Authorization Required</p>

                        <form onSubmit={handlePinSubmit} className="w-full flex flex-col items-center">
                            <input
                                autoFocus
                                type="password"
                                maxLength={4}
                                placeholder="PIN"
                                className="w-48 bg-transparent text-white text-center text-5xl tracking-[0.5em] mb-4 border-b-2 border-zinc-700 focus:border-primary outline-none py-2 font-mono transition-colors"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                            />
                            {pinError && <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-4 animate-shake">{pinError}</p>}

                            <div className="flex gap-4 w-full mt-8">
                                <button
                                    type="button"
                                    onClick={() => setPinUser(null)}
                                    className="flex-1 text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.2em] font-black border border-white/5 bg-white/[0.02] py-4 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-white text-black hover:bg-primary hover:text-white text-[10px] uppercase tracking-[0.2em] font-black py-4 rounded-xl transition-all shadow-xl active:scale-95"
                                >
                                    Unlock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSelection;
