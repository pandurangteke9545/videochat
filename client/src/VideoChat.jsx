import React, { useEffect, useRef } from 'react';
import socket from './socket';

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    let peerId = null;

    // 1. Get media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        socket.emit('join');
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
      });

    // 2. When room joined
    socket.off('room-joined').on('room-joined', async ({ peerId: remotePeerId, createOffer }) => {
      peerId = remotePeerId;

      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      // ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('signal', {
            to: peerId,
            data: { candidate: event.candidate }
          });
        }
      };

      // Create offer if flagged
      if (createOffer) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('signal', {
          to: peerId,
          data: { sdp: offer }
        });
      }
    });

    // 3. Handle signal
    socket.off('signal').on('signal', async ({ from, data }) => {
      const pc = peerConnectionRef.current;

      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', {
            to: from,
            data: { sdp: answer }
          });
        }
      }

      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    // 4. Handle disconnection
    socket.off('peer-disconnected').on('peer-disconnected', () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    // 5. Cleanup
    return () => {
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="video-container">
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
