import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import './Login.css';
import logo from '../assets/vidyavriti-favicon.png'; 

const Login = () => {
    const [step, setStep] = useState(1);
    const [rollNo, setRollNo] = useState('');
    // State is now an array of 4 empty strings
    const [otp, setOtp] = useState(['', '', '', '']); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);
    
    // Create an array of references for the 4 input boxes
    const inputRefs = useRef([]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // --- NEW: OTP Input Handlers ---
    const handleChange = (index, e) => {
        const value = e.target.value;
        if (isNaN(value)) return; // Only allow numbers

        const newOtp = [...otp];
        // Take only the last character (in case they type fast)
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input box automatically
        if (value && index < 3 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input box on backspace if current box is empty
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, 4).split('');
        if (pasteData.some(char => isNaN(char))) return; // Ensure paste is numbers only

        const newOtp = [...otp];
        pasteData.forEach((char, idx) => {
            newOtp[idx] = char;
        });
        setOtp(newOtp);

        // Focus the last filled input
        const focusIndex = pasteData.length < 4 ? pasteData.length : 3;
        inputRefs.current[focusIndex].focus();
    };

    // Step 1: Request OTP
    const handleGenerateOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/generate-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNo }),
            });

            if (response.ok) {
                setSuccessMessage('OTP sent successfully. Valid for 15 minutes.');
                setStep(2);
                setTimeLeft(900);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to generate OTP.');
            }
        } catch (err) {
            setError('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Join the array into a single string for the backend
        const otpString = otp.join('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNo, otp: otpString }),
            });

            if (response.ok) {
                const token = await response.text(); 
                try {
                    const decodedPayload = jwtDecode(token);
                    const studentData = {
                        id: decodedPayload.id,
                        name: decodedPayload.name,
                        phone: decodedPayload.phone,
                        city: decodedPayload.city,
                        classNum: decodedPayload.classNum,
                        role: decodedPayload.role,
                        rollNo: decodedPayload.sub 
                    };

                    sessionStorage.setItem('authToken', token);
                    sessionStorage.setItem('studentSession', JSON.stringify(studentData));

                    if (timerRef.current) clearInterval(timerRef.current);
                    window.location.href = '/';
                } catch (decodeError) {
                    setError('Failed to process session data from token.');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src={logo} alt="Vidyavriti Logo" className="login-logo" />
                    <h2>Vidyavriti Institute</h2>
                    <p>Academic Portal Login</p>
                </div>

                {error && <div className="alert-box error">{error}</div>}
                {successMessage && <div className="alert-box success">{successMessage}</div>}

                {step === 1 ? (
                    <form onSubmit={handleGenerateOtp} className="login-form">
                        <div className="input-group">
                            <label htmlFor="rollNo">Roll Number</label>
                            <input
                                type="text"
                                id="rollNo"
                                placeholder="Enter your roll number"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                required
                                disabled={loading || timeLeft > 0}
                            />
                        </div>
                        
                        {timeLeft > 0 && (
                            <div className="timer-display">
                                You can request a new OTP in: <strong>{formatTime(timeLeft)}</strong>
                            </div>
                        )}

                        <button type="submit" className="primary-btn" disabled={loading || !rollNo || timeLeft > 0}>
                            {loading ? 'Generating...' : 'Get OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="login-form">
                        <div className="input-group">
                            <label>Enter 4-Digit OTP</label>
                            <div className="otp-input-container">
                                {otp.map((data, index) => (
                                    <input
                                        className="otp-box"
                                        type="text"
                                        name="otp"
                                        maxLength="1"
                                        key={index}
                                        value={data}
                                        ref={el => inputRefs.current[index] = el}
                                        onChange={e => handleChange(index, e)}
                                        onKeyDown={e => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        disabled={loading}
                                    />
                                ))}
                            </div>
                        </div>

                        {timeLeft > 0 ? (
                            <div className="timer-display">
                                OTP expires in: <strong>{formatTime(timeLeft)}</strong>
                            </div>
                        ) : (
                            <div className="timer-display expired">
                                OTP has expired. Please step back to generate a new one.
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="primary-btn" 
                            disabled={loading || otp.join('').length < 4 || timeLeft === 0}
                        >
                            {loading ? 'Verifying...' : 'Login'}
                        </button>
                        
                        <button 
                            type="button" 
                            className="secondary-btn" 
                            onClick={() => { setStep(1); setOtp(['', '', '', '']); setError(''); setSuccessMessage(''); }}
                            disabled={loading}
                        >
                            Change Roll Number / View Timer
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;