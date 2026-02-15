import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Loader2, Play, User as UserIcon, Layers, Shield, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Debounced search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                setIsSearching(true);
                setShowDropdown(true);
                try {
                    const { data } = await api.get(`/search/${query}`);
                    setSuggestions(data.slice(0, 6));
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search/${query}`);
            setShowDropdown(false);
        }
    };

    if (!user) return null;

    return (
        <nav className="fixed top-0 w-full z-[100] px-6 md:px-12 py-4 flex items-center justify-between text-white transition-all duration-500">
            {/* Ultra-high-end Glassmorphic Background */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl border-b border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] -z-10" />

            <Link to="/" className="flex items-center gap-3 text-3xl font-black tracking-tighter text-primary hover:scale-105 transition-all duration-300 drop-shadow-[0_0_15px_rgba(244,117,33,0.3)]">
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                    <img src="https://images.weserv.nl/?url=static.wikia.nocookie.net/tonikaku-kawaii/images/7/7f/Tsukasa_Yuzaki_Profile.png" className="w-full h-full object-cover" alt="" />
                </div>
                THE ARCHIVE
            </Link>

            <div className="flex-1 max-w-xl mx-8 md:mx-16 relative" ref={dropdownRef}>
                <form onSubmit={handleSearch} className="relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${query ? 'text-primary scale-110' : 'text-zinc-500 group-focus-within:text-primary'}`} />
                    <input
                        type="text"
                        placeholder="Search our vast library..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium placeholder:text-zinc-600 shadow-inner"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.trim() && setShowDropdown(true)}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                    )}
                </form>

                {/* Refined Glassmorphic Dropdown */}
                {showDropdown && (suggestions.length > 0 || isSearching) && (
                    <div className="absolute top-full mt-3 w-full bg-zinc-900/40 backdrop-blur-[40px] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-3 space-y-2">
                            {suggestions.map((anime, idx) => {
                                const animeId = anime.url?.split('/anime/')[1]?.replace('/', '') || '';
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            navigate(`/anime/${animeId}`);
                                            setShowDropdown(false);
                                            setQuery('');
                                        }}
                                        className="w-full flex items-center gap-4 p-2.5 hover:bg-white/5 rounded-xl transition-all duration-300 group text-left border border-transparent hover:border-white/5"
                                    >
                                        <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-lg relative">
                                            <img src={anime.img || anime.poster} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-700" alt="" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors truncate mb-1">{anime.name}</h4>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{anime.type || 'TV'}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{anime.status}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100">
                                            <Play size={16} className="text-primary fill-primary" />
                                        </div>
                                    </button>
                                );
                            })}

                            {!isSearching && suggestions.length === 0 && (
                                <div className="p-8 text-center bg-white/[0.02] rounded-xl">
                                    <p className="text-zinc-500 text-sm font-medium">No anime found matching your search</p>
                                </div>
                            )}
                        </div>

                        {suggestions.length > 0 && (
                            <button
                                onClick={handleSearch}
                                className="w-full p-4 bg-primary/10 text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-white transition-all duration-300 border-t border-white/5"
                            >
                                SHOW ALL RESULTS
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                {user?.username === 'frosty' && (
                    <Link
                        to="/admin"
                        className="hidden xl:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all duration-300 group"
                    >
                        <Shield size={16} className="text-zinc-500 group-hover:text-primary transition-colors" />
                        ADMIN CONTROL
                    </Link>
                )}
                <Link
                    to="/my-lists"
                    className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all duration-300 group"
                >
                    <Layers size={16} className="text-zinc-500 group-hover:text-primary transition-colors" />
                    MY LISTS
                </Link>
                <Link
                    to={`/manage-profile/${user.id}`}
                    className="flex items-center gap-3 p-1.5 pr-5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-primary/30 transition-all duration-300 group shadow-lg"
                >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-black overflow-hidden border-2 border-white/10 group-hover:border-primary transition-all duration-500 shadow-[0_0_15px_rgba(244,117,33,0.2)]">
                        {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm">{user.username[0].toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="hidden md:inline font-black text-xs tracking-wide uppercase group-hover:text-primary transition-colors">{user.username}</span>
                        <span className="hidden md:inline text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Premium Member</span>
                    </div>
                </Link>
                <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="p-3 bg-white/[0.03] hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all duration-300 border border-white/5 hover:border-red-500/30 text-zinc-400 group"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
