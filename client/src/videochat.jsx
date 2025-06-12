//first version 

// import { useRef, useEffect, useState } from "react";
// import {
//   FiVideo,
//   FiVideoOff,
//   FiMic,
//   FiMicOff,
//   FiRefreshCcw,
//   FiSend,
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

// function VideoChat() {
//   const startButton = useRef(null);
//   const hangupButton = useRef(null);
//   const muteAudButton = useRef(null);
//   const localVideo = useRef(null);
//   const remoteVideo = useRef(null);
//   const [audiostate, setAudio] = useState(false);
//   const [videostate, setVideo] = useState(true);
//   const [messages, setMessages] = useState([]);
//   const [msg, setMsg] = useState("");
//   const chatRef = useRef();

//   useEffect(() => {
//     hangupButton.current.disabled = true;
//     muteAudButton.current.disabled = true;

//     socket.on("message", async (e) => {
//       if (!localStream && e.type !== "chat") return;
//       switch (e.type) {
//         case "offer": await handleOffer(e); break;
//         case "answer": await handleAnswer(e); break;
//         case "candidate": await handleCandidate(e); break;
//         case "ready": if (!pc) makeCall(); break;
//         case "bye": if (pc) hangup(); break;
//         case "chat":
//           setMessages((prev) => [...prev, { text: e.text, self: false }]);
//           break;
//       }
//     });

//     return () => socket.off("message");
//   }, []);

//   useEffect(() => {
//     chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
//   }, [messages]);

//   async function makeCall() {
//     pc = new RTCPeerConnection(configuration);
//     pc.onicecandidate = (e) => {
//       socket.emit("message", {
//         type: "candidate",
//         candidate: e.candidate?.candidate,
//         sdpMid: e.candidate?.sdpMid,
//         sdpMLineIndex: e.candidate?.sdpMLineIndex,
//       });
//     };
//     pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     socket.emit("message", { type: "offer", sdp: offer.sdp });
//   }

//   async function handleOffer(offer) {
//     if (pc) return;
//     pc = new RTCPeerConnection(configuration);
//     pc.onicecandidate = (e) => {
//       socket.emit("message", {
//         type: "candidate",
//         candidate: e.candidate?.candidate,
//         sdpMid: e.candidate?.sdpMid,
//         sdpMLineIndex: e.candidate?.sdpMLineIndex,
//       });
//     };
//     pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//     await pc.setRemoteDescription(offer);
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//     socket.emit("message", { type: "answer", sdp: answer.sdp });
//   }

//   async function handleAnswer(answer) {
//     if (!pc) return;
//     await pc.setRemoteDescription(answer);
//   }

//   async function handleCandidate(candidate) {
//     if (!pc) return;
//     await pc.addIceCandidate(candidate || null);
//   }

//   async function hangup() {
//     if (pc) {
//       pc.close();
//       pc = null;
//     }
//     localStream?.getTracks().forEach((track) => track.stop());
//     localStream = null;
//     startButton.current.disabled = false;
//     hangupButton.current.disabled = true;
//     muteAudButton.current.disabled = true;
//   }

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

//   const toggleVideo = () => {
//     setVideo((prev) => {
//       const newState = !prev;
//       localStream.getVideoTracks().forEach((track) => {
//         track.enabled = newState;
//       });
//       return newState;
//     });
//   };

//   const sendMsg = () => {
//     if (!msg.trim()) return;
//     setMessages((prev) => [...prev, { text: msg, self: true }]);
//     socket.emit("message", { type: "chat", text: msg });
//     setMsg("");
//   };

//   const nextB = async () => {
//     await hangB();
//     await startB();
//   };

//   return (
//   <div className="video-chat-container">
//     <div className="video-and-chat">
//       <div className="video-wrapper">
//         <video ref={remoteVideo} autoPlay playsInline className="remote-video" />
//         <video ref={localVideo} autoPlay muted playsInline className="local-video" />
//       </div>

//       <div className="chat-panel">
//         <div className="chat-messages" ref={chatRef}>
//           {messages.map((m, i) => (
//             <div key={i} className={`chat-msg ${m.self ? "self" : "other"}`}>
//               {m.text}
//             </div>
//           ))}
//         </div>
//         <div className="chat-input">
//           <input
//             value={msg}
//             onChange={(e) => setMsg(e.target.value)}
//             placeholder="Type message..."
//             onKeyDown={(e) => e.key === "Enter" && sendMsg()}
//           />
//           <button onClick={sendMsg}><FiSend /></button>
//         </div>
//       </div>
//     </div>

//     <div className="controls">
//       <button ref={startButton} onClick={startB} className="control-btn">
//         <FiVideo /> Start
//       </button>
//       <button ref={hangupButton} onClick={hangB} className="control-btn">
//         <FiVideoOff /> End
//       </button>
//       <button ref={muteAudButton} onClick={muteAudio} className="control-btn">
//         {audiostate ? <><FiMicOff /> Unmute</> : <><FiMic /> Mute</>}
//       </button>
//       <button onClick={toggleVideo} className="control-btn">
//         {videostate ? <><FiVideoOff /> Cam Off</> : <><FiVideo /> Cam On</>}
//       </button>
//       <button onClick={nextB} className="control-btn">
//         <FiRefreshCcw /> Next
//       </button>
//     </div>
//   </div>
// );

// }

// export default VideoChat;

//first version completed



// /// main code of second version ////

// import { useRef, useEffect, useState } from "react";
// import {
//   FiVideo, FiVideoOff, FiMic, FiMicOff, FiRefreshCcw, FiSend,
// } from "react-icons/fi";
// import socket from "./socket";

// const configuration = {
//   iceServers: [
//     { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
//   ],
//   iceCandidatePoolSize: 10,
// };

// let pc;
// let localStream;
// let remoteStream;

// function VideoChat() {
//   const startButton = useRef(null);
//   const hangupButton = useRef(null);
//   const muteAudButton = useRef(null);
//   const localVideo = useRef(null);
//   const remoteVideo = useRef(null);
//   const chatRef = useRef();

//   const [audiostate, setAudio] = useState(false);
//   const [videostate, setVideo] = useState(true);
//   const [messages, setMessages] = useState([]);
//   const [msg, setMsg] = useState("");
//   const [waiting, setWaiting] = useState(false);
//   const [myId, setMyId] = useState(null);
//   const [allUsers, setAllUsers] = useState([]);
//   const [partnerId, setPartnerId] = useState(null);

//   useEffect(() => {
//     socket.on("connect", () => {
//       setMyId(socket.id);
//       console.log("Connected with ID:", socket.id);
//       socket.emit("join-pool");
//     });

//     socket.on("users-update", (users) => {
//       console.log("Users updated:", users);
//       setAllUsers(users);
//     });

//     socket.on("signal", async (e) => {
//       console.log("Signal received:", e);
//       switch (e.type) {
//         case "offer":
//           await prepareLocalStream();
//           if (pc) {
//             pc.close();
//             pc = null;
//           }
//           setPartnerId(e.from);
//           await handleOffer(e);
//           break;
//         case "answer":
//           await handleAnswer(e);
//           break;
//         case "candidate":
//           await handleCandidate(e);
//           break;
//         case "ready":
//           setWaiting(false);
//           await prepareLocalStream();
//           makeCall(e.partnerId);
//           break;
//         case "bye":
//           setWaiting(true);
//           hangup();
//           break;
//         case "chat":
//           setMessages((prev) => [...prev, { text: e.text, self: false }]);
//           break;
//         case "partner-left":
//           hangup();
//           break;
//         default:
//           break;
//       }
//     });

//     return () => {
//       socket.off("signal");
//       if (pc) {
//         pc.close();
//         pc = null;
//       }
//     };
//   }, []);

//   useEffect(() => {
//     chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
//   }, [messages]);

//   const prepareLocalStream = async () => {
//     if (!localStream) {
//       localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: { echoCancellation: true },
//       });
//       console.log("Local stream prepared:", localStream);
//       if (localVideo.current) {
//         localVideo.current.srcObject = localStream;
//       }
//     }
//   };

//    function setupPeerConnection(toId) {
//     console.log("Setting up peer connection with:", toId);
//     remoteStream = new MediaStream();
//     if (remoteVideo.current) {
//       remoteVideo.current.srcObject = remoteStream;
//     }

//     pc.onicecandidate = (e) => {
//       if (e.candidate) {
//         console.log("Sending ICE candidate:", e.candidate);
//         socket.emit("signal", {
//           type: "candidate",
//           to: toId,
//           candidate: {
//             candidate: e.candidate.candidate,
//             sdpMid: e.candidate.sdpMid,
//             sdpMLineIndex: e.candidate.sdpMLineIndex,
//           },
//         });
//       }
//     };

//     pc.ontrack = (event) => {
//       console.log("Track event received:", event);
//       if (!remoteStream) {
//         remoteStream = new MediaStream();
//         if (remoteVideo.current) {
//           remoteVideo.current.srcObject = remoteStream;
//         }
//       }
//       event.streams[0].getTracks().forEach((track) => {
//         remoteStream.addTrack(track);
//       });
//     };

//     pc.onconnectionstatechange = () => {
//       console.log("Connection state changed:", pc.connectionState);
//       if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
//         hangup();
//       }
//     };
//   }

//   async function makeCall(toId) {
//     console.log("Making call to:", toId);
//     pc = new RTCPeerConnection(configuration);
//     setupPeerConnection(toId);
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     socket.emit("signal", { type: "offer", sdp: offer.sdp, to: toId });
//   }

 

//   async function handleOffer(offer) {
//     console.log("Handling offer from:", offer.from);
//     pc = new RTCPeerConnection(configuration);
//     setupPeerConnection(offer.from);
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//     await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offer.sdp }));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//     socket.emit("signal", { type: "answer", sdp: answer.sdp, to: offer.from });
//   }

//   async function handleAnswer(answer) {
//     if (!pc) return;
//     if (pc.signalingState !== "have-local-offer") return;
//     console.log("Handling answer:", answer);
//     await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answer.sdp }));
//   }

//   async function handleCandidate(data) {
//     if (!pc || !data?.candidate) return;
//     try {
//       const { candidate, sdpMid, sdpMLineIndex } = data.candidate;
//       console.log("Adding ICE candidate:", candidate);
//       const iceCandidate = new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex });
//       await pc.addIceCandidate(iceCandidate);
//     } catch (err) {
//       console.error("ICE error", err);
//     }
//   }

//   async function hangup() {
//     console.log("Hanging up call");
//     if (pc) {
//       pc.close();
//       pc = null;
//     }
//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       localStream = null;
//     }
//     if (localVideo.current) localVideo.current.srcObject = null;
//     if (remoteVideo.current) remoteVideo.current.srcObject = null;
//     setMessages([]);
//     setWaiting(true);
//   }

//   const startB = async () => {
//     console.log("Start button clicked");
//     await prepareLocalStream();
//     setWaiting(true);
//     setTimeout(() => shuffleAndConnect(), 300);
//   };

//   const shuffleAndConnect = () => {
//     const available = allUsers.filter((id) => id !== myId);
//     console.log("Shuffling to connect. Available users:", available);
//     if (available.length === 0) return;
//     const partner = available[Math.floor(Math.random() * available.length)];
//     setPartnerId(partner);
//     socket.emit("signal", { type: "ready", to: partner });
//   };

//   const hangB = async () => {
//     console.log("Hangup button clicked");
//     await hangup();
//     if (partnerId) socket.emit("signal", { type: "bye", to: partnerId });
//   };

//   const muteAudio = () => {
//     console.log("Toggling audio. Current state:", audiostate);
//     setAudio((prev) => {
//       localStream?.getAudioTracks().forEach((track) => (track.enabled = !prev));
//       return !prev;
//     });
//   };

//   const toggleVideo = () => {
//     console.log("Toggling video. Current state:", videostate);
//     setVideo((prev) => {
//       localStream?.getVideoTracks().forEach((track) => (track.enabled = !prev));
//       return !prev;
//     });
//   };

//   const sendMsg = () => {
//     if (!msg.trim()) return;
//     console.log("Sending message:", msg);
//     setMessages((prev) => [...prev, { text: msg, self: true }]);
//     socket.emit("signal", { type: "chat", text: msg, to: partnerId });
//     setMsg("");
//   };

//   const nextB = async () => {
//     console.log("Next button clicked");
//     await hangB();
//     await startB();
//   };
// return(
//     <div className="w-screen h-screen flex flex-col bg-black text-white">
//       {/* MOBILE VIEW */}
//       <div className="flex md:hidden flex-col h-full">
//         <div className="flex-1 overflow-hidden border-b border-gray-800">
//           <div className="w-full h-1/2 bg-gray-900 flex items-center justify-center">
//             <video ref={localVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
//           </div>
//           <div className="w-full h-1/2 bg-black relative flex items-center justify-center">
//             <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
//             {waiting && (
//               <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-semibold">
//                 🔄 Looking for a partner...
//               </div>
//             )}
//           </div>
//         </div>
//         <div ref={chatRef} className="flex-1 overflow-y-auto p-3 bg-gray-800 space-y-2">
//           {messages.map((m, i) => (
//             <div key={i} className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${m.self ? "self-end bg-green-500 text-white ml-auto" : "self-start bg-gray-700 text-white mr-auto"}`}>{m.text}</div>
//           ))}
//         </div>
//         <div className="bg-gray-900 border-t border-gray-700 p-2 flex flex-wrap gap-2 justify-center">
//           <button ref={startButton} onClick={startB} className="btn"><FiVideo /> Start</button>
//           <button ref={hangupButton} onClick={hangB} className="btn"><FiVideoOff /> End</button>
//           <button ref={muteAudButton} onClick={muteAudio} className="btn">{audiostate ? <><FiMicOff /> Unmute</> : <><FiMic /> Mute</>}</button>
//           <button onClick={toggleVideo} className="btn">{videostate ? <><FiVideoOff /> Cam Off</> : <><FiVideo /> Cam On</>}</button>
//           <button onClick={nextB} className="btn bg-indigo-600 hover:bg-indigo-500"><FiRefreshCcw /> Next</button>
//         </div>
//       </div>
//       {/* DESKTOP VIEW */}
//       <div className="hidden md:flex flex-1 flex-col bg-black">
//         <div className="flex flex-1 flex-row overflow-hidden">
//           <div className="relative flex-1 bg-gray-900 flex justify-center items-center">
//             {/* {waiting && <div className="absolute z-10 text-xl font-semibold text-white">🔄 Looking for a partner...</div>} */}
//             <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
//             <video ref={localVideo} autoPlay muted playsInline className="absolute bottom-5 right-5 w-48 h-28 border-2 border-white rounded-lg object-cover bg-black" />
//           </div>
//           <div className="w-[350px] bg-gray-800 border-l-2 border-gray-700 flex flex-col p-3">
//             <div ref={chatRef} className="flex-1 overflow-y-auto pr-1 mb-3 flex flex-col gap-2">
//               {messages.map((m, i) => (
//                 <div key={i} className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${m.self ? "self-end bg-green-500 text-white" : "self-start bg-gray-700 text-white"}`}>{m.text}</div>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <input className="flex-1 px-4 py-2 rounded-md bg-gray-700 text-white outline-none" placeholder="Type message..." value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} />
//               <button className="bg-green-500 text-white px-4 py-2 rounded-md" onClick={sendMsg}><FiSend /></button>
//             </div>
//           </div>
//         </div>
//         <div className="flex flex-wrap justify-center gap-4 p-4 bg-gray-900 border-t-2 border-gray-700">
//           <button ref={startButton} onClick={startB} className="btn"><FiVideo /> Start</button>
//           <button ref={hangupButton} onClick={hangB} className="btn"><FiVideoOff /> End</button>
//           <button ref={muteAudButton} onClick={muteAudio} className="btn">{audiostate ? <><FiMicOff /> Unmute</> : <><FiMic /> Mute</>}</button>
//           <button onClick={toggleVideo} className="btn">{videostate ? <><FiVideoOff /> Cam Off</> : <><FiVideo /> Cam On</>}</button>
//           <button onClick={nextB} className="btn bg-indigo-600 hover:bg-indigo-500"><FiRefreshCcw /> Next</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default VideoChat;

///main code version 2 ///////


//third version ////

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
let candidateQueue = [];

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
        case "offer":
          console.log("📩 Received offer");
          await handleOffer(e);
          break;
        case "answer":
          console.log("📩 Received answer");
          await handleAnswer(e);
          break;
        case "candidate":
          console.log("📩 Received candidate");
          await handleCandidate(e);
          break;
        case "ready":
          console.log("⚡ Received ready");
          if (!pc) {
            setTimeout(makeCall, 300);
          }
          break;
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
    console.log("📞 Starting call...");
    createPeerConnection();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("message", { type: "offer", sdp: offer.sdp });
  }

  function createPeerConnection() {
    pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("message", {
          type: "candidate",
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE state:", pc.iceConnectionState);
    };

    pc.ontrack = (event) => {
      console.log("📽️ ontrack event", event.streams, event.track);
      if (remoteVideo.current) {
        if (event.streams && event.streams[0]) {
          remoteVideo.current.srcObject = event.streams[0];
        } else {
          if (!remoteVideo.current.srcObject) {
            remoteVideo.current.srcObject = new MediaStream();
          }
          remoteVideo.current.srcObject.addTrack(event.track);
        }
        console.log("✅ Remote stream attached");
      }
    };
  }

  useEffect(() => {
    (async () => {
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.current.srcObject = localStream;
      }
    })();

    localVideo.current.onloadedmetadata = () => {
      console.log("✅ Local video metadata loaded");
    };
    remoteVideo.current.onloadedmetadata = () => {
      console.log("✅ Remote video metadata loaded");
    };
  }, []);

  async function handleOffer(offer) {
    console.log("⚙️ Handling offer...");
    if (pc) pc.close();
    createPeerConnection();

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.current.srcObject = localStream;
    }

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    while (candidateQueue.length) {
      try {
        await pc.addIceCandidate(candidateQueue.shift());
      } catch (err) {
        console.error("Error adding queued candidate", err);
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("message", { type: "answer", sdp: answer.sdp });
  }

  async function handleAnswer(answer) {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    while (candidateQueue.length) {
      try {
        await pc.addIceCandidate(candidateQueue.shift());
      } catch (err) {
        console.error("Error adding queued candidate", err);
      }
    }
  }

  async function handleCandidate({ candidate, sdpMid, sdpMLineIndex }) {
    if (!candidate || sdpMid == null || sdpMLineIndex == null) {
      console.warn("❗ Invalid candidate received", { candidate, sdpMid, sdpMLineIndex });
      return;
    }

    try {
      const iceCandidate = new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex });
      if (pc?.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(iceCandidate);
      } else {
        console.log("⏳ Queueing ICE candidate");
        candidateQueue.push(iceCandidate);
      }
    } catch (err) {
      console.error("Error constructing ICE candidate", err);
    }
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
    remoteVideo.current.srcObject = null;
    localVideo.current.srcObject = null;
    setMessages([]);
  }

  const startB = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: { echoCancellation: true } });
    localVideo.current.srcObject = localStream;
    startButton.current.disabled = true;
    hangupButton.current.disabled = false;
    muteAudButton.current.disabled = false;
    socket.emit("findPartner");
  };

  const hangB = async () => {
    hangup();
    socket.emit("leave");
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
    console.log("🔁 Next: restarting call");
    await hangB();
    await startB();
  };

  return (
    <div className="video-chat-container">
       {/* <div className="nametitle">
        <h1>Meet Your Magical Friend</h1>
        </div> */}
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

//third version done////


