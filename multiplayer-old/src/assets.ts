import { mkdir, readFile, writeFile, rm } from 'fs/promises'
import { join, resolve } from 'path'

// We are just using the filesystem to store assets
const DIR = resolve('./rooms')

export async function storeAsset(id: string, roomId: string, data: Buffer) {
	try {
	  await mkdir(`${DIR}/${roomId}/assets`, { recursive: true })
	  await writeFile(join(`${DIR}/${roomId}/assets`, id), data)
	} catch (error) {
	  console.error(`Failed to store asset ${id}:`, error)
	  throw error
	}
  }

export async function loadAsset(id: string, roomId: string) {
	try {
		return await readFile(join(`${DIR}/${roomId}/assets`, id))
	} catch (error) {
		console.error(`Failed to load asset ${id}:`, error)
		throw error
	}
}
