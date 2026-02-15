import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Play, Star, Calendar, Info, Layers, User as UserIcon, Monitor, Bookmark, Heart, Tv, Check, Shield } from 'lucide-react';

const AnimeDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [anime, setAnime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [listStatus, setListStatus] = useState([]);
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        if (!user) return;
        const fetchDetails = async () => {
            try {
                // Unified API call for local content
                const res = await api.get(`/anime/${id}`);
                const animeData = res.data;

                // const [animeRes, statusRes] = await Promise.all([
                //     api.get(`/anime/${id}`),
                //     api.get(`/users/${user.id}/anime/${id}/status`)
                // ]);

                // Fetch status separately to handle both local/remote IDs in lists safely
                const statusRes = await api.get(`/users/${user.id}/anime/${id}/status`);

                setAnime(animeData);
                setListStatus(statusRes.data.lists || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, user]);

    const toggleList = async (type) => {
        if (toggling) return;
        setToggling(type);
        const isActive = listStatus.includes(type);

        try {
            if (isActive) {
                await api.delete(`/users/${user.id}/lists/${id}/${type}`);
                setListStatus(prev => prev.filter(t => t !== type));
            } else {
                await api.post(`/users/${user.id}/lists`, {
                    anime_id: id,
                    anime_name: anime.title,
                    anime_poster: anime.poster,
                    list_type: type
                });
                setListStatus(prev => [...prev, type]);
            }
        } catch (err) {
            console.error('List toggle error:', err);
        } finally {
            setToggling(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(244,117,33,0.3)]"></div>
            <p className="text-zinc-500 font-black tracking-widest uppercase animate-pulse">Scanning the archives...</p>
        </div>
    );

    if (!anime) return <div className="text-center mt-20 text-zinc-500">Anime not found. Keep searching!</div>;

    const genres = Array.isArray(anime.genres) ? anime.genres : [];

    return (
        <div className="animate-fade-in pb-20">
            {/* Hero Section with Backdrop */}
            <div className="relative h-[45vh] md:h-[55vh] -mx-4 md:-mx-12 overflow-hidden mb-12">
                <div
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-30 transform group-hover:scale-100 transition-transform duration-[10000ms]"
                    style={{ backgroundImage: `url(${anime.poster})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

                <div className="relative h-full container mx-auto px-4 md:px-12 flex flex-col md:flex-row items-end gap-10 pb-16">
                    {/* Poster with Glow */}
                    <div className="hidden md:block w-72 aspect-[2/3] bg-surface rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10 shrink-0 transform -translate-y-8 animate-fade-in-up">
                        <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 animate-fade-in-up delay-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(244,117,33,0.5)]"></div>
                            <h2 className="text-sm font-black text-primary tracking-[0.3em] uppercase">SERIES OVERVIEW</h2>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            {anime.title}
                        </h1>
                        <div className="flex flex-wrap gap-3 mb-8">
                            {genres.map(g => (
                                <span key={g} className="px-4 py-1.5 bg-white/[0.05] border border-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-300">
                                    {g}
                                </span>
                            ))}
                        </div>

                        {anime.episodes && anime.episodes.length > 0 && (
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to={`/watch/${anime.id}/${getEpId(anime.episodes[0].episode_url)}`}
                                    className="group flex items-center gap-4 bg-white text-black hover:bg-primary hover:text-white px-10 py-5 rounded-xl font-black transition-all duration-500 transform hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.1)] overflow-hidden"
                                >
                                    <Play size={24} className="fill-current" />
                                    <span className="tracking-widest uppercase">START WATCHING</span>
                                </Link>

                                <button
                                    onClick={() => toggleList('favorite')}
                                    className={`p-5 rounded-xl border transition-all duration-500 ${listStatus.includes('favorite') ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                >
                                    <Heart size={24} fill={listStatus.includes('favorite') ? 'currentColor' : 'none'} className={toggling === 'favorite' ? 'animate-ping' : ''} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-12">
                {/* Main Content: Info & Story */}
                <div className="lg:col-span-3 space-y-16">
                    <section className="animate-fade-in-up delay-200">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1 h-6 bg-primary/40 rounded-full"></div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white">THE STORY</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg max-w-5xl font-medium tracking-tight">
                            {anime.story}
                        </p>
                    </section>

                    {/* Episodes Grid */}
                    <section className="animate-fade-in-up delay-300">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-1 h-6 bg-primary/40 rounded-full"></div>
                                <h2 className="text-xl font-black uppercase tracking-tighter text-white">CHAPTERS</h2>
                            </div>
                            <span className="text-xs font-black text-zinc-500 tracking-[0.2em]">{anime.episodes?.length || 0} TOTAL</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {anime.episodes && anime.episodes.map((ep, idx) => (
                                <Link
                                    key={idx}
                                    to={`/watch/${anime.id}/${getEpId(ep.episode_url)}`}
                                    className="group relative flex flex-col bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
                                >
                                    <div className="aspect-video relative overflow-hidden">
                                        <img src={ep.src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                                                <Play className="fill-current ml-1" size={20} />
                                            </div>
                                        </div>
                                        <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-black text-white shadow-xl">
                                            EP {ep.episode}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gradient-to-t from-surface to-surface/40">
                                        <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
                                            {ep.name || `Episode ${ep.episode}`}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{anime.title}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar: Metadata & List Actions */}
                <div className="space-y-8 animate-fade-in-up delay-400">
                    {/* List Management Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
                        <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                            <Monitor size={18} className="text-primary" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">MANAGE LISTS</h3>
                        </div>

                        <div className="space-y-3">
                            <ListToggleButton
                                active={listStatus.includes('saved')}
                                onClick={() => toggleList('saved')}
                                icon={<Bookmark size={18} />}
                                label="Plan to Watch"
                                color="primary"
                                loading={toggling === 'saved'}
                            />
                            <ListToggleButton
                                active={listStatus.includes('watching')}
                                onClick={() => toggleList('watching')}
                                icon={<Tv size={18} />}
                                label="Currently Watching"
                                color="blue"
                                loading={toggling === 'watching'}
                            />
                            <ListToggleButton
                                active={listStatus.includes('favorite')}
                                onClick={() => toggleList('favorite')}
                                icon={<Heart size={18} />}
                                label="Add to Favorites"
                                color="red"
                                loading={toggling === 'favorite'}
                            />
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-8">
                        <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                            <Info size={18} className="text-primary" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">SPECIFICATIONS</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            <InfoItem icon={<UserIcon size={14} />} label="Classification" value={anime['النوع'] || 'TV'} />
                            <InfoItem icon={<Calendar size={14} />} label="Production Year" value={anime['تاريخ الانتاج'] || 'Unknown'} />
                            <InfoItem icon={<Monitor size={14} />} label="Airing Status" value={anime['الحالة'] || 'Unknown'} />
                            <InfoItem icon={<Monitor size={14} />} label="Duration" value={anime['مدة الحلقة'] || 'Unknown'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ListToggleButton = ({ active, onClick, icon, label, color, loading }) => {
    const colorClasses = {
        primary: active ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_20px_rgba(244,117,33,0.1)]' : 'hover:border-primary/30',
        blue: active ? 'bg-blue-500/20 border-blue-500/50 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'hover:border-blue-500/30',
        red: active ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'hover:border-red-500/30'
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${colorClasses[color] || ''} ${!active ? 'bg-white/[0.02] border-white/5 text-zinc-500 hover:text-white hover:bg-white/[0.05]' : ''}`}
        >
            <div className="flex items-center gap-4">
                <span className={active ? 'animate-bounce-short' : ''}>{icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</span>
            </div>
            {active && <Check size={14} className="animate-in zoom-in duration-500" />}
            {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
        </button>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em]">
            {icon} {label}
        </div>
        <p className="text-white text-sm font-black tracking-tight">{value}</p>
    </div>
);

const getEpId = (url) => {
    if (!url) return '';
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
};

export default AnimeDetails;
