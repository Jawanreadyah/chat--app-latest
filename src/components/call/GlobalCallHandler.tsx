import React, { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { VoiceCall } from '../VoiceCall';
import { useNavigate } from 'react-router-dom';

export function GlobalCallHandler() {
  const { currentUser, incomingCall, checkForIncomingCalls, setIncomingCall } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Check for incoming calls immediately
    checkForIncomingCalls();

    // Set up interval to check for incoming calls
    const interval = setInterval(() => {
      checkForIncomingCalls();
    }, 3000);

    return () => {
      clearInterval(interval);
      // Clear any incoming call state when component unmounts
      setIncomingCall(null);
    };
  }, [currentUser, checkForIncomingCalls, setIncomingCall]);

  // Handle call close
  const handleCallClose = () => {
    setIncomingCall(null);
    // Navigate to the chat if we have a chatId
    if (incomingCall?.chatId) {
      navigate(`/chat/${incomingCall.chatId}`);
    }
  };

  if (!incomingCall || !currentUser) return null;

  return (
    <VoiceCall
      chatId={incomingCall.chatId}
      recipientUsername={incomingCall.from}
      currentUsername={currentUser.username}
      onClose={handleCallClose}
      isIncoming={true}
      isVideo={incomingCall.isVideo}
    />
  );
}