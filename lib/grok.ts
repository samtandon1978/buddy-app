const REALTIME_BASE_URL = "wss://api.x.ai/v1/realtime";
const DEFAULT_MODEL = "grok-voice-latest";
const DEFAULT_SAMPLE_RATE = 24000;
const DEBUG = true;

export type GrokVoiceModel =
  | "grok-voice-latest"
  | "grok-voice-think-fast-1.0"
  | "grok-voice-fast-1.0";

export type GrokVoice = "eve" | "ara" | "rex" | "sal" | "leo" | (string & {});

export type GrokConnectionState = "disconnected" | "connecting" | "connected";

export type GrokTranscriptRole = "user" | "assistant";

export type GrokSessionConfig = {
  instructions?: string;
  voice?: GrokVoice;	
  turnDetection?: {
    type: "server_vad";
    silence_duration_ms?: number;
    prefix_padding_ms?: number;
  } | {
    type: null;
  };
  sampleRate?: number;
  transcriptionModel?: "grok-transcribe";
  languageHint?: string;
  reasoningEffort?: "high" | "none";
};

export type GrokTranscriptMessage = {
  role: GrokTranscriptRole;
  text: string;
  isFinal: boolean;
  itemId?: string;
  responseId?: string;
};

export type GrokAudioMessage = {
  audio: ArrayBuffer;
  responseId?: string;
  isFinal: boolean;
};

export type GrokServiceCallbacks = {
  onConnected?: () => void;
  onDisconnected?: (event: CloseEvent) => void;
  onError?: (error: Error) => void;
  onSessionCreated?: (session: unknown) => void;
  onSessionUpdated?: (session: unknown) => void;
  onTranscript?: (message: GrokTranscriptMessage) => void;
  onAudio?: (message: GrokAudioMessage) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onResponseStarted?: (responseId: string) => void;
  onResponseDone?: (responseId: string) => void;
};

export type GrokServiceOptions = {
  token: string;
  model?: GrokVoiceModel;
  session?: GrokSessionConfig;
  callbacks?: GrokServiceCallbacks;
};

type RealtimeEvent = {
  type: string;
  [key: string]: unknown;
};

export function buildRealtimeUrl(
  model: GrokVoiceModel = DEFAULT_MODEL,
  params?: Record<string, string>,
): string {
  const searchParams = new URLSearchParams({ model, ...params });
  return `${REALTIME_BASE_URL}?${searchParams.toString()}`;
}

export function float32ToPcm16Buffer(samples: Float32Array): ArrayBuffer {
  const pcm16 = new Int16Array(samples.length);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    pcm16[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return pcm16.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

export function resampleAudio(
  samples: Float32Array,
  inputRate: number,
  outputRate: number,
): Float32Array {
  if (inputRate === outputRate) {
    return samples;
  }

  const ratio = inputRate / outputRate;
  const outputLength = Math.max(1, Math.round(samples.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(leftIndex + 1, samples.length - 1);
    const fraction = sourceIndex - leftIndex;
    const leftSample = samples[leftIndex] ?? 0;
    const rightSample = samples[rightIndex] ?? leftSample;
    output[index] = leftSample + (rightSample - leftSample) * fraction;
  }

  return output;
}

function assertBrowserEnvironment(): void {
  if (typeof window === "undefined") {
    throw new Error("GrokRealtimeService must run in a browser environment.");
  }
}

function buildSessionUpdateEvent(session: GrokSessionConfig): RealtimeEvent {
  const sampleRate = session.sampleRate ?? DEFAULT_SAMPLE_RATE;

  return {
    type: "session.update",
    session: {
      instructions: session.instructions,
      voice: session.voice ?? "leo",
      turn_detection:
  session.turnDetection ?? {
    type: "server_vad",
    silence_duration_ms: 1500,
    prefix_padding_ms: 500,
  },
      reasoning: session.reasoningEffort
        ? { effort: session.reasoningEffort }
        : undefined,
      audio: {
        input: {
          format: {
            type: "audio/pcm",
            rate: sampleRate,
          },
          transcription: {
            model: session.transcriptionModel ?? "grok-transcribe",
            language_hint: session.languageHint,
          },
        },
        output: {
          format: {
            type: "audio/pcm",
            rate: sampleRate,
          },
        },
      },
    },
  };
}

export class GrokRealtimeService {
  private readonly token: string;
  private readonly model: GrokVoiceModel;
  private readonly callbacks: GrokServiceCallbacks;
  private sessionConfig: GrokSessionConfig;

  private socket: WebSocket | null = null;
  private connectionState: GrokConnectionState = "disconnected";

  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isMicrophoneActive = false;

  constructor(options: GrokServiceOptions) {
    this.token = options.token;
    this.model = options.model ?? DEFAULT_MODEL;
    this.sessionConfig = options.session ?? {};
    this.callbacks = options.callbacks ?? {};
  }

  getConnectionState(): GrokConnectionState {
    return this.connectionState;
  }

  getIsMicrophoneActive(): boolean {
    return this.isMicrophoneActive;
  }

  updateSessionConfig(session: GrokSessionConfig): void {
    this.sessionConfig = { ...this.sessionConfig, ...session };

    if (this.connectionState === "connected") {
      this.sendEvent(buildSessionUpdateEvent(this.sessionConfig));
    }
  }

  connect(): Promise<void> {
    assertBrowserEnvironment();

    if (this.connectionState === "connected" || this.connectionState === "connecting") {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.connectionState = "connecting";

      const url = buildRealtimeUrl(this.model);
      const socket = new WebSocket(url, [`xai-client-secret.${this.token}`]);
      this.socket = socket;

      socket.onopen = () => {
        this.connectionState = "connected";
        this.sendEvent(buildSessionUpdateEvent(this.sessionConfig));
        this.callbacks.onConnected?.();
        resolve();
      };

      socket.onmessage = (messageEvent) => {
        this.handleServerEvent(messageEvent.data);
      };

      socket.onerror = () => {
        const error = new Error("Grok realtime WebSocket connection failed.");
        this.callbacks.onError?.(error);
        reject(error);
      };

      socket.onclose = (closeEvent) => {
        this.connectionState = "disconnected";
        this.socket = null;
        this.callbacks.onDisconnected?.(closeEvent);
      };
    });
  }

  disconnect(): void {
    this.stopMicrophone();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.connectionState = "disconnected";
  }

  async startMicrophone(): Promise<void> {
    assertBrowserEnvironment();

    if (this.connectionState !== "connected") {
      throw new Error("Connect to Grok before starting the microphone.");
    }

    if (this.isMicrophoneActive) {
      return;
    }

    const sampleRate = this.sessionConfig.sampleRate ?? DEFAULT_SAMPLE_RATE;
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

;

    this.audioContext = new AudioContext({ sampleRate });
    this.mediaSource = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

 this.processorNode.onaudioprocess = (event) => {



  if (!this.isMicrophoneActive || this.connectionState !== "connected") {
    return;
  }

      const input = event.inputBuffer.getChannelData(0);
      const actualRate = this.audioContext?.sampleRate ?? sampleRate;
      const resampled =
        actualRate === sampleRate
          ? input
          : resampleAudio(input, actualRate, sampleRate);
      const pcm16 = float32ToPcm16Buffer(resampled);

      this.appendInputAudio(pcm16);
    };

    this.mediaSource.connect(this.processorNode);

this.processorNode.connect(this.audioContext.destination);
    this.isMicrophoneActive = true;
  }

  stopMicrophone(): void {
    this.isMicrophoneActive = false;

    this.processorNode?.disconnect();
    this.mediaSource?.disconnect();
    this.processorNode = null;
    this.mediaSource = null;

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }

  sendText(text: string): void {
    this.sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    this.sendEvent({ type: "response.create" });
  }

appendInputAudio(audio: ArrayBuffer): void {



  this.sendEvent({
    type: "input_audio_buffer.append",
    audio: arrayBufferToBase64(audio),
  });
}

  commitInputAudio(): void {
    this.sendEvent({ type: "input_audio_buffer.commit" });
  }

  clearInputAudio(): void {
    this.sendEvent({ type: "input_audio_buffer.clear" });
  }

  requestResponse(): void {
    this.sendEvent({ type: "response.create" });
  }

  private sendEvent(event: RealtimeEvent): void {
    if (!this.socket || this.connectionState !== "connected") {
      throw new Error("Grok realtime WebSocket is not connected.");
    }

    this.socket.send(JSON.stringify(event));
  }

  private handleServerEvent(rawData: unknown): void {
    if (typeof rawData !== "string") {
      return;
    }

    let event: RealtimeEvent;

    try {
      event = JSON.parse(rawData) as RealtimeEvent;
     
if (event.type !== "response.output_audio.delta") {
  const importantEvents = [
  "session.created",
  "input_audio_buffer.speech_started",
  "input_audio_buffer.speech_stopped",
  "response.created",
  "response.done",
  "error",
];

if (importantEvents.includes(event.type)) {
  console.log("GROK EVENT:", event.type);
}
};
}
catch {
      this.callbacks.onError?.(new Error("Received invalid JSON from Grok realtime API."));
      return;
    }

    switch (event.type) {
      case "session.created":
        this.callbacks.onSessionCreated?.(event.session);
        break;

      case "session.updated":
        this.callbacks.onSessionUpdated?.(event.session);
        break;

      case "input_audio_buffer.speech_started":
        this.callbacks.onSpeechStarted?.();
        break;

      case "input_audio_buffer.speech_stopped":
        this.callbacks.onSpeechStopped?.();
        break;

      case "conversation.item.input_audio_transcription.updated":
        this.callbacks.onTranscript?.({
          role: "user",
          text: String(event.transcript ?? ""),
          isFinal: false,
          itemId: typeof event.item_id === "string" ? event.item_id : undefined,
        });
        break;

      case "conversation.item.input_audio_transcription.completed":
  this.callbacks.onTranscript?.({
    role: "user",
    text: String(event.transcript ?? ""),
    isFinal: true,
    itemId:
      typeof event.item_id === "string"
        ? event.item_id
        : undefined,
  });

  break;

      case "response.created":
        if (typeof event.response_id === "string") {
          this.callbacks.onResponseStarted?.(event.response_id);
        }
        break;

      case "response.output_audio_transcript.delta":
        this.callbacks.onTranscript?.({
          role: "assistant",
          text: String(event.delta ?? ""),
          isFinal: false,
          responseId:
            typeof event.response_id === "string" ? event.response_id : undefined,
        });
        break;

      case "response.output_audio_transcript.done":
        this.callbacks.onTranscript?.({
          role: "assistant",
          text: String(event.transcript ?? ""),
          isFinal: true,
          responseId:
            typeof event.response_id === "string" ? event.response_id : undefined,
        });
        break;

      case "response.output_audio.delta":
        if (typeof event.delta === "string" && event.delta.length > 0) {
          this.callbacks.onAudio?.({
            audio: base64ToArrayBuffer(event.delta),
            responseId:
              typeof event.response_id === "string" ? event.response_id : undefined,
            isFinal: false,
          });
        }
        break;

      case "response.output_audio.done":
        this.callbacks.onAudio?.({
          audio: new ArrayBuffer(0),
          responseId:
            typeof event.response_id === "string" ? event.response_id : undefined,
          isFinal: true,
        });
        break;

      case "response.done":
        if (typeof event.response_id === "string") {
          this.callbacks.onResponseDone?.(event.response_id);
        }
        break;

      case "error":
        this.callbacks.onError?.(
          new Error(
            typeof event.message === "string"
              ? event.message
              : "Grok realtime API returned an error.",
          ),
        );
        break;

      default:
        break;
    }
  }
}

export function createGrokService(options: GrokServiceOptions): GrokRealtimeService {
  return new GrokRealtimeService(options);
}
