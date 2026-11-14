import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Home as HomeIcon,
  Users,
  MessageCircle,
  LogOut,
  Play,
  BadgeCheck,
  Ban,
  UserRound,
} from "lucide-react";
import "../styles/Home.css";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("connectly_token");
    const savedUser = localStorage.getItem("connectly_user");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(savedUser);
    } catch {
      navigate("/login");
      return;
    }

    if (
      !parsedUser.profile_completed ||
      !parsedUser.gender ||
      !parsedUser.is_adult_confirmed
    ) {
      navigate("/profile");
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("connectly_token");
    localStorage.removeItem("connectly_user");
    navigate("/login");
  };

  if (!user) return null;

  const shownName = user.display_name || user.name || "there";
  const initial = shownName.charAt(0).toUpperCase();

  return (
    <div className="sp-app">
      <aside className="sp-side">
        <div className="sp-panel sp-nav">
          <div className="sp-brand">
            <span className="sp-logo">
              <Video size={18} />
            </span>
            <span>Connectly</span>
          </div>

          <nav className="sp-links">
            <button className="sp-link active">
              <HomeIcon size={22} />
              Home
            </button>
            <button className="sp-link" onClick={() => navigate("/call")}>
              <Video size={22} />
              Video call
            </button>
            <button className="sp-link" onClick={() => navigate("/profile")}>
              <UserRound size={22} />
              Profile
            </button>
            <button className="sp-link disabled" disabled>
              <Users size={22} />
              Connections
              <span className="sp-soon">Soon</span>
            </button>
            <button className="sp-link disabled" disabled>
              <MessageCircle size={22} />
              Messages
              <span className="sp-soon">Soon</span>
            </button>
          </nav>
        </div>

        <div className="sp-panel sp-user">
          <span className="sp-avatar">{initial}</span>
          <div className="sp-user-info">
            <strong>{shownName}</strong>
            <span>{user.gender}</span>
          </div>
          <button
            className="sp-icon-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="sp-main">
        <div className="sp-hero-bg" />

        <div className="sp-content">
          <h1 className="sp-greeting">
            {getGreeting()}, {shownName}
          </h1>

          <section className="sp-feature">
            <div className="sp-feature-text">
              <span className="sp-feature-tag">LIVE VIDEO CHAT</span>
              <h2>Meet someone new, face to face.</h2>
              <p>
                One-on-one video with real people. Skip, block or report at
                any time.
              </p>
            </div>
            <button
              className="sp-play-big"
              onClick={() => navigate("/call")}
              aria-label="Start video call"
            >
              <Video size={30} />
            </button>
          </section>

          <section className="sp-shelf">
            <h2>Quick access</h2>
            <div className="sp-tiles">
              <button className="sp-tile" onClick={() => navigate("/call")}>
                <span className="sp-tile-art sp-art-rose">
                  <Video size={26} />
                </span>
                <span className="sp-tile-title">Start video call</span>
                <span className="sp-tile-play">
                  <Play size={18} fill="currentColor" />
                </span>
              </button>

              <button className="sp-tile" onClick={() => navigate("/profile")}>
                <span className="sp-tile-art sp-art-violet">
                  <UserRound size={26} />
                </span>
                <span className="sp-tile-title">Your profile</span>
                <span className="sp-tile-play">
                  <Play size={18} fill="currentColor" />
                </span>
              </button>

              <div className="sp-tile disabled">
                <span className="sp-tile-art sp-art-blue">
                  <Users size={26} />
                </span>
                <span className="sp-tile-title">Connections</span>
                <span className="sp-soon">Soon</span>
              </div>

              <div className="sp-tile disabled">
                <span className="sp-tile-art sp-art-teal">
                  <MessageCircle size={26} />
                </span>
                <span className="sp-tile-title">Messages</span>
                <span className="sp-soon">Soon</span>
              </div>
            </div>
          </section>

          <section className="sp-shelf">
            <h2>How it works</h2>
            <div className="sp-cards">
              <div className="sp-card">
                <div className="sp-card-art sp-art-rose">1</div>
                <h3>Tap start</h3>
                <p>Allow camera and mic, and we begin looking for a match.</p>
              </div>
              <div className="sp-card">
                <div className="sp-card-art sp-art-violet">2</div>
                <h3>Get matched</h3>
                <p>You are paired with someone of the opposite gender.</p>
              </div>
              <div className="sp-card">
                <div className="sp-card-art sp-art-blue">3</div>
                <h3>Talk or move on</h3>
                <p>Not a fit? Skip to the next person in one tap.</p>
              </div>
            </div>
          </section>

          <section className="sp-shelf">
            <h2>Built with safety in mind</h2>
            <div className="sp-cards">
              <div className="sp-card">
                <div className="sp-card-art sp-art-teal">
                  <BadgeCheck size={40} />
                </div>
                <h3>18+ only</h3>
                <p>Every member confirms their age before they can match.</p>
              </div>
              <div className="sp-card">
                <div className="sp-card-art sp-art-rose">
                  <Users size={40} />
                </div>
                <h3>Opposite-gender matching</h3>
                <p>Matches are always between a man and a woman.</p>
              </div>
              <div className="sp-card">
                <div className="sp-card-art sp-art-violet">
                  <Ban size={40} />
                </div>
                <h3>Block and report</h3>
                <p>Blocked people never match with you again.</p>
              </div>
            </div>
          </section>

          <footer className="sp-footer">
            Be respectful. Harassment results in a disabled account.
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Home;