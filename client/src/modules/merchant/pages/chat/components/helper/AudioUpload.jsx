import { useState, useEffect, useRef } from "react";
import { Mic, X, SendHorizontal } from "lucide-react";
import { useUploadMessageImagesMutation } from "@/redux/api/MessageImagesApi";

export default function AudioUpload({ senderId, receiverId, onUploadComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);
  const timerRef = useRef(null);

  const [uploadChatFiles, { isLoading }] = useUploadMessageImagesMutation();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);  
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const blobURL = URL.createObjectURL(audioBlob);
        setBlobUrl(blobURL);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
      setDuration(0);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const cancelRecording = () => {
    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    setMediaRecorder(null);
    setIsRecording(false);
    setDuration(0);
    setAudioChunks([]);
    setBlobUrl(null);
  };

  const handleSend = async () => {
    if (!audioChunks.length || !senderId || !receiverId) return;

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("senderId", senderId);
    formData.append("receiverId", receiverId);
    formData.append("files", audioBlob, "recording.webm");

    try {
      const response = await uploadChatFiles(formData).unwrap();
      const audioUrl = response?.fileUrls?.[0];
      if (audioUrl) {
        onUploadComplete(audioUrl);
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }

    // Cleanup
    setAudioChunks([]);
    setBlobUrl(null);
    setDuration(0);
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !blobUrl && (
        <button onClick={startRecording}>
          <Mic size={20} />
        </button>
      )}

      {isRecording && (
        <>
          <span className="text-sm text-gray-500">{formatTime(duration)}</span>
          <button onClick={stopRecording} className="text-green-600">
            <Mic size={20} />
          </button>
          <button onClick={cancelRecording} className="text-red-500">
            <X size={20} />
          </button>
        </>
      )}

      {blobUrl && !isRecording && (
        <>
          <audio src={blobUrl} controls className="w-40" />
          <button onClick={handleSend} disabled={isLoading} className="text-blue-600">
            <SendHorizontal size={20} />
          </button>
          <button onClick={cancelRecording} className="text-red-500">
            <X size={20} />
          </button>
        </>
      )}
    </div>
  );
}