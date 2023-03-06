interface MediaInfoVideo {
	media_type: "video"
	bitrate: number
	codec_id: number
	extra_data: string
	width: number
	height: number
	frame_rate: number
}

interface MediaInfoAudio {
	media_type: "audio"
	bitrate: number
	codec_id: number
	extra_data: string
	channels: number
	channel_layout: string
	bits_per_sample: number
	sample_rate: number
}

type MediaInfo = MediaInfoVideo | MediaInfoAudio

interface MpegtsInput {
	input_type: "mpegts"
	mpegts: {
		stream_id: string
		pid: number
		index: number
		prog_num: number
		addr: string
		connection: number
	}
}

interface RtmpInput {
	input_type: "rtmp"
	rtmp: {
		app: string
		flashver: string
		swf_url: string
		tc_url: string
		page_url: string
		addr: string
		connection: number
		name: string
		type: string
		args: string
	}
}

type ControllerRequestConnectMpegts = {
	event_type: "connect"
} & MpegtsInput

type ControllerRequestConnectRtmp = {
	event_type: "connect"
} & RtmpInput

export type ControllerRequestConnect = ControllerRequestConnectMpegts | ControllerRequestConnectRtmp

interface ControllerRequestConnectResponseOk {
	code: "ok"
	message?: string
}

interface ControllerRequestConnectResponseError {
	code: "error"
	message?: string
}

export type ControllerRequestConnectResponse =
	| ControllerRequestConnectResponseOk
	| ControllerRequestConnectResponseError

type ControllerRequestPublishMpegts = {
	event_type: "publish"
	input_id: string
	media_info: MediaInfo
} & MpegtsInput

type ControllerRequestPublishRtmp = {
	event_type: "publish"
	input_id: string
	media_info: MediaInfo
} & RtmpInput

export type ControllerRequestPublish = ControllerRequestPublishMpegts | ControllerRequestPublishRtmp

interface ControllerRequestPublishResponseOk {
	code: "ok"
	channel_id: string
	track_id: string
	upstreams: {
		url: string
		id?: string
		required?: boolean
		resume_from?: "last_acked" | "last_sent" | "last_written"
	}[]
	connect_data?: string
}

interface ControllerRequestPublishResponseError {
	code: "error"
	message?: string
}

export type ControllerRequestPublishResponse =
	| ControllerRequestPublishResponseOk
	| ControllerRequestPublishResponseError

export interface ControllerRequestUnpublish {
	event_type: "unpublish"
	input_id: string
	reason:
		| "alloc_failed"
		| "append_failed"
		| "create_publish_failed"
		| "create_upstream_failed"
		| "parse_publish_failed"
		| "upstream_error"
		| string
}

type ControllerRequestRepublishMpegts = {
	event_type: "republish"
	id: string
	input_id: string
	channel_id: string
	track_id: string
	media_info: MediaInfo
} & MpegtsInput

type ControllerRequestRepublishRtmp = {
	event_type: "republish"
	id: string
	input_id: string
	channel_id: string
	track_id: string
	media_info: MediaInfo
} & RtmpInput

export type ControllerRequestRepublish = ControllerRequestRepublishMpegts | ControllerRequestRepublishRtmp

interface ControllerRequestRepublishResponseOk {
	code: "ok"
	url: string
	connect_data?: string
}

interface ControllerRequestRepublishResponseError {
	code: "error"
	message?: string
}

export type ControllerRequestRepublishResponse =
	| ControllerRequestRepublishResponseOk
	| ControllerRequestRepublishResponseError

export type ControllerRequest =
	| ControllerRequestConnect
	| ControllerRequestPublish
	| ControllerRequestUnpublish
	| ControllerRequestRepublish

export type ControllerRequestResponse =
	| ControllerRequestConnectResponse
	| ControllerRequestPublishResponse
	| ControllerRequestRepublishResponse
