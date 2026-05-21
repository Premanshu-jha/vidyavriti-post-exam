import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatStreaming.css'; 

const ChatStreaming = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    // 1. Fetch History ONCE on page load
    useEffect(() => {
        fetch('/chat/1/chat-history')
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(err => console.error("Failed to load history:", err));
    }, []);

    const askQuestion = () => {
        if (!inputValue.trim() || isStreaming) return;

        const userPrompt = inputValue;
        setInputValue(""); // Clear input box instantly
        setIsStreaming(true);

        // 2. THE EFFICIENT WAY: Instantly update React state!
        // We push the User's message, AND an empty Assistant placeholder.
        setMessages(prev => [
            ...prev,
            { type: 'USER', content: userPrompt },
            { type: 'ASSISTANT', content: '' } // This is what we will stream into!
        ]);

        const url = `/chat/claude/1/stream-chat?q=${encodeURIComponent(userPrompt)}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            const formattedChunk = event.data.replace(/\\n/g, '\n');
            
            // 3. Append chunks to the LAST element in the messages array
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
            {/* The Chat History Window */}
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div key={index} className={`message message-${msg.type}`}>
                        {/* If it's the user, just show text. If AI/System, parse Markdown */}
                        {msg.type === 'USER' ? (
                            msg.content
                        ) : (
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        )}
                    </div>
                ))}
            </div>

            {/* The Input Area */}
            <div className="chat-input-area">
                <input 
                    type="text" 
                    className="chat-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                    placeholder="Ask about a student or exam..."
                    disabled={isStreaming}
                />
                <button 
                    className="chat-button" 
                    onClick={askQuestion} 
                    disabled={isStreaming}
                >
                    {isStreaming ? "Typing..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default ChatStreaming;