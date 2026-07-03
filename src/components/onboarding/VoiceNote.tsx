'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceNoteProps {
  onRecorded?: (blob: Blob, durationSec: number) => void;
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export function VoiceNote({ onRecorded, className }: VoiceNoteProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const dur = Math.round((Date.now() - startTime.current) / 1000);
        setDuration(dur);
        setState('recorded');
        onRecorded?.(blob, dur);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      startTime.current = Date.now();
      setState('recording');

      // Auto-stop at 60s
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime.current) / 1000);
        setDuration(elapsed);
        if (elapsed >= 60) stopRecording();
      }, 1000);
    } catch {
      setError('Microphone access denied');
      setState('idle');
    }
  }, [onRecorded]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorder.current?.stop();
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    if (state === 'playing') {
      audioRef.current.pause();
      setState('recorded');
    } else {
      audioRef.current.play();
      setState('playing');
      audioRef.current.onended = () => setState('recorded');
    }
  }, [state, audioUrl]);

  const discard = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
    setError(null);
  }, [audioUrl]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        {/* Main record/stop button */}
        {state === 'idle' && (
          <button
            id="voice-record"
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-5 py-4 bg-brand text-white rounded-2xl font-semibold text-sm transition-all hover:bg-brand/90 active:scale-95 min-h-[56px]"
          >
            <Mic className="w-4 h-4" />
            Record Voice Note
          </button>
        )}

        {state === 'recording' && (
          <button
            id="voice-stop"
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-4 bg-red-500 text-white rounded-2xl font-semibold text-sm transition-all hover:bg-red-600 active:scale-95 min-h-[56px]"
          >
            <Square className="w-4 h-4 fill-white" />
            Stop — {formatTime(duration)}
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </button>
        )}

        {state === 'recorded' && (
          <>
            <button
              id="voice-play"
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-2 px-4 py-4 bg-green-500 text-white rounded-2xl font-semibold text-sm active:scale-95 min-h-[56px]"
            >
              <Play className="w-4 h-4" />
              {formatTime(duration)}
            </button>
            <button
              id="voice-discard"
              type="button"
              onClick={discard}
              className="flex items-center gap-2 px-4 py-4 bg-gray-100 text-gray-600 rounded-2xl font-medium text-sm active:scale-95 min-h-[56px]"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
          </>
        )}

        {state === 'playing' && (
          <button
            id="voice-pause"
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-2 px-4 py-4 bg-blue-500 text-white rounded-2xl font-semibold text-sm active:scale-95 min-h-[56px]"
          >
            <Pause className="w-4 h-4" />
            Playing...
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
    </div>
  );
}
