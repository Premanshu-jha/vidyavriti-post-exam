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
                    const processedHistory = data.map(msg => {
                        if (msg.type === 'USER' && msg.content) {
                            const matchWithSize = msg.content.match(/^\[Attached: (.*?) \| Size: (\d+)\]\n\n/);
                            if (matchWithSize) {
                                return {
                                    ...msg,
                                    content: msg.content.replace(matchWithSize[0], ''),
                                    file: { name: matchWithSize[1], size: parseInt(matchWithSize[2], 10) }
                                };
                            }
                        }
                        return msg;
                    });
                    setMessages(processedHistory);
                    hasInitialized.current = true;
                }
            })
            .catch(err => console.error("Failed to load history:", err));
    }, [API_BASE_URL, name, rollNo]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPendingFile(e.target.files[0]);
        }
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
        const textToUse = overridePrompt || inputValue;
        if ((!textToUse.trim() && !pendingFile) || isStreaming) return;

        const userPrompt = pendingFile
            ? `[Attached: ${pendingFile.name} | Size: ${pendingFile.size}]\n\n${textToUse}`
            : textToUse;

        const fileToUpload = pendingFile;
        const currentTime = new Date().toISOString();

        setInputValue("");
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsStreaming(true);

        setMessages(prev => [
            ...prev,
            { type: 'USER', content: textToUse, timestamp: currentTime, file: fileToUpload ? { name: fileToUpload.name, size: fileToUpload.size } : null },
            { type: 'ASSISTANT', content: '', timestamp: currentTime }
        ]);

        try {
            if (fileToUpload) {
                const formData = new FormData();
                formData.append("file", fileToUpload);
                await fetch(`${API_BASE_URL}/api/chat/upload?rollNumber=${rollNo}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body: formData
                });
            }

            const response = await fetch(`${API_BASE_URL}/api/chat/${rollNo}/stream-chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userPrompt })
            });

            if (!response.ok) throw new Error("Streaming failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                chunk.split('\n\n').forEach(event => {
                    if (event.startsWith('data:')) {
                        const dataStr = event.replace('data:', '').trim();
                        if (dataStr === '[DONE]') return;
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.text) {
                                setMessages(prev => {
                                    const newArray = [...prev];
                                    newArray[newArray.length - 1].content += parsed.text;
                                    return newArray;
                                });
                            }
                        } catch (e) {}
                    }
                });
            }
        } catch (error) {
            console.error("Pipeline Error:", error);
            setMessages(prev => {
                const newArray = [...prev];
                newArray[newArray.length - 1] = { 
                    ...newArray[newArray.length - 1], 
                    type: 'ERROR', 
                    content: "Connection Error: Please try again." 
                };
                return newArray;
            });
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
                            {msg.file && (
                                <div className="message-file-attachment">
                                    <span className="file-icon-wrapper">{getFileIcon(msg.file.name)}</span>
                                    <div className="file-info">
                                        <div className="file-name">{msg.file.name}</div>
                                        <div className="file-size">{(msg.file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                            )}
                            {msg.type === 'USER' ? (msg.content || "Uploaded document.") : (
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
                        <span>{pendingFile.name}</span>
                        <button onClick={removePendingFile}>✕</button>
                    </div>
                )}
                <div className="chat-input-area">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isStreaming}><Icon name="paperclip" size={20} /></button>
                    <textarea 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
                        placeholder="Ask anything!"
                        disabled={isStreaming}
                    />
                    <button onClick={askQuestion} disabled={isStreaming}><Icon name="send" size={18} /></button>
                </div>
            </div>
        </div>
    );
};

export default ChatStreaming;