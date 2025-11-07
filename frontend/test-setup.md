# Testing the Login + Whiteboard Setup

This guide will help you test the complete login flow with the whiteboard application.

## Quick Setup

### 1. Start the Backend Server

In a terminal window, start the backend:

```bash
cd ../whiteboard-backend
# Set your custom authentication token
echo "CUSTOM_AUTH_TOKEN=my_secret_token_123" > .env
# Build and start the server
npm run build
npm run start
```

The backend should now be running on `http://localhost:5959`.

### 2. Start the Frontend Development Server

In another terminal window:

```bash
cd whiteboard-frontend
npm run dev
```

The frontend should now be running on `http://localhost:5173` (or similar).

## Testing the Flow

### 1. **Open the Login Page**
   - Navigate to `http://localhost:5173/`
   - You should see a beautiful login form

### 2. **Fill in the Login Form**
   - **Username**: `john_doe` (or any name you like)
   - **Room ID**: Click "Generate" or enter `test-room-123`
   - **Token**: Enter `my_secret_token_123` (matching your backend `.env`)

### 3. **Join the Whiteboard**
   - Click "Join Whiteboard"
   - You should be redirected to `/whiteboard` with your parameters
   - The whiteboard should load with your username and room ID displayed

### 4. **Test Collaboration**
   - Open another browser tab/window
   - Go to the login page again
   - Use the **same Room ID and Token** but a **different Username**
   - Both users should see each other's cursors and drawings

## Sample URLs for Testing

Once you've filled the form, URLs will look like:
```
http://localhost:5173/whiteboard?username=john_doe&roomId=test-room-123&token=my_secret_token_123
```

You can also bookmark these URLs or share them directly.

## Authentication Testing

### Valid Token Test
Use the token you set in the backend `.env` file (`my_secret_token_123`).

### Invalid Token Test
Try using a wrong token like `wrong_token` - you should get an authentication error.

### No Token Test
Try accessing the whiteboard directly without a token - you should be redirected to login.

## Advanced Testing

### 1. **Custom Authentication Methods**

Edit the backend `src/server.ts` to test different authentication methods:

**JWT Authentication:**
```javascript
// Uncomment the JWT section in validateCustomAuth()
// Set JWT_SECRET in your .env file
```

**Room-Specific Tokens:**
```javascript
// Uncomment the room-specific validation
// Use tokens like "room_test-room-123_secret"
```

### 2. **Multiple Room Testing**
- Create different room IDs
- Test that users in different rooms can't see each other

### 3. **Real-time Features**
- Draw shapes and lines
- Test the PDF export feature
- Upload images (if backend supports it)

## Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:5959/test
# Should return connection refused or CORS error (expected)
```

### Frontend Issues
```bash
# Check console for errors
# Open browser developer tools (F12)
# Look for network requests to localhost:5959
```

### Authentication Issues
- Check backend console logs for authentication errors
- Verify token matches between frontend and backend
- Ensure `.env` file is properly loaded

## Production Deployment

For production, you'll need to:

1. **Update Backend URL** in `src/Whiteboard.tsx`:
   ```javascript
   const WORKER_URL = 'https://your-backend-domain.com'
   ```

2. **Build Frontend**:
   ```bash
   npm run build
   ```

3. **Deploy** the `dist` folder to your hosting service

4. **Configure Real Authentication** in the backend by implementing your actual token validation logic.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Basic support (touch drawing works)

Enjoy your collaborative whiteboard! 🎨
