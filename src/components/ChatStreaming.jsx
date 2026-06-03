import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatStreaming.css';
import remarkGfm from 'remark-gfm';

const ChatStreaming = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    
    const [pendingFile, setPendingFile] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetch('/api/chat/1/chat-history')
            .then(res => res.json())
            .then(data => {
                const processedHistory = data.map(msg => {
                    if (msg.type === 'USER' && msg.content) {
                        
                        const matchWithSize = msg.content.match(/^\[Attached: (.*?) \| Size: (\d+)\]\n\n/);
                        
                        const matchOld = msg.content.match(/^\[Attached: (.*?)\]\n\n/);
                        
                        if (matchWithSize) {
                            return {
                                ...msg,
                                content: msg.content.replace(matchWithSize[0], ''),
                                file: { name: matchWithSize[1], size: parseInt(matchWithSize[2], 10) } 
                            };
                        } else if (matchOld) {
                            return {
                                ...msg,
                                content: msg.content.replace(matchOld[0], ''),
                                file: { name: matchOld[1], size: null } 
                            };
                        }
                    }
                    return msg;
                });
                
                setMessages(processedHistory);
            })
            .catch(err => console.error("Failed to load history:", err));
    }, []);

    const formatTime = (timestamp) => {
        if (!timestamp) return "Unknown Time";
        try {
            const date = new Date(timestamp);
            if (isNaN(date)) return timestamp;
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPendingFile(e.target.files[0]);
        }
    };

    const removePendingFile = () => {
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const askQuestion = async () => {
        if ((!inputValue.trim() && !pendingFile) || isStreaming) return;

        const userPrompt = pendingFile 
            ? `[Attached: ${pendingFile.name} | Size: ${pendingFile.size}]\n\n${inputValue}` 
            : inputValue;

        const fileToUpload = pendingFile;
        const currentTime = new Date().toISOString();

        const cleanInputForUI = inputValue; 

        setInputValue("");
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsStreaming(true);

        setMessages(prev => [
            ...prev,
            { 
                type: 'USER', 
                content: cleanInputForUI, 
                timestamp: currentTime,
                file: fileToUpload ? { name: fileToUpload.name, size: fileToUpload.size } : null 
            },
            { type: 'ASSISTANT', content: '', timestamp: currentTime }
        ]);

        try {
            if (fileToUpload) {
                const formData = new FormData();
                formData.append("file", fileToUpload);
                
                const uploadResponse = await fetch('/api/chat/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    throw new Error("Document ingestion failed");
                }

            }

            const url = `/api/chat/1/stream-chat?q=${encodeURIComponent(userPrompt)}`;
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

        } catch (error) {
           console.error("Error in upload/stream pipeline:", error);
            
            setMessages(prev => {
                const newArray = [...prev];
                const lastIndex = newArray.length - 1;
                
                newArray[lastIndex] = {
                    ...newArray[lastIndex],
                    content: `❌ **Error:** ${error.message || "Something went wrong. Please try again."}`
                };
                
                return newArray;
            });

            setIsStreaming(false);
        }
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

                            {msg.file && (
                                <div className="message-file-attachment">
                                    <span className="file-icon">📄</span>
                                    <div className="file-info">
                                        <div className="file-name">{msg.file.name}</div>
                                        <div className="file-size">{(msg.file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                            )}

                            {msg.type === 'USER' ? (
                                msg.content || "Uploaded a document."
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
                        <span className="file-icon">📄</span>
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
                    
                    <button 
                        className="attach-button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming}
                    >
                        📎
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
                                e.target.style.height = 'auto';
                            }
                        }}
                        placeholder={pendingFile ? "Ask a question about this file..." : "Ask anything!"}
                        disabled={isStreaming}
                        rows="1"
                    />
                    
                    <button
                        className="chat-button"
                        onClick={askQuestion}
                        disabled={isStreaming}
                    >
                        {isStreaming ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatStreaming;