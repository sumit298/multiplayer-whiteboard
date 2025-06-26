import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginPage.css';

interface LoginFormData {
  username: string;
  roomId: string;
  token: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    roomId: '',
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
      token: urlParams.get('token') || ''
    });
  }, [location.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
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
    
    if (!formData.token.trim()) {
      newErrors.token = 'Token is required';
    } else if (formData.token.trim().length < 8) {
      newErrors.token = 'Token must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Optional: Test connection to backend before proceeding
      await fetch('http://localhost:5959/test', {
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => null);
      
      // Navigate to whiteboard with parameters
      const params = new URLSearchParams({
        username: formData.username.trim(),
        roomId: formData.roomId.trim(),
        token: formData.token.trim()
      });
      
      navigate(`/whiteboard?${params.toString()}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      // Still proceed to whiteboard - connection errors will be handled there
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

  const generateToken = () => {
    // For development - in production, tokens should come from your auth system
    // Use the same token that's configured in the backend .env file
    const developmentToken = 'my_secret_token_123';
    setFormData(prev => ({
      ...prev,
      token: developmentToken
    }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Join Whiteboard</h1>
          <p>Enter your details to join or create a collaborative whiteboard session</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              className={errors.username ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div className="input-with-button">
              <input
                type="text"
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                placeholder="Enter room ID or generate one"
                className={errors.roomId ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="generate-btn"
                disabled={isLoading}
              >
                Generate
              </button>
            </div>
            {errors.roomId && <span className="error-message">{errors.roomId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="token">Authentication Token</label>
            <div className="input-with-button">
              <input
                type="password"
                id="token"
                name="token"
                value={formData.token}
                onChange={handleInputChange}
                placeholder="Enter your authentication token"
                className={errors.token ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={generateToken}
                className="generate-btn"
                disabled={isLoading}
                title="Generate test token (for development only)"
              >
                Generate
              </button>
            </div>
            {errors.token && <span className="error-message">{errors.token}</span>}
            <small className="help-text">
              Contact your administrator for a valid authentication token
            </small>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Join Whiteboard'}
          </button>
        </form>

        <div className="login-footer">
          <div className="tips">
            <h4>Tips:</h4>
            <ul>
              <li>Share the Room ID with others to collaborate</li>
              <li>Use the same token that others in your room are using</li>
              <li>Your username will be visible to other participants</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
