import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatStreaming.css';
import { getFileIcon, Icon } from '../assets/utils';

const ChatStreaming = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const hasInitialized = useRef(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const sessionData = JSON.parse(sessionStorage.getItem("studentSession") || "{}");
    const { name, rollNo } = sessionData;
    const getToken = () => sessionStorage.getItem("authToken");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!rollNo) return;
        fetch(`${API_BASE_URL}/api/chat/${rollNo}/chat-history`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.length === 0 && !hasInitialized.current) {
                    hasInitialized.current = true;
                    askQuestion(`Hi! my name is ${name} and my roll number is ${rollNo}!`);
                } else {
                    setMessages(data);
                    hasInitialized.current = true;
                }
            })
            .catch(err => console.error("Failed to load history:", err));
    }, [API_BASE_URL, name, rollNo]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setPendingFile(e.target.files[0]);
    };

    const removePendingFile = () => {
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        try {
            return new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return timestamp; }
    };

    const askQuestion = async (overridePrompt = null) => {
        const textToUse = (typeof overridePrompt === 'string') ? overridePrompt : inputValue;
        if ((!textToUse.trim() && !pendingFile) || isStreaming) return;

        const currentTime = new Date().toISOString();
        setInputValue("");
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsStreaming(true);

        setMessages(prev => [
            ...prev,
            { type: 'USER', content: textToUse, timestamp: currentTime },
            { type: 'ASSISTANT', content: '', timestamp: currentTime }
        ]);

        try {
            if (pendingFile) {
                const formData = new FormData();
                formData.append("file", pendingFile);
                await fetch(`${API_BASE_URL}/api/chat/upload?rollNumber=${rollNo}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body: formData
                });
            }

            const response = await fetch(`${API_BASE_URL}/api/chat/${rollNo}/stream-chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: textToUse })
            });

            if (!response.ok) throw new Error("Streaming failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const dataStr = line.replace('data:', '').trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.text) {
                                setMessages(prev => {
                                    const newArray = [...prev];
                                    const lastMsg = newArray[newArray.length - 1];
                                    if (!lastMsg.content.endsWith(parsed.text)) {
                                        lastMsg.content += parsed.text;
                                    }
                                    return newArray;
                                });
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (error) {
            setMessages(prev => [...prev.slice(0, -1), { type: 'ERROR', content: "Connection Error." }]);
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div key={index} className={`message message-${msg.type}`}>
                        <div className="message-header">{formatTime(msg.timestamp)}</div>
                        <div className="message-content">
                            {msg.type === 'USER' ? (
                                msg.content
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
                {pendingFile && (
                    <div className="pending-file-preview">
                        <span className="file-icon-wrapper">{getFileIcon(pendingFile.name)}</span>
                        <span className="pending-file-name">{pendingFile.name}</span>
                        <button className="remove-file-btn" onClick={removePendingFile}>✕</button>
                    </div>
                )}
                <div className="chat-input-area">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.docx,.txt"
                    />
                    <button className="attach-button" onClick={() => fileInputRef.current?.click()} disabled={isStreaming}>
                        <Icon name="paperclip" size={20} />
                    </button>
                    <textarea
                        className="chat-input"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                askQuestion();
                            }
                        }}
                        placeholder="Ask anything!"
                        disabled={isStreaming}
                    />
                    <button className="chat-button" onClick={askQuestion} disabled={isStreaming}>
                        <Icon name="send" size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatStreaming;