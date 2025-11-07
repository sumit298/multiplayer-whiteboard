import { StateNode } from 'tldraw'
import jsPDF from 'jspdf'

declare global {
	interface Window {
		ReactNativeWebView?: {
			postMessage: (message: string) => void
		}
	}
}

export class ExportPdfTool extends StateNode {
	static id = 'exportPdf'

	override onEnter = () => {
		this.exportPdf()
	}

	private async exportPdf() {
		const { editor } = this

		try {
			const images = await Promise.all(
				editor
					.getPages()
					?.map((p) => editor.getPageShapeIds(p.id))
					.map(async (ids, index) => {
						if (ids.size === 0) return { pageIndex: index, data: 'empty page' }
						const image = await editor.toImage([...ids], { format: 'jpeg' })
						return { pageIndex: index, data: image }
					}),
			)

			// Filter out empty pages
			const validImages = images.filter((item) => item.data !== 'empty page')

			if (validImages.length === 0) {
				console.warn('No content to export')
				this.editor.setCurrentTool('select')
				return
			}

			// Create PDF with first page dimensions
			const firstImage = validImages[0].data as any
			const { width, height } = firstImage

			// Convert pixels to mm (assuming 96 DPI)
			const widthMM = (width * 25.4) / 96
			const heightMM = (height * 25.4) / 96

			const pdf = new jsPDF({
				orientation: width > height ? 'landscape' : 'portrait',
				unit: 'mm',
				format: [widthMM, heightMM],
			})

			let isFirstPage = true

			for (const item of validImages) {
				if (typeof item.data !== 'string') {
					const { blob, width: imgWidth, height: imgHeight } = item.data

					// Convert blob to base64
					const base64 = await this.blobToBase64(blob)

					// Add new page if not the first page
					if (!isFirstPage) {
						const pageWidthMM = (imgWidth * 25.4) / 96
						const pageHeightMM = (imgHeight * 25.4) / 96
						pdf.addPage(
							[pageWidthMM, pageHeightMM],
							imgWidth > imgHeight ? 'landscape' : 'portrait',
						)
					}

					// Add image to PDF
					const currentPageWidthMM = (imgWidth * 25.4) / 96
					const currentPageHeightMM = (imgHeight * 25.4) / 96

					pdf.addImage(
						base64,
						'JPEG',
						0,
						0,
						currentPageWidthMM,
						currentPageHeightMM,
					)

					isFirstPage = false
				}
			}

			// Check if we're in a WebView (React Native)
			const isWebView = window.ReactNativeWebView !== undefined

			if (isWebView && window.ReactNativeWebView) {
				// Send PDF data to React Native
				const pdfBase64 = pdf.output('datauristring').split(',')[1] // Get base64 without data URI prefix

				window.ReactNativeWebView.postMessage(
					JSON.stringify({
						type: 'pdf_export',
						data: {
							base64: pdfBase64,
							filename: `exported_whiteboard_${new Date()
								.toISOString()
								.slice(0, 19)
								.replace(/[:.]/g, '-')}.pdf`,
						},
					}),
				)
			} else {
				// Normal web browser - use regular download
				pdf.save(`exported_whiteboard_${new Date().toISOString()}.pdf`)
			}

			// Switch back to select tool after export is complete
			this.editor.setCurrentTool('select')
		} catch (error) {
			console.error('Error exporting PDF:', error)
			// Switch back to select tool even if there's an error
			this.editor.setCurrentTool('select')
		}
	}

	private async blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => {
				const result = reader.result as string
				// Remove the data URL prefix to get just the base64 data
				const base64 = result.split(',')[1]
				resolve(base64)
			}
			reader.onerror = reject
			reader.readAsDataURL(blob)
		})
	}
}
