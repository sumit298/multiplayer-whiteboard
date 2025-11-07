"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
exports.Errors = {
    INVALID_TOKEN: {
        code: 4002,
        message: "'token' is empty or invalid or might have expired.",
    },
    INVALID_API_KEY: {
        code: 4001,
        message: "'apikey' provided in the token is empty or invalid, please verify it on the dashboard.",
    },
    INVALID_MEETING_ID: {
        code: 4003,
        message: "'meetingId' is empty or invalid, please verify it or generate new meetingId using the API.",
    },
    INVALID_PARTICIPANT_ID: {
        code: 4004,
        message: "'participantId' is empty or invalid, it shouldn't contain any whitespaces.",
    },
    DUPLICATE_PARTICIPANT: {
        code: 4005,
        message: "Leaving meeting, since this 'participantId' joined from another device.",
    },
    ACCOUNT_DEACTIVATED: {
        code: 4006,
        message: "It seems your account is deactivated by VideoSDK for some reason, you can reach out to us at support@videosdk.live.",
    },
    ACCOUNT_DISCONTINUED: {
        code: 4007,
        message: "Your account has been discontinued.",
    },
    INVALID_PERMISSIONS: {
        code: 4008,
        message: "'permissions' provided in the token are invalid, please don't use 'allow_join' or 'allow_mod' with 'ask_join'.",
    },
    MAX_PARTCIPANT_REACHED: {
        code: 4009,
        message: "'You have reached max partcipant limit in a meeting. To increase contact at support@videosdk.live'",
    },
    MAX_SPEAKER_REACHED: {
        code: 4010,
        message: "'You have reached max speaker limit in a meeting. To increase contact at support@videosdk.live'",
    },
    START_RECORDING_FAILED: {
        code: 4011,
        message: "Recording start request failed due to an unknown error.",
    },
    STOP_RECORDING_FAILED: {
        code: 4012,
        message: "Recording stop request failed due to an unknown error.",
    },
    START_LIVESTREAM_FAILED: {
        code: 4013,
        message: "Livestream start request failed due to an unknown error.",
    },
    STOP_LIVESTREAM_FAILED: {
        code: 4014,
        message: "Livestream stop request failed due to an unknown error.",
    },
    INVALID_LIVESTREAM_CONFIG: {
        code: 4015,
        message: "Livestream 'outputs' configuration provided was invalid.",
    },
    START_HLS_FAILED: {
        code: 4016,
        message: "HLS start request failed due to an unknown error.",
    },
    STOP_HLS_FAILED: {
        code: 4017,
        message: "HLS stop request failed due to an unknown error.",
    },
    PREV_RECORDING_PROCESSING: {
        code: 4018,
        message: "Previous recording session is being processed, please try again after few seconds!",
    },
    PREV_RTMP_RECORDING_PROCESSING: {
        code: 4019,
        message: "Previous RTMP recording session is being processed, please try again after few seconds!",
    },
    PREV_HLS_STREAMING_PROCESSING: {
        code: 4020,
        message: "Previous HLS streaming session is being processed, please try again after few seconds!",
    },
    ADD_ON_SERVICES_DISABLED: {
        code: 4021,
        message: "Add-On services are disabled for your account! Please contact us at support@videosdk.live.",
    },
    UNAUTHORIZED_MEETING_ID: {
        code: 4022,
        message: "'token' is not valid for the provided meetingId",
    },
    UNAUTHORIZED_PARTCIPANT_ID: {
        code: 4023,
        message: "'token' is not valid for the provided participantId",
    },
    UNAUTHORIZED_ROLE: {
        code: 4024,
        message: "Role provided in 'token' is not valid for joining the meeting",
    },
    UNAUTHORIZED_REQUEST: {
        code: 4025,
        message: "Your request does not match the security configuration",
    },
    // Errors for organization limit
    MAX_SPEAKER_LIMIT_REACHED_ON_ORGANIZATION: {
        code: 4026,
        message: "You have reached max speaker limit on organization. To increase contact at support@videosdk.live",
    },
    MAX_VIEWER_LIMIT_REACHED_ON_ORGANIZATION: {
        code: 4027,
        message: "You have reached max viewer limit on organization. To increase contact at support@videosdk.live",
    },
    MAX_RECORDING_LIMIT_REACHED_ON_ORGANIZATION: {
        code: 4028,
        message: "You have reached max limit of recording on organization. To increase contact at support@videosdk.live",
    },
    MAX_HLS_LIMIT_REACHED_ON_ORGANIZATION: {
        code: 4029,
        message: "You have reached max limit of hls on organization. To increase contact at support@videosdk.live",
    },
    MAX_LIVESTREAM_LIMIT_REACHED_ON_ORGANIZATION: {
        code: 4030,
        message: "You have reached max limit of livestream on organization. To increase contact at support@videosdk.live",
    },
    START_TRANSCRIPTION_FAILED: {
        code: 4031,
        message: "Transcription start request failed due to an unknown error.",
    },
    STOP_TRANSCRIPTION_FAILED: {
        code: 4032,
        message: "Transcription stop request failed due to an unknown error.",
    },
    CHARACTER_JOIN_FAILED: {
        code: 4033,
        message: "Character Join request failed due to an unknown error.",
    },
    CHARACTER_LEAVE_FAILED: {
        code: 4034,
        message: "Character leave request failed due to an unknown error.",
    },
    START_PARTICIPANT_RECORDING_FAILED: {
        code: 4035,
        message: "Participant recording start request failed due to an unknown error.",
    },
    STOP_PARTICIPANT_RECORDING_FAILED: {
        code: 4036,
        message: "Participant recording stop request failed due to an unknown error.",
    },
    START_TRACK_RECORDING_FAILED: {
        code: 4037,
        message: "Track recording start request failed due to an unknown error.",
    },
    STOP_TRACK_RECORDING_FAILED: {
        code: 4038,
        message: "Track recording stop request failed due to an unknown error.",
    },
    START_COMPOSITE_RECORDING_FAILED: {
        code: 4039,
        message: "Composite recording start request failed due to an unknown error.",
    },
    STOP_COMPPOSITE_RECORDING_FAILED: {
        code: 4040,
        message: "Composite recording stop request failed due to an unknown error.",
    },
    // Critical errors
    RECORDING_FAILED: {
        code: 5001,
        message: "Recording stopped due to an unknown error.",
    },
    LIVESTREAM_FAILED: {
        code: 5002,
        message: "Livestream stopped due to an unknown error.",
    },
    HLS_FAILED: {
        code: 5003,
        message: "HLS stopped due to an unknown error.",
    },
    RECORDING_DURATION_LIMIT_REACHED: {
        code: 5004,
        generateMessage: ({ maxHoursLimit }) => {
            return `Recording has been automatically stopped by the system, due to max duration limit of ${maxHoursLimit} hours reached for a single Recording`;
        },
    },
    LIVESTREAM_DURATION_LIMIT_REACHED: {
        code: 5005,
        generateMessage: ({ maxHoursLimit }) => {
            return `Livestream has been automatically stopped by the system, due to max duration limit of ${maxHoursLimit} hours reached for a single RTMP`;
        },
    },
    HLS_DURATION_LIMIT_REACHED: {
        code: 5006,
        generateMessage: ({ maxHoursLimit }) => {
            return `Hls has been automatically stopped by the system, due to max duration limit of ${maxHoursLimit} hours reached for a single HLS`;
        },
    },
    TRANSCRIPTION_FAILED: {
        code: 5007,
        message: "Transcription Failed due to an unknown error",
    },
    CHARACTER_FAILED: {
        code: 5008,
        message: "Character Interaction Failed due to an unknown error",
    },
    PARTICIPANT_RECORDING_DURATION_LIMIT_REACHED: {
        code: 5009,
        generateMessage: ({ maxHoursLimit }) => {
            return `Participant recording has been automatically stopped by the system, due to max duration limit of ${maxHoursLimit} hours reached for a single Participant recording`;
        },
    },
    TRACK_RECORDING_DURATION_LIMIT_REACHED: {
        code: 5010,
        generateMessage: ({ maxHoursLimit }) => {
            return `Track recording has been automatically stopped by the system, due to max duration limit of ${maxHoursLimit} hours reached for a single Track recording`;
        },
    },
    COMPOSITE_RECORDING_DURATION_LIMIT_REACHED: {
        code: 5011,
        generateMessage: ({ maxHoursLimit }) => {
            return `Composite recording has been automatically stopped by the system, due to max duration limit of ${maxHoursLimit} hours reached for a single Composite recording`;
        },
    },
    PARTICIPANT_RECORDING_FAILED: {
        code: 5012,
        message: "Participant recording stopped due to an unknown error.",
    },
    TRACK_RECORDING_FAILED: {
        code: 5013,
        message: "Track recording stopped due to an unknown error.",
    },
    COMPOSITE_RECORDING_FAILED: {
        code: 5014,
        message: "Composite recording stopped due to an unknown error.",
    },
};
