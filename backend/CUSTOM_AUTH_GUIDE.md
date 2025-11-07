# Custom Authentication Guide

This guide explains how to implement and use custom authentication in your whiteboard backend after removing VideoSDK token verification.

## Overview

The VideoSDK token verification has been replaced with a flexible custom authentication system that supports multiple authentication methods:

1. **Simple Token Authentication** - Basic string comparison
2. **JWT Authentication** - JSON Web Token verification
3. **Room-specific Authentication** - Per-room token validation
4. **API-based Authentication** - External service validation

## Implementation

### Current Implementation Location

The custom authentication logic is implemented in `/src/server.ts` in the `validateCustomAuth()` function.

### Authentication Methods

#### 1. Simple Token Authentication (Default)

Set an environment variable and compare tokens:


#### 2. JWT Authentication

For JWT-based authentication, uncomment the JWT section in `validateCustomAuth()`:

```bash
# In your .env file
JWT_SECRET=your_jwt_secret_key
```

**Code to uncomment in server.ts:**
```javascript
// Example 2: JWT verification (uncomment if you want to use JWT)
try {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  const decoded = jwt.verify(token, secret);
  // Additional validation logic based on decoded payload
  return true;
} catch (error) {
  console.error('JWT verification failed:', error);
  throw new RoomError('Invalid token', 401);
}
```

**Usage Examples:**
```javascript
// Generate JWT on your auth server
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'user123', roomId: 'room123' }, 
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Use JWT in requests
const wsUrl = `ws://localhost:5959/?roomId=room123&token=${token}`;
```

#### 3. Room-specific Authentication

For per-room authentication, uncomment the room-specific section:

**Code to uncomment in server.ts:**
```javascript
// Example 3: Room-specific validation
if (roomId && token === `room_${roomId}_secret`) {
  return true;
}
```

**Usage Examples:**
```javascript
// For room "meeting-2024"
const token = "room_meeting-2024_secret";
const wsUrl = `ws://localhost:5959/?roomId=meeting-2024&token=${token}`;
```

#### 4. API-based Authentication

Replace the validation logic with an API call to your authentication service:

```javascript
// Example: External API validation
async function validateCustomAuth(token, roomId) {
  if (!token) {
    throw new RoomError('Authentication token is required', 401);
  }

  try {
    const response = await fetch('https://your-auth-api.com/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, roomId })
    });

    if (!response.ok) {
      throw new RoomError('Invalid token', 401);
    }

    const result = await response.json();
    return result.valid;
  } catch (error) {
    console.error('API validation failed:', error);
    throw new RoomError('Authentication failed', 401);
  }
}
```

## Frontend Integration

### Update Frontend Token Handling

If you're using the frontend code, update the token requirement in `App.tsx`:

**Current code that checks for token:**
```javascript
if (!params.roomId || !params.token) {
  return (
    <div>Error: Missing required parameters (roomId and token)</div>
  );
}
```

**You can customize this based on your needs:**

1. **Keep token requirement** (recommended):
```javascript
if (!params.roomId || !params.token) {
  return <div>Error: Missing required parameters</div>;
}
```

2. **Make token optional** (if using a different auth method):
```javascript
if (!params.roomId) {
  return <div>Error: Missing roomId parameter</div>;
}
```

3. **Use different parameter names**:
```javascript
const authToken = params.get('authToken') || params.get('sessionKey');
```

### Frontend Usage Examples

```javascript
// Simple token
const url = `http://localhost:3000/?roomId=room123&token=your_secret_token_here`;

// JWT token
const url = `http://localhost:3000/?roomId=room123&token=${jwtToken}`;

// No token (if you implement server-side session validation)
const url = `http://localhost:3000/?roomId=room123&sessionId=${sessionId}`;
```

## Setup Instructions

1. **Update environment variables:**
```bash
cp .env.example .env
# Edit .env with your authentication method
```

2. **Choose your authentication method** by editing `src/server.ts`:
   - Uncomment the desired validation logic in `validateCustomAuth()`
   - Comment out methods you don't want to use

3. **Rebuild the server:**
```bash
npm run build
```

4. **Start the server:**
```bash
npm run start
```

## Migration Checklist

- [x] Removed VideoSDK token verification
- [x] Removed VideoSDK dependencies (`axios`, JWT verification with VideoSDK API)
- [x] Updated environment variables
- [x] Implemented flexible custom authentication
- [x] Updated both WebSocket and REST API middlewares
- [ ] Choose and implement your preferred authentication method
- [ ] Update frontend token handling (if needed)
- [ ] Test authentication with your use case

## Security Considerations

1. **Token Storage**: Store sensitive tokens securely in environment variables
2. **HTTPS**: Use HTTPS in production for secure token transmission
3. **Token Expiration**: Implement token expiration for JWT-based auth
4. **Rate Limiting**: Consider adding rate limiting to prevent brute force attacks
5. **Logging**: Avoid logging sensitive tokens in production

## Troubleshooting

### Common Issues:

1. **"Authentication token is required" error**:
   - Check if token is being passed correctly in query params or headers
   - Verify environment variables are set

2. **"Invalid authentication token" error**:
   - Verify token format matches your implementation
   - Check if token has expired (for JWT)
   - Ensure token matches expected value

3. **WebSocket connection fails**:
   - Check if token is in query parameters: `?roomId=room123&token=your_token`
   - Verify WebSocket middleware is working

4. **REST API calls fail**:
   - Check Authorization header format: `Bearer your_token` or `Basic your_token`
   - Verify API middleware configuration

### Debug Mode:

Enable detailed logging by checking the console output. All authentication failures are logged with specific error messages.

## Examples

See the `examples/` directory for complete implementation examples of each authentication method.
