import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';
import { chatService } from '../../services/chatService';

export const AskAISection: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'bot',
      text: "I'm here to connect the dots between what you eat and what you want to feel.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const replyText = await chatService.sendMessage(trimmed);
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: replyText,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <section id="ask-ai">
      <div className="wrap">
        <div className="ask-grid">
          <div className="ask-left">
            <div className="bubble-ic">💬</div>
            <div className="eyebrow light">
              <span className="dot" style={{ background: '#fff' }}></span>04 · YOUR ALWAYS-ON COACH
            </div>
            <h2>Ask NutriTrack AI anything.</h2>
            <p>
              Not another chatbot. A calm, context-aware coach that remembers
              the goal behind the meal.
            </p>
          </div>

          <div className="ask-right">
            <div className="chat-head">
              <div className="who">
                <div className="avatar">🤖</div>
                <div>
                  <div className="name">NutriTrack AI</div>
                  <div className="status">
                    <span className="dt"></span>Online · personalized to {user.name}
                  </div>
                </div>
              </div>
              <span className="demo-pill">DEMO COACH</span>
            </div>

            <div className="chat-body" id="chatBody" ref={chatBodyRef}>
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.sender}`}>
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div className="msg bot" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                  Thinking...
                </div>
              )}
            </div>

            <div className="quick-prompts">
              <button onClick={() => handleSend('What should I eat for dinner?')}>
                What should I eat for dinner?
              </button>
              <button onClick={() => handleSend('Am I meeting my calorie goal today?')}>
                Am I meeting my calorie goal today?
              </button>
              <button onClick={() => handleSend('Suggest a high-protein vegetarian meal.')}>
                Suggest a high-protein vegetarian meal.
              </button>
            </div>

            <form
              className="chat-input-row"
              id="chatForm"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
            >
              <input
                type="text"
                id="chatInput"
                placeholder="Ask about your nutrition..."
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="send-btn" aria-label="Send">
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
