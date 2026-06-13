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
                
                if (data.length === 0) {
                    if (!hasInitialized.current) {
                        hasInitialized.current = true;
                        const introMessage = `Hi! my name is ${name} and my roll number is ${rollNo}!`;
                        askQuestion(introMessage);
                    }
                } else {
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
                    hasInitialized.current = true; 
                }
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

            const response = await fetch(`/api/chat/${rollNo}/stream-chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: userPrompt })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let isStreamFinished = false; // NEW: Explicit break flag

            while (true) {
                const { value, done: streamDone } = await reader.read();
                
                if (streamDone || isStreamFinished) {
                    break; 
                }
                
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');
                    buffer = events.pop();

                    for (let event of events) {
                        const lines = event.split('\n');
                        for (let line of lines) {
                            if (line.startsWith('data:')) {
                                const dataStr = line.replace(/^data:\s*/, '').trim();
                                
                                // THE FIX: If the server sends the DONE flag, mark it and break out
                                if (dataStr === '[DONE]') {
                                    isStreamFinished = true;
                                    break; 
                                }
                                
                                if (dataStr === '') continue;

                                let formattedChunk = "";
                                
                                try {
                                    const parsed = JSON.parse(dataStr);
                                    if (parsed && typeof parsed.text === 'string') {
                                        formattedChunk = parsed.text;
                                    }
                                } catch (e) {
                                    formattedChunk = dataStr.replace(/\\n/g, '\n');
                                }

                                if (formattedChunk) {
                                    setMessages(prev => {
                                        const newArray = [...prev];
                                        const lastIndex = newArray.length - 1;
                                        newArray[lastIndex] = {
                                            ...newArray[lastIndex],
                                            content: newArray[lastIndex].content + formattedChunk
                                        };
                                        return newArray;
                                    });
                                }
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error("Error in upload/stream pipeline:", error);
            setMessages(prev => {
                const newArray = [...prev];
                const lastIndex = newArray.length - 1;
                newArray[lastIndex] = {
                    ...newArray[lastIndex],
                    type: 'ERROR',
                    content: `**Connection Error:** ${error.message || "Something went wrong. Please try again."}`
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
                        <div className="message-header">
                            {formatTime(msg.timestamp)}
                        </div>
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
                            <Icon name="send" size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatStreaming;