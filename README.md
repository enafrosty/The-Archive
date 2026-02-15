# THE ARCHIVE - Anime Streaming & Library Project
![logo](https://i.imgur.com/ODUZzpG.png)
A high-performance, comprehensive anime streaming and management platform. This project combines advanced web scraping, torrent streaming, Mega.nz integration, and a sophisticated library management system into a single, seamless experience.

## 🚀 Features

### 📺 Advanced Streaming
- **Multi-Source Support**: Stream content from local storage, Mega.nz folders, or directly via Torrent magnet links.
- **Torrent Engine**: Integrated WebTorrent client with background download support, progress tracking, and session restoration on startup.
- **Mega Integration**: Browse and stream directly from Mega.nz folders without downloading the entire file first.
- **Custom Player**: Built on Video.js, featuring intuitive controls, progress tracking, and seamless source switching.

### 📚 Library & Media Management
- **Smart Scanner**: Automatically scans local or Mega paths to index your collection.
- **Metadata Fetching**: Automatically retrieves posters, synopses, and ratings using the Jikan (MyAnimeList) API.
- **Auto-Organization**: Intelligent upload system that parses filenames (Series, Season, Episode) and moves them into a structured library format.
- **Library Manager**: Admin tools to scan, cleanup, or completely reset the media library.

### 👤 User Experience
- **User Profiles**: Multiple user support with customizable avatars and PIN protection.
- **Watch History**: Detailed tracking of watched episodes, including resume points and last-watched timestamps.
- **Personal Lists**: Manage "Following", "Plan to Watch", and "Favorites" lists.
- **Admin Dashboard**: Comprehensive control panel for library maintenance and system status.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Player**: [Video.js](https://videojs.com/)
- **Routing**: [React Router 7](https://reactrouter.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js 5](https://expressjs.com/)
- **Database**: [SQLite3](https://www.sqlite.org/) (Local, serverless, and fast)
- **Scraping**: [Cheerio](https://cheerio.js.org/) & [Axios](https://axios-http.com/)
- **Torrents**: [WebTorrent](https://webtorrent.io/)
- **Mega.nz**: [MegaJS](https://github.com/tonistiigi/mega)
- **Media Processing**: [Fluent-FFmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

---

## 📂 Project Structure

```text
anime/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (Player, Navbar, etc.)
│   │   ├── pages/          # Main views (Home, Admin, Library, Profile)
│   │   └── ...
├── server/                 # Express Backend
│   ├── tests/              # Debugging & unit test scripts
│   ├── debug_ui/           # Manual testing web interfaces
│   ├── uploads/            # Default storage for managed media
│   ├── downloads/          # Active torrent download storage
│   ├── db.js               # SQLite database initialization & migrations
│   ├── index.js            # Main API server & routing
│   ├── library_manager.js  # Core logic for scanning & organizing media
│   ├── torrent_client.js   # WebTorrent integration & session management
│   ├── mega_client.js      # Mega.nz traversal & streaming logic
│   └── metadata_fetcher.js # Jikan API integration
├── run.bat                 # One-click launch for Windows
├── run.sh                  # One-click launch for Linux/macOS
└── README.md               # You are here
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **FFmpeg**: Required for some streaming features. (Ensure it's in your system PATH)

### Quick Start (Recommended)

#### Windows
```powershell
./run.bat
```

#### Linux / macOS
```bash
chmod +x run.sh
./run.sh
```

These scripts will handle dependency installation (`npm install`) for both client and server and launch them concurrently.

### Manual Installation

1. **Clone the repository**
2. **Setup Server**:
   ```bash
   cd server
   npm install
   npm start
   ```
3. **Setup Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## ⚙️ Configuration

The server runs on port `5000` by default. You can change this by setting the `PORT` environment variable.
The client runs on port `5173` via Vite.

---

## 🛠 Troubleshooting

- **Black Screen in Player**: Ensure FFmpeg is installed and accessible. For Mega/Torrent streams, ensure you have a stable internet connection.
- **Metadata Not Found**: The project uses MyAnimeList titles for fetching. If an anime isn't found, try renaming its folder to its official English or Japanese title.
- **Torrent Issues**: Large torrents may take a moment to "warm up" before streaming becomes smooth.

---

## 💵 Donations

Donation via Binance Pay
**Binance ID**: `449271515`
### USDT (BNB Smart Chain)
`0x02c09c2e6155e8e336d940bdfd80c9a9558a24e0`
**Redotpay UID**: `1931398117`

---

## 📜 License
This project is for educational purposes. All media content and metadata are owned by their respective creators.

---

## 📣 Support

For support, email iyad@heyfrosty.space or send a message on discord @enafrosty.

---

## 😊 Authors

- [@enafrosty](https://www.github.com/enafrosty)

