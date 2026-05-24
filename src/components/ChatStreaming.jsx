import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatStreaming.css';
import remarkGfm from 'remark-gfm';

const ChatStreaming = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetch('/api/chat/1/chat-history')
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(err => console.error("Failed to load history:", err));
    }, []);

    const formatTime = (timestamp) => {
        if (!timestamp) return "Unknown Time";
        try {
            const date = new Date(timestamp);
            if (isNaN(date)) return timestamp;

            // toLocaleString keeps the date!
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp;
        }
    };

    const askQuestion = () => {
        if (!inputValue.trim() || isStreaming) return;

        const userPrompt = inputValue;
        const currentTime = new Date().toISOString();

        setInputValue("");
        setIsStreaming(true);

        setMessages(prev => [
            ...prev,
            { type: 'USER', content: userPrompt, timestamp: currentTime },
            { type: 'ASSISTANT', content: '', timestamp: currentTime }
        ]);

        const url = `/chat/claude/1/stream-chat?q=${encodeURIComponent(userPrompt)}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            const formattedChunk = event.data.replace(/\\n/g, '\n');

            setMessages(prev => {
                const newArray = [...prev];
                const lastIndex = newArray.length - 1;

                newArray[lastIndex] = {
                    ...newArray[lastIndex],
                    content: newArray[lastIndex].content + formattedChunk
                };
                return newArray;
            });
        };

        eventSource.onerror = () => {
            eventSource.close();
            setIsStreaming(false);
        };
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div key={index} className={`message message-${msg.type}`}>

                        <div className="message-header">
                            {formatTime(msg.timestamp)}
                        </div>

                        <div className="message-content">
                            {msg.type === 'USER' ? (
                                msg.content || msg.text || msg.prompt || "⚠️ No content found. Check backend key!"
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            )}
                        </div>

                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <textarea
                    className="chat-input"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                        // Send on Enter, but allow Shift+Enter for new lines
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault(); // Prevents the enter key from typing a new line
                            askQuestion();
                            // Reset height back to default after sending
                            e.target.style.height = 'auto';
                        }
                    }}
                    placeholder="Ask anything!"
                    disabled={isStreaming}
                    rows="1"
                />
                <button
                    className="chat-button"
                    onClick={() => {
                        askQuestion();
                        document.querySelector('.chat-input').style.height = 'auto';
                    }}
                    disabled={isStreaming}
                >
                    {isStreaming ? "Typing..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default ChatStreaming;