import "./styles/theme.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Call from "./pages/Call";
import Admin from "./pages/Admin";
import Legal from "./pages/Legal";

function App() {
  return (
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/call" element={<Call />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/terms" element={<Legal type="terms" />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;