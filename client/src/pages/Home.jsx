import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import AnimeCard from '../components/AnimeCard';
import { Play, TrendingUp, Clock, Calendar, ChevronRight, ChevronLeft, Sparkles, Activity, HardDrive } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [homeData, setHomeData] = useState({ featured: [], trending: [], latest: [] });
    const [library, setLibrary] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const homeRes = await api.get('/home');
                setHomeData(homeRes.data);

                // Fetch Library
                try {
                    const libRes = await api.get('/library/series');
                    setLibrary(libRes.data);
                } catch (e) {
                    console.error("Failed to fetch library", e);
                }

                if (user) {
                    const historyRes = await api.get(`/users/${user.id}/continue-watching`);
                    setContinueWatching(historyRes.data);
                }
            } catch (error) {
                console.error('Error fetching home data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Auto-rotate hero slider
    useEffect(() => {
        if (homeData.featured.length > 0) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % homeData.featured.length);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [homeData.featured]);

    const handleWatchNow = () => {
        const featured = homeData.featured[currentSlide];
        if (!featured?.url) return;

        if (featured.url.includes('/episode/')) {
            const episodeId = featured.url.split('/episode/')[1]?.replace('/', '');
            const derivedAnimeId = episodeId.split('-episode-')[0] || 'search';
            navigate(`/watch/${derivedAnimeId}/${episodeId}`);
        } else {
            const animeId = featured.url.split('/anime/')[1]?.replace('/', '');
            if (animeId) navigate(`/anime/${animeId}`);
        }
    };

    const handleExploreSeries = () => {
        const featured = homeData.featured[currentSlide];
        if (!featured?.url) return;

        const animeId = featured.url.includes('/anime/')
            ? featured.url.split('/anime/')[1]?.replace('/', '')
            : featured.url.split('/episode/')[1]?.split('-episode-')[0]?.replace('/', '');

        if (animeId) navigate(`/anime/${animeId}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[85vh] bg-background">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(244,117,33,0.3)]"></div>
                <p className="text-zinc-500 font-black animate-pulse tracking-[0.3em] uppercase text-xs">Elevating your experience</p>
            </div>
        );
    }

    const currentFeatured = homeData.featured[currentSlide];

    return (
        <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
            {/* High-End Cinematic Hero Banner */}
            {currentFeatured && (
                <div className="relative h-[75vh] md:h-[90vh] -mt-24 overflow-hidden group">
                    <div
                        className="absolute inset-0 bg-cover bg-center scale-110 transition-all duration-[15000ms] ease-out group-hover:scale-100 filter brightness-90 animate-subtle-zoom"
                        style={{ backgroundImage: `url(${currentFeatured.banner})` }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
                    <div className="absolute inset-0 bg-black/20" />

                    <div className="absolute inset-0 container mx-auto px-6 md:px-12 flex flex-col justify-center items-start pt-32">
                        <div className="max-w-4xl relative z-10">
                            <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
                                <span className="bg-primary/90 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 backdrop-blur-sm">FEATURED RELEASES</span>
                                <div className="h-0.5 w-12 bg-white/20"></div>
                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} className="text-primary" /> NEW CONTENT AVAILABLE
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-[7.5rem] font-black text-white mb-8 tracking-tighter leading-[0.85] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-title-reveal">
                                {currentFeatured.title}
                            </h1>

                            <div className="flex flex-wrap gap-5 animate-fade-in-up delay-300">
                                <button
                                    onClick={handleWatchNow}
                                    className="group/btn relative flex items-center gap-4 bg-white text-black hover:bg-primary hover:text-white px-10 py-4 rounded-xl font-black transition-all duration-500 transform hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.1)] overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                    <Play size={24} className="relative z-10 fill-current" />
                                    <span className="relative z-10 tracking-[0.05em]">WATCH NOW</span>
                                </button>
                                <button
                                    onClick={handleExploreSeries}
                                    className="group/btn flex items-center gap-4 bg-white/[0.05] backdrop-blur-xl text-white hover:bg-white/[0.1] px-10 py-4 rounded-xl font-black transition-all duration-300 border border-white/10 hover:border-white/20"
                                >
                                    EXPLORE SERIES
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-16 right-12 flex flex-col gap-4 z-20">
                        {homeData.featured.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className="group flex items-center gap-4 outline-none"
                            >
                                <span className={`text-[10px] font-black transition-all duration-500 uppercase tracking-widest ${idx === currentSlide ? 'text-primary opacity-100 translate-x-0' : 'text-white/20 opacity-0 translate-x-4 group-hover:opacity-40'}`}>
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div className={`h-1.5 transition-all duration-700 rounded-full ${idx === currentSlide ? 'bg-primary w-12 shadow-[0_0_15px_rgba(244,117,33,0.5)]' : 'bg-white/10 w-4 group-hover:bg-white/30'}`} />
                            </button>
                        ))}
                    </div>

                    <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </div>
            )}

            <div className="container mx-auto px-6 md:px-12 mt-12 space-y-24 relative z-10">

                {/* --- MY LIBRARY SECTION --- */}
                {library.length > 0 && (
                    <section className="animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1.5 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">My <span className="text-green-500">Library</span></h2>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                                <HardDrive size={12} /> Local Content
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {library.map(item => (
                                <Link
                                    to={`/anime/local-${item.id}`} // Prefix local IDs
                                    key={`local-${item.id}`}
                                    className="group relative aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-green-500/50 transition-all duration-300"
                                >
                                    {item.poster_path ? (
                                        <img src={item.poster_path} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center flex-col text-zinc-600 p-4 text-center">
                                            <div className="mb-2"><HardDrive size={32} /></div>
                                            <span className="text-xs font-bold">{item.title}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <h3 className="font-bold text-sm leading-tight text-white mb-1">{item.title}</h3>
                                        <div className="text-[9px] uppercase tracking-widest text-green-500 font-bold">Local Seris</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Continue Watching Section */}
                {user && continueWatching.length > 0 && (
                    <section className="animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(244,117,33,0.5)]"></div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Stay <span className="text-primary">Linked</span></h2>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-2">Continue Watching</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {continueWatching.map(item => (
                                <Link
                                    to={`/watch/${item.series_id}/${item.episode_id.startsWith('http') ? 'local-' + item.episode_id : item.episode_id.replace('episode/', '')}`}
                                    key={item.series_id}
                                    className="group relative bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500"
                                >
                                    <div className="aspect-video relative">
                                        <img src={item.series_poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                                                <Play size={20} fill="currentColor" />
                                            </div>
                                        </div>
                                        <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black text-white shadow-xl">
                                            {item.episode_number}
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                            <div
                                                className="h-full bg-primary shadow-[0_0_10px_rgba(244,117,33,0.8)]"
                                                style={{ width: `${(item.progress / item.duration) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-sm font-black text-white truncate group-hover:text-primary transition-colors">{item.series_name}</h3>
                                        <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">{item.episode_number}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Most Popular - Premium Grid */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(244,117,33,0.4)]"></div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">MOST POPULAR</h2>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
                            <TrendingUp size={16} className="text-primary italic" />
                            <span className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">TRENDING THIS SEASON</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {homeData.trending.map((anime, idx) => (
                            <AnimeCard key={idx} anime={anime} />
                        ))}
                    </div>
                </section>

                {/* Latest Releases */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(244,117,33,0.4)]"></div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">LATEST RELEASES</h2>
                        </div>
                        <button className="text-[10px] font-black text-zinc-600 hover:text-primary transition-colors tracking-widest uppercase">VIEW ALL RELEASES</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {homeData.latest.slice(0, 10).map((episode, idx) => {
                            let episodeId, animeId;
                            if (episode.episode_url && episode.episode_url.includes('/watch/')) {
                                const parts = episode.episode_url.split('/watch/')[1].split('/');
                                animeId = parts[0];
                                episodeId = parts[1];
                            } else {
                                episodeId = episode.episode_url?.split('/episode/')[1]?.replace('/', '') || '';
                                animeId = episode.anime_url?.split('/anime/')[1]?.replace('/', '') || 'search';
                            }
                            return (
                                <div
                                    key={idx}
                                    onClick={() => navigate(`/watch/${animeId}/${episodeId}`)}
                                    className="group relative flex flex-col bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-primary/10"
                                >
                                    <div className="aspect-video relative overflow-hidden">
                                        <img src={episode.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                                        <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-black text-white shadow-xl">
                                            EPISODE {episode.episode_title.match(/\d+/)?.[0]}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                                                <Play size={24} fill="currentColor" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-t from-surface to-surface/50">
                                        <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors line-clamp-1 mb-2 tracking-tight">
                                            {episode.anime_title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Activity size={12} className="text-primary/60" />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">JUST RELEASED</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            <style jsx global>{`
                @keyframes subtle-zoom {
                    0% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .animate-subtle-zoom {
                    animation: subtle-zoom 15s ease-out forwards;
                }
                .animate-title-reveal {
                    animation: title-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                @keyframes title-reveal {
                    from { opacity: 0; transform: translateY(40px); clip-path: inset(100% 0 0 0); }
                    to { opacity: 1; transform: translateY(0); clip-path: inset(0 0 0 0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Home;
