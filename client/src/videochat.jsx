import { useRef, useEffect, useState } from "react";
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiRefreshCcw,
  FiSend,
} from "react-icons/fi";
import "./VideoChat.css";
import socket from "./socket";

const configuration = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
  iceCandidatePoolSize: 10,
};

let pc;
let localStream;

function VideoChat() {
  const startButton = useRef(null);
  const hangupButton = useRef(null);
  const muteAudButton = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [audiostate, setAudio] = useState(false);
  const [videostate, setVideo] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const chatRef = useRef();

  useEffect(() => {
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;

    socket.on("message", async (e) => {
      if (!localStream && e.type !== "chat") return;
      switch (e.type) {
        case "offer": await handleOffer(e); break;
        case "answer": await handleAnswer(e); break;
        case "candidate": await handleCandidate(e); break;
        case "ready": if (!pc) makeCall(); break;
        case "bye": if (pc) hangup(); break;
        case "chat":
          setMessages((prev) => [...prev, { text: e.text, self: false }]);
          break;
      }
    });

    return () => socket.off("message");
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function makeCall() {
    pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      socket.emit("message", {
        type: "candidate",
        candidate: e.candidate?.candidate,
        sdpMid: e.candidate?.sdpMid,
        sdpMLineIndex: e.candidate?.sdpMLineIndex,
      });
    };
    pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("message", { type: "offer", sdp: offer.sdp });
  }

  async function handleOffer(offer) {
    if (pc) return;
    pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      socket.emit("message", {
        type: "candidate",
        candidate: e.candidate?.candidate,
        sdpMid: e.candidate?.sdpMid,
        sdpMLineIndex: e.candidate?.sdpMLineIndex,
      });
    };
    pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("message", { type: "answer", sdp: answer.sdp });
  }

  async function handleAnswer(answer) {
    if (!pc) return;
    await pc.setRemoteDescription(answer);
  }

  async function handleCandidate(candidate) {
    if (!pc) return;
    await pc.addIceCandidate(candidate || null);
  }

  async function hangup() {
    if (pc) {
      pc.close();
      pc = null;
    }
    localStream?.getTracks().forEach((track) => track.stop());
    localStream = null;
    startButton.current.disabled = false;
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
  }

  const startB = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { echoCancellation: true },
    });
    localVideo.current.srcObject = localStream;
    startButton.current.disabled = true;
    hangupButton.current.disabled = false;
    muteAudButton.current.disabled = false;
    socket.emit("message", { type: "ready" });
  };

  const hangB = async () => {
    hangup();
    socket.emit("message", { type: "bye" });
  };

  const muteAudio = () => {
    setAudio((prev) => {
      const newState = !prev;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !newState;
      });
      return newState;
    });
  };

  const toggleVideo = () => {
    setVideo((prev) => {
      const newState = !prev;
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
      return newState;
    });
  };

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { text: msg, self: true }]);
    socket.emit("message", { type: "chat", text: msg });
    setMsg("");
  };

  const nextB = async () => {
    await hangB();
    await startB();
  };

  return (
    <div className="video-chat-container">
      <div className="video-and-chat">
        <div className="video-wrapper">
          <video ref={remoteVideo} autoPlay playsInline className="remote-video" />
          <video ref={localVideo} autoPlay muted playsInline className="local-video" />
        </div>

        <div className="chat-panel">
          <div className="chat-messages" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.self ? "self" : "other"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type message..."
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            />
            <button onClick={sendMsg}><FiSend /></button>
          </div>
        </div>
      </div>

      <div className="controls">
        <button ref={startButton} onClick={startB} className="control-btn">
          <FiVideo /> Start
        </button>
        <button ref={hangupButton} onClick={hangB} className="control-btn">
          <FiVideoOff /> End
        </button>
        <button ref={muteAudButton} onClick={muteAudio} className="control-btn">
          {audiostate ? <><FiMicOff /> Unmute</> : <><FiMic /> Mute</>}
        </button>
        <button onClick={toggleVideo} className="control-btn">
          {videostate ? <><FiVideoOff /> Cam Off</> : <><FiVideo /> Cam On</>}
        </button>
        <button onClick={nextB} className="control-btn">
          <FiRefreshCcw /> Next
        </button>
      </div>
    </div>
  );
}

export default VideoChat;
