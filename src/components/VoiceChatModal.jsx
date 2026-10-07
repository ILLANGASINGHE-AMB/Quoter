import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, PhoneForwarded } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { sendVoiceWaitingPing } from '../voiceStatus';

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
  const statusChannelRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

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
    
    pendingCandidatesRef.current = [];
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
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
    console.log('[Voice] Initializing WebRTC, isInitiator:', isInitiator, 'targetPeerId:', targetPeerId);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
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
      console.log('[Voice] Remote track received:', event);
      if (audioRef.current) {
        if (event.streams && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0];
        } else {
          const inboundStream = new MediaStream();
          inboundStream.addTrack(event.track);
          audioRef.current.srcObject = inboundStream;
        }
        audioRef.current.play().catch(e => console.warn('[Voice] autoPlay audio error:', e));
        setStatus('connected');
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[Voice] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        handleHangup();
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
      console.log('[Voice] ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setStatus('connected');
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
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
      setStatus('requesting_mic');
      // Get mic permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setStatus('searching');

      // Setup Supabase Channel for matchmaking and signaling
      const channel = supabase.channel('voice-matchmaking', {
        config: {
          broadcast: { self: false }
        }
      });
      channelRef.current = channel;

      let isMatched = false;

      const flushCandidates = async (pc) => {
        const queued = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const c of queued) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn('[voice] addIceCandidate failed', e); }
        }
      };

      channel
        .on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
          if (!payload) return;
          // Ignore signals not meant for us
          if (payload.target !== peerId && payload.target !== 'all') return;
          if (isMatched && payload.target === 'all') return;

          const { sender, signal } = payload;
          const pc = peerConnectionRef.current;

          if (signal.type === 'ping') {
            console.log('[Voice] Received ping from:', sender);
            // Received a ping from someone!
            if (peerId < sender && !isMatched) {
              isMatched = true;
              if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
              }
              setRemotePeerId(sender);
              setStatus('connecting');
              initializeWebRTC(true, sender);
            }
          } else if (signal.type === 'offer') {
            console.log('[Voice] Received offer from:', sender);
            isMatched = true;
            if (pingIntervalRef.current) {
              clearInterval(pingIntervalRef.current);
              pingIntervalRef.current = null;
            }
            setRemotePeerId(sender);
            setStatus('connecting');
            
            const newPc = await initializeWebRTC(false, sender);
            await newPc.setRemoteDescription(new RTCSessionDescription(signal));
            await flushCandidates(newPc);
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
          } else if (signal.type === 'answer' && pc) {
            console.log('[Voice] Received answer from:', sender);
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            await flushCandidates(pc);
          } else if (signal.type === 'candidate') {
            const cur = peerConnectionRef.current;
            if (cur && cur.remoteDescription) {
              try { await cur.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch (e) { console.warn('[voice] addIceCandidate failed', e); }
            } else {
              pendingCandidatesRef.current.push(signal.candidate);
            }
          }
        })
        .subscribe(async (subStatus) => {
          console.log('[Voice] Channel subscription status:', subStatus);
          if (subStatus === 'SUBSCRIBED') {
            const sendPing = () => {
              if (!isMatched) {
                channel.send({
                  type: 'broadcast',
                  event: 'webrtc-signal',
                  payload: { target: 'all', sender: peerId, signal: { type: 'ping' } }
                });
                sendVoiceWaitingPing();
              }
            };

            // Send immediately upon subscription
            sendPing();

            // And keep advertising every 1.5 seconds
            pingIntervalRef.current = setInterval(sendPing, 1500);
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
          <div className="text-sm text-[#665345] mb-6 text-center px-2 min-h-[44px] flex flex-col items-center justify-center">
            {status === 'idle' && (
              <span>අහඹු ලෙස සම්බන්ධ වී කතා කරන්න (Talk anonymously)</span>
            )}
            {status === 'requesting_mic' && (
              <span>මයික්‍රොෆෝනයට අවසර දෙන්න... (Allow mic in browser...)</span>
            )}
            {status === 'searching' && (
              <>
                <span className="font-medium text-[#b24c32]">මයික්‍රෆෝනය සූදානම්! සම්බන්ධ වීමට කෙනෙකු සොයමින්...</span>
                <span className="text-xs text-[#8c7362] mt-1">Mic active. Waiting for another person to click call...</span>
              </>
            )}
            {status === 'connecting' && (
              <span className="font-medium text-[#2a2421]">සම්බන්ධ වෙමින් පවතී... (Connecting...)</span>
            )}
            {status === 'connected' && (
              <span className="font-semibold text-green-700">සම්බන්ධ විය! කතා කරන්න (Connected!)</span>
            )}
          </div>

          <div className="w-24 h-24 rounded-full bg-[#f5eedf] border-2 border-[#b24c32]/30 flex items-center justify-center mb-6 relative">
            {(status === 'searching' || status === 'requesting_mic') && (
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

          {status === 'searching' && (
            <div className="bg-[#f5eedf]/70 border border-[#b24c32]/20 rounded-lg p-2.5 mb-6 text-[11px] text-[#665345] text-center leading-relaxed">
              💡 <strong>අත්හදා බැලීමට (To test):</strong> වෙනත් Tab එකකින් හෝ Phone එකකින් මෙම වෙබ් අඩවිය විවෘත කර ඇමතුමක් ආරම්භ කරන්න.
            </div>
          )}

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

      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}
