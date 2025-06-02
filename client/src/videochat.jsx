import React, { useEffect, useRef, useState } from 'react';
import socket from './socket';

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [serverStatus, setServerStatus] = useState('Checking...');

  const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    let peerId = null;

    // Backend check
    fetch('http://192.168.43.76:5000/ping')
      .then(res => res.text())
      .then(data => {
        console.log('Ping response:', data);
        if (data === 'pong') {
          setServerStatus('Connected to backend ✅');
        } else {
          setServerStatus('Backend response invalid ❌');
        }
      })
      .catch(err => {
        console.error('Backend not reachable:', err);
        setServerStatus('Backend not reachable ❌');
      });

    // Media access
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log('Got local media stream');
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        socket.emit('join');
        console.log('Sent join to backend');
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
      });

    // Room joined
    socket.off('room-joined').on('room-joined', async ({ peerId: remotePeerId, createOffer }) => {
      console.log('Joined room with peer:', remotePeerId, 'Create offer:', createOffer);
      peerId = remotePeerId;

      if (!localStreamRef.current) {
        console.warn('Local stream not available yet');
        return;
      }

      // Create RTCPeerConnection
      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
      const pc = peerConnectionRef.current;

      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.ontrack = (event) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate to:', peerId);
          socket.emit('signal', {
            to: peerId,
            data: { candidate: event.candidate }
          });
        }
      };

      if (createOffer) {
        console.log('Creating offer...');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal', {
          to: peerId,
          data: { sdp: offer }
        });
        console.log('Sent offer');
      }
    });

    // Signal received
    socket.off('signal').on('signal', async ({ from, data }) => {
      console.log('Received signal from:', from, data);
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn('Peer connection not initialized');
        return;
      }

      if (data.sdp) {
        console.log('Received SDP:', data.sdp.type);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', {
            to: from,
            data: { sdp: answer }
          });
          console.log('Sent answer');
        }
      }

      if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('Added ICE candidate');
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Peer disconnected
    socket.off('peer-disconnected').on('peer-disconnected', () => {
      console.log('Peer disconnected');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    return () => {
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.disconnect();
    };
  }, []);

  return (
    <div className="video-container">
      <p style={{ color: 'green', fontWeight: 'bold' }}>{serverStatus}</p>
      <video ref={localVideoRef} autoPlay muted className="local-video" />
      <video ref={remoteVideoRef} autoPlay className="remote-video" />
      <div className="controls">
        <button onClick={() => {
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
        }}>
          Mute / Unmute
        </button>
        <button onClick={() => {
          const videoTrack = localStreamRef.current?.getVideoTracks()[0];
          if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
        }}>
          Camera On/Off
        </button>
        <button>Next</button>
        <button>End Chat</button>
      </div>
    </div>
  );
};

export default VideoChat;



// import React, { useEffect, useRef } from 'react';
// import socket from './socket';

// const VideoChat = () => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const localStreamRef = useRef(null);

//   const ICE_SERVERS = {
//     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
//   };

//   useEffect(() => {
//     let peerId = null;

//     // 1. Get media
//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         localStreamRef.current = stream;
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }
//         socket.emit('join');
//       })
//       .catch((err) => {
//         console.error('Error accessing media devices:', err);
//       });

//     // 2. When room joined
//     socket.off('room-joined').on('room-joined', async ({ peerId: remotePeerId, createOffer }) => {
//       peerId = remotePeerId;

//       if (!localStreamRef.current) {
//         console.warn("Local stream is not ready yet.");
//         return;
//       }

//       peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

//       // Add local tracks
//       localStreamRef.current.getTracks().forEach(track => {
//         peerConnectionRef.current.addTrack(track, localStreamRef.current);
//       });

//       // Handle remote stream
//       peerConnectionRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       // ICE candidates
//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit('signal', {
//             to: peerId,
//             data: { candidate: event.candidate }
//           });
//         }
//       };

//       // Create offer if flagged
//       if (createOffer) {
//         const offer = await peerConnectionRef.current.createOffer();
//         await peerConnectionRef.current.setLocalDescription(offer);
//         socket.emit('signal', {
//           to: peerId,
//           data: { sdp: offer }
//         });
//       }
//     });

//     // 3. Handle signal
//     socket.off('signal').on('signal', async ({ from, data }) => {
//       const pc = peerConnectionRef.current;
//       if (!pc) return;

//       if (data.sdp) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
//         if (data.sdp.type === 'offer') {
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit('signal', {
//             to: from,
//             data: { sdp: answer }
//           });
//         }
//       }

//       if (data.candidate) {
//         try {
//           await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//         } catch (err) {
//           console.error("Error adding received ice candidate", err);
//         }
//       }
//     });

//     // 4. Handle disconnection
//     socket.off('peer-disconnected').on('peer-disconnected', () => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }
//       if (peerConnectionRef.current) {
//         peerConnectionRef.current.close();
//         peerConnectionRef.current = null;
//       }
//     });

//     // 5. Cleanup
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



// /server/index.js
// /client/src/VideoChat.js
// import React, { useEffect, useRef,useState } from 'react';
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

//       fetch('http://192.168.43.76:5000/ping')
//       .then(res => res.text())
//       .then(data => {
//         console.log('this is the data', data);
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

//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         localStreamRef.current = stream;
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }
//         socket.emit('join'); // Important: emit 'join'
//       })
//       .catch((err) => {
//         console.error('Error accessing media devices:', err);
//       });

//     socket.off('room-joined').on('room-joined', async ({ peerId: remotePeerId, createOffer }) => {
//       peerId = remotePeerId;

//       if (!localStreamRef.current) return;

//       peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

//       localStreamRef.current.getTracks().forEach(track => {
//         peerConnectionRef.current.addTrack(track, localStreamRef.current);
//       });

//       peerConnectionRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit('signal', {
//             to: peerId,
//             data: { candidate: event.candidate }
//           });
//         }
//       };

//       if (createOffer) {
//         const offer = await peerConnectionRef.current.createOffer();
//         await peerConnectionRef.current.setLocalDescription(offer);
//         socket.emit('signal', {
//           to: peerId,
//           data: { sdp: offer }
//         });
//       }
//     });

//     socket.off('signal').on('signal', async ({ from, data }) => {
//       const pc = peerConnectionRef.current;
//       if (!pc) return;

//       if (data.sdp) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
//         if (data.sdp.type === 'offer') {
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit('signal', {
//             to: from,
//             data: { sdp: answer }
//           });
//         }
//       }

//       if (data.candidate) {
//         try {
//           await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//         } catch (err) {
//           console.error("Error adding received ice candidate", err);
//         }
//       }
//     });

//     socket.off('peer-disconnected').on('peer-disconnected', () => {
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
