#!/usr/bin/env node

/**
 * Simple test script to verify custom authentication is working
 * Run with: node test-auth.js
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Test configuration
const SERVER_URL = 'ws://localhost:5959';
const ROOM_ID = 'test-room-123';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_this_in_production';

// Generate valid JWT token for testing
const TEST_TOKEN = jwt.sign(
  { 
    userId: 'test-user-123', 
    roomId: ROOM_ID, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  }, 
  JWT_SECRET
);

console.log('🧪 Testing Custom Authentication');
console.log('================================');
console.log(`Server: ${SERVER_URL}`);
console.log(`Room ID: ${ROOM_ID}`);
console.log(`Token: ${TEST_TOKEN.substring(0, 10)}...`);
console.log('');

// Test 1: Valid token
console.log('📝 Test 1: Connecting with valid token...');
const validWs = new WebSocket(`${SERVER_URL}/?roomId=${ROOM_ID}&token=${TEST_TOKEN}&sessionId=test-session-1`);

validWs.on('open', () => {
  console.log('✅ Success: Connected with valid token');
  validWs.close();
});

validWs.on('error', (error) => {
  console.log('❌ Failed: Valid token rejected');
  console.log('Error:', error.message);
});

// Test 2: Invalid token
setTimeout(() => {
  console.log('📝 Test 2: Connecting with invalid token...');
  const invalidWs = new WebSocket(`${SERVER_URL}/?roomId=${ROOM_ID}&token=invalid_token&sessionId=test-session-2`);
  
  invalidWs.on('open', () => {
    console.log('❌ Failed: Invalid token was accepted (this should not happen)');
    invalidWs.close();
  });
  
  invalidWs.on('error', (error) => {
    console.log('✅ Success: Invalid token rejected correctly');
    console.log('Expected error:', error.message);
  });
}, 1000);

// Test 3: No token
setTimeout(() => {
  console.log('📝 Test 3: Connecting without token...');
  const noTokenWs = new WebSocket(`${SERVER_URL}/?roomId=${ROOM_ID}&sessionId=test-session-3`);
  
  noTokenWs.on('open', () => {
    console.log('❌ Failed: Connection without token was accepted (this should not happen)');
    noTokenWs.close();
  });
  
  noTokenWs.on('error', (error) => {
    console.log('✅ Success: No token rejected correctly');
    console.log('Expected error:', error.message);
  });
}, 2000);

// Test 4: REST API test
setTimeout(async () => {
  console.log('📝 Test 4: Testing REST API with valid token...');
  
  try {
    const response = await fetch(`http://localhost:5959/rooms/${ROOM_ID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Success: REST API accepts valid token');
    } else {
      console.log('❌ Failed: REST API rejected valid token');
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Note: REST API test failed - make sure server is running');
    console.log('Error:', error.message);
  }
}, 3000);

setTimeout(() => {
  console.log('');
  console.log('🏁 Test completed');
  console.log('');
  console.log('💡 Tips:');
  console.log('- Make sure to set CUSTOM_AUTH_TOKEN in your .env file');
  console.log('- Start the server with: npm run start');
  console.log('- Check server logs for detailed authentication messages');
  process.exit(0);
}, 4000);
