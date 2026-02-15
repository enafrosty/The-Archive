import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const AnimeCard = ({ anime }) => {
    const animeId = anime.url?.split('/anime/')[1]?.replace('/', '') || '';

    return (
        <Link
            to={`/anime/${animeId}`}
            className="group relative bg-surface rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-primary/5"
        >
            <div className="aspect-[2/3] relative overflow-hidden">
                <img
                    src={anime.poster || anime.img}
                    alt={anime.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Play Icon Reveal */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="bg-white text-black p-4 rounded-full shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                        <Play size={24} fill="currentColor" />
                    </div>
                </div>

                {/* Status Badge */}
                {anime.isLocal && (
                    <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white shadow-xl z-20">
                        LOCAL
                    </div>
                )}
                {anime.status && !anime.isLocal && (
                    <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        {anime.status.toUpperCase()}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gradient-to-t from-surface to-surface/60">
                <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors line-clamp-2 tracking-tight leading-tight">
                    {anime.name}
                </h3>
                {anime.type && (
                    <p className="text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-[0.2em]">{anime.type}</p>
                )}
            </div>
        </Link>
    );
};

export default AnimeCard;
