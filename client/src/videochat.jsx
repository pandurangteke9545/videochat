// import { useRef, useEffect, useState } from "react";
// import {
//   FiVideo,
//   FiVideoOff,
//   FiMic,
//   FiMicOff,
//   FiRefreshCcw,
// } from "react-icons/fi";
// import "./VideoChat.css";
// import socket from "./socket";

// const configuration = {
//   iceServers: [
//     { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
//   ],
//   iceCandidatePoolSize: 10,
// };

// let pc;
// let localStream;

// socket.on("message", (e) => {
//   if (!localStream) return;
//   switch (e.type) {
//     case "offer": handleOffer(e); break;
//     case "answer": handleAnswer(e); break;
//     case "candidate": handleCandidate(e); break;
//     case "ready": if (!pc) makeCall(); break;
//     case "bye": if (pc) hangup(); break;
//   }
// });

// async function makeCall() {
//   pc = new RTCPeerConnection(configuration);
//   pc.onicecandidate = (e) => {
//     socket.emit("message", {
//       type: "candidate",
//       candidate: e.candidate?.candidate,
//       sdpMid: e.candidate?.sdpMid,
//       sdpMLineIndex: e.candidate?.sdpMLineIndex,
//     });
//   };
//   pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//   localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);
//   socket.emit("message", { type: "offer", sdp: offer.sdp });
// }

// async function handleOffer(offer) {
//   if (pc) return;
//   pc = new RTCPeerConnection(configuration);
//   pc.onicecandidate = (e) => {
//     socket.emit("message", {
//       type: "candidate",
//       candidate: e.candidate?.candidate,
//       sdpMid: e.candidate?.sdpMid,
//       sdpMLineIndex: e.candidate?.sdpMLineIndex,
//     });
//   };
//   pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//   localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   await pc.setRemoteDescription(offer);
//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);
//   socket.emit("message", { type: "answer", sdp: answer.sdp });
// }

// async function handleAnswer(answer) {
//   if (!pc) return;
//   await pc.setRemoteDescription(answer);
// }

// async function handleCandidate(candidate) {
//   if (!pc) return;
//   await pc.addIceCandidate(candidate || null);
// }

// async function hangup() {
//   if (pc) {
//     pc.close();
//     pc = null;
//   }
//   localStream?.getTracks().forEach((track) => track.stop());
//   localStream = null;
//   startButton.current.disabled = false;
//   hangupButton.current.disabled = true;
//   muteAudButton.current.disabled = true;
// }

// let remoteVideo;
// let localVideo;
// let startButton;
// let hangupButton;
// let muteAudButton;

// function VideoChat() {
//   startButton = useRef(null);
//   hangupButton = useRef(null);
//   muteAudButton = useRef(null);
//   localVideo = useRef(null);
//   remoteVideo = useRef(null);
//   const [audiostate, setAudio] = useState(false);

//   useEffect(() => {
//     hangupButton.current.disabled = true;
//     muteAudButton.current.disabled = true;
//   }, []);

//   const startB = async () => {
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: { echoCancellation: true },
//     });
//     localVideo.current.srcObject = localStream;
//     startButton.current.disabled = true;
//     hangupButton.current.disabled = false;
//     muteAudButton.current.disabled = false;
//     socket.emit("message", { type: "ready" });
//   };

//   const hangB = async () => {
//     hangup();
//     socket.emit("message", { type: "bye" });
//   };

//   const muteAudio = () => {
//     setAudio((prev) => {
//       const newState = !prev;
//       localStream.getAudioTracks().forEach((track) => {
//         track.enabled = !newState;
//       });
//       return newState;
//     });
//   };

//   return (
//     <div className="video-chat-container">
//       <div className="video-wrapper">
//         <video ref={localVideo} autoPlay muted playsInline className="video" />
//         <video ref={remoteVideo} autoPlay playsInline className="video" />
//       </div>

//       <div className="controls">
//         <button ref={startButton} onClick={startB} className="control-btn">
//           <FiVideo /> Start
//         </button>
//         <button ref={hangupButton} onClick={hangB} className="control-btn">
//           <FiVideoOff /> End
//         </button>
//         <button ref={muteAudButton} onClick={muteAudio} className="control-btn">
//           {audiostate ? <><FiMicOff /> Unmute</> : <><FiMic /> Mute</>}
//         </button>
//         <button onClick={() => window.location.reload()} className="control-btn">
//           <FiRefreshCcw /> Next
//         </button>
//       </div>
//     </div>
//   );
// }

// export default VideoChat;



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

let remoteVideo;
let localVideo;
let startButton;
let hangupButton;
let muteAudButton;

function VideoChat() {
  startButton = useRef(null);
  hangupButton = useRef(null);
  muteAudButton = useRef(null);
  localVideo = useRef(null);
  remoteVideo = useRef(null);
  const [audiostate, setAudio] = useState(false);
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

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { text: msg, self: true }]);
    socket.emit("message", { type: "chat", text: msg });
    setMsg("");
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
        <button onClick={() => window.location.reload()} className="control-btn">
          <FiRefreshCcw /> Next
        </button>
      </div>
    </div>
  );
}

export default VideoChat;




// import { useRef, useEffect, useState } from "react";
// import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiRefreshCcw } from "react-icons/fi";
// import "./app.css"; // Ensure your CSS is updated
// import socket from "./socket";

// const configuration = {
//   iceServers: [
//     {
//       urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
//     },
//   ],
//   iceCandidatePoolSize: 10,
// };

// let pc;
// let localStream;
// let startButton;
// let hangupButton;
// let muteAudButton;
// let remoteVideo;
// let localVideo;

// socket.on("message", (e) => {
//   if (!localStream) return;

//   switch (e.type) {
//     case "offer": handleOffer(e); break;
//     case "answer": handleAnswer(e); break;
//     case "candidate": handleCandidate(e); break;
//     case "ready": if (!pc) makeCall(); break;
//     case "bye": if (pc) hangup(); break;
//     default: break;
//   }
// });

// async function makeCall() {
//   pc = new RTCPeerConnection(configuration);
//   pc.onicecandidate = (e) => {
//     socket.emit("message", {
//       type: "candidate",
//       candidate: e.candidate?.candidate || null,
//       sdpMid: e.candidate?.sdpMid,
//       sdpMLineIndex: e.candidate?.sdpMLineIndex,
//     });
//   };
//   pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//   localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);
//   socket.emit("message", { type: "offer", sdp: offer.sdp });
// }

// async function handleOffer(offer) {
//   if (pc) return;
//   pc = new RTCPeerConnection(configuration);
//   pc.onicecandidate = (e) => {
//     socket.emit("message", {
//       type: "candidate",
//       candidate: e.candidate?.candidate || null,
//       sdpMid: e.candidate?.sdpMid,
//       sdpMLineIndex: e.candidate?.sdpMLineIndex,
//     });
//   };
//   pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//   localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   await pc.setRemoteDescription(offer);
//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);
//   socket.emit("message", { type: "answer", sdp: answer.sdp });
// }

// async function handleAnswer(answer) {
//   if (!pc) return;
//   await pc.setRemoteDescription(answer);
// }

// async function handleCandidate(candidate) {
//   if (!pc) return;
//   await pc.addIceCandidate(candidate || null);
// }

// async function hangup() {
//   if (pc) {
//     pc.close();
//     pc = null;
//   }
//   localStream?.getTracks().forEach((track) => track.stop());
//   localStream = null;
//   startButton.current.disabled = false;
//   hangupButton.current.disabled = true;
//   muteAudButton.current.disabled = true;
// }

// function VideoChat() {
//   startButton = useRef(null);
//   hangupButton = useRef(null);
//   muteAudButton = useRef(null);
//   localVideo = useRef(null);
//   remoteVideo = useRef(null);
//   const [audiostate, setAudio] = useState(false);

//   useEffect(() => {
//     hangupButton.current.disabled = true;
//     muteAudButton.current.disabled = true;
//   }, []);

//   const startB = async () => {
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: { echoCancellation: true },
//     });
//     localVideo.current.srcObject = localStream;
//     startButton.current.disabled = true;
//     hangupButton.current.disabled = false;
//     muteAudButton.current.disabled = false;
//     socket.emit("message", { type: "ready" });
//   };

//   const hangB = async () => {
//     hangup();
//     socket.emit("message", { type: "bye" });
//   };

//   const muteAudio = () => {
//     setAudio((prev) => {
//       const newState = !prev;
//       localStream.getAudioTracks().forEach((track) => {
//         track.enabled = !newState;
//       });
//       return newState;
//     });
//   };

//   return (
//     <div className="chat-container">
//       <div className="videos">
//         <video ref={localVideo} autoPlay muted playsInline className="video-box" />
//         <video ref={remoteVideo} autoPlay playsInline className="video-box" />
//       </div>
//       <div className="controls">
//         <button ref={startButton} onClick={startB} className="control-btn">
//           <FiVideo /> Start
//         </button>
//         <button ref={hangupButton} onClick={hangB} className="control-btn">
//           <FiVideoOff /> End
//         </button>
//         <button ref={muteAudButton} onClick={muteAudio} className="control-btn">
//           {audiostate ? <><FiMicOff /> Unmute</> : <><FiMic /> Mute</>}
//         </button>
//         <button onClick={() => window.location.reload()} className="control-btn">
//           <FiRefreshCcw /> Next
//         </button>
//       </div>
//     </div>
//   );
// }

// export default VideoChat;

