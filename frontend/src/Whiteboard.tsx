import { useSync } from '@tldraw/sync'
import {
	AssetRecordType,
	Editor,
	getHashForString,
	TLAssetStore,
	TLBookmarkAsset,
	Tldraw,
	TldrawOptions,
	TLInstancePresence,
	uniqueId,
	TLUiOverrides,
	TLComponents,
	useTools,
	useIsToolSelected,
	DefaultToolbar,
	TldrawUiMenuItem,
	DefaultToolbarContent,
	DefaultKeyboardShortcutsDialog,
	DefaultKeyboardShortcutsDialogContent,
	TLUiAssetUrlOverrides,
} from 'tldraw'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExportPdfTool } from './exportPdfTool'


const WORKER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5959'

const getUrlParams = () => {
	const params = new URLSearchParams(window.location.search)

	return {
		roomId: params.get('roomId'),
		username:
			params.get('username') ||
			`user-${Math.random().toString(36).substring(2, 7)}`,
		token: params.get('token') || '',
		drawOnWhiteboardParam: params.get('drawOnWhiteboard'),
		stopFollowingParam: params.get('hideFollowingBtn'),
		participantId: params.get('participantId') || '',
		participantIdToFollow: params.get('participantIdToFollow') || '',
		scrollDisabled: params.get('scrollDisabled') || '',
		cameraLock: params.get('cameraLock') || '',
	}
}

const multiplayerAssets: TLAssetStore = {
	async upload(_asset, file) {
		const id = uniqueId()
		const roomId = getUrlParams().roomId
		const objectName = `${id}-${file.name}`
		const url = `${WORKER_URL}/uploads/${roomId}/${encodeURIComponent(
			objectName,
		)}`

		const response = await fetch(url, {
			method: 'PUT',
			body: file,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'PUT',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		})
		if (!response.ok)
			throw new Error(`Failed to upload asset: ${response.statusText}`)

		return {
			src: url,
		}
	},
	resolve: (asset) => asset.props.src,
}

const unfurlBookmarkUrl = async ({
	url,
}: {
	url: string
}): Promise<TLBookmarkAsset> => {
	const asset: TLBookmarkAsset = {
		id: AssetRecordType.createId(getHashForString(url)),
		typeName: 'asset',
		type: 'bookmark',
		meta: {},
		props: { src: url, description: '', image: '', favicon: '', title: '' },
	}

	try {
		const response = await fetch(
			`${WORKER_URL}/unfurl?url=${encodeURIComponent(url)}`,
		)
		if (response.ok) {
			const data = await response.json()
			Object.assign(asset.props, {
				description: data?.description || '',
				image: data?.image || '',
				favicon: data?.favicon || '',
				title: data?.title || '',
			})
		}
	} catch (e) {
		console.error('Bookmark unfurling error:', e)
	}

	return asset
}

const Whiteboard = () => {
	const navigate = useNavigate()

	const uiOverrides: TLUiOverrides = {
		// make a button for pdf export
		tools(editor, tools) {
			tools.exportPdf = {
				id: 'exportPdf',
				label: 'Export as PDF',
				icon: 'file_download',
				kbd: 'Ctrl+Shift+E',
				onSelect: async () => {
					editor.setCurrentTool('exportPdf')
				},
			}
			return tools
		},
		actions(_editor: Editor, { 'flatten-to-image': _, ...actions }) {
			// Remove the "flatten to image" action
			return actions
		},
	}
	const [params] = useState(() => getUrlParams())
	const [drawOnWhiteboard, setDrawOnWhiteboard] = useState(
		params.drawOnWhiteboardParam !== 'false',
	)

	const rootRef = useRef<HTMLDivElement | null>(null)
	const editorRef = useRef<Editor | null>(null) // Add editor ref
	const [stopFollowing] = useState(params.stopFollowingParam === 'true')
	const [scrollDisabled] = useState(params.scrollDisabled === 'true')
	const [cameraLock] = useState(params.cameraLock === 'true')

	// Handle leaving room without clearing content
	const handleLeaveRoom = async () => {
		const confirmLeave = window.confirm(
			'Are you sure you want to leave this room?'
		)
		
		if (!confirmLeave) {
			return
		}
		
		try {
			// Just disconnect the user, don't delete room contents
			const response = await fetch(`${WORKER_URL}/rooms/${params.roomId}/disconnect`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${params.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username: params.username })
			})
			
			if (response.ok) {
				console.log('Successfully disconnected from room')
			} else {
				console.warn('Failed to disconnect from room:', response.statusText)
			}
		} catch (error) {
			console.error('Error disconnecting from room:', error)
		} finally {
			// Always navigate back to login
			navigate('/')
		}
	}

	// For removing selecting events when not drawing on whiteboard
	useEffect(() => {
		if (rootRef.current) {
			rootRef.current.style.pointerEvents = drawOnWhiteboard ? 'auto' : 'none'
		}
	}, [drawOnWhiteboard])

	const handleMount = useCallback((editor: Editor) => {
		editorRef.current = editor // Store editor instance

		window.addEventListener('message', (event) => {
			if (event.data?.type === 'upload_image') {
				const imageUrl = event.data.message.src
				const imageHeight = event.data.message.height
				const imageWidth = event.data.message.width
				const imagePositionX = event.data.message.x
				const imagePositionY = event.data.message.y
				const assetId = AssetRecordType.createId()
				editor.createAssets([
					{
						id: assetId,
						type: 'image',
						typeName: 'asset',
						props: {
							name: 'tldraw image file',
							src: `${imageUrl}`,
							w: imageWidth,
							h: imageHeight,
							mimeType: 'img/jpeg',
							isAnimated: false,
						},
						meta: {},
					},
				])
				editor.createShape({
					type: 'image',
					x: imagePositionX,
					y: imagePositionY,
					props: {
						assetId,
						w: imageWidth,
						h: imageHeight,
					},
				})
			} else if (event?.data?.type === 'follow_participant') {
				// console.log('event follow from whiteboard', event?.data?.message)
				setTimeout(() => {
					const participantIdToFollow = event.data.message.participantIdToFollow
					const records = editor.store.allRecords()
					// console.log('records', records)
					const presenceRecords = records.filter(
						(r) => r.typeName === 'instance_presence',
					) as TLInstancePresence[]

					const userToFollow = presenceRecords.find(
						(p) => p.userId === participantIdToFollow,
					)

					// console.log('user To follow', userToFollow)
					// console.log('presence records', presenceRecords)
					if (userToFollow) {
						editor.startFollowingUser(userToFollow.userId)
					}
				}, 1000)
			} else if (event.data.type === 'whiteboard_access') {
				const canDrawOnWhiteboard = event.data.message.canDrawOnWhiteboard
				if (canDrawOnWhiteboard !== undefined) {
					setDrawOnWhiteboard(canDrawOnWhiteboard)
				}
			}
		})
	}, [])

	// Check if required parameters are present, if not redirect to login
	useEffect(() => {
		if (!params.roomId || !params.token) {
			console.log('Missing required parameters, redirecting to login...')
			navigate('/')
		}
	}, [params.roomId, params.token, navigate])

	if (!params.roomId || !params.token) {
		return (
			<div
				style={{
					position: 'fixed',
					inset: 0,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#f0f0f0',
					color: '#ff0000',
					fontSize: '1.2rem',
				}}
			>
				Redirecting to login...
			</div>
		)
	}

	const options: Partial<TldrawOptions> = {
		enableToolbarKeyboardShortcuts: drawOnWhiteboard,
		// "flatten-to-image": null,
	}

	const queryParams = new URLSearchParams({
		roomId: params.roomId || '',
		token: params.token || '',
		username: params.username || '',
	})

	if (drawOnWhiteboard !== undefined) {
		queryParams.append('drawOnWhiteboard', drawOnWhiteboard.toString())
	}

	if (params.participantId) {
		queryParams.append('participantId', params.participantId)
	}

	const store = useSync({
		uri: `${WORKER_URL}/?${queryParams.toString()}`,
		assets: multiplayerAssets,
	})

	const components: TLComponents = {
		Toolbar: (props) => {
			const tools = useTools()
			const isExportPdfToolSelected = useIsToolSelected(tools['exportPdf'])
			return (
				<DefaultToolbar {...props}>
					<TldrawUiMenuItem
						{...tools['exportPdf']}
						isSelected={isExportPdfToolSelected}
					/>
					<DefaultToolbarContent />
				</DefaultToolbar>
			)
		},
		KeyboardShortcutsDialog: (props) => {
			const tools = useTools()
			return (
				<DefaultKeyboardShortcutsDialog {...props}>
					<DefaultKeyboardShortcutsDialogContent />
					{/* Ideally, we'd interleave this into the tools group */}
					<TldrawUiMenuItem {...tools['exportPdf']} />
				</DefaultKeyboardShortcutsDialog>
			)
		},
	}

	const customAssetUrls: TLUiAssetUrlOverrides = {
		icons: {
			file_download:
				'https://img.icons8.com/?size=100&id=299&format=png&color=000000',
		},
	}

	const customTools = [ExportPdfTool]

	// Add header with room info and logout button
	const HeaderComponent = () => (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				height: '60px',
				background: 'rgba(255, 255, 255, 0.95)',
				backdropFilter: 'blur(10px)',
				borderBottom: '1px solid #e2e8f0',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0 20px',
				zIndex: 1000,
				fontSize: '14px',
				color: '#4a5568',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
				<div style={{ fontWeight: '600', color: '#2d3748' }}>
					Collaborative Whiteboard
				</div>
				<div>Room: <strong>{params.roomId}</strong></div>
				<div>User: <strong>{params.username}</strong></div>
			</div>
			<button
				onClick={() => handleLeaveRoom()}
				style={{
					padding: '8px 16px',
					background: '#667eea',
					color: 'white',
					border: 'none',
					borderRadius: '6px',
					cursor: 'pointer',
					fontSize: '14px',
					fontWeight: '500',
				}}
			>
				Leave Room
			</button>
		</div>
	)

	try {
		return (
			<>
				<HeaderComponent />
				<div 
					ref={rootRef} 
					style={{ 
						position: 'fixed', 
						inset: 0,
						paddingTop: '60px' // Account for header
					}}
				>
					<Tldraw
						options={options}
						store={store}
						maxAssetSize={10000000}
						tools={customTools}
						overrides={uiOverrides}
						maxImageDimension={Infinity}
						assetUrls={customAssetUrls}
						components={{
							...(drawOnWhiteboard
								? {
										CollaboratorCursor: null,
										CollaboratorHint: null,
										Toolbar: components.Toolbar,
								  }
								: {
										Toolbar: null,
										StylePanel: null,
										KeyboardShortcutsDialog: null,
										TopPanel: null,
										SelectionForeground: null,
										SelectionBackground: null,
										ActionsMenu: null,
										ContextMenu: null,
										Scribble: null,
										SharePanel: null,
								  }),
							...(stopFollowing ? { HelperButtons: null } : {}),
						}}
						onMount={(editor) => {
							editor.user.updateUserPreferences({
								name: params.username !== 'recorder' ? params.username : ``,
								color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
								...(params.participantId && { id: params.participantId }),
							})

							editor.setCameraOptions({
								wheelBehavior: scrollDisabled ? 'none' : 'pan',
								isLocked: cameraLock,
							})

							handleMount(editor)

							// Register unfurl handler for bookmarks
							editor.registerExternalAssetHandler('url', unfurlBookmarkUrl)
							editor.user.updateUserPreferences({})

							setTimeout(() => {
								const records = editor.store.allRecords()
								const presenceRecords = records.filter(
									(r) => r.typeName === 'instance_presence',
								) as TLInstancePresence[]

								if (params.participantIdToFollow) {
									const userToFollow = presenceRecords.find(
										(p) => p.userId === params.participantIdToFollow,
									)
									if (userToFollow) {
										editor.startFollowingUser(userToFollow.userId)
									}
								}
							}, 1000)
						}}
					></Tldraw>
				</div>
			</>
		)
	} catch (error) {
		return (
			<div
				style={{
					position: 'fixed',
					inset: 0,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#f0f0f0',
					color: '#ff0000',
					fontSize: '1.2rem',
					padding: '20px',
					textAlign: 'center',
				}}
			>
				<div style={{ marginBottom: '20px' }}>
					Connection Error: {(error as Error).message}
				</div>
				<button
					onClick={() => navigate('/')}
					style={{
						padding: '12px 24px',
						background: '#667eea',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						fontSize: '16px',
					}}
				>
					Back to Login
				</button>
			</div>
		)
	}
}

export default Whiteboard
