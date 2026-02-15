import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Play, Shield, Zap, Heart, Sparkles, ChevronRight } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();
    const [posters, setPosters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosters = async () => {
            try {
                const { data } = await api.get('/home');
                const allPosters = [
                    ...(data.featured?.map(i => i.banner) || []),
                    ...(data.trending?.map(i => i.poster) || []),
                    ...(data.latest?.map(i => i.thumbnail) || [])
                ].filter(Boolean);
                // Shuffle and take a few
                setPosters(allPosters.sort(() => 0.5 - Math.random()).slice(0, 20));
            } catch (err) {
                console.error('Failed to fetch posters for landing background', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosters();
    }, []);

    const handleEnter = () => {
        // We actually want to go to the profile selection
        // In our current App.jsx logic, if no user is selected, it shows ProfileSelection.
        // But we want a "Landing" page BEFORE that.
        // So we might need a "visited landing" state or just navigate to a specific profile selection route.
        // For now, let's assume we'll update App.jsx to show Landing first and navigate to /profiles
        navigate('/profiles');
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-primary selection:text-white">
            {/* Dynamic Blurred Background Grid */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 scale-110 blur-[80px] animate-slow-drift">
                    {posters.map((url, i) => (
                        <div key={i} className="aspect-[2/3] rounded-3xl bg-zinc-900 overflow-hidden border border-white/5 shadow-2xl">
                            <img src={url} alt="" className="w-full h-full object-cover opacity-60" />
                        </div>
                    ))}
                    {posters.length === 0 && !loading && Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] rounded-3xl bg-zinc-800 animate-pulse border border-white/5" />
                    ))}
                </div>
            </div>

            {/* Dark Overlays for legibility */}
            <div className="absolute inset-0 z-1 bg-gradient-to-b from-black via-black/40 to-black" />
            <div className="absolute inset-0 z-1 bg-gradient-to-r from-black via-transparent to-black opacity-60" />

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-6 text-center animate-fade-in">
                <div className="inline-flex items-center gap-3 bg-white/[0.05] border border-white/10 px-6 py-2.5 rounded-full mb-12 animate-fade-in-up">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/40">
                        <img src="https://images.weserv.nl/?url=static.wikia.nocookie.net/tonikaku-kawaii/images/7/7f/Tsukasa_Yuzaki_Profile.png" className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Welcome to the Archive</span>
                </div>

                <h1 className="text-6xl md:text-[8rem] font-black text-white tracking-tighter leading-none mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-title-reveal">
                    THE ANIME <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-red-600 italic">UNLIMITED</span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 font-medium leading-relaxed mb-12 animate-fade-in-up delay-200">
                    Discover thousands of anime titles, track your progress, and immerse yourself in high-definition streaming. Your personal gateway to every universe ever imagined.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
                    <button
                        onClick={handleEnter}
                        className="group relative flex items-center gap-4 bg-white text-black hover:bg-primary hover:text-white px-12 py-6 rounded-2xl font-black transition-all duration-500 transform hover:scale-105 shadow-[0_20px_60px_rgba(255,255,255,0.1)] active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10 tracking-[0.2em] uppercase">Enter the Archive</span>
                        <ChevronRight size={20} className="relative z-10 transition-transform group-hover:translate-x-2" />
                    </button>

                    <div className="flex items-center gap-8 px-8 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl">
                        <Feature icon={<Shield size={18} />} label="Secure" />
                        <div className="w-px h-6 bg-white/10" />
                        <Feature icon={<Zap size={18} />} label="Lightning Fast" />
                        <div className="w-px h-6 bg-white/10" />
                        <Feature icon={<Heart size={18} />} label="No Ads" />
                    </div>
                </div>
            </div>

            {/* Footer Attribution */}
            <div className="absolute bottom-12 left-0 right-0 z-10 text-center animate-fade-in delay-500">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">Powered by Coffee • A cool project by frosty</p>
            </div>

            <style jsx global>{`
                @keyframes slow-drift {
                    0% { transform: scale(1.1) translateY(0); }
                    50% { transform: scale(1.15) translateY(-20px) rotate(1deg); }
                    100% { transform: scale(1.1) translateY(0); }
                }
                .animate-slow-drift {
                    animation: slow-drift 30s ease-in-out infinite;
                }
                .animate-title-reveal {
                    animation: title-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                @keyframes title-reveal {
                    from { opacity: 0; transform: translateY(40px); filter: blur(20px); }
                    to { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
                .delay-500 { animation-delay: 0.5s; }
            `}</style>
        </div>
    );
};

const Feature = ({ icon, label }) => (
    <div className="flex items-center gap-2 text-white/60">
        <span className="text-primary">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

export default Landing;
