import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveProfile } from "../services/authService";
import "../styles/Profile.css";

// Read the saved user (if any) so the form can be pre-filled
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("connectly_user")) || {};
  } catch {
    return {};
  }
};

function Profile() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  const [displayName, setDisplayName] = useState(storedUser.display_name || "");
  const [bio, setBio] = useState(storedUser.bio || "");
  const [gender, setGender] = useState(storedUser.gender || "");
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(
    storedUser.is_adult_confirmed === true
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const genderLocked = storedUser.gender_locked === true;
  const adultAlreadyConfirmed = storedUser.is_adult_confirmed === true;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("connectly_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    if (!isAdultConfirmed) {
      setError("You must confirm that you are 18 or older.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await saveProfile(token, {
        displayName,
        bio,
        gender,
        isAdultConfirmed,
      });

      localStorage.setItem(
        "connectly_user",
        JSON.stringify(result.user)
      );

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="profile-page">
      <form className="profile-card" onSubmit={handleSubmit}>
        <span className="profile-label">STEP 01 — YOUR PROFILE</span>

        <h1>Let's make it yours.</h1>

        <p className="profile-description">
          Choose how invited people will see you on Connectly.
        </p>

        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          type="text"
          placeholder="What should we call you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          maxLength={50}
          required
        />

        <label htmlFor="bio">A little about you</label>
        <textarea
          id="bio"
          placeholder="Write a short introduction..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={4}
        />

        <div className="character-count">{bio.length}/300</div>

        <label>I am</label>
        <div className="gender-options">
          <button
            type="button"
            className={`gender-option ${gender === "male" ? "selected" : ""}`}
            onClick={() => setGender("male")}
            disabled={genderLocked}
          >
            Male
          </button>
          <button
            type="button"
            className={`gender-option ${gender === "female" ? "selected" : ""}`}
            onClick={() => setGender("female")}
            disabled={genderLocked}
          >
            Female
          </button>
        </div>

        <p className="gender-note">
          {genderLocked
            ? "Your gender is saved and cannot be changed."
            : "Choose carefully. Once saved, your gender cannot be changed."}
        </p>

        {!adultAlreadyConfirmed && (
          <label className="adult-check">
            <input
              type="checkbox"
              checked={isAdultConfirmed}
              onChange={(e) => setIsAdultConfirmed(e.target.checked)}
            />
            <span>I confirm that I am 18 years or older.</span>
          </label>
        )}

        <p className="legal-note">
          By continuing, you agree to our{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
          .
        </p>

        {error && <p className="profile-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Complete profile"}
        </button>
      </form>
    </main>
  );
}

export default Profile;