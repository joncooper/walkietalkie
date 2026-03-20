export interface RealtimeSession {
  id: string;
  object: string;
  model: string;
  instructions: string;
  voice: string;
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
    create_response: boolean;
    interrupt_response: boolean;
  } | null;
}

export interface RealtimeError {
  type: string;
  code: string;
  message: string;
}

export type RealtimeServerEvent =
  | { type: "session.created"; event_id: string; session: RealtimeSession }
  | { type: "session.updated"; event_id: string; session: RealtimeSession }
  | { type: "input_audio_buffer.speech_started"; event_id: string; audio_start_ms: number }
  | { type: "input_audio_buffer.speech_stopped"; event_id: string; audio_end_ms: number }
  | { type: "input_audio_buffer.committed"; event_id: string; item_id: string }
  | { type: "input_audio_buffer.cleared"; event_id: string }
  | { type: "conversation.created"; event_id: string }
  | { type: "conversation.item.created"; event_id: string; item: unknown }
  | { type: "conversation.item.done"; event_id: string; item: unknown }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      event_id: string;
      transcript: string;
    }
  | {
      type: "conversation.item.input_audio_transcription.failed";
      event_id: string;
      error: RealtimeError;
    }
  | { type: "response.created"; event_id: string; response: unknown }
  | { type: "response.started"; event_id: string; response: unknown }
  | { type: "response.done"; event_id: string; response: unknown }
  | { type: "response.output_item.added"; event_id: string; item: unknown }
  | { type: "response.output_item.done"; event_id: string; item: unknown }
  | { type: "response.audio.delta"; event_id: string; delta: string }
  | { type: "response.audio.done"; event_id: string }
  | { type: "response.audio_transcript.delta"; event_id: string; delta: string }
  | { type: "response.audio_transcript.done"; event_id: string; transcript: string }
  | { type: "response.text.delta"; event_id: string; delta: string }
  | { type: "response.text.done"; event_id: string; text: string }
  | { type: "output_audio_buffer.started"; event_id: string }
  | { type: "output_audio_buffer.stopped"; event_id: string }
  | { type: "output_audio_buffer.cleared"; event_id: string }
  | { type: "error"; event_id: string; error: RealtimeError };

export type RealtimeClientEvent =
  | {
      type: "session.update";
      session: {
        instructions?: string;
        voice?: string;
        turn_detection?: {
          type: "server_vad";
          threshold?: number;
          prefix_padding_ms?: number;
          silence_duration_ms?: number;
          create_response?: boolean;
          interrupt_response?: boolean;
        } | null;
        input_audio_transcription?: {
          model: string;
        };
      };
    }
  | { type: "input_audio_buffer.append"; audio: string }
  | { type: "input_audio_buffer.commit" }
  | { type: "input_audio_buffer.clear" }
  | { type: "response.create" }
  | { type: "response.cancel" };
