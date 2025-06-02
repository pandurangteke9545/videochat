// import React, { useEffect, useRef, useState } from 'react';
// import socket from './socket';

// const VideoChat = () => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const [serverStatus, setServerStatus] = useState('Checking...');

//   const ICE_SERVERS = {
//     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
//   };

//   useEffect(() => {
//     let peerId = null;

//     // Backend check
//     fetch('http://192.168.43.76:5000/ping')
//       .then(res => res.text())
//       .then(data => {
//         console.log('Ping response:', data);
//         if (data === 'pong') {
//           setServerStatus('Connected to backend ✅');
//         } else {
//           setServerStatus('Backend response invalid ❌');
//         }
//       })
//       .catch(err => {
//         console.error('Backend not reachable:', err);
//         setServerStatus('Backend not reachable ❌');
//       });

//     // Media access
//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         console.log('Got local media stream');
//         localStreamRef.current = stream;
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }
//         socket.emit('join');
//         console.log('Sent join to backend');
//       })
//       .catch((err) => {
//         console.error('Error accessing media devices:', err);
//       });

//     // Room joined
//     socket.off('room-joined').on('room-joined', async ({ peerId: remotePeerId, createOffer }) => {
//       console.log('Joined room with peer:', remotePeerId, 'Create offer:', createOffer);
//       peerId = remotePeerId;

//       if (!localStreamRef.current) {
//         console.warn('Local stream not available yet');
//         return;
//       }

//       // Create RTCPeerConnection
//       peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
//       const pc = peerConnectionRef.current;

//       localStreamRef.current.getTracks().forEach(track => {
//         pc.addTrack(track, localStreamRef.current);
//       });

//       pc.ontrack = (event) => {
//         console.log('Received remote stream');
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       pc.onicecandidate = (event) => {
//         if (event.candidate) {
//           console.log('Sending ICE candidate to:', peerId);
//           socket.emit('signal', {
//             to: peerId,
//             data: { candidate: event.candidate }
//           });
//         }
//       };

//       if (createOffer) {
//         console.log('Creating offer...');
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socket.emit('signal', {
//           to: peerId,
//           data: { sdp: offer }
//         });
//         console.log('Sent offer');
//       }
//     });

//     // Signal received
//     socket.off('signal').on('signal', async ({ from, data }) => {
//       console.log('Received signal from:', from, data);
//       const pc = peerConnectionRef.current;
//       if (!pc) {
//         console.warn('Peer connection not initialized');
//         return;
//       }

//       if (data.sdp) {
//         console.log('Received SDP:', data.sdp.type);
//         await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
//         if (data.sdp.type === 'offer') {
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit('signal', {
//             to: from,
//             data: { sdp: answer }
//           });
//           console.log('Sent answer');
//         }
//       }

//       if (data.candidate) {
//         try {
//           await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//           console.log('Added ICE candidate');
//         } catch (err) {
//           console.error('Error adding ICE candidate:', err);
//         }
//       }
//     });

//     // Peer disconnected
//     socket.off('peer-disconnected').on('peer-disconnected', () => {
//       console.log('Peer disconnected');
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }
//       if (peerConnectionRef.current) {
//         peerConnectionRef.current.close();
//         peerConnectionRef.current = null;
//       }
//     });

//     return () => {
//       if (peerConnectionRef.current) peerConnectionRef.current.close();
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//       socket.disconnect();
//     };
//   }, []);

//   return (
//     <div className="video-container">
//       <p style={{ color: 'green', fontWeight: 'bold' }}>{serverStatus}</p>
//       <video ref={localVideoRef} autoPlay muted className="local-video" />
//       <video ref={remoteVideoRef} autoPlay className="remote-video" />
//       <div className="controls">
//         <button onClick={() => {
//           const audioTrack = localStreamRef.current?.getAudioTracks()[0];
//           if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
//         }}>
//           Mute / Unmute
//         </button>
//         <button onClick={() => {
//           const videoTrack = localStreamRef.current?.getVideoTracks()[0];
//           if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
//         }}>
//           Camera On/Off
//         </button>
//         <button>Next</button>
//         <button>End Chat</button>
//       </div>
//     </div>
//   );
// };

// export default VideoChat;





// import { sockent } from "socket.io-client";
import { useRef, useEffect, useState } from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";
import "../src/app.css"; // Import external CSS for cleaner styling
import socket from "./socket";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};


let pc;
let localStream;
let startButton;
let hangupButton;
let muteAudButton;
let remoteVideo;
let localVideo;

socket.on("message", (e) => {
  if (!localStream) return;

  switch (e.type) {
    case "offer": handleOffer(e); break;
    case "answer": handleAnswer(e); break;
    case "candidate": handleCandidate(e); break;
    case "ready": if (!pc) makeCall(); break;
    case "bye": if (pc) hangup(); break;
    default: break;
  }
});

async function makeCall() {
  pc = new RTCPeerConnection(configuration);
  pc.onicecandidate = (e) => {
    const message = {
      type: "candidate",
      candidate: e.candidate ? e.candidate.candidate : null,
      sdpMid: e.candidate?.sdpMid,
      sdpMLineIndex: e.candidate?.sdpMLineIndex,
    };
    socket.emit("message", message);
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
    const message = {
      type: "candidate",
      candidate: e.candidate ? e.candidate.candidate : null,
      sdpMid: e.candidate?.sdpMid,
      sdpMLineIndex: e.candidate?.sdpMLineIndex,
    };
    socket.emit("message", message);
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

function VideoChat() {
  startButton = useRef(null);
  hangupButton = useRef(null);
  muteAudButton = useRef(null);
  localVideo = useRef(null);
  remoteVideo = useRef(null);
  const [audiostate, setAudio] = useState(false);

  useEffect(() => {
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
  }, []);

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
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !audiostate;
    });
    setAudio(!audiostate);
  };

  return (
    <div className="chat-container">
      <div className="videos">
        <video ref={localVideo} autoPlay muted playsInline className="video-box" />
        <video ref={remoteVideo} autoPlay playsInline className="video-box" />
      </div>
      <div className="controls">
        <button ref={startButton} onClick={startB} className="control-btn">
          <FiVideo />
        </button>
        <button ref={hangupButton} onClick={hangB} className="control-btn">
          <FiVideoOff />
        </button>
        <button ref={muteAudButton} onClick={muteAudio} className="control-btn">
          {audiostate ? <FiMicOff /> : <FiMic />}
        </button>
      </div>
    </div>
  );
}

export default VideoChat;
