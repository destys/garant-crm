"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  XIcon,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CallProps } from "@/types/call.types";
import { API_URL } from "@/constants";
import { formatDate } from "@/lib/utils";

interface Props {
  call: CallProps;
  onClose: () => void;
}

export const CallAudioPlayer = ({ call, onClose }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(
    call.recording?.url ? `${API_URL}${call.recording.url}` : null
  );
  const [isFetchingRecording, setIsFetchingRecording] = useState(false);

  const fetchRecordingFromMango = useCallback(async () => {
    if (!call.recordingId) return;

    setIsFetchingRecording(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/mango/recording/${encodeURIComponent(call.recordingId)}`
      );

      const contentType = response.headers.get("Content-Type");

      if (!response.ok || !contentType?.includes("audio")) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось получить запись");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrl(blobUrl);
      setIsLoading(true);
    } catch (err) {
      console.error("Error fetching recording from Mango:", err);
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить запись"
      );
    } finally {
      setIsFetchingRecording(false);
    }
  }, [call.recordingId]);

  useEffect(() => {
    if (!audioUrl && call.recordingId && !isFetchingRecording) {
      fetchRecordingFromMango();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.recordingId]);

  useEffect(() => {
    const currentUrl = audioUrl;
    return () => {
      if (currentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    setIsLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError("Не удалось загрузить запись");
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Запись звонка</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {isFetchingRecording ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-sm">
                Загрузка записи из Mango Office...
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <p className="text-muted-foreground">
                  Запись временно недоступна.
                </p>
              )}
              <p className="text-muted-foreground">Возможные причины:</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Запись ещё обрабатывается в Mango Office</li>
                <li>Запись не была загружена автоматически</li>
                <li>Звонок был слишком коротким для записи</li>
              </ul>
              {call.recordingId && (
                <>
                  <p className="text-xs text-muted-foreground mt-4">
                    ID записи в Mango: {call.recordingId}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRecordingFromMango}
                    disabled={isFetchingRecording}
                    className="mt-2"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Попробовать загрузить
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Запись звонка</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">От:</span> {call.fromNumber || "—"}
          </p>
          <p>
            <span className="font-medium">Кому:</span> {call.toNumber || "—"}
          </p>
          <p>
            <span className="font-medium">Дата:</span>{" "}
            {formatDate(call.startedAt, "dd.MM.yyyy HH:mm")}
          </p>
        </div>

        {error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : (
          <div className="space-y-4">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <div className="flex items-center gap-4">
              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1">
                <input
                  type="range"
                  value={currentTime}
                  max={duration || 100}
                  step={0.1}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                />
              </div>

              <span className="text-sm tabular-nums w-20 text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
