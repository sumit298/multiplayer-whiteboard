import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginFormData {
  username: string;
  roomId: string;
  roomPassword: string;
  token: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    roomId: '',
    roomPassword: '',
    token: ''
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill form with URL parameters if available
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setFormData({
      username: urlParams.get('username') || '',
      roomId: urlParams.get('roomId') || '',
      roomPassword: urlParams.get('roomPassword') || '',
      token: urlParams.get('token') || ''
    });
  }, [location.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    }
    
    if (!formData.roomId.trim()) {
      newErrors.roomId = 'Room ID is required';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(formData.roomId.trim())) {
      newErrors.roomId = 'Room ID can only contain letters, numbers, hyphens, and underscores';
    }
    
    if (!formData.roomPassword.trim()) {
      newErrors.roomPassword = 'Room password is required';
    } else if (formData.roomPassword.trim().length < 4) {
      newErrors.roomPassword = 'Room password must be at least 4 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!formData.token.trim()) {
      alert('Please authenticate with room credentials first by clicking the "Authenticate" button.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await fetch('http://localhost:5959/test', {
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => null);
      
      const params = new URLSearchParams({
        username: formData.username.trim(),
        roomId: formData.roomId.trim(),
        token: formData.token.trim()
      });
      
      navigate(`/whiteboard?${params.toString()}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      const params = new URLSearchParams({
        username: formData.username.trim(),
        roomId: formData.roomId.trim(),
        token: formData.token.trim()
      });
      
      navigate(`/whiteboard?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoomId = () => {
    const randomId = `room-${Math.random().toString(36).substring(2, 10)}`;
    setFormData(prev => ({
      ...prev,
      roomId: randomId
    }));
  };

  const authenticateWithRoom = async (): Promise<void> => {
    if (!formData.roomId.trim() || !formData.roomPassword.trim()) {
      alert('Please enter both Room ID and Room Password first');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5959'}/auth/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username || `user_${Math.random().toString(36).substring(2, 8)}`,
          roomId: formData.roomId.trim(),
          roomPassword: formData.roomPassword.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        token: data.token
      }));
      
      console.log('Room authentication successful:', data.payload);
      alert('Authentication successful! You can now join the whiteboard.');
    } catch (error) {
      console.error('Room authentication failed:', error);
      alert(`Authentication failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Side - Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroBackground}>
          <div style={styles.floatingOrb1}></div>
          <div style={styles.floatingOrb2}></div>
          <div style={styles.floatingOrb3}></div>
        </div>
        
        <div style={styles.heroContent}>
          <div style={styles.heroHeader}>
            <div style={styles.heroIcon}>
              👥
            </div>
            <h1 style={styles.heroTitle}>
              Collaborative Whiteboard
            </h1>
            <p style={styles.heroSubtitle}>
              Join your team in real-time collaboration. Create, share, and innovate together on our advanced whiteboard platform.
            </p>
          </div>
          
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <div style={styles.featureIconBlue}>⚡</div>
              <div>
                <h3 style={styles.featureTitle}>Real-time Sync</h3>
                <p style={styles.featureDescription}>See changes instantly across all devices</p>
              </div>
            </div>
            
            <div style={styles.featureItem}>
              <div style={styles.featureIconPurple}>🛡️</div>
              <div>
                <h3 style={styles.featureTitle}>Secure Rooms</h3>
                <p style={styles.featureDescription}>Password-protected collaborative spaces</p>
              </div>
            </div>
            
            <div style={styles.featureItem}>
              <div style={styles.featureIconOrange}>👥</div>
              <div>
                <h3 style={styles.featureTitle}>Team Collaboration</h3>
                <p style={styles.featureDescription}>Work together with unlimited participants</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={styles.formSection}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Join Session</h2>
            <p style={styles.formSubtitle}>Enter your credentials to get started</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                style={{
                  ...styles.input,
                  ...(errors.username ? styles.inputError : {})
                }}
                disabled={isLoading}
              />
              {errors.username && <p style={styles.errorMessage}>{errors.username}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Room ID</label>
              <div style={styles.inputWithButton}>
                <input
                  type="text"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleInputChange}
                  placeholder="Enter or generate room ID"
                  style={{
                    ...styles.input,
                    ...styles.inputFlex,
                    ...(errors.roomId ? styles.inputError : {})
                  }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={generateRoomId}
                  disabled={isLoading}
                  style={styles.iconButton}
                >
                  🔄
                </button>
              </div>
              {errors.roomId && <p style={styles.errorMessage}>{errors.roomId}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Room Password</label>
              <input
                type="password"
                name="roomPassword"
                value={formData.roomPassword}
                onChange={handleInputChange}
                placeholder="Enter room password"
                style={{
                  ...styles.input,
                  ...(errors.roomPassword ? styles.inputError : {})
                }}
                disabled={isLoading}
              />
              {errors.roomPassword && <p style={styles.errorMessage}>{errors.roomPassword}</p>}
              <p style={styles.helpText}>
                Set password for new rooms or enter existing room password
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Authentication Token</label>
              <div style={styles.inputWithButton}>
                <input
                  type="password"
                  name="token"
                  value={formData.token}
                  onChange={handleInputChange}
                  placeholder="Get your token"
                  style={{
                    ...styles.input,
                    ...styles.inputFlex,
                    ...(errors.token ? styles.inputError : {})
                  }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={authenticateWithRoom}
                  disabled={isLoading}
                  style={styles.iconButtonPurple}
                >
                  🔑
                </button>
              </div>
              {errors.token && <p style={styles.errorMessage}>{errors.token}</p>}
              <p style={styles.helpText}>
                Click the key icon to authenticate with your room credentials
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.submitButton,
                ...(isLoading ? styles.submitButtonDisabled : {})
              }}
            >
              {isLoading ? (
                <>
                  <span style={styles.spinner}></span>
                  Connecting...
                </>
              ) : (
                <>
                  Join Whiteboard →
                </>
              )}
            </button>
          </form>

          {/* <div style={styles.formFooter}>
            <div style={styles.tips}>
              <h4 style={styles.tipsTitle}>Quick Tips</h4>
              <div style={styles.tipsList}>
                <p style={styles.tipItem}>💡 Share your Room ID with team members</p>
                <p style={styles.tipItem}>🔒 Keep your room password secure</p>
                <p style={styles.tipItem}>👥 Your username will be visible to others</p>
              </div>
            </div> */}
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    background: '#000000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  heroSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '4rem 2rem 4rem 2rem',
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
  },
  heroBackground: {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0.1,
  },
  floatingOrb1: {
    position: 'absolute' as const,
    top: '5rem',
    left: '5rem',
    width: '18rem',
    height: '18rem',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    animation: 'pulse 4s ease-in-out infinite',
  },
  floatingOrb2: {
    position: 'absolute' as const,
    top: '10rem',
    right: '5rem',
    width: '24rem',
    height: '24rem',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    animation: 'pulse 4s ease-in-out infinite 2s',
  },
  floatingOrb3: {
    position: 'absolute' as const,
    bottom: '-8rem',
    left: '10rem',
    width: '20rem',
    height: '20rem',
    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    animation: 'pulse 4s ease-in-out infinite 4s',
  },
  heroContent: {
    position: 'relative' as const,
    zIndex: 10,
    color: 'white',
    maxWidth: '32rem',
  },
  heroHeader: {
    marginBottom: '2rem',
  },
  heroIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '4rem',
    height: '4rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    backdropFilter: 'blur(10px)',
    marginBottom: '1.5rem',
    fontSize: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '1.5rem',
    lineHeight: 1.1,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#a3a3a3',
    marginBottom: '2rem',
    lineHeight: 1.6,
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  featureIconBlue: {
    flexShrink: 0,
    width: '3rem',
    height: '3rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  featureIconPurple: {
    flexShrink: 0,
    width: '3rem',
    height: '3rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  featureIconOrange: {
    flexShrink: 0,
    width: '3rem',
    height: '3rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  featureTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'white',
    margin: 0,
  },
  featureDescription: {
    color: '#737373',
    margin: 0,
  },
  formSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: '#ffffff',
  },
  formCard: {
    width: '100%',
    maxWidth: '28rem',
    backgroundColor: '#ffffff',
    borderRadius: '1.5rem',
    padding: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #e5e5e5',
  },
  formHeader: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  formTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#000000',
    margin: '0 0 0.5rem 0',
  },
  formSubtitle: {
    color: '#525252',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#262626',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e5e5',
    borderRadius: '0.75rem',
    color: '#000000',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
  },
  inputFlex: {
    flex: 1,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  inputWithButton: {
    display: 'flex',
    gap: '0.5rem',
  },
  iconButton: {
    padding: '0.75rem',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  iconButtonPurple: {
    padding: '0.75rem',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: '0.875rem',
    margin: 0,
  },
  helpText: {
    color: '#737373',
    fontSize: '0.75rem',
    margin: 0,
  },
  submitButton: {
    width: '100%',
    padding: '1rem 1.5rem',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    outline: 'none',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '1.25rem',
    height: '1.25rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  formFooter: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e5e5',
  },
  tips: {
    textAlign: 'center' as const,
  },
  tipsTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#262626',
    margin: '0 0 0.75rem 0',
  },
  tipsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  tipItem: {
    color: '#737373',
    fontSize: '0.75rem',
    margin: 0,
  },
};

export default LoginPage;