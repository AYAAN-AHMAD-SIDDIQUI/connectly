import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  LogOut,
  ArrowRight,
  Users,
  Ban,
  BadgeCheck,
  MessageCircle,
  Lock,
  Check,
} from "lucide-react";
import "../styles/Home.css";

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
    <div className="hm-page">
      <header className="hm-nav">
        <div className="hm-brand">
          <span className="hm-logo">
            <Video size={18} />
          </span>
          <span>Connectly</span>
        </div>

        <div className="hm-nav-right">
          <div className="hm-user">
            <span className="hm-avatar-xs">{initial}</span>
            <span className="hm-user-name">{shownName}</span>
          </div>
          <button className="hm-ghost-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="hm-container">
        <section className="hm-hero">
          <div className="hm-hero-text">
            <span className="hm-eyebrow">
              <span className="hm-dot" />
              Live video chat
            </span>

            <h1>
              Meet someone new,
              <br />
              <span className="hm-accent">face to face.</span>
            </h1>

            <p className="hm-lead">
              One-on-one video conversations with real people. Start with a
              single tap, and skip, block or report at any time.
            </p>

            <button className="hm-cta" onClick={() => navigate("/call")}>
              <Video size={20} />
              Start video call
              <ArrowRight size={18} />
            </button>

            <p className="hm-hint">
              Camera and microphone access is requested when you start.
            </p>
          </div>

          <aside className="hm-panel">
            <div className="hm-panel-top">
              <span className="hm-avatar">{initial}</span>
              <div>
                <h3>{shownName}</h3>
                <span className="hm-badge">{user.gender}</span>
              </div>
            </div>

            <p className="hm-bio">{user.bio || "No bio added yet."}</p>

            <ul className="hm-checks">
              <li>
                <Check size={16} /> Profile completed
              </li>
              <li>
                <Check size={16} /> Age confirmed (18+)
              </li>
              <li>
                <Check size={16} /> Ready to match
              </li>
            </ul>
          </aside>
        </section>

        <section className="hm-section">
          <h2>How it works</h2>
          <div className="hm-grid-3">
            <div className="hm-card">
              <span className="hm-num">1</span>
              <h3>Tap start</h3>
              <p>Allow your camera and mic, and we begin looking for a match.</p>
            </div>
            <div className="hm-card">
              <span className="hm-num">2</span>
              <h3>Get matched</h3>
              <p>You are paired with someone of the opposite gender.</p>
            </div>
            <div className="hm-card">
              <span className="hm-num">3</span>
              <h3>Talk or move on</h3>
              <p>Not a fit? Skip to the next person in one tap.</p>
            </div>
          </div>
        </section>

        <section className="hm-section">
          <h2>Built with safety in mind</h2>
          <div className="hm-grid-3">
            <div className="hm-card">
              <span className="hm-icon">
                <BadgeCheck size={20} />
              </span>
              <h3>18+ only</h3>
              <p>Every member confirms their age before they can match.</p>
            </div>
            <div className="hm-card">
              <span className="hm-icon">
                <Users size={20} />
              </span>
              <h3>Opposite-gender matching</h3>
              <p>Matches are always between a man and a woman.</p>
            </div>
            <div className="hm-card">
              <span className="hm-icon">
                <Ban size={20} />
              </span>
              <h3>Block and report</h3>
              <p>Blocked people never match with you again. Reports are reviewed.</p>
            </div>
          </div>
        </section>

        <section className="hm-section">
          <h2>Coming soon</h2>
          <div className="hm-grid-2">
            <div className="hm-card hm-muted">
              <span className="hm-icon">
                <Users size={20} />
              </span>
              <h3>Connections</h3>
              <p>Stay in touch with people you click with.</p>
              <span className="hm-tag">
                <Lock size={12} /> Coming soon
              </span>
            </div>
            <div className="hm-card hm-muted">
              <span className="hm-icon">
                <MessageCircle size={20} />
              </span>
              <h3>Messages</h3>
              <p>Private conversations with your connections.</p>
              <span className="hm-tag">
                <Lock size={12} /> Coming soon
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="hm-footer">
        Be respectful. Harassment results in a disabled account.
      </footer>
    </div>
  );
}

export default Home;