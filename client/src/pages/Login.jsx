
import { GoogleLogin } from "@react-oauth/google";
import { MessageCircle, ShieldCheck, Users } from "lucide-react";
import { googleLogin } from "../services/authService";
import "../styles/Login.css";

function Login() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await googleLogin(credentialResponse.credential);

      localStorage.setItem("connectly_token", result.token);
      localStorage.setItem(
        "connectly_user",
        JSON.stringify(result.user)
      );

      window.location.href = result.user.profile_completed
        ? "/"
        : "/profile";
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "Google login failed");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-icon">
            <MessageCircle size={27} />
          </div>
          <span>Connectly</span>
        </div>

        <div className="login-content">
          <span className="eyebrow">YOUR SPACE TO CONNECT</span>

          <h1>Good conversations start here.</h1>

          <p className="description">
            Connect with people you know through private,
            invite-based conversations.
          </p>

          <div className="features">
            <div>
              <Users size={19} />
              <span>Connect with invited people</span>
            </div>

            <div>
              <ShieldCheck size={19} />
              <span>Privacy-focused communication</span>
            </div>
          </div>

          <div className="google-login">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google Sign-In failed")}
              theme="outline"
              size="large"
              shape="pill"
              width="300"
            />
          </div>

          <p className="terms">
            By continuing, you agree to use Connectly respectfully
            and keep conversations safe.
          </p>
        </div>
      </section>

      <div className="login-decoration">
        <div className="decoration-circle circle-one"></div>
        <div className="decoration-circle circle-two"></div>
        <div className="decoration-circle circle-three"></div>
        <div className="decoration-text">
          <span>CONNECT.</span>
          <span>COMMUNICATE.</span>
          <span>STAY CLOSE.</span>
        </div>
      </div>
    </main>
  );
}

export default Login;
