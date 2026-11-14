import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Users,
  LogOut,
  ShieldCheck,
  Video,
  ArrowRight,
  Ban,
  Flag,
  BadgeCheck,
  Lock,
  Sparkles,
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

  // Floating particles: fixed values so they do not jump on re-render
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 37) % 100,
        size: 4 + (i % 4) * 2,
        delay: (i * 0.9) % 8,
        duration: 9 + (i % 5) * 2,
      })),
    []
  );

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

  // Rotate the headline phrase every 2.5 seconds
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

  // Soft glow that follows the mouse
  const handlePageMove = (e) => {
    e.currentTarget.style.setProperty("--mx", `${e.clientX}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY}px`);
  };

  // Spotlight inside a card that follows the mouse
  const handleCardMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  if (!user) return null;

  const shownName = user.display_name || user.name || "there";
  const initial = shownName.charAt(0).toUpperCase();

  return (
    <main className="hm-page" onMouseMove={handlePageMove}>
      <div className="hm-glow hm-glow-purple" />
      <div className="hm-glow hm-glow-cyan" />
      <div className="hm-glow hm-glow-pink" />

      <div className="hm-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <header className="hm-header hm-reveal">
        <div className="hm-brand">
          <span className="hm-brand-icon">
            <MessageCircle size={20} />
          </span>
          <span>Connectly</span>
        </div>

        <button className="hm-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <section className="hm-hero">
        <div className="hm-hero-text">
          <span className="hm-pill hm-reveal" style={{ "--d": "0.1s" }}>
            <span className="hm-live-dot" />
            <Sparkles size={14} />
            Live video chat
          </span>

          <h1 className="hm-reveal" style={{ "--d": "0.2s" }}>
            Hey <span className="hm-gradient">{shownName}</span>,
            <br />
            ready to meet{" "}
            <span key={phraseIndex} className="hm-phrase hm-gradient">
              {PHRASES[phraseIndex]}
            </span>
            ?
          </h1>

          <p className="hm-reveal" style={{ "--d": "0.3s" }}>
            Jump into a video call with a real person. One tap, no
            waiting rooms, and you can skip anytime.
          </p>

          <button
            className="hm-cta hm-reveal"
            style={{ "--d": "0.4s" }}
            onClick={() => navigate("/call")}
          >
            <Video size={22} />
            Start video call
            <ArrowRight size={20} />
          </button>

          <div className="hm-badges hm-reveal" style={{ "--d": "0.5s" }}>
            <span>
              <BadgeCheck size={15} /> 18+ only
            </span>
            <span>
              <Users size={15} /> Opposite-gender matching
            </span>
            <span>
              <Ban size={15} /> Block &amp; report
            </span>
          </div>
        </div>

        <div
          className="hm-preview hm-reveal"
          style={{ "--d": "0.4s" }}
          aria-hidden="true"
        >
          <div className="hm-preview-card">
            <div className="hm-avatar hm-avatar-you hm-float">{initial}</div>

            <div className="hm-link">
              <span className="hm-ring" />
              <span className="hm-ring hm-ring-delay" />
              <Video size={22} />
            </div>

            <div className="hm-avatar hm-avatar-them hm-float hm-float-late">
              ?
            </div>
          </div>
          <p className="hm-preview-text">
            Finding your match
            <span className="hm-dots">
              <i />
              <i />
              <i />
            </span>
          </p>
        </div>
      </section>

      <section className="hm-steps">
        <h2 className="hm-reveal" style={{ "--d": "0.5s" }}>
          How it works
        </h2>
        <div className="hm-steps-grid">
          <div
            className="hm-step hm-card-fx hm-reveal"
            style={{ "--d": "0.6s" }}
            onMouseMove={handleCardMove}
          >
            <span className="hm-step-num">1</span>
            <h3>Tap Start</h3>
            <p>Allow camera and mic, then we look for someone for you.</p>
          </div>
          <div
            className="hm-step hm-card-fx hm-reveal"
            style={{ "--d": "0.7s" }}
            onMouseMove={handleCardMove}
          >
            <span className="hm-step-num">2</span>
            <h3>Get matched</h3>
            <p>You are paired with someone of the opposite gender.</p>
          </div>
          <div
            className="hm-step hm-card-fx hm-reveal"
            style={{ "--d": "0.8s" }}
            onMouseMove={handleCardMove}
          >
            <span className="hm-step-num">3</span>
            <h3>Talk or skip</h3>
            <p>Not feeling it? Skip, block or report in one tap.</p>
          </div>
        </div>
      </section>

      <section className="hm-cards">
        <div
          className="hm-card hm-card-fx hm-profile hm-reveal"
          style={{ "--d": "0.9s" }}
          onMouseMove={handleCardMove}
        >
          <div className="hm-profile-top">
            <div className="hm-avatar hm-avatar-you hm-avatar-sm">
              {initial}
            </div>
            <div>
              <h3>{shownName}</h3>
              <span className="hm-gender">{user.gender}</span>
            </div>
          </div>
          <p className="hm-bio">{user.bio || "No bio added yet."}</p>
          <span className="hm-status">
            <ShieldCheck size={14} /> Profile completed
          </span>
        </div>

        <div
          className="hm-card hm-card-fx hm-soon hm-reveal"
          style={{ "--d": "1s" }}
          onMouseMove={handleCardMove}
        >
          <div className="hm-card-icon">
            <Users size={22} />
          </div>
          <h3>Your Connections</h3>
          <p>Stay in touch with people you click with.</p>
          <span className="hm-tag">
            <Lock size={12} /> Coming soon
          </span>
        </div>

        <div
          className="hm-card hm-card-fx hm-soon hm-reveal"
          style={{ "--d": "1.1s" }}
          onMouseMove={handleCardMove}
        >
          <div className="hm-card-icon">
            <MessageCircle size={22} />
          </div>
          <h3>Your Messages</h3>
          <p>Your private conversations will appear here.</p>
          <span className="hm-tag">
            <Lock size={12} /> Coming soon
          </span>
        </div>
      </section>

      <footer className="hm-footer">
        <Flag size={15} />
        <span>
          Be respectful. Harassment gets accounts disabled. Connectly —
          private, respectful connections.
        </span>
      </footer>
    </main>
  );
}

export default Home;