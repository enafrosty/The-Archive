import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AnimeCard from '../components/AnimeCard';
import { Bookmark, Heart, Tv, Layers, Sparkles } from 'lucide-react';

const MyLists = () => {
    const { user } = useAuth();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('favorite');

    useEffect(() => {
        if (!user) return;
        const fetchLists = async () => {
            try {
                const { data } = await api.get(`/users/${user.id}/lists`);
                setLists(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLists();
    }, [user]);

    const filteredLists = lists.filter(item => item.list_type === activeTab);

    const tabs = [
        { id: 'favorite', label: 'Favorites', icon: <Heart size={18} /> },
        { id: 'watching', label: 'Watching', icon: <Tv size={18} /> },
        { id: 'saved', label: 'To Watch', icon: <Bookmark size={18} /> },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(244,117,33,0.3)]"></div>
            <p className="text-zinc-500 font-black tracking-[0.4em] uppercase text-xs animate-pulse">Organizing your library</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-32 animate-fade-in overflow-x-hidden">
            {/* Cinematic Header */}
            <div className="relative py-24 md:py-32 mb-16 overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.02] border-b border-white/5 shadow-2xl skew-y-1 origin-top-left -translate-y-12"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

                <div className="container mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                                <Layers size={14} className="animate-pulse" /> PERSONAL COLLECTION
                                <div className="h-0.5 w-8 bg-white/10 hidden md:block"></div>
                                <span className="text-zinc-500 hidden md:block italic">SYSTEM ARCHIVES</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4 uppercase">
                                My <span className="text-primary italic">Lists</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-6">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(244,117,33,0.4)]"></div>
                                <span className="text-sm font-bold text-zinc-400 tracking-widest uppercase">{lists.length} TOTAL TITLES</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12">
                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-12 border-b border-white/5 pb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black transition-all duration-500 uppercase tracking-widest text-xs border ${activeTab === tab.id
                                ? 'bg-primary text-white border-primary shadow-[0_10px_30px_rgba(244,117,33,0.3)] scale-105'
                                : 'bg-white/[0.03] text-zinc-500 border-white/5 hover:bg-white/[0.05] hover:text-white'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'}`}>
                                {lists.filter(i => i.list_type === tab.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                {filteredLists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-8 animate-fade-in-up">
                        {filteredLists.map((item, idx) => (
                            <AnimeCard
                                key={idx}
                                anime={{
                                    name: item.anime_name,
                                    poster: item.anime_poster,
                                    url: `/anime/${item.anime_id}`
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center bg-white/[0.01] rounded-[3rem] border border-white/5 max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-20"></div>
                        <div className="relative mb-10 translate-y-0">
                            <div className="relative bg-white/5 backdrop-blur-xl p-12 rounded-[2.5rem] border border-white/10 shadow-3xl">
                                <Layers size={80} className="text-zinc-700 animate-pulse" />
                            </div>
                            <Sparkles className="absolute -top-6 -right-6 text-primary animate-spin-slow" size={40} />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter relative">THIS WING IS VACANT</h2>
                        <p className="text-zinc-500 max-w-lg text-lg font-medium leading-relaxed relative">
                            Your <span className="text-primary font-black italic">"{tabs.find(t => t.id === activeTab).label}"</span> list is currently empty.
                            <br /><span className="text-sm tracking-widest uppercase opacity-60">START DISCOVERING TO FILL YOUR ARCHIVE</span>
                        </p>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin-slow {
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default MyLists;
