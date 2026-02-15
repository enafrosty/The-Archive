const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'anime.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking users table schema...');

db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Columns in users table:');
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });

        const pinExists = rows.some(row => row.name === 'pin');
        if (pinExists) {
            console.log('\nSUCCESS: pin column exists.');
        } else {
            console.error('\nFAILURE: pin column MISSING!');
        }
    }
    db.close();
});
