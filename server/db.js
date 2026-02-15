const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'anime.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            avatar TEXT,
            pin TEXT,
            last_seen TIMESTAMP,
            current_activity TEXT
        )`);

        // Migration for existing tables
        db.run("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP", (err) => { });
        db.run("ALTER TABLE users ADD COLUMN current_activity TEXT", (err) => { });
        db.run("ALTER TABLE series ADD COLUMN folder_name TEXT", (err) => { });
        db.run("ALTER TABLE history ADD COLUMN series_id TEXT", (err) => { });
        db.run("ALTER TABLE history ADD COLUMN series_name TEXT", (err) => { });
        db.run("ALTER TABLE history ADD COLUMN series_poster TEXT", (err) => { });
        db.run("ALTER TABLE history ADD COLUMN episode_number TEXT", (err) => { });

        // Library Storage Paths
        // type: 'local' | 'mega'
        // path: local file system path or Mega folder URL
        db.run(`CREATE TABLE IF NOT EXISTS library_paths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            type TEXT NOT NULL,
            label TEXT,
            last_scanned TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating library_paths table:", err);
        });

        // Series Metadata (Shows)
        db.run(`CREATE TABLE IF NOT EXISTS series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tmdb_id INTEGER UNIQUE,
            title TEXT NOT NULL,
            overview TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            first_air_date TEXT,
            status TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run("ALTER TABLE series ADD COLUMN status TEXT", (err) => { });
        db.run("ALTER TABLE series ADD COLUMN first_air_date TEXT", (err) => { });
        db.run("ALTER TABLE series ADD COLUMN backdrop_path TEXT", (err) => { });

        // Episodes
        // location: 'local' | 'mega'
        // file_path: relative path from library root OR mega file handle
        db.run(`CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            series_id INTEGER,
            season_number INTEGER,
            episode_number INTEGER,
            title TEXT,
            overview TEXT,
            still_path TEXT,
            file_path TEXT,
            location TEXT, 
            mega_handle TEXT,
            duration INTEGER DEFAULT 0,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (series_id) REFERENCES series (id),
            UNIQUE(series_id, season_number, episode_number)
        )`);

        // Active Downloads
        db.run(`CREATE TABLE IF NOT EXISTS downloads (
            infoHash TEXT PRIMARY KEY,
            name TEXT,
            magnet TEXT,
            progress REAL DEFAULT 0,
            status TEXT,
            speed REAL DEFAULT 0,
            bytes_downloaded INTEGER DEFAULT 0,
            total_bytes INTEGER DEFAULT 0,
            save_path TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error("Error creating downloads table:", err);
        });

        // Watch History table
        db.run(`CREATE TABLE IF NOT EXISTS history (
            user_id INTEGER,
            episode_id TEXT,
            series_id TEXT,
            series_name TEXT,
            series_poster TEXT,
            episode_number TEXT,
            progress INTEGER DEFAULT 0,
            duration INTEGER DEFAULT 0,
            last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, episode_id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error("Error creating history table:", err);
        });

        // User Lists (Favorites, Watching, To Watch)
        db.run(`CREATE TABLE IF NOT EXISTS user_lists (
            user_id INTEGER,
            anime_id TEXT,
            anime_name TEXT,
            anime_poster TEXT,
            list_type TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, anime_id, list_type),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error("Error creating user_lists table:", err);
        });

        // Insert a default user if none exists
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO users (username) VALUES (?)", ["Admin"]);
            }
        });
    });
}

module.exports = db;
