const fs = require('fs');
const path = require('path');
const db = require('./db');
const megaClient = require('./mega_client');
const metadataFetcher = require('./metadata_fetcher');

class LibraryManager {
    constructor() {
        this.scanning = false;
        // Periodic sync every 6 hours
        setInterval(() => this.scanLibrary(), 6 * 60 * 60 * 1000);
    }

    async scanLibrary() {
        if (this.scanning) return;
        this.scanning = true;
        console.log("Starting library scan...");

        try {
            const paths = await this.getLibraryPaths();
            for (const p of paths) {
                if (p.type === 'local') {
                    await this.scanLocalPath(p.path);
                } else if (p.type === 'mega') {
                    await this.scanMegaPath(p.path);
                }
            }
            // Cleanup after scan
            await this.cleanupLibrary();
        } catch (error) {
            console.error("Scan failed:", error);
        } finally {
            this.scanning = false;
            console.log("Library scan finished.");
        }
    }

    getLibraryPaths() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM library_paths", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async scanLocalPath(basePath) {
        if (!fs.existsSync(basePath)) {
            console.log(`Scan error: basePath does not exist: ${basePath}`);
            return;
        }

        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        console.log(`Scanning local path: ${basePath}, found ${entries.length} entries`);

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const seriesName = entry.name;
                const seriesPath = path.join(basePath, seriesName);
                console.log(`Checking series folder: ${seriesName}`);
                const seriesId = await this.addOrUpdateSeries(seriesName);
                if (!seriesId) continue;

                const seasons = fs.readdirSync(seriesPath, { withFileTypes: true });
                for (const season of seasons) {
                    if (season.isDirectory() && season.name.toLowerCase().includes('season')) {
                        console.log(`  Found season folder: ${season.name}`);
                        const seasonPath = path.join(seriesPath, season.name);
                        const files = fs.readdirSync(seasonPath);
                        for (const file of files) {
                            if (this.isVideoFile(file)) {
                                console.log(`    Processing video file: ${file}`);
                                await this.addEpisode(seriesId, seriesName, season.name, file, path.join(seasonPath, file), 'local');
                            }
                        }
                    } else if (this.isVideoFile(season.name)) {
                        console.log(`  Found video file in series root: ${season.name}`);
                        await this.addEpisode(seriesId, seriesName, 'Season 1', season.name, path.join(seriesPath, season.name), 'local');
                    }
                }
            }
        }
    }

    async scanMegaPath(megaUrl) {
        console.log(`Scanning Mega folder: ${megaUrl}`);
        const entries = await megaClient.getFolderContents(megaUrl);

        for (const entry of entries) {
            if (entry.directory) {
                const seriesName = entry.name;
                const seriesId = await this.addOrUpdateSeries(seriesName);
                if (!seriesId) continue;

                // If entry has children (files/folders inside series folder)
                if (entry.children) {
                    for (const sub of entry.children) {
                        if (sub.directory && sub.name.toLowerCase().includes('season')) {
                            // Season folder
                            if (sub.children) {
                                for (const file of sub.children) {
                                    if (!file.directory && this.isVideoFile(file.name)) {
                                        // Construct a relative path for identification: "Series/Season/Episode.mkv"
                                        const relPath = `${seriesName}/${sub.name}/${file.name}`;
                                        await this.addEpisode(seriesId, seriesName, sub.name, file.name, relPath, 'mega', megaUrl);
                                    }
                                }
                            }
                        } else if (!sub.directory && this.isVideoFile(sub.name)) {
                            // File in series root
                            const relPath = `${seriesName}/${sub.name}`;
                            await this.addEpisode(seriesId, seriesName, 'Season 1', sub.name, relPath, 'mega', megaUrl);
                        }
                    }
                }
            }
        }
    }

    isVideoFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ['.mp4', '.mkv', '.webm', '.avi'].includes(ext);
    }

    async addOrUpdateSeries(title) {
        return new Promise(async (resolve, reject) => {
            // 1. Fetch metadata first to get tmdb_id
            const metadata = await metadataFetcher.fetchAnimeMetadata(title);
            const tmdbId = metadata ? metadata.tmdb_id : null;

            // 2. Check by title OR tmdb_id
            let query = "SELECT * FROM series WHERE title = ?";
            let params = [title];
            if (tmdbId) {
                query += " OR tmdb_id = ?";
                params.push(tmdbId);
            }

            db.get(query, params, async (err, row) => {
                if (err) return reject(err);

                if (row) {
                    // Update existing record
                    if (metadata) {
                        db.run(
                            "UPDATE series SET title = ?, tmdb_id = ?, folder_name = ?, overview = ?, poster_path = ?, backdrop_path = ?, first_air_date = ?, status = ? WHERE id = ?",
                            [metadata.title || title, tmdbId, title, metadata.overview, metadata.poster_path, metadata.backdrop_path, metadata.first_air_date, metadata.status, row.id],
                            (err) => {
                                if (err) reject(err);
                                else resolve(row.id);
                            }
                        );
                    } else {
                        resolve(row.id);
                    }
                } else {
                    // Insert new record
                    const finalTitle = metadata ? metadata.title : title;
                    const overview = metadata ? metadata.overview : null;
                    const poster = metadata ? metadata.poster_path : null;
                    const backdrop = metadata ? metadata.backdrop_path : null;
                    const airDate = metadata ? metadata.first_air_date : null;
                    const status = metadata ? metadata.status : null;

                    db.run(
                        "INSERT INTO series (title, tmdb_id, folder_name, overview, poster_path, backdrop_path, first_air_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [finalTitle, tmdbId, title, overview, poster, backdrop, airDate, status],
                        function (err) {
                            if (err) {
                                console.error(`Error inserting series ${finalTitle}:`, err);
                                reject(err);
                            } else {
                                console.log(`Inserted new series: ${finalTitle} (ID: ${this.lastID})`);
                                resolve(this.lastID);
                            }
                        }
                    );
                }
            });
        });
    }

    addEpisode(seriesId, seriesTitle, seasonName, fileName, filePath, location = 'local', megaHandle = null) {
        // More robust regex for episode parsing
        // S01E01, S01EP01, 1x01, Episode 01, - 01
        const s01e01Match = fileName.match(/S(\d+)(?:E|EP)(\d+)/i);
        const dashMatch = fileName.match(/ - (\d+)/);
        const xMatch = fileName.match(/(\d+)x(\d+)/i);
        const epMatch = fileName.match(/Episode\s*(\d+)/i);
        const simpleNumMatch = fileName.match(/(?:\D|^)(\d{1,3})(?:\D|$)/); // Last resort: any 1-3 digit number

        let seasonNum = 1;
        let episodeNum = 0;

        if (s01e01Match) {
            seasonNum = parseInt(s01e01Match[1]);
            episodeNum = parseInt(s01e01Match[2]);
        } else if (xMatch) {
            seasonNum = parseInt(xMatch[1]);
            episodeNum = parseInt(xMatch[2]);
        } else if (dashMatch) {
            episodeNum = parseInt(dashMatch[1]);
        } else if (epMatch) {
            episodeNum = parseInt(epMatch[1]);
        } else if (simpleNumMatch) {
            episodeNum = parseInt(simpleNumMatch[1]);
        }

        // Try to parse season from seasonName folder
        const seasonFolderMatch = seasonName.match(/Season\s*(\d+)/i);
        if (seasonFolderMatch) {
            seasonNum = parseInt(seasonFolderMatch[1]);
        }

        if (episodeNum === 0) {
            console.log(`Could not parse episode number for: ${fileName}`);
        }

        return new Promise((resolve) => {
            console.log(`Adding episode ${episodeNum} to series ${seriesTitle} (ID: ${seriesId})`);
            db.run(`
                INSERT INTO episodes (series_id, season_number, episode_number, title, file_path, location, mega_handle) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(series_id, season_number, episode_number) DO UPDATE SET 
                    file_path = excluded.file_path,
                    location = excluded.location,
                    mega_handle = excluded.mega_handle
             `, [seriesId, seasonNum, episodeNum, fileName, filePath, location, megaHandle], (err) => {
                if (err && !err.message.includes('UNIQUE')) console.error(`Error adding episode ${fileName}:`, err);
                resolve();
            });
        });
    }

    async cleanupLibrary() {
        console.log("Cleaning up library (removing missing files)...");
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM episodes", async (err, episodes) => {
                if (err) return reject(err);

                for (const ep of episodes) {
                    if (ep.location === 'local' && ep.file_path) {
                        if (!fs.existsSync(ep.file_path)) {
                            console.log(`Removing missing local file from database: ${ep.file_path}`);
                            await this.removeEpisode(ep.id);
                        }
                    }
                }

                // Cleanup series that NO LONGER exist in any library path AND have 0 episodes
                // 1. Get all folders from library roots
                const paths = await this.getLibraryPaths();
                const existingFolders = new Set();
                for (const p of paths) {
                    if (p.type === 'local' && fs.existsSync(p.path)) {
                        fs.readdirSync(p.path).forEach(f => existingFolders.add(f.toLowerCase()));
                    }
                }

                // 2. Remove series that are neither in episodes nor on disk
                db.all("SELECT id, title FROM series", (err, series) => {
                    if (err) return resolve();

                    const promises = series.map(s => {
                        return new Promise((res) => {
                            db.get("SELECT COUNT(*) as count FROM episodes WHERE series_id = ?", [s.id], (err, row) => {
                                if (!err && row.count === 0 && !existingFolders.has(s.title.toLowerCase())) {
                                    console.log(`Deleting orphan series: ${s.title}`);
                                    db.run("DELETE FROM series WHERE id = ?", [s.id], () => res());
                                } else {
                                    res();
                                }
                            });
                        });
                    });

                    Promise.all(promises).then(() => resolve());
                });
            });
        });
    }

    deleteSeries(seriesId) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM series WHERE id = ?", [seriesId], async (err, series) => {
                if (err) return reject(err);
                if (!series) return resolve({ success: false, message: "Series not found" });

                try {
                    console.log(`[DELETE] Starting manual deletion for: ${series.title} (ID: ${seriesId})`);

                    // 1. Delete local folder (if exists)
                    const paths = await this.getLibraryPaths();
                    for (const p of paths) {
                        if (p.type === 'local') {
                            const seriesPath = path.join(p.path, series.title);
                            if (fs.existsSync(seriesPath)) {
                                console.log(`[DELETE] Removing local folder: ${seriesPath}`);
                                fs.rmSync(seriesPath, { recursive: true, force: true });
                            }
                        }
                    }

                    // 2. Perform DB deletions sequentially
                    const runQuery = (sql, params) => {
                        return new Promise((res) => {
                            db.run(sql, params, (err) => {
                                if (err) {
                                    console.error(`[DELETE] Warning: Query failed [${sql}]:`, err.message);
                                }
                                res();
                            });
                        });
                    };

                    console.log(`[DELETE] Removing episodes for series ${seriesId}`);
                    await runQuery("DELETE FROM episodes WHERE series_id = ?", [seriesId]);

                    console.log(`[DELETE] Removing from user_lists for series ${seriesId}`);
                    // We use both anime_id and series_id checks in case of schema variations
                    await runQuery("DELETE FROM user_lists WHERE anime_id = ?", [seriesId]);

                    console.log(`[DELETE] Removing from history for series ${seriesId}`);
                    // Wrap in try-catch surrogate via runQuery to avoid crashes on missing columns
                    await runQuery("DELETE FROM history WHERE series_id = ?", [seriesId]);
                    await runQuery("DELETE FROM history WHERE anime_id = ?", [seriesId]); // Fallback check

                    console.log(`[DELETE] Finalizing deletion of series ${seriesId} from DB`);
                    db.run("DELETE FROM series WHERE id = ?", [seriesId], (err) => {
                        if (err) {
                            console.error(`[DELETE] Error deleting series record:`, err);
                            reject(err);
                        } else {
                            console.log(`[DELETE] Deletion complete for: ${series.title}`);
                            resolve({ success: true });
                        }
                    });

                } catch (error) {
                    console.error(`[DELETE] Fatal error during series deletion:`, error);
                    reject(error);
                }
            });
        });
    }

    clearLibrary() {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("DELETE FROM episodes", (err) => {
                    if (err) console.error("Error clearing episodes:", err);
                });
                db.run("DELETE FROM series", (err) => {
                    if (err) {
                        console.error("Error clearing series:", err);
                        reject(err);
                    } else {
                        console.log("Library cleared successfully (series and episodes purged)");
                        resolve({ success: true });
                    }
                });
            });
        });
    }

    removeEpisode(episodeId) {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM episodes WHERE id = ?", [episodeId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    async organizeUpload(file) {
        // 1. Parse Filename
        const metadata = this.parseFilename(file.originalname);
        if (!metadata) {
            throw new Error('Could not parse filename. Please ensure it contains Series Name and Episode info (e.g., "Show.Name.S01E01.mp4" or "Show - 01.mkv").');
        }

        // 2. Get Library Root
        const paths = await this.getLibraryPaths();
        const localPath = paths.find(p => p.type === 'local');
        if (!localPath) {
            throw new Error('No local library path configured. Please add a local path in Admin settings first.');
        }
        const libraryRoot = localPath.path;

        // 3. Construct Destination Paths
        const seriesDir = path.join(libraryRoot, metadata.seriesName);
        const seasonDir = path.join(seriesDir, `Season ${metadata.season}`);

        // Ensure directories exist
        if (!fs.existsSync(seriesDir)) fs.mkdirSync(seriesDir, { recursive: true });
        if (!fs.existsSync(seasonDir)) fs.mkdirSync(seasonDir, { recursive: true });

        // 4. Move File
        const destPath = path.join(seasonDir, file.originalname);
        fs.renameSync(file.path, destPath);

        // 5. Add to DB
        // Add Series if not exists (This now fetches metadata automatically)
        const seriesId = await this.addOrUpdateSeries(metadata.seriesName);

        // Add Episode
        await this.addEpisode(
            seriesId,
            metadata.seriesName,
            `Season ${metadata.season}`,
            file.originalname,
            destPath,
            'local'
        );

        return {
            success: true,
            path: destPath,
            metadata
        };
    }

    parseFilename(filename) {
        // 1. Remove file extension
        let name = filename.replace(/\.[^/.]+$/, "");

        // 2. Remove common bracket stuff [1080p], [Group], (2023), etc.
        name = name.replace(/^\[.*?\]\s*/, ""); // Remove starting [Group]  
        name = name.replace(/\s*\[.*?\]$/, ""); // Remove trailing [Hash] or [1080p]
        name = name.replace(/\s*\(.*?\)$/, ""); // Remove trailing (Year) etc

        // 3. Normalized replace of dots/underscores with spaces 

        // Strategy A: SxxExx or SxEx (Standard, now supports EP)
        const regexSxxExx = /(.*?)[\s\.-]+[sS](\d+)[\s\.-]*(?:EP|E)(\d+)/i;
        let match = name.match(regexSxxExx);

        if (match) {
            return {
                seriesName: match[1].replace(/[._]/g, " ").trim(),
                season: parseInt(match[2], 10),
                episode: parseInt(match[3], 10)
            };
        }

        // Strategy B: 1x01 (SxEp)
        const regex1x01 = /(.*?)[\s\.-]+(\d+)x(\d+)/;
        match = name.match(regex1x01);
        if (match) {
            return {
                seriesName: match[1].replace(/[._]/g, " ").trim(),
                season: parseInt(match[2], 10),
                episode: parseInt(match[3], 10)
            };
        }

        // Strategy C: " - Episode XX" or " - 01" (Anime style, implied Season 1)
        const regexAnime = /(.*?)[\s\.-]+(?:-\s+)?(?:Episode\s*|EP|E)(\d+)/i;
        match = name.match(regexAnime);
        if (match) {
            return {
                seriesName: match[1].replace(/[._]/g, " ").trim(),
                season: 1, // Default to Season 1
                episode: parseInt(match[2], 10)
            };
        }

        // Strategy D: Last resort - just a number at the end "Show Name 05"
        const regexSimple = /(.*?)[\s\.-]+(\d{1,3})$/;
        match = name.match(regexSimple);
        if (match) {
            return {
                seriesName: match[1].replace(/[._]/g, " ").trim(),
                season: 1,
                episode: parseInt(match[2], 10)
            };
        }

        return null;
    }
}

module.exports = new LibraryManager();
