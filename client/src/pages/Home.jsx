import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Users,
  LogOut,
  ShieldCheck,
  Video,
  Ban,
  Flag,
  BadgeCheck,
  Lock,
  Mic,
  SkipForward,
  Camera,
} from "lucide-react";
import "../styles/Home.css";

const PHRASES = [
  "someone new",
  "a new friend",
  "a real conversation",
  "your next chat",
];

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("connectly_token");
    localStorage.removeItem("connectly_user");
    navigate("/login");
  };

  if (!user) return null;

  const shownName = user.display_name || user.name || "there";
  const initial = shownName.charAt(0).toUpperCase();

  return (
    <main className="hm-page">
      <header className="hm-header">
        <div className="hm-brand">
          <span className="hm-brand-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          Connectly
        </div>

        <div className="hm-header-right">
          <span className="hm-me" title={shownName}>
            <span className="hm-me-avatar">{initial}</span>
            <span className="hm-me-name">{shownName}</span>
          </span>
          <button className="hm-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <section className="hm-hero">
        <div className="hm-hero-text">
          <h1>
            Hey {shownName}, ready to meet{" "}
            <span key={phraseIndex} className="hm-phrase">
              {PHRASES[phraseIndex]}
            </span>
            ?
          </h1>

          <p>
            Jump into a video call with a real person. One tap, no waiting
            rooms, and you can skip anytime.
          </p>

          <button className="hm-cta" onClick={() => navigate("/call")}>
            <Video size={22} />
            Start video call
          </button>

          <ul className="hm-badges">
            <li>
              <BadgeCheck size={16} /> 18+ only
            </li>
            <li>
              <Users size={16} /> Opposite-gender matching
            </li>
            <li>
              <Ban size={16} /> Block &amp; report
            </li>
          </ul>
        </div>

        <div className="hm-call" aria-hidden="true">
          <div className="hm-tile hm-tile-them">
            <span className="hm-radar">
              <i />
              <i />
              <i />
            </span>
            <span className="hm-tile-label">Finding your match…</span>
          </div>

          <div className="hm-tile hm-tile-you">
            <span className="hm-you-avatar">{initial}</span>
            <span className="hm-tile-label">You</span>
          </div>

          <div className="hm-controls">
            <span>
              <Mic size={18} />
            </span>
            <span>
              <Camera size={18} />
            </span>
            <span className="hm-skip">
              <SkipForward size={18} /> Skip
            </span>
            <span>
              <Flag size={18} />
            </span>
          </div>
        </div>
      </section>

      <section className="hm-steps" aria-labelledby="hm-how">
        <h2 id="hm-how">How it works</h2>
        <ol>
          <li>
            <span className="hm-step-num">1</span>
            <div>
              <h3>Tap Start</h3>
              <p>Allow camera and mic, then we look for someone for you.</p>
            </div>
          </li>
          <li>
            <span className="hm-step-num">2</span>
            <div>
              <h3>Get matched</h3>
              <p>You are paired with someone of the opposite gender.</p>
            </div>
          </li>
          <li>
            <span className="hm-step-num">3</span>
            <div>
              <h3>Talk or skip</h3>
              <p>Not feeling it? Skip, block or report in one tap.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="hm-cards">
        <article className="hm-card hm-profile">
          <div className="hm-profile-top">
            <span className="hm-me-avatar hm-lg">{initial}</span>
            <div>
              <h3>{shownName}</h3>
              <span className="hm-gender">{user.gender}</span>
            </div>
          </div>
          <p className="hm-bio">{user.bio || "No bio added yet."}</p>
          <span className="hm-status">
            <ShieldCheck size={14} /> Profile completed
          </span>
        </article>

        <article className="hm-card hm-soon">
          <Users size={22} />
          <h3>Your Connections</h3>
          <p>Stay in touch with people you click with.</p>
          <span className="hm-tag">
            <Lock size={12} /> Coming soon
          </span>
        </article>

        <article className="hm-card hm-soon">
          <MessageCircle size={22} />
          <h3>Your Messages</h3>
          <p>Your private conversations will appear here.</p>
          <span className="hm-tag">
            <Lock size={12} /> Coming soon
          </span>
        </article>
      </section>

      <footer className="hm-footer">
        <Flag size={15} />
        <span>
          Be respectful. Harassment gets accounts disabled. Connectly: private,
          respectful connections.
        </span>
      </footer>
    </main>
  );
}

export default Home;