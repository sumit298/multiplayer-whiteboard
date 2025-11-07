import { RoomSnapshot, TLSocketRoom } from '@tldraw/sync-core'
import { mkdir, readFile, writeFile, readdir, unlink, access, rm } from 'fs/promises'
import { join } from 'path'


const DIR = './rooms'

async function cleanupRooms(roomId?: string) {
	try {
		// try {
		// 	await access(`${DIR}/${roomId}`, constants.F_OK)
		// } catch {

		// 	return
		// }

		if (roomId) {
			try {
				

				rm(join(`${DIR}/`, roomId), {
					force: true,
					recursive: true
				}).catch((error) => console.error(error))


			} catch (err) {
				// Only log as error if it's not a "file not found" error
				if ((err as any).code !== 'ENOENT') {
					console.error(`Failed to delete room ${roomId}:`, err)
				}
			}
		} else {
			// Clean all rooms
			const files = await readdir(`${DIR}/`)
			if (files.length === 0) {
				return
			}

			await Promise.all(
				files.map(async (file) => {
					try {
						// Check if file still exists before trying to delete
						// try {
						// 	await access(join(`${DIR}/${roomId}`, file), constants.F_OK)
						// } catch {
						// 	return // Skip if file doesn't exist
						// }

						unlink(join(`${DIR}/`, file)).catch((error) => console.error(error))
					} catch (err) {
						// Only log as error if it's not a "file not found" error
						if ((err as any).code !== 'ENOENT') {
							console.error(`Failed to delete room ${file}:`, err)
						}
					}
				})
			)
		}
	} catch (error) {
		console.error('Error during rooms cleanup:', error)
	}
}

// Export the cleanupRooms function for use in other modules
export { cleanupRooms }

// Function to clean assets folder

async function readSnapshotIfExists(roomId: string) {
	try {
		const data = await readFile(join(`${DIR}/${roomId}`, roomId))
		return JSON.parse(data.toString()) ?? undefined
	} catch (e) {
		return undefined
	}
}
async function saveSnapshot(roomId: string, snapshot: RoomSnapshot) {
	await mkdir(`${DIR}/${roomId}`, { recursive: true, })
	await writeFile(join(`${DIR}/${roomId}`, roomId), JSON.stringify(snapshot))
}

// We'll keep an in-memory map of rooms and their data
interface RoomState {
	room: TLSocketRoom<any, void>
	id: string
	needsPersist: boolean
}
const rooms = new Map<string, RoomState>()

// Replace the single mutex with a map of mutexes per room
const mutexes = new Map<string, Promise<null | Error>>()

export { rooms, mutexes }

export async function makeOrLoadRoom(roomId: string) {
	// Initialize mutex for this room if it doesn't exist
	if (!mutexes.has(roomId)) {
		mutexes.set(roomId, Promise.resolve<null | Error>(null))
	}

	// Get the mutex for this specific room
	let roomMutex = mutexes.get(roomId)!
	// Chain the new operation to this room's mutex
	roomMutex = roomMutex
		.then(async () => {
			if (rooms.has(roomId)) {
				const roomState = rooms.get(roomId)!
				if (!roomState.room.isClosed()) {
					return null
				}
				// Remove from memory but don't cleanup files
				rooms.delete(roomId)
			}

			const initialSnapshot = await readSnapshotIfExists(roomId)

			const roomState: RoomState = {
				needsPersist: false,
				id: roomId,
				room: new TLSocketRoom({
					initialSnapshot,
					async onSessionRemoved(room, args) {
						if (args.numSessionsRemaining === 0) {
							
							room.close()

						}
					},
					onDataChange() {
						roomState.needsPersist = true
					},
				}),
			}
			rooms.set(roomId, roomState)

			return null
		})
		.catch((error) => {
			console.error('Error in mutex:', error)
			return error
		})

	// Update the mutex in the map
	mutexes.set(roomId, roomMutex)

	const err = await roomMutex
	if (err) throw err
	return rooms.get(roomId)!.room
}

setInterval(async () => {
	// Persist rooms that need saving
	for (const roomState of rooms.values()) {
		if (roomState.needsPersist) {
			roomState.needsPersist = false;
			await saveSnapshot(roomState.id, roomState.room.getCurrentSnapshot());
		}
	}

	// Collect active room IDs
	const activeRoomIds = [];
	for (const roomId of rooms.keys()) {
		const roomState = rooms.get(roomId);
		if (roomState && !roomState.room.isClosed()) {
			activeRoomIds.push(roomId);
		}
	}

	if (activeRoomIds.length === 0) {
		console.log('No active rooms found!');
	}
	else {
		console.log(`${activeRoomIds.length},`, activeRoomIds);
	}


}, 1000);
