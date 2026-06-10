import React, { useState, useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatStreaming.css';

// Import your new utility!
import { getFileIcon } from '../assets/utils'; 

const ChatStreaming = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const sessionData = JSON.parse(sessionStorage.getItem("studentSession") || "{}");
    const { name, role, rollNo } = sessionData;

    const getToken = () => sessionStorage.getItem("authToken");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetch(`/api/chat/${rollNo}/chat-history`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.length === 0 && role === 'STUDENT') {
                    const introMessage = `Hi! my name is ${name} and my roll number is ${rollNo}!`;
                    askQuestion(introMessage);
                }

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
    }, [name, role, rollNo]);

    const formatTime = (timestamp) => {
        if (!timestamp) return "Unknown Time";
        try {
            const date = new Date(timestamp);
            if (isNaN(date)) return timestamp;
            return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    const askQuestion = async (overridePrompt = null) => {
        const isEvent = overridePrompt && typeof overridePrompt === 'object' && overridePrompt.type;
        const textToUse = (!isEvent && overridePrompt) ? overridePrompt : inputValue;

        if ((!textToUse.trim() && !pendingFile) || isStreaming) return;

        const userPrompt = pendingFile
            ? `[Attached: ${pendingFile.name} | Size: ${pendingFile.size}]\n\n${textToUse}`
            : textToUse;

        const fileToUpload = pendingFile;
        const currentTime = new Date().toISOString();
        const cleanInputForUI = textToUse;

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

                const uploadResponse = await fetch(`/api/chat/upload?rollNumber=${rollNo}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body: formData
                });

                if (!uploadResponse.ok) throw new Error("Document ingestion failed");
            }

            await fetchEventSource(`/api/chat/${rollNo}/stream-chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: userPrompt }),

                onmessage(event) {
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
                },
                onerror(err) {
                    console.error("Stream error:", err);
                    setIsStreaming(false);
                    throw err; 
                },
                onclose() {
                    setIsStreaming(false);
                }
            });

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
                                    {/* Using Dynamic SVG Icon */}
                                    <span className="file-icon-wrapper">{getFileIcon(msg.file.name)}</span>
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
                        {/* Using Dynamic SVG Icon */}
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
                    <button
                        className="attach-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming}
                        title="Attach File"
                    >
                        {/* Premium SVG Paperclip */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
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
                        {isStreaming ? "..." : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatStreaming;