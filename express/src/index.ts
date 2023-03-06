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
import bodyParser from "body-parser"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 3000
app.use(bodyParser.json())

if (!process.env.WEBAPP_API) {
	throw new Error("WEBAPP_API env variable is not set")
}

function parseMpegtsStreamId(streamId: string): { channelId: string; preset: PresetsEnum; streamKey: string } {
	const parsedStreamId = Buffer.from(streamId, "base64").toString("utf8")
	// stream key format: <channel_id>:<streamKey> or lls_<channel_id>:<streamKey> for low latency preset
	const [rawChannelId, streamKey] = parsedStreamId.split(":")

	let channelId: string
	let preset: PresetsEnum

	if (rawChannelId.startsWith("ll_")) {
		channelId = rawChannelId.replace("ll_", "")
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
			throw new Error("[Connect] Invalid stream id")
		}

		const checkValidKeyResp = await fetch(`${process.env.WEBAPP_API}/api/srt/check-key`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				channel_id,
				stream_key
			})
		})

		if (!checkValidKeyResp.ok) {
			throw new Error("[Connect] Invalid stream key")
		}

		return {
			code: "ok",
			message: "Channel created"
		}
	} catch (error) {
		console.error(error)
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
			throw new Error("[Publish] Invalid stream id")
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
		console.error(error)
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

app.post(
	"/controller",
	async (
		req: TypedRequestBody<ControllerRequest>,
		res: TypedResponse<ControllerRequestResponse | { code: "ok" | "error"; message: string }>
	) => {
		try {
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
		} catch (error) {
			console.error("[Controller] Error while handling request", error)
			return res.json({ code: "error", message: "Error while handling request" })
		}
	}
)

app.get("/", (req: Request, res: Response) => {
	res.send("Controller is running")
})

app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
