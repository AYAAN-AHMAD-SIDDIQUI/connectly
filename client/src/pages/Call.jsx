import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  SkipForward,
  PhoneOff,
  Search,
  ArrowLeft,
  Ban,
  Flag,
} from "lucide-react";
import { connectSocket } from "../services/socket";
import "../styles/Call.css";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate behaviour" },
  { value: "harassment", label: "Harassment" },
  { value: "underage", label: "Seems under 18" },
  { value: "fake_gender", label: "Fake gender" },
  { value: "other", label: "Other" },
];

function Call() {
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const roomIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // idle | searching | connecting | connected
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");

  const closePeer = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    roomIdRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const createPeer = (roomId) => {
    closePeer();
    roomIdRef.current = roomId;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    localStreamRef.current
      .getTracks()
      .forEach((track) => pc.addTrack(track, localStreamRef.current));

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      socketRef.current.emit("webrtc:signal", {
        roomId,
        data: { candidate: event.candidate.toJSON() },
      });
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed") {
        setNotice("Video connection failed. Try Skip.");
      }
    };

    return pc;
  };

  useEffect(() => {
    const token = localStorage.getItem("connectly_token");
    const savedUser = localStorage.getItem("connectly_user");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    let parsedUser = {};
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

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      setNotice(`Could not connect: ${err.message}`);
      setStatus("idle");
    });

    socket.on("queue:waiting", () => {
      setStatus("searching");
      setNotice("");
    });

    socket.on("queue:left", () => setStatus("idle"));

    socket.on("queue:error", (e) => {
      setNotice(e.message);
      setStatus("idle");
    });

    socket.on("match:found", async ({ roomId, initiator, partner }) => {
      setPartnerName(partner?.name || "");
      setStatus("connecting");
      setNotice("");
      setShowReport(false);

      const pc = createPeer(roomId);

      if (initiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc:signal", {
            roomId,
            data: { description: { type: offer.type, sdp: offer.sdp } },
          });
        } catch (error) {
          console.error("Offer failed:", error);
        }
      }
    });

    socket.on("webrtc:signal", async ({ roomId, data }) => {
      const pc = pcRef.current;
      if (!pc || roomId !== roomIdRef.current || !data) return;

      try {
        if (data.description) {
          await pc.setRemoteDescription(data.description);

          if (data.description.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("webrtc:signal", {
              roomId,
              data: { description: { type: answer.type, sdp: answer.sdp } },
            });
          }

          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(candidate);
          }
          pendingCandidatesRef.current = [];
        } else if (data.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(data.candidate);
          } else {
            pendingCandidatesRef.current.push(data.candidate);
          }
        }
      } catch (error) {
        console.error("Signal error:", error);
      }
    });

    socket.on("match:ended", ({ reason }) => {
      closePeer();
      setPartnerName("");
      setStatus("idle");
      setShowReport(false);
      setNotice(reason || "Call ended");
    });

    // Arrives right after match:ended, so this message is the one shown
    socket.on("safety:result", ({ action, ok, message }) => {
      if (message) {
        setNotice(message);
        return;
      }
      if (action === "block") {
        setNotice(
          ok
            ? "User blocked. You will not be matched again."
            : "Call ended, but the block could not be saved. Please try again."
        );
      }
      if (action === "report") {
        setNotice(
          ok
            ? "Report sent and user blocked. Thank you."
            : "Call ended, but the report could not be saved. Please try again."
        );
      }
    });

    return () => {
      closePeer();
      socket.disconnect();
      socketRef.current = null;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const ensureCamera = async () => {
    if (localStreamRef.current) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      console.error(error);
      setNotice("Camera and microphone access is needed for video calls.");
      return false;
    }
  };

  const handleStart = async () => {
    setNotice("");
    const ok = await ensureCamera();
    if (!ok) return;
    socketRef.current?.emit("queue:join");
  };

  const handleStopSearch = () => {
    socketRef.current?.emit("queue:leave");
  };

  const handleSkip = () => {
    socketRef.current?.emit("match:leave");
    socketRef.current?.emit("queue:join");
  };

  const handleEnd = () => {
    socketRef.current?.emit("match:leave");
  };

  const handleBlock = () => {
    if (!roomIdRef.current) return;
    if (!window.confirm("Block this person and end the call?")) return;
    socketRef.current?.emit("match:block", { roomId: roomIdRef.current });
  };

  const handleReportSubmit = () => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("match:report", {
      roomId: roomIdRef.current,
      reason: reportReason,
    });
  };

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCameraOn(next);
  };

  const inCall = status === "connecting" || status === "connected";

  return (
    <main className="call-page">
      <header className="call-header">
        <button className="call-back" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="call-title">Connectly Video</span>
      </header>

      <section className="call-stage">
        <div className="remote-box">
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />

          {!inCall && (
            <div className="remote-overlay">
              {status === "searching" && <p>Searching for a match...</p>}
              {status === "idle" && <p>Press Start to find someone.</p>}
            </div>
          )}

          {status === "connecting" && (
            <div className="remote-overlay">
              <p>Connecting to {partnerName || "your match"}...</p>
            </div>
          )}

          {status === "connected" && partnerName && (
            <span className="partner-tag">{partnerName}</span>
          )}
        </div>

        <video
          ref={localVideoRef}
          className="local-video"
          autoPlay
          playsInline
          muted
        />
      </section>

      {notice && <p className="call-notice">{notice}</p>}

      {inCall && showReport && (
        <section className="report-panel">
          <label htmlFor="reportReason">Why are you reporting?</label>
          <select
            id="reportReason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="report-actions">
            <button className="call-btn" onClick={() => setShowReport(false)}>
              Cancel
            </button>
            <button className="call-btn danger" onClick={handleReportSubmit}>
              Send report
            </button>
          </div>
          <p className="report-hint">
            Reporting also blocks this person and ends the call.
          </p>
        </section>
      )}

      <section className="call-controls">
        {status === "idle" && (
          <button className="call-btn primary" onClick={handleStart}>
            <Search size={18} />
            Start
          </button>
        )}

        {status === "searching" && (
          <button className="call-btn" onClick={handleStopSearch}>
            Stop searching
          </button>
        )}

        {inCall && (
          <>
            <button className="call-btn" onClick={toggleMic}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button className="call-btn" onClick={toggleCamera}>
              {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button className="call-btn primary" onClick={handleSkip}>
              <SkipForward size={18} />
              Skip
            </button>
            <button className="call-btn" onClick={handleBlock}>
              <Ban size={18} />
              Block
            </button>
            <button
              className="call-btn"
              onClick={() => setShowReport((v) => !v)}
            >
              <Flag size={18} />
              Report
            </button>
            <button className="call-btn danger" onClick={handleEnd}>
              <PhoneOff size={18} />
              End
            </button>
          </>
        )}
      </section>
    </main>
  );
}

export default Call;