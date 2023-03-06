import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import {
	ControllerRequest,
	ControllerRequestConnect,
	ControllerRequestConnectResponse,
	ControllerRequestPublish,
	ControllerRequestPublishResponse,
	ControllerRequestRepublish,
	ControllerRequestRepublishResponse,
	ControllerRequestResponse
} from "./interfaces/controller-request.interface"
import { TypedRequestBody, TypedResponse } from "./interfaces/express.interface"
import { PresetsEnum } from "./interfaces/presets.enum"
import { segmenterChannelCreate, segmenterKmpUrl, setupSegmenterTrack } from "./segmenter"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3000

function parseMpegtsStreamId(streamId: string): { channelId: string; preset: PresetsEnum; streamKey: string } {
	const parsedStreamId = Buffer.from(streamId, "base64").toString("utf8")
	// stream key format: <channel_id>:<streamKey> or lls_<channel_id>:<streamKey> for low latency preset
	const [rawChannelId, streamKey] = parsedStreamId.split(":")

	let channelId: string
	let preset: PresetsEnum

	if (rawChannelId.startsWith("lls_")) {
		channelId = rawChannelId.replace("lls_", "")
		preset = PresetsEnum.LOW_LATENCY
	} else {
		channelId = rawChannelId
		preset = PresetsEnum.MAIN
	}

	return { channelId, preset, streamKey }
}

async function handleConnect(body: ControllerRequestConnect): Promise<ControllerRequestConnectResponse> {
	try {
		const { input_type } = body

		let preset: PresetsEnum | null = null
		let channel_id: string | null = null
		let stream_key: string | null = null

		if (input_type === "mpegts") {
			const parsedStreamId = parseMpegtsStreamId(body.mpegts.stream_id)
			preset = parsedStreamId.preset
			channel_id = parsedStreamId.channelId
			stream_key = parsedStreamId.streamKey
		}

		if (!channel_id || !preset || !stream_key) {
			throw new Error("Invalid stream id")
		}

		// TODO: Add logic to handle connect event

		return {
			code: "ok",
			message: "Channel created"
		}
	} catch (error) {
		return {
			code: "error",
			message: "Error while parsing stream id"
		}
	}
}

async function handlePublish(body: ControllerRequestPublish): Promise<ControllerRequestPublishResponse> {
	try {
		const { input_type, media_info } = body

		let preset: PresetsEnum | null = null
		let channel_id: string | null = null
		let stream_key: string | null = null

		if (input_type === "mpegts") {
			const parsedStreamId = parseMpegtsStreamId(body.mpegts.stream_id)
			preset = parsedStreamId.preset
			channel_id = parsedStreamId.channelId
			stream_key = parsedStreamId.streamKey
		}

		if (!channel_id || !preset || !stream_key) {
			throw new Error("Invalid stream id")
		}

		const track_id = `${media_info.media_type}_${preset}`

		await segmenterChannelCreate(channel_id, preset)
		await setupSegmenterTrack(channel_id, preset, track_id, media_info.media_type)

		return {
			code: "ok",
			channel_id,
			track_id,
			upstreams: [
				{
					id: "main",
					url: segmenterKmpUrl
				}
			]
		}
	} catch (error) {
		return {
			code: "error",
			message: "Error while parsing stream id"
		}
	}
}

function handleRepublish(_body: ControllerRequestRepublish): ControllerRequestRepublishResponse {
	return {
		code: "ok",
		url: segmenterKmpUrl
	}
}

app.get(
	"/controller",
	async (
		req: TypedRequestBody<ControllerRequest>,
		res: TypedResponse<ControllerRequestResponse | { code: "ok" | "error"; message: string }>
	) => {
		const { event_type } = req.body

		switch (event_type) {
			case "connect":
				return res.json(await handleConnect(req.body))
			case "publish":
				return res.json(await handlePublish(req.body))
			case "republish":
				return res.json(handleRepublish(req.body))
			case "unpublish":
				return res.json({ code: "ok", message: "" })
		}
	}
)

app.get("/", (req: Request, res: Response) => {
	res.send("Express + TypeScript Server")
})

app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
