import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import AnimeCard from '../components/AnimeCard';
import { Search as SearchIcon, Ghost, Sparkles, Filter } from 'lucide-react';

const Search = () => {
    const { query } = useParams();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSearch = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/search/${query}`);
                setResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (query) fetchSearch();
    }, [query]);

    return (
        <div className="min-h-screen bg-background pb-32 animate-fade-in overflow-x-hidden">
            {/* Cinematic Header for Search Results */}
            <div className="relative py-24 md:py-32 mb-16 overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.02] border-b border-white/5 shadow-2xl skew-y-1 origin-top-left -translate-y-12"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

                <div className="container mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                                <SearchIcon size={14} className="animate-pulse" /> SEARCHING DATABASE
                                <div className="h-0.5 w-8 bg-white/10 hidden md:block"></div>
                                <span className="text-zinc-500 hidden md:block italic">SCANNING ARCHIVES</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                                RESULTS FOR <br className="md:hidden" />
                                <span className="text-primary italic whitespace-nowrap">"{query}"</span>
                            </h1>
                            {!loading && (
                                <div className="flex items-center gap-2 mt-6">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(244,117,33,0.4)]"></div>
                                    <span className="text-sm font-bold text-zinc-400 tracking-widest uppercase">{results.length} TITLES MATCHED</span>
                                </div>
                            )}
                        </div>

                        {!loading && results.length > 0 && (
                            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 p-2 rounded-xl backdrop-blur-md">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Filter size={18} />
                                </div>
                                <div className="pr-4">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SMART FILTERING</p>
                                    <p className="text-xs font-bold text-white">RELEVANCE SORTED</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/[0.01] rounded-3xl border border-white/5">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(244,117,33,0.3)]"></div>
                        <p className="text-zinc-500 font-black tracking-[0.4em] uppercase text-xs animate-pulse">Filtering your destiny</p>
                    </div>
                ) : (
                    <>
                        {results.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-8 animate-fade-in-up">
                                {results.map((anime, idx) => (
                                    <AnimeCard key={idx} anime={anime} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 text-center bg-white/[0.01] rounded-3xl border border-white/5 max-w-5xl mx-auto shadow-2xl">
                                <div className="relative mb-10">
                                    <div className="absolute inset-0 bg-primary blur-3xl opacity-10 animate-pulse"></div>
                                    <div className="relative bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 shadow-2xl">
                                        <Ghost size={80} className="text-zinc-700 animate-bounce" />
                                    </div>
                                    <Sparkles className="absolute -top-4 -right-4 text-primary animate-spin-slow" size={32} />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">THE ARCHIVES ARE SILENT</h2>
                                <p className="text-zinc-500 max-w-lg text-lg font-medium leading-relaxed">
                                    We searched every corner of our galaxy for <span className="text-primary font-black italic">"{query}"</span> but found no signal.
                                    <br /><span className="text-sm tracking-widest uppercase opacity-60">TRY BROADER TERMS OR CHECK SPELLING</span>
                                </p>
                            </div>
                        )}
                    </>
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
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Search;
