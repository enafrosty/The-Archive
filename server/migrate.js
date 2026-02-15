const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'anime.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration...');

db.serialize(() => {
    const historyCols = [
        { name: 'anime_name', type: 'TEXT' },
        { name: 'anime_poster', type: 'TEXT' },
        { name: 'episode_number', type: 'TEXT' }
    ];

    historyCols.forEach(col => {
        db.run(`ALTER TABLE history ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error adding column ${col.name} to history:`, err.message);
            }
        });
    });

    db.run(`ALTER TABLE users ADD COLUMN pin TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error(`Error adding column pin to users:`, err.message);
        } else if (!err) {
            console.log('Column pin added successfully to users table.');
        } else {
            console.log('Column pin already exists in users table.');
        }
    });
});

setTimeout(() => {
    db.close();
    console.log('Migration finished.');
}, 2000);
