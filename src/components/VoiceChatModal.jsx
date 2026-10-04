import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, PhoneForwarded } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Helper to generate a random peer ID
const generatePeerId = () => Math.random().toString(36).substring(2, 15);

export default function VoiceChatModal({ isOpen, onClose }) {
  const [status, setStatus] = useState('idle'); // idle, searching, connecting, connected
  const [isMuted, setIsMuted] = useState(false);
  const [peerId] = useState(generatePeerId());
  const [remotePeerId, setRemotePeerId] = useState(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const audioRef = useRef(null);
  const channelRef = useRef(null);

  // Stop everything and reset state
  const handleHangup = () => {
    setStatus('idle');
    setRemotePeerId(null);
    setIsMuted(false);
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const handleClose = () => {
    handleHangup();
    onClose();
  };

  // Toggle microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStreamRef.current.getAudioTracks()[0].enabled);
    }
  };

  const initializeWebRTC = async (isInitiator, targetPeerId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      if (audioRef.current && event.streams[0]) {
        audioRef.current.srcObject = event.streams[0];
        setStatus('connected');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            target: targetPeerId,
            sender: peerId,
            signal: { type: 'candidate', candidate: event.candidate }
          }
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        handleHangup();
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: {
          target: targetPeerId,
          sender: peerId,
          signal: offer
        }
      });
    }

    return pc;
  };

  const startSearch = async () => {
    try {
      setStatus('searching');
      // Get mic permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Setup Supabase Channel for matchmaking and signaling
      const channel = supabase.channel('voice-matchmaking', {
        config: {
          presence: { key: peerId },
          broadcast: { self: false }
        }
      });
      channelRef.current = channel;

      let isMatched = false;

      channel
        .on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
          // Ignore signals not meant for us
          if (payload.target !== peerId) return;

          const { sender, signal } = payload;
          const pc = peerConnectionRef.current;

          if (signal.type === 'offer') {
            isMatched = true;
            setRemotePeerId(sender);
            setStatus('connecting');
            
            const newPc = await initializeWebRTC(false, sender);
            await newPc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await newPc.createAnswer();
            await newPc.setLocalDescription(answer);
            
            channel.send({
              type: 'broadcast',
              event: 'webrtc-signal',
              payload: {
                target: sender,
                sender: peerId,
                signal: answer
              }
            });
            // Stop advertising presence since we are matched
            channel.untrack();
          } else if (signal.type === 'answer' && pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.type === 'candidate' && pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        })
        .on('presence', { event: 'sync' }, () => {
          if (isMatched) return;

          const state = channel.presenceState();
          const peers = Object.keys(state).filter(id => id !== peerId);
          
          if (peers.length > 0) {
            // Found someone! We will initiate if our ID is lexically smaller to avoid glare
            const target = peers[0];
            if (peerId < target && !isMatched) {
              isMatched = true;
              setRemotePeerId(target);
              setStatus('connecting');
              initializeWebRTC(true, target);
              channel.untrack(); // Leave matchmaking pool
            }
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ ready: true });
          }
        });

    } catch (err) {
      console.error("Error accessing mic or setting up room:", err);
      setStatus('idle');
      alert("මයික්‍රෆෝනය වෙත ප්‍රවේශ වීමට නොහැකි විය. (Microphone access denied)");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF6EE] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[#3c332f] relative">
        <div className="p-6 flex flex-col items-center">
          
          <h2 className="text-2xl font-serif font-bold text-[#2a2421] mb-2">
            නිර්නාම ඇමතුම්
          </h2>
          <p className="text-sm text-[#665345] mb-8 text-center px-4">
            {status === 'idle' && 'අහඹු ලෙස සම්බන්ධ වී කතා කරන්න (Talk anonymously)'}
            {status === 'searching' && 'මයික්‍රෆෝනයට අවසර දෙන්න... (Allow mic / Searching...)'}
            {status === 'connecting' && 'සම්බන්ධ වෙමින්...'}
            {status === 'connected' && 'සම්බන්ධ විය! (Connected!)'}
          </p>

          <div className="w-24 h-24 rounded-full bg-[#f5eedf] border-2 border-[#b24c32]/30 flex items-center justify-center mb-8 relative">
            {status === 'searching' && (
              <div className="absolute inset-0 rounded-full border-2 border-[#b24c32] animate-ping opacity-75" />
            )}
            {status === 'connected' ? (
              <div className="w-full h-full rounded-full bg-green-100 flex items-center justify-center">
                <Mic className="w-10 h-10 text-green-600 animate-pulse" />
              </div>
            ) : status === 'idle' ? (
              <PhoneForwarded className="w-10 h-10 text-[#665345]" />
            ) : (
              <Loader2 className="w-10 h-10 text-[#b24c32] animate-spin" />
            )}
          </div>

          <div className="flex gap-4">
            {status === 'idle' ? (
              <button
                onClick={startSearch}
                className="bg-[#b24c32] text-white px-6 py-3 rounded-full font-medium hover:bg-[#963b23] transition-colors shadow-[2px_2px_0px_#2a2421] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2a2421] flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span>ඇමතුමක් ආරම්භ කරන්න</span>
              </button>
            ) : (
              <>
                {status === 'connected' && (
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-colors shadow-[2px_2px_0px_#2a2421] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2a2421] ${
                      isMuted ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-[#2a2421] hover:bg-gray-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                )}
                <button
                  onClick={handleHangup}
                  className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors shadow-[2px_2px_0px_#2a2421] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2a2421]"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <audio ref={audioRef} autoPlay />
    </div>
  );
}
