import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, ArrowRight } from 'lucide-react';

interface VoiceRecorderProps {
  onComplete: (transcript: string, authorName: string) => void;
}

export function VoiceRecorder({ onComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setTranscript((prev) => {
          const updated = prev + finalTranscript;
          return updated;
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const handleComplete = () => {
    if (transcript.trim() && authorName.trim()) {
      onComplete(transcript.trim(), authorName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 via-teal-300 to-green-400 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">
            Tell Your Story! 🎤
          </h2>

          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-700 mb-3">
              What's your name?
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-6 py-4 border-4 border-blue-300 rounded-2xl text-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex justify-center mb-6">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-10 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center gap-3"
              >
                <Mic className="w-8 h-8" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-10 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center gap-3 animate-pulse"
              >
                <Square className="w-8 h-8" />
                Stop Recording
              </button>
            )}
          </div>

          {isListening && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-6 py-3 rounded-full font-bold">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                Listening...
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-6 min-h-[300px] max-h-[400px] overflow-y-auto">
            {transcript ? (
              <p className="text-xl text-gray-800 leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            ) : (
              <p className="text-xl text-gray-400 text-center italic">
                Your story will appear here as you speak...
              </p>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            {transcript && (
              <button
                onClick={clearTranscript}
                className="flex-1 bg-red-500 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-lg hover:bg-red-600 transform hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-6 h-6" />
                Clear
              </button>
            )}

            {transcript && authorName && (
              <button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-white text-lg">
          <p className="font-bold">💡 Tips:</p>
          <p>Speak clearly and tell your story with excitement!</p>
        </div>
      </div>
    </div>
  );
}
