import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { loadCSVFromURL, getAudioURL } from '../utils/fileLoader.js';

const EnglishLearningApp = () => {
  // State variables
  const [csvData, setCsvData] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');
  const [writings, setWritings] = useState([]);
  const [selectedWriting, setSelectedWriting] = useState('');
  const [activeTab, setActiveTab] = useState('full');
  const [volume, setVolume] = useState(0.7);
  const [speed, setSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentAudioType, setCurrentAudioType] = useState(null);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(-1);
  
  // Current content data
  const [fullTextData, setFullTextData] = useState(null);
  const [sentenceData, setSentenceData] = useState([]);
  const [currentSentence, setCurrentSentence] = useState(null);

  // Audio refs
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Initialize app
  useEffect(() => {
    loadCSVData();
    initializeAudioContext();
  }, []);

  const initializeAudioContext = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
  };

  const loadCSVData = async () => {
    try {
      // 実際のCSVファイルを読み込む
    const csvPath = `${import.meta.env.BASE_URL}assets/data/sentence_data.csv`;
    console.log('Attempting to load CSV from:', csvPath);
    const csvData = await loadCSVFromURL(csvPath);
    
    // データの前処理（必要に応じて）
    const processedData = csvData.map(row => ({
      ...row,
      Stage: parseInt(row.Stage) || 0,
      sentence: parseInt(row.sentence) || undefined
    })).filter(row => row.Stage > 0); // 無効なデータを除外

    setCsvData(processedData);
    
    // Extract unique stages
    const uniqueStages = [...new Set(processedData.map(item => item.Stage))].sort((a, b) => a - b);
    setStages(uniqueStages);
    
    console.log('CSV data loaded successfully:', processedData.length, 'records');
  } catch (error) {
    console.error('Failed to load CSV data:', error);
    alert('CSVデータの読み込みに失敗しました。サンプルデータを使用します。');
    
    // フォールバック用のサンプルデータ

      // In a real application, you would load CSV from a file
      // For demo purposes, using sample data
      const sampleData = [
        {
          Stage: 1,
          Writing: "Sample Text 1",
          Audio_Name: "audio_001_00",
          English: "This is a sample English text for full audio.",
          Japanese: "これは全文音声のサンプル英語テキストです。"
        },
        {
          Stage: 1,
          Writing: "Sample Text 1",
          Audio_Name: "audio_001_01",
          English: "This is the first sentence.",
          Japanese: "これは最初の文です。",
          sentence: 1
        },
        {
          Stage: 1,
          Writing: "Sample Text 1",
          Audio_Name: "audio_001_02",
          English: "This is the second sentence.",
          Japanese: "これは二番目の文です。",
          sentence: 2
        },
        {
          Stage: 2,
          Writing: "Sample Text 2",
          Audio_Name: "audio_002_00",
          English: "Another sample text for demonstration.",
          Japanese: "デモンストレーション用の別のサンプルテキストです。"
        }
      ];

      setCsvData(sampleData);
      setStages([1, 2]);
    }
  };

  

  const handleStageChange = (stage) => {
    setSelectedStage(stage);
    setSelectedWriting('');
    clearContent();

    if (stage) {
      const stageWritings = [...new Set(
        csvData.filter(item => item.Stage === parseInt(stage))
          .map(item => item.Writing)
      )];
      setWritings(stageWritings);
    } else {
      setWritings([]);
    }
  };

  const handleWritingChange = (writing) => {
    setSelectedWriting(writing);
    clearContent();

    if (selectedStage && writing) {
      updateContent(parseInt(selectedStage), writing);
    }
  };

  const updateContent = (stage, writing) => {
    const filteredData = csvData.filter(item => 
      item.Stage === stage && item.Writing === writing
    );

    // Full text data
    const fullData = filteredData.find(item => item.Audio_Name.endsWith('_00'));
    setFullTextData(fullData || null);

    // Sentence data
    const sentences = filteredData
      .filter(item => !item.Audio_Name.endsWith('_00') && item.sentence)
      .sort((a, b) => a.sentence - b.sentence);
    setSentenceData(sentences);

    console.log('Content updated:', { fullData, sentences });
  };

  const clearContent = () => {
    setFullTextData(null);
    setSentenceData([]);
    setCurrentSentence(null);
    setSelectedSentenceIndex(-1);
    stopAudio();
  };

  const playAudioWithSpeed = async (audioFileName) => {
    try {
      const { wavPath, mp3Path } = getAudioURL(audioFileName);
    
    // 音声ファイルの存在確認と読み込み
    let audioUrl = null;
    try {
      const checkAudioPath = async (path) => {
        try {
          const response = await fetch(path);
          const contentType = response.headers.get('content-type');
          if (response.ok && contentType && contentType.startsWith('audio')) {
            return path;
          }
        } catch (e) {
          return null;
        }
        return null;
      };
      audioUrl = await checkAudioPath(wavPath) || await checkAudioPath(mp3Path);
    } catch (error) {
      console.error('Audio file check failed:', error);
    }

    if (!audioUrl) {
      alert(`音声ファイルが見つかりません: ${audioFileName}`);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = speed;
      audioRef.current.volume = volume;
      
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      
      // 音声終了時のイベントリスナー
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentAudioType(null);
        audioRef.current.removeEventListener('ended', handleEnded);
      };
      
      audioRef.current.addEventListener('ended', handleEnded);
    }

    } catch (error) {
      console.error('Audio playback failed:', error);
      alert('音声の再生に失敗しました。');
    }
  };

  const toggleFullAudio = () => {
    if (!fullTextData) return;

    if (isPlaying && currentAudioType === 'full') {
      pauseAudio();
    } else if (isPaused && currentAudioType === 'full') {
      resumeAudio();
    } else {
      setCurrentAudioType('full');
      playAudioWithSpeed(fullTextData.Audio_Name);
    }
  };

  const toggleSentenceAudio = () => {
    if (!currentSentence) return;

    if (isPlaying && currentAudioType === 'sentence') {
      pauseAudio();
    } else if (isPaused && currentAudioType === 'sentence') {
      resumeAudio();
    } else {
      setCurrentAudioType('sentence');
      playAudioWithSpeed(currentSentence.Audio_Name);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  };

  const resumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
    setIsPlaying(true);
    setIsPaused(false);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentAudioType(null);
  };

  const resetAudio = () => {
    stopAudio();
  };

  const handleSentenceSelect = (sentence, index) => {
    // Stop any playing audio when selecting a new sentence
    if (isPlaying || isPaused) {
      stopAudio();
    }
    
    setCurrentSentence(sentence);
    setSelectedSentenceIndex(index);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (audioRef.current && isPlaying) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (activeTab === 'full' && fullTextData) {
            toggleFullAudio();
          } else if (activeTab === 'sentence' && currentSentence) {
            toggleSentenceAudio();
          }
          break;
        case 'Escape':
          event.preventDefault();
          resetAudio();
          break;
        case 'Enter':
          event.preventDefault();
          if (activeTab === 'sentence' && currentSentence) {
            toggleSentenceAudio();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, fullTextData, currentSentence, isPlaying, isPaused]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          リスニング練習用プレイヤー
        </h1>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Stage Selection */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Stage:</label>
              <select
                value={selectedStage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            {/* Writing Selection */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-black">Writing:</label>
              <select
                value={selectedWriting}
                onChange={(e) => handleWritingChange(e.target.value)}
                disabled={!selectedStage}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">選択してください</option>
                {writings.map(writing => (
                  <option key={writing} value={writing}>{writing}</option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">再生速度:</label>
              <select
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1.0}>1.0</option>
                <option value={0.9}>0.9</option>
                <option value={0.8}>0.8</option>
                <option value={0.7}>0.7</option>
                <option value={0.6}>0.6</option>
                <option value={0.5}>0.5</option>
              </select>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-gray-700" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('full')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'full'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              全文表示
            </button>
            <button
              onClick={() => setActiveTab('sentence')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'sentence'
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              個別文章
            </button>
          </div>

          <div className={`p-6 min-h-[20rem] ${activeTab === 'full' ? 'flex justify-center' : ''}`}>
            {activeTab === 'full' && (
              <div className="max-w-4xl">
                {fullTextData ? (
                  <>
                    <div className="mb-6">
                      <p className="text-lg font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {fullTextData.English}
                      </p>
                    </div>
                    <div className="mb-6">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {fullTextData.Japanese}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={toggleFullAudio}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        {isPlaying && currentAudioType === 'full' ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                        {isPlaying && currentAudioType === 'full' ? '一時停止' : '全文再生'}
                      </button>
                      <button
                        onClick={resetAudio}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Square size={16} />
                        リセット
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    StageとWritingを選択してください。
                  </p>
                )}
              </div>
            )}

            {activeTab === 'sentence' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {currentSentence ? (
                    <>
                      <div className="pl-4">
                        <div className="mb-6">
                          <p className="text-lg font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {currentSentence.English}
                          </p>
                        </div>
                        <div className="mb-6">
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {currentSentence.Japanese}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 pl-4">
                        <button
                          onClick={toggleSentenceAudio}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          {isPlaying && currentAudioType === 'sentence' ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                          {isPlaying && currentAudioType === 'sentence' ? '一時停止' : '再生'}
                        </button>
                        <button
                          onClick={resetAudio}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          <Square size={16} />
                          リセット
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      文章を選択してください。
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">文章一覧</h3>
                  {sentenceData.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {sentenceData.map((sentence, index) => (
                        <div
                          key={index}
                          onClick={() => handleSentenceSelect(sentence, index)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedSentenceIndex === index
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {sentence.sentence}: {sentence.English}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      StageとWritingを選択してください。
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden audio element for demo purposes */}
        <audio ref={audioRef} style={{ display: 'none' }}>
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2t2MdBDuN1O/PfSMCwAEA" type="audio/wav" />
        </audio>

        {/* Keyboard shortcuts info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>キーボードショートカット: スペース(再生/停止) | Escape(リセット) | Enter(選択された文章を再生)</p>
        </div>
      </div>
    </div>
  );
};

export default EnglishLearningApp;
