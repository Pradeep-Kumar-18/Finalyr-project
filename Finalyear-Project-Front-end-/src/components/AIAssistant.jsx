import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, User, Bot } from 'lucide-react';
import '../styles/AIAssistant.css';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your Synapse Assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulated Bot Responses
    setTimeout(() => {
      const lowerInput = userMsg.text.toLowerCase();
      let botResponse = "I'm still learning! You can ask me about hemoglobin levels, anemia symptoms, or iron-rich foods.";

      if (lowerInput.includes('hemo') || lowerInput.includes('hb')) {
        botResponse = "Hemoglobin (Hb) is the protein in red blood cells that carries oxygen. Normal levels for men are 13.5-17.5 g/dL and for women 12.0-15.5 g/dL.";
      } else if (lowerInput.includes('anemic') || lowerInput.includes('anemia')) {
        botResponse = "Anemia occurs when you don't have enough healthy red blood cells. Common symptoms include fatigue, weakness, and pale skin.";
      } else if (lowerInput.includes('food') || lowerInput.includes('diet') || lowerInput.includes('eat')) {
        botResponse = "To boost iron, try eating more spinach, red meat, pomegranates, and lentils. Check our 'Nutrition Advisor' tab for more details!";
      } else if (lowerInput.includes('accuracy') || lowerInput.includes('safe')) {
        botResponse = "HemoVision AI uses a ResNet-50 CNN model with 99.4% accuracy. It is perfectly safe as it is 100% non-invasive.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className={`ai-assistant-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Floating Bubble */}
      <button className="assistant-bubble" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <div className="bubble-ping"></div>}
      </button>

      {/* Chat Window */}
      <div className="chat-window glass-panel-ai">
        <div className="chat-header">
          <div className="bot-status">
            <div className="status-dot"></div>
            <Sparkles size={16} className="sparkle-icon" />
            <span>Synapse Assistant</span>
          </div>
          <button className="close-chat" onClick={() => setIsOpen(false)}><X size={18} /></button>
        </div>

        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message-row bot">
              <div className="message-avatar"><Bot size={14} /></div>
              <div className="message-bubble typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder="Ask me anything..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
