import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProfileSelection from './pages/ProfileSelection';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetails from './pages/AnimeDetails';
import Player from './pages/Player';

import ProfileManagement from './pages/ProfileManagement';
import MyLists from './pages/MyLists';
import Landing from './pages/Landing';
import Admin from './pages/Admin';

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  // If no user is logged in
  const isManaging = pathname.startsWith('/manage-profile');
  const isProfiles = pathname === '/profiles';

  if (!user && !isManaging) {
    if (isProfiles) return <ProfileSelection />;
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-background text-white pb-10">
      {user && <Navbar />}
      <div className={user ? "pt-20 px-4 md:px-12" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search/:query" element={<Search />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/watch/:animeId/:episodeId" element={<Player />} />
          <Route path="/my-lists" element={<MyLists />} />
          <Route path="/profiles" element={<ProfileSelection />} />
          <Route path="/manage-profile/:id" element={<ProfileManagement />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
