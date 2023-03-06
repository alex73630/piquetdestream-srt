import dotenv from "dotenv"
import { PresetsEnum } from "./interfaces/presets.enum"
dotenv.config()

export const segmenterKmpPort = process.env.SEGMENTER_KMP_PORT || 8003
export const segmenterKmpUrl = `kmp://${process.env.SEGMENTER_KMP_HOST || "127.0.0.1"}:${segmenterKmpPort}`
export const segmenterKmpApiUrl = `http://${process.env.SEGMENTER_KMP_HOST || "127.0.0.1"}/api/live`
export const rtmpOutKmpUrl = `kmp://${process.env.RTMP_OUT_KMP_HOST || "127.0.0.1"}:${
	process.env.RTMP_OUT_KMP_PORT || 8005
}`

export async function segmenterChannelCreate(channelId: string, preset: PresetsEnum) {
	try {
		await fetch(`${segmenterKmpApiUrl}/channels`, {
			method: "POST",
			body: JSON.stringify({
				id: channelId,
				preset,
				initial_segment_index: Math.round(new Date().getTime() / 1000)
			}),
			headers: {
				"Content-Type": "application/json"
			}
		})

		await fetch(`${segmenterKmpApiUrl}/channels/${channelId}/timelines`, {
			method: "POST",
			body: JSON.stringify({
				id: "main",
				active: true,
				max_segments: 20,
				max_manifest_segments: 10
			}),
			headers: {
				"Content-Type": "application/json"
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function segmenterTrackCreate(channelId: string, trackId: string, mediaType: string) {
	try {
		await fetch(`${segmenterKmpApiUrl}/channels/${channelId}/tracks`, {
			method: "POST",
			body: JSON.stringify({
				id: trackId,
				media_type: mediaType
			}),
			headers: {
				"Content-Type": "application/json"
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function segmenterVariantCreate(
	channelId: string,
	variantId: string,
	tracksIds?: Record<string, unknown>,
	role?: string,
	label?: string,
	lang?: string
) {
	try {
		await fetch(`${segmenterKmpApiUrl}/channels/${channelId}/variants`, {
			method: "POST",
			body: JSON.stringify({
				id: variantId,
				tracks_ids: tracksIds,
				role,
				label,
				lang
			}),
			headers: {
				"Content-Type": "application/json"
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function segmenterVariantAddTrack(channelId: string, variantId: string, trackId: string) {
	try {
		await fetch(`${segmenterKmpApiUrl}/channels/${channelId}/variants/${variantId}/tracks`, {
			method: "POST",
			body: JSON.stringify({
				id: trackId
			}),
			headers: {
				"Content-Type": "application/json"
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function getRtmpOutUpstream(rtmpOutUrl: string) {
	const connectData = {
		url: rtmpOutUrl,
		upstream_id: "rtmp"
	}

	return {
		id: "rtmp-out",
		url: segmenterKmpUrl,
		required: false,
		resume_from: "last_written",
		connect_data: Buffer.from(JSON.stringify(connectData), "base64").toString("base64")
	}
}

export async function setupSegmenterTrack(channelId: string, variantId: string, trackId: string, mediaType: string) {
	try {
		await Promise.all([
			segmenterVariantCreate(channelId, variantId),
			segmenterTrackCreate(channelId, trackId, mediaType),
			segmenterVariantAddTrack(channelId, variantId, trackId)
		])
	} catch (error) {
		console.error(error)
		throw error
	}
}
