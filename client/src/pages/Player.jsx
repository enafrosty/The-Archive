import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { ArrowLeft, Maximize2, SkipForward } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

const Player = () => {
    const { animeId, episodeId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const containerRef = useRef(null);
    const progressInterval = useRef(null);
    const controlsTimeout = useRef(null);

    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState(0);
    const [loading, setLoading] = useState(true);
    const [animeInfo, setAnimeInfo] = useState(null);
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Local Media Server Logic
                // Fetch Series Info
                const infoRes = await api.get(`/anime/${animeId}`);
                setAnimeInfo(infoRes.data);

                // Construct Local Stream URL
                const streamUrl = `http://${window.location.hostname}:5000/api/stream/library/${episodeId}`;
                setServers([{
                    name: 'Local Server',
                    url: streamUrl,
                    isLocal: true
                }]);
                setSelectedServer(0);
            } catch (err) {
                console.error('Fetch error:', err);
                setServers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [episodeId, animeId]);

    // Mouse movement detection to show/hide controls
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            controlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        };
    }, []);

    // Save watch history periodically
    useEffect(() => {
        if (user && animeInfo && episodeId) {
            saveProgress(0, 0);
            progressInterval.current = setInterval(() => {
                saveProgress(15, 100);
            }, 30000);

            return () => {
                if (progressInterval.current) clearInterval(progressInterval.current);
            };
        }
    }, [user, animeInfo, episodeId]);

    const saveProgress = async (progress, duration) => {
        if (!user || !animeInfo) return;
        try {
            await api.post(`/users/${user.id}/history`, {
                anime_id: animeId,
                anime_name: animeInfo.title,
                anime_poster: animeInfo.poster,
                episode_id: episodeId,
                episode_number: `Episode ${animeInfo.episodes?.find(e => e.episode_url.includes(episodeId))?.episode || 'Unknown'}`,
                progress,
                duration
            });
        } catch (error) {
            console.error('Failed to save watch history:', error);
        }
    };

    const getNextEpisode = () => {
        if (!animeInfo?.episodes) return null;

        // Find current index
        const currentIndex = animeInfo.episodes.findIndex(ep => {
            // ep.episode_url is like "/watch/123/456"
            // we check if it ends with our current episodeId
            return ep.episode_url.split('/').pop() === episodeId;
        });

        if (currentIndex !== -1 && currentIndex + 1 < animeInfo.episodes.length) {
            return animeInfo.episodes[currentIndex + 1];
        }
        return null;
    };

    const handleNextEpisode = () => {
        const next = getNextEpisode();
        if (next) {
            const nextId = next.episode_url.split('/').pop();
            navigate(`/watch/${animeId}/${nextId}`);
        }
    };

    const handleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Fullscreen error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4 font-black italic">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-2xl uppercase tracking-[0.5em] animate-pulse">Initializing</div>
            </div>
        );
    }

    if (!servers || servers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-6">
                <div className="text-4xl text-primary font-black uppercase italic tracking-tighter">No Signal</div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-white text-black font-black uppercase italic tracking-widest hover:bg-primary hover:text-white transition-all duration-500"
                >
                    Back to Safety
                </button>
            </div>
        );
    }

    const currentServer = servers[selectedServer];
    const nextEp = getNextEpisode();

    return (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden select-none">
            <VideoPlayer
                url={currentServer.url}
                onNext={nextEp ? handleNextEpisode : null}
                onBack={() => navigate(-1)}
                animeTitle={animeInfo?.title}
                episodeNumber={`Episode ${(() => {
                    const ep = animeInfo?.episodes?.find(e => e.episode_url.split('/').pop() === String(episodeId));
                    return ep?.episode || 'Unknown';
                })()}`}
                servers={servers}
                selectedServer={selectedServer}
                onServerSelect={setSelectedServer}
            />
        </div>
    );
};

export default Player;
