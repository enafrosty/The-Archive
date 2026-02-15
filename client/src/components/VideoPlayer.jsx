import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, SkipForward, ArrowLeft } from 'lucide-react';

const VideoPlayer = ({ url, onNext, onBack, animeTitle, episodeNumber, servers = [], selectedServer = 0, onServerSelect }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const controlsTimeout = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => setIsLoading(false);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
        };
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleSeek = (e) => {
        const time = (e.target.value / 100) * duration;
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        videoRef.current.muted = newMuted;
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const skipTime = (amount) => {
        videoRef.current.currentTime += amount;
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowRight') {
                skipTime(10);
            } else if (e.code === 'ArrowLeft') {
                skipTime(-10);
            } else if (e.code === 'KeyF') {
                toggleFullscreen();
            } else if (e.code === 'KeyM') {
                toggleMute();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, isMuted]);

    return (
        <div
            ref={containerRef}
            className="relative flex-1 w-full h-full bg-black group overflow-hidden flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    key={url}
                    src={url}
                    className="w-full h-full cursor-pointer object-contain"
                    onClick={togglePlay}
                    onCanPlay={() => setIsLoading(false)}
                    onWaiting={() => setIsLoading(true)}
                    onPlaying={() => setIsLoading(false)}
                    onError={(e) => {
                        console.error("Video Error:", e);
                        setIsLoading(false);
                    }}
                    autoPlay
                    playsInline
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-neon"></div>
                            <div className="text-primary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Buffering</div>
                        </div>
                    </div>
                )}

                {/* Center Play Indicator */}
                <div
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${(!isPlaying && !isLoading) ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
                >
                    <div className="bg-black/60 p-8 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
                        <Play className="text-white fill-current" size={48} />
                    </div>
                </div>
            </div>

            {/* Gradient Overlays */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent"></div>
            </div>

            {/* Top Info */}
            <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-center transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'} z-50`}>
                <div className="flex items-center gap-6">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-primary transition-all shadow-xl"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tight drop-shadow-lg">{animeTitle}</h2>
                        <p className="text-primary text-[10px] font-black uppercase tracking-widest drop-shadow-lg">{episodeNumber}</p>
                    </div>
                </div>

                <div className="hidden md:flex gap-2">
                    {servers.map((s, idx) => (
                        <button
                            key={idx}
                            onClick={() => onServerSelect(idx)}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${idx === selectedServer ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-black/40 text-white/40 hover:text-white border border-white/5'}`}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'} z-50`}>

                {/* Progress Bar */}
                <div className="relative mb-6 group/progress">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={duration ? (currentTime / duration) * 100 : 0}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary group-hover/progress:h-2 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover/progress:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity"
                    />
                    <div
                        className="absolute top-0 left-0 h-1.5 bg-primary rounded-full pointer-events-none group-hover/progress:h-2 transition-all shadow-[0_0_10px_rgba(244,117,33,0.5)]"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors transform hover:scale-110 active:scale-95">
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-4">
                            <button onClick={() => skipTime(-10)} className="text-white/70 hover:text-white transition-colors transform hover:scale-110">
                                <RotateCcw size={20} />
                            </button>
                            <button onClick={() => skipTime(10)} className="text-white/70 hover:text-white transition-colors transform hover:scale-110">
                                <RotateCw size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 group/volume">
                            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div className="text-white font-black italic text-xs tracking-wider font-mono">
                            <span>{formatTime(currentTime)}</span>
                            <span className="mx-2 text-white/40">/</span>
                            <span className="text-white/70">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {onNext && (
                            <button
                                onClick={onNext}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-black uppercase italic tracking-widest text-[10px] hover:bg-white hover:text-black transition-all shadow-lg active:scale-95"
                            >
                                <span>Next Episode</span>
                                <SkipForward size={14} />
                            </button>
                        )}
                        <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors transform hover:scale-110">
                            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
