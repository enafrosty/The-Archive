const express = require('express');
const cors = require('cors');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// New Modules
const torrentClient = require('./torrent_client');
const libraryManager = require('./library_manager');
const megaClient = require('./mega_client');
const { requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Log to file
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    logStream.write(`[${new Date().toISOString()}] LOG: ${args.join(' ')}\n`);
    originalLog.apply(console, args);
};

console.error = (...args) => {
    logStream.write(`[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`);
    originalError.apply(console, args);
};

// Restrict CORS to configured origins (comma-separated CORS_ORIGINS env,
// defaulting to the local Vite client). Requests without an Origin header
// (non-browser clients, the <video> element) are allowed through.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
}));
app.use(express.json());
// Serve uploaded media, but never let the browser sniff/execute it as HTML/JS.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer config — validated per upload type (extension allowlist + size caps).
const VIDEO_EXTS = ['.mp4', '.mkv', '.webm', '.avi'];
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Always generate a safe name; never trust the original extension casing.
        cb(null, Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

const extFilter = (allowedExts) => (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type "${ext || file.originalname}". Allowed: ${allowedExts.join(', ')}`));
};

const uploadVideo = multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024 * 1024 }, // 10 GiB
    fileFilter: extFilter(VIDEO_EXTS)
});

const uploadAvatar = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB
    fileFilter: extFilter(IMAGE_EXTS)
});

// Restore incomplete downloads on startup
setTimeout(async () => {
    await torrentClient.restoreDownloads();
}, 2000);


// --- Library & Media Server Routes ---

// Scan Library
app.post('/api/library/scan', requireAdmin, async (req, res) => {
    try {
        await libraryManager.scanLibrary();
        res.json({ success: true, message: 'Scan started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Series
app.delete('/api/series/:id', requireAdmin, async (req, res) => {
    try {
        const result = await libraryManager.deleteSeries(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear All Library Series & Episodes
app.delete('/api/library/clear', requireAdmin, async (req, res) => {
    try {
        const result = await libraryManager.clearLibrary();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Series in Library
app.get('/api/library/series', (req, res) => {
    db.all("SELECT * FROM series ORDER BY title", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Episodes for Series
app.get('/api/library/series/:id/episodes', (req, res) => {
    db.all("SELECT * FROM episodes WHERE series_id = ? ORDER BY season_number, episode_number", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Single Series from Library
app.get('/api/library/series/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM series WHERE id = ?", [id], (err, series) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!series) return res.status(404).json({ error: 'Series not found' });

        // Fetch episodes
        db.all("SELECT * FROM episodes WHERE series_id = ? ORDER BY season_number, episode_number", [id], (err, episodes) => {
            if (err) return res.status(500).json({ error: err.message });

            // Map to match scraper format for frontend compatibility
            const mappedSeries = {
                ...series,
                poster: series.poster_path, // Map poster_path to poster
                story: series.overview,     // Map overview to story
                genres: ['Local'],          // Default genre
                episodes: episodes.map(ep => ({
                    ...ep,
                    episode: ep.episode_number,
                    name: ep.title || `Episode ${ep.episode_number}`,
                    src: ep.still_path || series.backdrop_path, // Use still or series backdrop
                    episode_url: `local-${ep.id}` // Special URL format for local episodes
                }))
            };

            res.json(mappedSeries);
        });
    });
});

// Add Download
app.post('/api/downloads', requireAdmin, async (req, res) => {
    const { magnet } = req.body;
    if (!magnet) return res.status(400).json({ error: 'Magnet link required' });

    try {
        await torrentClient.addDownload(magnet);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Active Downloads
app.get('/api/downloads', async (req, res) => {
    const torrents = await torrentClient.getTorrents();
    res.json(torrents);
});

// Remove Download
app.delete('/api/downloads/:infoHash', requireAdmin, async (req, res) => {
    const { infoHash } = req.params;
    const { deleteFiles } = req.body;
    await torrentClient.removeTorrent(infoHash, deleteFiles);
    res.json({ success: true });
});

// Stream Library Content (Local or Mega)
app.get('/api/stream/library/:episodeId', (req, res) => {
    db.get("SELECT * FROM episodes WHERE id = ?", [req.params.episodeId], async (err, row) => {
        if (err || !row) return res.status(404).send("File not found");

        if (row.location === 'mega') {
            try {
                // Stream from Mega
                // row.mega_handle is the root folder URL
                // row.file_path is the relative path "Series/Season/Episode.mkv"

                // We need to resolve the file first to get size for Range support if possible
                // mega_client.getStream supports options {start, end}

                const file = await megaClient.getFileFromFolder(row.mega_handle, row.file_path);
                if (!file) return res.status(404).send("Mega file not found");

                const fileSize = file.size;
                const range = req.headers.range;

                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = (end - start) + 1;

                    const stream = file.download({ start, end });

                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'video/mp4', // Mega files usually determine type, but mp4 is safe default for streaming
                    };
                    res.writeHead(206, head);
                    stream.pipe(res);
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/mp4',
                    };
                    res.writeHead(200, head);
                    file.download().pipe(res);
                }
            } catch (e) {
                console.error("Mega Stream Error:", e);
                res.status(500).send("Stream Error");
            }
        } else {
            // Local File
            const filePath = row.file_path;
            if (!fs.existsSync(filePath)) return res.status(404).send("File not found on disk");

            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(200, head);
                fs.createReadStream(filePath).pipe(res);
            }
        }
    });
});


// Upload File (Smart Organize)
app.post('/api/library/upload', requireAdmin, uploadVideo.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const result = await libraryManager.organizeUpload(req.file);
        res.json(result);
    } catch (error) {
        // Clean up temp file if organization failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// Add Library Path
app.post('/api/library/paths', requireAdmin, (req, res) => {
    const { path, type, label } = req.body;
    if (!path || !type) return res.status(400).json({ error: 'Path and Type required' });

    db.run("INSERT INTO library_paths (path, type, label) VALUES (?, ?, ?)", [path, type, label || type], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Get Library Paths
app.get('/api/library/paths', (req, res) => {
    db.all("SELECT * FROM library_paths", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Remove Library Path
app.delete('/api/library/paths/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM library_paths WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


// --- Local Media Server Routes (Replaces Scraper) ---

// Search Anime (Local Only)
app.get('/api/search/:name', (req, res) => {
    const { name } = req.params;
    const searchQuery = `%${name}%`;
    db.all("SELECT * FROM series WHERE title LIKE ?", [searchQuery], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const results = rows.map(s => ({
            name: s.title,
            url: `/anime/${s.id}`,
            img: s.poster_path, // Map for frontend
            poster: s.poster_path,
            status: 'Local',
            type: 'TV',
            isLocal: true
        }));
        res.json(results);
    });
});

// Latest Episodes (Local)
app.get('/api/latest', (req, res) => {
    const query = `
        SELECT e.id, e.title as episode_title, e.episode_number, e.still_path, 
               s.id as series_id, s.title as anime_title, s.poster_path
        FROM episodes e
        JOIN series s ON e.series_id = s.id
        ORDER BY e.added_at DESC
        LIMIT 10
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const results = rows.map(row => ({
            episode_title: row.episode_title || `Episode ${row.episode_number}`,
            episode_url: `/watch/${row.series_id}/${row.id}`,
            anime_title: row.anime_title,
            anime_url: `/anime/${row.series_id}`,
            thumbnail: row.still_path || row.poster_path
        }));
        res.json(results);
    });
});

// Anime Info (Local Only)
app.get('/api/anime/:id', async (req, res) => {
    let { id } = req.params;

    // Check if ID is numeric or starts with 'local-'
    const isLocalId = /^\d+$/.test(id) || id.startsWith('local-');
    const cleanId = id.replace('local-', '');

    const query = isLocalId ? "SELECT * FROM series WHERE id = ?" : "SELECT * FROM series WHERE title LIKE ? OR folder_name LIKE ?";
    const queryParam = isLocalId ? cleanId : `%${id.replace(/-/g, ' ')}%`;
    const params = isLocalId ? [queryParam] : [queryParam, queryParam];

    db.get(query, params, async (err, series) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!series && !isLocalId) {
            // If it's a slug and not in DB, try to find it via metadata fetcher first?
            // But we need episodes. So if not in DB, it's a 404 for this app.
            return res.status(404).json({ error: 'Series not found in local library' });
        }

        if (!series) return res.status(404).json({ error: 'Series not found' });

        // If metadata is missing, try to fetch it now
        if (!series.poster_path || !series.overview) {
            const metadataFetcher = require('./metadata_fetcher');
            const metadata = await metadataFetcher.fetchAnimeMetadata(series.title);
            if (metadata) {
                db.run(
                    "UPDATE series SET tmdb_id = ?, overview = ?, poster_path = ?, backdrop_path = ?, first_air_date = ?, status = ? WHERE id = ?",
                    [metadata.tmdb_id, metadata.overview, metadata.poster_path, metadata.backdrop_path, metadata.first_air_date, metadata.status, series.id]
                );
                // Update local series object for the response
                series.tmdb_id = metadata.tmdb_id;
                series.overview = metadata.overview;
                series.poster_path = metadata.poster_path;
                series.backdrop_path = metadata.backdrop_path;
                series.first_air_date = metadata.first_air_date;
                series.status = metadata.status;
            }
        }

        db.all("SELECT * FROM episodes WHERE series_id = ? ORDER BY season_number, episode_number", [series.id], (err, episodes) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                id: series.id,
                title: series.title,
                story: series.overview || 'No description available.',
                poster: series.poster_path || '',
                banner: series.backdrop_path || series.poster_path || '',
                genres: ['Local Library'],
                status: series.status || 'Available',
                type: 'TV Series',
                'تاريخ الانتاج': series.first_air_date ? new Date(series.first_air_date).getFullYear() : 'Unknown',
                'الحالة': series.status || 'Available',
                'النوع': 'TV Series',
                'مدة الحلقة': 'Unknown',
                episodes: episodes.map(ep => ({
                    id: ep.id,
                    episode: ep.episode_number,
                    name: ep.title || `Episode ${ep.episode_number}`,
                    src: ep.still_path || series.backdrop_path || series.poster_path,
                    episode_url: `/watch/${series.id}/${ep.id}`
                }))
            });
        });
    });
});

// Home Page Data (Local Only)
app.get('/api/home', async (req, res) => {
    try {
        // Featured: Random 5 series
        const featuredPromise = new Promise((resolve, reject) => {
            db.all("SELECT * FROM series ORDER BY RANDOM() LIMIT 5", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(s => ({
                    title: s.title,
                    url: `/anime/${s.id}`,
                    banner: s.backdrop_path || s.poster_path
                })));
            });
        });

        // Latest: 10 most recent episodes
        const latestPromise = new Promise((resolve, reject) => {
            const query = `
                SELECT e.id, e.title as episode_title, e.episode_number, e.still_path, 
                       s.id as series_id, s.title as anime_title, s.poster_path
                FROM episodes e
                JOIN series s ON e.series_id = s.id
                ORDER BY e.added_at DESC
                LIMIT 10
            `;
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({
                    episode_title: row.episode_title || `Episode ${row.episode_number}`,
                    episode_url: `/watch/${row.series_id}/${row.id}`,
                    anime_title: row.anime_title,
                    anime_url: `/anime/${row.series_id}`,
                    thumbnail: row.still_path || row.poster_path
                })));
            });
        });

        // Trending: Just random 10 for now (or most watched if we tracked it properly)
        const trendingPromise = new Promise((resolve, reject) => {
            db.all("SELECT * FROM series ORDER BY title LIMIT 10", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(s => ({
                    name: s.title,
                    url: `/anime/${s.id}`,
                    poster: s.poster_path,
                    type: 'TV',
                    status: 'Local'
                })));
            });
        });

        const [featured, latest, trending] = await Promise.all([featuredPromise, latestPromise, trendingPromise]);

        res.json({
            featured,
            trending,
            latest
        });
    } catch (error) {
        console.error('Home API Error:', error);
        res.status(500).json({ error: 'Failed to fetch home data' });
    }
});


// --- User & History Routes ---

// Get all users
app.get('/api/users', (req, res) => {
    // SECURITY: never expose the `pin` column. Return a boolean `hasPin` flag instead.
    db.all(
        "SELECT id, username, avatar, last_seen, current_activity, (pin IS NOT NULL AND pin != '') AS hasPin FROM users",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Create user
app.post('/api/users', (req, res) => {
    const { username, avatar, pin } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    db.run("INSERT INTO users (username, avatar, pin) VALUES (?, ?, ?)", [username, avatar, pin || null], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        // SECURITY: do not echo the PIN back to the client.
        res.json({ id: this.lastID, username, avatar, hasPin: !!pin });
    });
});

// Delete user
app.delete('/api/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    // Also delete history and lists to clean up
    db.serialize(() => {
        db.run("DELETE FROM user_lists WHERE user_id = ?", [id]);
        db.run("DELETE FROM history WHERE user_id = ?", [id]);
        db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Verify PIN
app.post('/api/users/:id/verify-pin', (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;

    db.get("SELECT pin FROM users WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'User not found' });

        if (row.pin === pin) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid PIN' });
        }
    });
});

// Set/Change PIN
app.post('/api/users/:id/set-pin', (req, res) => {
    const { id } = req.params;
    const { oldPin, newPin } = req.body;

    db.get("SELECT pin FROM users WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'User not found' });

        // If user already has a PIN, require oldPin to change it
        if (row.pin && row.pin !== oldPin) {
            return res.status(401).json({ error: 'Incorrect original PIN' });
        }

        db.run("UPDATE users SET pin = ? WHERE id = ?", [newPin, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Upload Avatar
app.post('/api/users/:id/avatar', uploadAvatar.single('avatar'), (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const host = req.get('host');
    const avatarUrl = `${req.protocol}://${host}/uploads/${req.file.filename}`;

    db.run("UPDATE users SET avatar = ? WHERE id = ?", [avatarUrl, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, avatarUrl });
    });
});

// Get User History
app.get('/api/users/:userId/history', (req, res) => {
    const { userId } = req.params;
    db.all("SELECT * FROM history WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update History (Progress) - Enhanced with metadata
app.post('/api/users/:userId/history', (req, res) => {
    const { userId } = req.params;
    const { anime_id, anime_name, anime_poster, episode_id, episode_number, progress, duration } = req.body;

    if (!episode_id) return res.status(400).json({ error: 'Episode ID required' });

    const query = `
        INSERT INTO history (user_id, episode_id, series_id, series_name, series_poster, episode_number, progress, duration, last_watched)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, episode_id) DO UPDATE SET
            series_name = excluded.series_name,
            series_poster = excluded.series_poster,
            episode_number = excluded.episode_number,
            progress = excluded.progress,
            duration = excluded.duration,
            last_watched = CURRENT_TIMESTAMP
    `;

    // Map legacy 'anime_' fields to new 'series_' fields if present
    const s_id = anime_id;
    const s_name = anime_name;
    const s_poster = anime_poster;

    // Update History Table
    db.run(query, [userId, episode_id, s_id, s_name, s_poster, episode_number, progress, duration], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Update User Activity
        const activity = `Watching ${s_name} - Episode ${episode_number}`;
        db.run("UPDATE users SET last_seen = CURRENT_TIMESTAMP, current_activity = ? WHERE id = ?", [activity, userId]);

        res.json({ success: true });
    });
});

// Get Continue Watching (most recent  by anime)
app.get('/api/users/:userId/continue-watching', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT series_id, series_name, series_poster, episode_id, episode_number, progress, duration, last_watched
        FROM history
        WHERE user_id = ?
        AND series_id IN (
            SELECT series_id FROM history WHERE user_id = ? GROUP BY series_id ORDER BY MAX(last_watched) DESC LIMIT 12
        )
        GROUP BY series_id
        HAVING last_watched = MAX(last_watched)
        ORDER BY last_watched DESC
    `;

    db.all(query, [userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- User Lists API ---

// Get all lists for a user
app.get('/api/users/:userId/lists', (req, res) => {
    const { userId } = req.params;
    db.all("SELECT * FROM user_lists WHERE user_id = ? ORDER BY added_at DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add/Update item in a list
app.post('/api/users/:userId/lists', (req, res) => {
    const { userId } = req.params;
    const { anime_id, anime_name, anime_poster, list_type } = req.body;

    if (!anime_id || !list_type) return res.status(400).json({ error: 'Anime ID and List Type required' });

    const query = `
        INSERT INTO user_lists (user_id, anime_id, anime_name, anime_poster, list_type, added_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, anime_id, list_type) DO UPDATE SET
            anime_name = excluded.anime_name,
            anime_poster = excluded.anime_poster,
            added_at = CURRENT_TIMESTAMP
    `;

    db.run(query, [userId, anime_id, anime_name, anime_poster, list_type], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Remove item from a list
app.delete('/api/users/:userId/lists/:animeId/:type', (req, res) => {
    const { userId, animeId, type } = req.params;
    db.run("DELETE FROM user_lists WHERE user_id = ? AND anime_id = ? AND list_type = ?", [userId, animeId, type], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Check anime status in lists
app.get('/api/users/:userId/anime/:animeId/status', (req, res) => {
    const { userId, animeId } = req.params;
    db.all("SELECT list_type FROM user_lists WHERE user_id = ? AND anime_id = ?", [userId, animeId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            lists: rows.map(r => r.list_type)
        });
    });
});

const os = require('os');

// --- System Stats Route ---
app.get('/api/system/stats', (req, res) => {
    try {
        const cpus = os.cpus();
        const load = os.loadavg(); // Returns [1, 5, 15] min averages
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        // Simple CPU usage estimation based on load average
        // (Windows doesn't support loadavg natively, so we fallback to a simpler metric or just 0 if unavailable)
        // A better approach for Windows without extra deps is just uptime/mem for now.
        // But let's try to provide what we can.

        const stats = {
            cpuLoad: load[0], // On Windows this might be 0 always without specific win-node tools
            memoryUsage: {
                total: totalMem,
                free: freeMem,
                used: totalMem - freeMem
            },
            uptime: os.uptime(),
            platform: os.platform()
        };

        // Get Active Users count (seen in last 5 mins)
        // We can do this in parallel too?
        db.get("SELECT COUNT(*) as count FROM users WHERE last_seen > datetime('now', '-5 minutes')", (err, row) => {
            if (!err && row) {
                stats.activeUsers = row.count;
            }
            res.json(stats);
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Enhanced User & History Routes ---

// Get active users details
app.get('/api/users/active', (req, res) => {
    db.all("SELECT id, username, avatar, last_seen, current_activity FROM users WHERE last_seen > datetime('now', '-5 minutes')", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Clear User History
app.delete('/api/users/:id/data/history', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM history WHERE user_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Clear User Favorites/Lists
app.delete('/api/users/:id/data/favorites', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM user_lists WHERE user_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Centralized error handler for upload validation (Multer) and CORS rejections,
// so bad uploads / disallowed origins return a clean status instead of crashing.
app.use((err, req, res, next) => {
    if (!err) return next();
    if (/not allowed by CORS/i.test(err.message)) {
        return res.status(403).json({ error: err.message });
    }
    if (err.name === 'MulterError' || /Unsupported file type/i.test(err.message)) {
        return res.status(400).json({ error: err.message });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
