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


// // VideoChat.jsx
// import React, { useEffect, useRef, useState } from 'react';
// import { io } from 'socket.io-client';

// const socket = io('http://192.168.43.76:5000'); // Replace with your local IP

// const VideoChat = () => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const peerConnection = useRef(null);
//   const [localStream, setLocalStream] = useState(null);

//   useEffect(() => {
//     // 1. Get local media
//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         setLocalStream(stream);
//         localVideoRef.current.srcObject = stream;
//         socket.emit('join');
//         console.log("Got local media stream");
//       })
//       .catch(err => console.error('Media error:', err));

//     // 2. Handle incoming peer connection
//     socket.on('room-joined', async ({ peerId, createOffer }) => {
//       console.log('Room joined, peer:', peerId);
//       createPeerConnection(peerId);

//       if (createOffer) {
//         const offer = await peerConnection.current.createOffer();
//         await peerConnection.current.setLocalDescription(offer);
//         socket.emit('signal', {
//           to: peerId,
//           data: offer,
//         });
//       }
//     });

//     // 3. Handle signaling data (offer/answer/candidates)
//     socket.on('signal', async ({ from, data }) => {
//       console.log('Signal received:', data);

//       if (!peerConnection.current) {
//         createPeerConnection(from);
//       }

//       if (data.type === 'offer') {
//         await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data));
//         const answer = await peerConnection.current.createAnswer();
//         await peerConnection.current.setLocalDescription(answer);
//         socket.emit('signal', {
//           to: from,
//           data: answer,
//         });
//       } else if (data.type === 'answer') {
//         await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data));
//       } else if (data.candidate) {
//         await peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
//       }
//     });

//     socket.on('peer-disconnected', () => {
//       console.log('Peer disconnected');
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }
//       if (peerConnection.current) {
//         peerConnection.current.close();
//         peerConnection.current = null;
//       }
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   const createPeerConnection = (peerId) => {
//     if (peerConnection.current) return;

//     peerConnection.current = new RTCPeerConnection({
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//     });

//     localStream.getTracks().forEach(track => {
//       peerConnection.current.addTrack(track, localStream);
//     });

//     peerConnection.current.ontrack = (event) => {
//       console.log('Remote track received');
//       remoteVideoRef.current.srcObject = event.streams[0];
//     };

//     peerConnection.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit('signal', {
//           to: peerId,
//           data: event.candidate,
//         });
//       }
//     };
//   };

//   return (
//     <div>
//       <h2>WebRTC Video Chat</h2>
//       <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '45%' }} />
//       <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '45%' }} />
//     </div>
//   );
// };

// export default VideoChat;



// The remote peer(callee) will also create an instance of the RTC peer connection. When the callee receives an offer, it will set its remote session description to the offer, then create an answer, and set the answer as its local session description. The callee will send the answer to the caller through the signaling server. The callee would also attach its media stream and ice candidate to the peer connection.

// The connection between the caller and callee can only take place after they have both exchanged ice candidates. We mentioned before that ice candidates are potential network addresses that peers can use to communicate with one another. The caller would send its ice candidate to the callee through the signaling server and listen for the ice candidate of the callee, when the caller receives the ice candidate of the callee, it will add it to the RTCPeerConnection. The callee would also repeat this process.

// We implemented the offer and answer mechanism in the code below.

// import { io } from "socket.io-client";
// import { useRef, useEffect, useState } from "react";
// import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";

// const configuration = {
//   iceServers: [
//     {
//       urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
//     },
//   ],
//   iceCandidatePoolSize: 10,
// };
// const socket = io("http://localhost:3000", { transports: ["websocket"] });

// let pc;
// let localStream;
// let startButton;
// let hangupButton;
// let muteAudButton;
// let remoteVideo;
// let localVideo;
// socket.on("message", (e) => {
//   if (!localStream) {
//     console.log("not ready yet");
//     return;
//   }
//   switch (e.type) {
//     case "offer":
//       handleOffer(e);
//       break;
//     case "answer":
//       handleAnswer(e);
//       break;
//     case "candidate":
//       handleCandidate(e);
//       break;
//     case "ready":
//       // A second tab joined. This tab will initiate a call unless in a call already.
//       if (pc) {
//         console.log("already in call, ignoring");
//         return;
//       }
//       makeCall();
//       break;
//     case "bye":
//       if (pc) {
//         hangup();
//       }
//       break;
//     default:
//       console.log("unhandled", e);
//       break;
//   }
// });

// async function makeCall() {
//   try {
//     pc = new RTCPeerConnection(configuration);
//     pc.onicecandidate = (e) => {
//       const message = {
//         type: "candidate",
//         candidate: null,
//       };
//       if (e.candidate) {
//         message.candidate = e.candidate.candidate;
//         message.sdpMid = e.candidate.sdpMid;
//         message.sdpMLineIndex = e.candidate.sdpMLineIndex;
//       }
//       socket.emit("message", message);
//     };
//     pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//     const offer = await pc.createOffer();
//     socket.emit("message", { type: "offer", sdp: offer.sdp });
//     await pc.setLocalDescription(offer);
//   } catch (e) {
//     console.log(e);
//   }
// }

// async function handleOffer(offer) {
//   if (pc) {
//     console.error("existing peerconnection");
//     return;
//   }
//   try {
//     pc = new RTCPeerConnection(configuration);
//     pc.onicecandidate = (e) => {
//       const message = {
//         type: "candidate",
//         candidate: null,
//       };
//       if (e.candidate) {
//         message.candidate = e.candidate.candidate;
//         message.sdpMid = e.candidate.sdpMid;
//         message.sdpMLineIndex = e.candidate.sdpMLineIndex;
//       }
//       socket.emit("message", message);
//     };
//     pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//     await pc.setRemoteDescription(offer);

//     const answer = await pc.createAnswer();
//     socket.emit("message", { type: "answer", sdp: answer.sdp });
//     await pc.setLocalDescription(answer);
//   } catch (e) {
//     console.log(e);
//   }
// }

// async function handleAnswer(answer) {
//   if (!pc) {
//     console.error("no peerconnection");
//     return;
//   }
//   try {
//     await pc.setRemoteDescription(answer);
//   } catch (e) {
//     console.log(e);
//   }
// }

// async function handleCandidate(candidate) {
//   try {
//     if (!pc) {
//       console.error("no peerconnection");
//       return;
//     }
//     if (!candidate) {
//       await pc.addIceCandidate(null);
//     } else {
//       await pc.addIceCandidate(candidate);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// }
// async function hangup() {
//   if (pc) {
//     pc.close();
//     pc = null;
//   }
//   localStream.getTracks().forEach((track) => track.stop());
//   localStream = null;
//   startButton.current.disabled = false;
//   hangupButton.current.disabled = true;
//   muteAudButton.current.disabled = true;
// }

// function App() {
//   startButton = useRef(null);
//   hangupButton = useRef(null);
//   muteAudButton = useRef(null);
//   localVideo = useRef(null);
//   remoteVideo = useRef(null);
//   useEffect(() => {
//     hangupButton.current.disabled = true;
//     muteAudButton.current.disabled = true;
//   }, []);
//   const [audiostate, setAudio] = useState(false);

//   const startB = async () => {
//     try {
//       localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: { echoCancellation: true },
//       });
//       localVideo.current.srcObject = localStream;
//     } catch (err) {
//       console.log(err);
//     }

//     startButton.current.disabled = true;
//     hangupButton.current.disabled = false;
//     muteAudButton.current.disabled = false;

//     socket.emit("message", { type: "ready" });
//   };

//   const hangB = async () => {
//     hangup();
//     socket.emit("message", { type: "bye" });
//   };

//   function muteAudio() {
//     if (audiostate) {
//       localVideo.current.muted = true;
//       setAudio(false);
//     } else {
//       localVideo.current.muted = false;
//       setAudio(true);
//     }
//   }

//   return (
//     <>
//       <main className="container  ">
//         <div className="video bg-main">
//           <video
//             ref={localVideo}
//             className="video-item"
//             autoPlay
//             playsInline
//             src=" "
//           ></video>
//           <video
//             ref={remoteVideo}
//             className="video-item"
//             autoPlay
//             playsInline
//             src=" "
//           ></video>
//         </div>

//         <div className="btn">
//           <button
//             className="btn-item btn-start"
//             ref={startButton}
//             onClick={startB}
//           >
//             <FiVideo />
//           </button>
//           <button
//             className="btn-item btn-end"
//             ref={hangupButton}
//             onClick={hangB}
//           >
//             <FiVideoOff />
//           </button>
//           <button
//             className="btn-item btn-start"
//             ref={muteAudButton}
//             onClick={muteAudio}
//           >
//             {audiostate ? <FiMic /> : <FiMicOff />}
//           </button>
//         </div>
//       </main>
//     </>
//   );
// }

// // export default App
// In the script above, we initialized a variable named configuration and assigned it an object with two fields, iceServers, and iceCandidatePoolSize. The value of the iceServers field is an array that contains the URL of the ice servers. Next, we instantiated a Socket.IO client and assigned it to the variable socket. The instance of the Socket.IO client contains two parameters, the URL of server-side Socket.IO and the transport protocol to use. Then, we declared seven global variables without assigning any value to them.

// The instance of the Socket.IO client listens to a message event. On receiving a message event, the event will be passed through a switch block to handle a specific type of event. The offer and answer were implemented through five async functions:

// makeCall
// handleOffer
// handleAnswer
// handleCandidate
// hangUp
// Video App UI
// We used React.js to create the UI of the video chat app. We created a component named App. To start a video call, click on the phone icon. This will fire the browser API navigator.mediaDevices.getUserMedia({video: true, audio:{'echoCancellation':true}}) The stream from the camera will be seen in the video element of the App component. Open another tab in the browser, and type the URL of the React App, you will see two streams of videos. One local and one remote.

// Below are the Cascading Style Sheets(CSS) and HTML for the UI

// .bg-body {
//   background-color: #332e33;
// }

// .container {
//   display: flex;
//   flex-direction: column;
//   gap: 5px;
//   padding: 10px;
// }
// .col-container {
//   display: flex;
//   flex-direction: column;
//   width: inherit;
// }
// .label-text {
//   color: #fff;
//   text-align: center;
//   font-size: 20px;
// }
// .btn-start {
//   background-color: #0ced23;
// }
// .btn-end {
//   background-color: rgb(225, 5, 5);
// }
// .btn {
//   display: flex;
//   flex-direction: row;
//   justify-content: center;
//   column-gap: 20px;
//   margin-top: 10px;
// }
// .btn-item {
//   width: 50px;
//   height: 50px;
//   color: #fff;
//   border-radius: 50%;
// }
// .video {
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   row-gap: 10px;
// }
// .video-item {
//   width: 90%;
//   height: 250px;
//   border: 2px solid #fff;
//   border-radius: 10px;
//   margin: 10px auto;
// }
// @media only screen and (min-width: 800px) {
//   .container {
//     margin-top: 30px;
//   }
//   .video {
//     display: flex;
//     flex-direction: row;
//     column-gap: 0.5%;
//     justify-content: center;
//   }
//   .video-item {
//     width: 40%;
//     height: 400px;
//   }
//   .btn-item {
//     width: 80px;
//     height: 80px;
//     color: #fff;
//     border-radius: 50%;
//   }
// }
// <!doctype html>
// <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <link rel="icon" type="image/svg+xml" href="/vite.svg" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <link rel="stylesheet" href="/style.css" />
//     <title>Video Chat</title>
//   </head>
//   <body class="bg-body">
//     <div id="root"></div>
//     <script type="module" src="/src/main.jsx"></script>
//   </body>
// </html>
// Conclusion
// In this article, we explained WebRTC, and Socket.IO concepts and how to set them up to create a Video Chat App. Also, we discussed the advantages and disadvantages of using WebRTC for video chat applications.

// Like, Share, or Comment if you find this article interesting.

// Top comments (6)

// Subscribe
// pic
// Add to the discussion
//  I've read the code of conduct
 
 
// jcubic profile image
// Jakub T. Jankiewicz
// •
// Sep 3 '23 • Edited on Sep 3
// Comment hidden by post author
 
 
// enravishjeni411 profile image
// enravishjeni411
// •
// Feb 7 • Edited on Feb 7

// I had tried all the possible ways, in my demo application. But still on opening a new tab, I never get to see second video player {remoteVideo} playing. Anyone facing this issue ?


// 1
//  like
// Like

// Reply
 
 
// eyitayoitalt profile image
// Eyitayo Itunu Babatope 
// •
// Feb 21

// This can be due to different factors, I will suggest the following to fix the issue.

// Ensure the two tab can exchange messages through the socketing. Console.log to find out.
// Check the ice candidate, consoles.log(message.candidate), in handleCall() and handleOffer() function.
// Also check if the navigator.mediaDevices.getUserMedia()fires up

// 1
//  like
// Like

// Reply
 
 
// eyitayoitalt profile image
// Eyitayo Itunu Babatope 
// •
// Apr 14
// Comment hidden by post author
 
 
// rushiljalal profile image
// Rushil Jalal
// •
// Apr 10
// Comment hidden by post author
 
 
// temiogundeji profile image
// Temiogundeji
// •
// Sep 1 '23

// Great article on WebRTC


// 1
//  like
// Like

// Reply
// Some comments have been hidden by the post's author - find out more

// Code of Conduct • Report abuse
// Read next
// pantelis_vardakas profile image
// Test Reporting using Allure Server and GitLab CI
// Pantelis Vardakas - May 26

// jordankeurope profile image
// How Do Free Resume Builders Compare to Paid Ones in 2025?
// Jordan Knightin - May 26

// yunus_emremert_1756b71d3 profile image
// Web Performansını İyileştir: Daha Hızlı Yüklenen Sayfalar
// Yunus Emre Mert - May 26

// jajera profile image
// Getting Started with AWS SSO Using `aws configure sso`
// John Ajera - May 26


// Eyitayo Itunu Babatope
// Follow
// Solidity and Web Developer
// Location
// Osun, Nigeria
// Work
// Full stack web developer and web programmer
// Joined
// Jan 9, 2023
// More from Eyitayo Itunu Babatope
// Smart Contract Fork Testing Using Foundry Cheatcodes
// Video Streaming with MPEG-DASH?
// #dash #videostreaming #videos #https
// Toggle Password Visibility Using React useRef
// #javascript #frontend #react #useref


import { io } from "socket.io-client";
import { useRef, useEffect, useState } from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
const socket = io("http://192.168.43.76:5000", { transports: ["websocket"] });

let pc;
let localStream;
let startButton;
let hangupButton;
let muteAudButton;
let remoteVideo;
let localVideo;
socket.on("message", (e) => {
  if (!localStream) {
    console.log("not ready yet");
    return;
  }
  switch (e.type) {
    case "offer":
      handleOffer(e);
      break;
    case "answer":
      handleAnswer(e);
      break;
    case "candidate":
      handleCandidate(e);
      break;
    case "ready":
      // A second tab joined. This tab will initiate a call unless in a call already.
      if (pc) {
        console.log("already in call, ignoring");
        return;
      }
      makeCall();
      break;
    case "bye":
      if (pc) {
        hangup();
      }
      break;
    default:
      console.log("unhandled", e);
      break;
  }
});

async function makeCall() {
  try {
    pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      const message = {
        type: "candidate",
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      socket.emit("message", message);
    };
    pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    const offer = await pc.createOffer();
    socket.emit("message", { type: "offer", sdp: offer.sdp });
    await pc.setLocalDescription(offer);
  } catch (e) {
    console.log(e);
  }
}

async function handleOffer(offer) {
  if (pc) {
    console.error("existing peerconnection");
    return;
  }
  try {
    pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      const message = {
        type: "candidate",
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      socket.emit("message", message);
    };
    pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    socket.emit("message", { type: "answer", sdp: answer.sdp });
    await pc.setLocalDescription(answer);
  } catch (e) {
    console.log(e);
  }
}

async function handleAnswer(answer) {
  if (!pc) {
    console.error("no peerconnection");
    return;
  }
  try {
    await pc.setRemoteDescription(answer);
  } catch (e) {
    console.log(e);
  }
}

async function handleCandidate(candidate) {
  try {
    if (!pc) {
      console.error("no peerconnection");
      return;
    }
    if (!candidate) {
      await pc.addIceCandidate(null);
    } else {
      await pc.addIceCandidate(candidate);
    }
  } catch (e) {
    console.log(e);
  }
}
async function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
  localStream.getTracks().forEach((track) => track.stop());
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
  useEffect(() => {
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
  }, []);
  const [audiostate, setAudio] = useState(false);

  const startB = async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      localVideo.current.srcObject = localStream;
    } catch (err) {
      console.log(err);
    }

    startButton.current.disabled = true;
    hangupButton.current.disabled = false;
    muteAudButton.current.disabled = false;

    socket.emit("message", { type: "ready" });
  };

  const hangB = async () => {
    hangup();
    socket.emit("message", { type: "bye" });
  };

  function muteAudio() {
    if (audiostate) {
      localVideo.current.muted = true;
      setAudio(false);
    } else {
      localVideo.current.muted = false;
      setAudio(true);
    }
  }

  return (
    <>
      <main className="container  ">
        <div className="video bg-main">
          <video
            ref={localVideo}
            className="video-item"
            autoPlay
            playsInline
            src=" "
          ></video>
          <video
            ref={remoteVideo}
            className="video-item"
            autoPlay
            playsInline
            src=" "
          ></video>
        </div>

        <div className="btn">
          <button
            className="btn-item btn-start"
            ref={startButton}
            onClick={startB}
          >
            <FiVideo />
          </button>
          <button
            className="btn-item btn-end"
            ref={hangupButton}
            onClick={hangB}
          >
            <FiVideoOff />
          </button>
          <button
            className="btn-item btn-start"
            ref={muteAudButton}
            onClick={muteAudio}
          >
            {audiostate ? <FiMic /> : <FiMicOff />}
          </button>
        </div>
      </main>
    </>
  );
}

export default VideoChat