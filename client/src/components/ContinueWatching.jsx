import { Link } from 'react-router-dom';

const ContinueWatching = ({ items }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => {
                const animeId = item.anime_id;
                const episodeId = item.episode_id?.split('episode/')[1]?.replace('/', '') || '';
                const progress = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;

                return (
                    <Link
                        key={item.anime_id}
                        to={`/watch/${animeId}/${episodeId}`}
                        className="group bg-surface rounded-lg overflow-hidden border border-white/5 hover:border-primary transition-all"
                    >
                        <div className="aspect-video relative">
                            <img
                                src={item.anime_poster}
                                alt={item.anime_name}
                                className="w-full h-full object-cover"
                            />
                            {/* Progress Bar */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="text-xs font-bold line-clamp-1 text-white">
                                {item.anime_name}
                            </h3>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase">
                                {item.episode_number}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default ContinueWatching;
