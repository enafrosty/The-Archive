const path = require('path');
const fs = require('fs');
const db = require('./db');

let client;
let clientReady = false;

// Dynamic import for ESM compatibility
const initPromise = import('webtorrent').then(mod => {
    const WebTorrent = mod.default || mod;
    client = new WebTorrent();
    clientReady = true;
    console.log("WebTorrent initialized");
    return client;
}).catch(err => {
    console.error("Failed to initialize WebTorrent:", err);
});

// Ensure downloads directory exists
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Restore active downloads from DB on startup
async function restoreDownloads() {
    await initPromise;
    db.all("SELECT magnet, save_path FROM downloads WHERE status IN ('downloading', 'paused')", (err, rows) => {
        if (err) return console.error("Error restoring downloads:", err);
        rows.forEach(row => {
            addDownload(row.magnet, row.save_path);
        });
    });
}

async function addDownload(magnetLink, savePath = DOWNLOAD_DIR) {
    const c = await initPromise;
    if (!c) return;

    c.add(magnetLink, { path: savePath }, (torrent) => {
        console.log('Client is downloading:', torrent.infoHash);

        // Initial DB entry
        const query = `INSERT OR IGNORE INTO downloads (infoHash, name, magnet, save_path, status) VALUES (?, ?, ?, ?, ?)`;
        db.run(query, [torrent.infoHash, torrent.name, magnetLink, savePath, 'downloading']);

        torrent.on('download', (bytes) => {
            // Update DB every few seconds (throttled in real app, here simple)
        });

        torrent.on('done', () => {
            console.log('Torrent finished:', torrent.name);
            db.run("UPDATE downloads SET status = ?, progress = 100 WHERE infoHash = ?", ['completed', torrent.infoHash]);
        });

        // Sync progress interval
        const interval = setInterval(() => {
            if (torrent.destroyed) {
                clearInterval(interval);
                return;
            }
            db.run("UPDATE downloads SET progress = ?, speed = ?, bytes_downloaded = ?, total_bytes = ?, name = ? WHERE infoHash = ?",
                [torrent.progress * 100, torrent.downloadSpeed, torrent.downloaded, torrent.length, torrent.name, torrent.infoHash]);
        }, 2000);
    });
}

async function getTorrents() {
    if (!clientReady) return [];
    return client.torrents.map(t => ({
        infoHash: t.infoHash,
        name: t.name,
        progress: t.progress * 100,
        downloadSpeed: t.downloadSpeed,
        timeRemaining: t.timeRemaining
    }));
}

async function removeTorrent(infoHash, deleteFiles = false) {
    const c = await initPromise;
    if (!c) return;

    const torrent = c.get(infoHash);
    if (torrent) {
        // Remove from client
        c.remove(infoHash, { destroyStore: deleteFiles }, (err) => {
            if (!err) {
                db.run("DELETE FROM downloads WHERE infoHash = ?", [infoHash]);
            }
        });
    } else {
        // Just remove from DB if not in client
        db.run("DELETE FROM downloads WHERE infoHash = ?", [infoHash]);
    }
}

module.exports = {
    addDownload,
    getTorrents,
    removeTorrent,
    restoreDownloads
};
