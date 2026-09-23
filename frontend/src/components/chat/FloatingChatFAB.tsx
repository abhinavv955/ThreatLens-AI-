import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';
import { chatService } from '../../services/chatService';

export const FloatingChatFAB: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'fab_init',
      sender: 'bot',
      text: `Hi ${user.name} — need a quick nutrition check-in?`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const fabBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fabBodyRef.current) {
      fabBodyRef.current.scrollTop = fabBodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;

    const userMsg: ChatMessage = {
      id: 'fab_u_' + Date.now(),
      sender: 'user',
      text: val,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    const reply = await chatService.sendMessage(val);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'fab_b_' + Date.now(),
          sender: 'bot',
          text: reply,
        },
      ]);
    }, 400);
  };

  return (
    <>
      <button
        className="fab"
        id="fabBtn"
        aria-label="Open chat"
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </button>

      <div className={`fab-popup ${isOpen ? 'open' : ''}`} id="fabPopup">
        <div className="fhead">
          <span>NutriTrack AI</span>
          <button className="x" id="fabClose" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <div className="fbody" id="fabBody" ref={fabBodyRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.sender}`}
              style={{
                background: m.sender === 'bot' ? '#f1f3f5' : 'var(--ink)',
                color: m.sender === 'bot' ? 'inherit' : '#fff',
                alignSelf: m.sender === 'bot' ? 'flex-start' : 'flex-end',
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form className="frow" id="fabForm" onSubmit={handleSend}>
          <input
            type="text"
            id="fabInput"
            placeholder="Type a message..."
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit">➤</button>
        </form>
      </div>
    </>
  );
};
