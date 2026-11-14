import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Video, BadgeCheck, Users, Ban } from "lucide-react";
import { googleLogin } from "../services/authService";
import "../styles/Login.css";

const APP_NAME = "Connectly";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;

    if (!idToken) {
      setError("Google sign-in did not return a login token. Please try again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await googleLogin(idToken);

      localStorage.setItem("connectly_token", data.token);
      localStorage.setItem("connectly_user", JSON.stringify(data.user));

      const user = data.user;
      if (
        !user.profile_completed ||
        !user.gender ||
        !user.is_adult_confirmed
      ) {
        navigate("/profile");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not sign you in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    setError("Google sign-in failed. Please try again.");
  };

  return (
    <main className="lg-page">
      <section className="lg-left">
        <div className="lg-card">
          <div className="lg-brand">
            <span className="lg-logo">
              <Video size={20} />
            </span>
            <span>{APP_NAME}</span>
          </div>

          <h1>Log in to continue</h1>
          <p className="lg-sub">
            Meet new people through one-on-one live video, with safety tools
            built in.
          </p>

          <div className="lg-google">
            {loading ? (
              <div className="lg-loading">
                <span className="lg-spinner" />
                <div>
                  <strong>Signing you in...</strong>
                  <span>
                    If this is the first visit in a while, the server may
                    take up to a minute to wake up.
                  </span>
                </div>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_black"
                shape="pill"
                size="large"
                text="continue_with"
                width="320"
              />
            )}
          </div>

          {error && <p className="lg-error">{error}</p>}

          <p className="lg-legal">
            By continuing, you confirm that you are 18 or older and agree to
            our{" "}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="lg-right">
        <div className="lg-right-inner">
          <span className="lg-tag">LIVE VIDEO CHAT</span>
          <h2>Meet someone new, face to face.</h2>

          <ul className="lg-points">
            <li>
              <span className="lg-point-icon">
                <BadgeCheck size={20} />
              </span>
              <div>
                <strong>18+ only</strong>
                <span>Every member confirms their age.</span>
              </div>
            </li>
            <li>
              <span className="lg-point-icon">
                <Users size={20} />
              </span>
              <div>
                <strong>Opposite-gender matching</strong>
                <span>Always a man and a woman.</span>
              </div>
            </li>
            <li>
              <span className="lg-point-icon">
                <Ban size={20} />
              </span>
              <div>
                <strong>Block and report</strong>
                <span>Skip, block or report in one tap.</span>
              </div>
            </li>
          </ul>

          <div className="lg-preview" aria-hidden="true">
            <span className="lg-pavatar">A</span>
            <span className="lg-plink">
              <span className="lg-ring" />
              <Video size={18} />
            </span>
            <span className="lg-pavatar lg-pavatar-q">?</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;