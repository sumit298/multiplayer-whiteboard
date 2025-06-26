import dotenv from 'dotenv';
dotenv.config();

import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import fastify from 'fastify'
import { storeAsset, loadAsset } from './assets'
import { makeOrLoadRoom, cleanupRooms, rooms, mutexes } from './rooms'
import { RoomError } from './RoomError'
import { Errors } from './Errors'
import jwt from 'jsonwebtoken'
// import { unfurl } from './unfurl'

const PORT = 5959

const app = fastify({
  bodyLimit: 1024 * 1024 * 10, // 10mb,
  maxParamLength: 1024,
})
app.register(websocketPlugin)
app.register(cors, { origin: '*' })



// Custom verification function for your own authentication
async function validateCustomAuth(
  token: string | undefined,
  roomId: string
) {
  if (!token) {
    console.error('No token provided');
    throw new RoomError(
      'Authentication token is required',
      401
    );
  }

  // JWT verification
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    const decoded = jwt.verify(token, secret) as any;
    console.log('JWT token verified successfully for user:', decoded.userId || 'unknown');
    
    // Optional: Additional validation logic based on decoded payload
    // For example, check if the token is for the correct room:
    // if (decoded.roomId && decoded.roomId !== roomId) {
    //   throw new Error('Token is not valid for this room');
    // }
    
    return true;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new RoomError('Invalid token', 401);
  }
}

// Simplified validation function that uses your custom auth
async function validateTokenAndRoom({
  token,
  roomId,
}: {
  token: string | undefined;
  roomId: string;
}) {
  return validateCustomAuth(token, roomId);
}

// VideoSDK specific functions removed - no longer needed
// You can add your own helper functions here if needed

async function validateTokenAndRoomWebSocketMiddleware(req: any, reply: any, done: any) {
  const roomId = (req.query as any)?.['roomId'] as string;
  const token = (req.query as any)?.['token'] as string;

  try {
    await validateTokenAndRoom({ token, roomId });
    done();
  } catch (error) {
    console.error('WebSocket token validation failed:', error);
    reply.code(401).send({ error: 'Unauthorized' });
    done(new Error('Unauthorized'));
  }
}

// Create middleware function for REST API (using Authorization header)
async function validateTokenAndRoomApiMiddleware(req: any, reply: any, done: any) {
  const roomId = (req.params as any).roomId as string;

  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader && authHeader.startsWith('Basic ')) {
    token = authHeader.substring(6);
  }

  try {
    await validateCustomAuth(token, roomId);
    done();
  } catch (error) {
    console.error('API token validation failed:', error);
    reply.code(401).send({ error: 'Unauthorized' });
    done(new Error('Unauthorized'));
  }
}

app.register(async (app) => {
  // This is the main entrypoint for the multiplayer sync
  app.get('/', {
    websocket: true,
    preHandler: validateTokenAndRoomWebSocketMiddleware  // Use WebSocket middleware
  }, async (socket, req) => {
    try {
      const roomId = (req.query as any)?.['roomId'] as string
      const sessionId = (req.query as any)?.['sessionId'] as string
      const drawOnWhiteboard = (req.query as any)?.['drawOnWhiteboard'] as string
      const isReadonly = drawOnWhiteboard === 'false' ? false : true;

      const room = await makeOrLoadRoom(roomId);
      room.handleSocketConnect({ sessionId, socket, isReadonly: !isReadonly });
    } catch (error) {
      console.error('Connection failed:', error);
      socket.terminate();
    }
  });

  // To enable blob storage for assets, we add a simple endpoint supporting PUT and GET requests
  // But first we need to allow all content types with no parsing, so we can handle raw data
  app.addContentTypeParser('*', (_, __, done) => done(null))
  app.put('/uploads/:roomId/:id', {
    config: {
      bodyLimit: 10 * 1024 * 1024 // 10MB
    },
    handler: async (req, res) => {
      const id = (req.params as any).id as string
      const roomId = (req.params as any).roomId as string

      try {
        // Create a buffer from the entire stream
        const chunks = []
        for await (const chunk of req.raw) {
          chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)

        await storeAsset(id, roomId, buffer)
        return res.send({ ok: true })
      } catch (error) {
        console.error('Upload error:', error)
        return res.status(500).send({ error: 'Upload failed' })
      }
    }
  })
  app.get('/uploads/:roomId/:id', async (req, res) => {

  const id = (req.params as any).id as string
  const roomId = (req.params as any).roomId as string
  
  
  try {
    const data = await loadAsset(id, roomId)
    
    if (!data) {
      return res.status(404).send({ error: 'File not found' })
    }
    
    
    // Set proper content type for SVG
    const extension = id.split('.').pop()?.toLowerCase()
    if (extension === 'svg') {
      res.type('image/svg+xml')
    } else if (extension === 'png') {
      res.type('image/png') 
    } else if (extension === 'jpg' || extension === 'jpeg') {
      res.type('image/jpeg')
    } else {
      res.type('application/octet-stream')
    }
    
    return res.send(data)
  } catch (error) {
    console.error(`Get asset error for ${id}:`, error)
    return res.status(500).send({ error: 'Internal server error' })
  }
})

  // Development endpoint to generate JWT tokens (remove in production)
  app.post('/generate-token', async (req, res) => {
    try {
      const body = req.body as { userId?: string; roomId?: string } || {};
      const { userId, roomId } = body;
      
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).send({ error: 'JWT_SECRET not configured' });
      }
      
      const payload = {
        userId: userId || `user_${Math.random().toString(36).substring(2, 8)}`,
        roomId: roomId || 'default-room',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
      };
      
      const token = jwt.sign(payload, secret);
      
      return res.send({ 
        token, 
        payload,
        expiresIn: '1 hour'
      });
    } catch (error) {
      console.error('Token generation failed:', error);
      return res.status(500).send({ error: 'Failed to generate token' });
    }
  });

  app.delete('/rooms/:roomId', {
    preHandler: validateTokenAndRoomApiMiddleware,
    handler: async (req, res) => {
      const roomId = (req.params as any).roomId as string

      try {

        const roomExists = rooms.has(roomId)
        if (roomExists) {
          const roomState = rooms.get(roomId)!
          if (!roomState.room.isClosed()) {
            roomState.room.close()
          }
          rooms.delete(roomId)
          mutexes.delete(roomId)
        }

        await cleanupRooms(roomId)

        return res.send({ success: true, message: `Room ${roomId} deleted successfully` })
      } catch (error) {
        console.error(`Error deleting room ${roomId}:`, error)
        return res.status(500).send({ success: false, error: 'Failed to delete room' })
      }
    }
  })

  // To enable unfurling of bookmarks, we add a simple endpoint that takes a URL query param
  // app.get('/unfurl', async (req, res) => {
  // 	const url = (req.query as any).url as string
  // 	res.send(await unfurl(url))
  // })
})

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log(`Server started on port ${PORT}`)
})
