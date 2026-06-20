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
    const uploadedFileIdRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false); 
    const [status, setStatus] = useState({ text: "", type: "" });

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const sessionData = JSON.parse(sessionStorage.getItem("studentSession") || "{}");
    const { rollNo } = sessionData;
    const getToken = () => sessionStorage.getItem("authToken");

    useEffect(() => {
        const fetchHistory = async () => {
            if (!rollNo) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/chat/${rollNo}/chat-history`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (res.ok) {
                    const history = await res.json();
                    setMessages(history);
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchHistory();
    }, [rollNo, API_BASE_URL]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (uploadedFileIdRef.current) await removePendingFile();

        setPendingFile(file);
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/chat/upload?rollNumber=${rollNo}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            if (!res.ok) throw new Error("Upload/Ingestion failed");
            const data = await res.json();
            console.log("data",data);
            uploadedFileIdRef.current = data.id;
            console.log("id",uploadedFileIdRef.current);
        } catch (err) {
            setStatus({ text: "Upload failed.", type: "error" });
            setPendingFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const removePendingFile = async () => {
        const currentId = uploadedFileIdRef.current;
        console.log("Delete triggered. ID:", currentId, "File:", pendingFile?.name);
        if (currentId && pendingFile) {
            try {
                const safeFileName = encodeURIComponent(pendingFile.name);
                await fetch(`${API_BASE_URL}/api/chat/delete/${currentId}?fileName=${safeFileName}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
            } catch (err) { console.error("Deletion failed", err); }
        }
        setPendingFile(null);
        uploadedFileIdRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getDisplayContent = (content) => {
        return content.replace(/^\[Attached: .*?\]\n\n/, '');
    };

    const askQuestion = async () => {
        if ((!inputValue.trim() && !pendingFile) || isStreaming || isUploading) return;

        const userPrompt = pendingFile ? `[Attached: ${pendingFile.name}]\n\n${inputValue}` : inputValue;
        const currentTime = new Date().toISOString();
        
        setInputValue("");
        setIsStreaming(true);

        setMessages(prev => [
            ...prev,
            { type: 'USER', content: userPrompt, timestamp: currentTime, file: pendingFile },
            { type: 'ASSISTANT', content: '', timestamp: currentTime }
        ]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/${rollNo}/stream-chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userPrompt })
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
                                    if (!lastMsg.content.endsWith(parsed.text)) lastMsg.content += parsed.text;
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
            setPendingFile(null);
            uploadedFileIdRef.current = null;
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {messages.map((msg, index) => {
                    const attachedMatch = msg.content.match(/\[Attached: (.*?)\]/);
                    const fileName = attachedMatch ? attachedMatch[1] : null;
                    return (
                    <div key={index} className={`message message-${msg.type}`}>
                        <div className="message-content">
                            {fileName && (
                                <div className="message-file-attachment">
                                    {getFileIcon(fileName)}
                                    <div className="file-info">{fileName}</div>
                                </div>
                            )}
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.type === 'USER' ? getDisplayContent(msg.content) : msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                )
})}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
                {isUploading && <div className="upload-overlay">Processing & Ingesting file...</div>}
                {pendingFile && (
                    <div className="pending-file-preview">
                        {getFileIcon(pendingFile.name)} <span>{pendingFile.name}</span>
                        <button onClick={removePendingFile}>✕</button>
                    </div>
                )}
                <div className="chat-input-area">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.csv" />
                    <button className="attach-button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isStreaming}>
                        <Icon name="paperclip" size={20} />
                    </button>
                    <textarea 
                        className="chat-input" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        disabled={isUploading || isStreaming} 
                        placeholder={isUploading ? "Please wait..." : "Ask anything!"} 
                    />
                    <button className="chat-button" onClick={askQuestion} disabled={isUploading || isStreaming}>
                        <Icon name="send" size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatStreaming;