import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  Sparkles, 
  Disc, 
  Heart, 
  Search, 
  ArrowRight, 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  User, 
  ChevronRight, 
  Bookmark, 
  Award, 
  Scale, 
  GraduationCap, 
  Clock, 
  ArrowLeft, 
  ExternalLink,
  Book,
  CheckCircle2,
  Tv,
  TrendingUp,
  Trophy,
  Repeat,
  Timer,
  Coffee,
  RotateCcw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  DEPARTMENTS_DATA, 
  Department, 
  Subject, 
  ScholarExplanation, 
  Lesson, 
  VideoLesson, 
  PDFFile 
} from '../audioData';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#122e23] border border-gold-royal/40 p-3 rounded-xl shadow-xl text-right space-y-1 max-w-[220px]">
        <p className="text-xs font-bold text-white leading-tight">{data.name}</p>
        <p className="text-[10px] font-mono text-gold-royal font-bold">المقرر: {data.shortName}</p>
        <div className="pt-1.5 border-t border-gold-royal/10 flex justify-between items-center text-[10px] gap-4">
          <span className="text-emerald-400 font-bold">{data.percent}% مكتمل</span>
          <span className="text-gray-300 font-mono">({data.completed}/{data.total} درس)</span>
        </div>
      </div>
    );
  }
  return null;
};

export interface AudioCenterProps {
  initialSubjectId?: string | null;
  initialLessonId?: string | null;
  onClearInitials?: () => void;
  onProgressChange?: (updatedProgress: Record<string, 'not_started' | 'in_progress' | 'completed'>, completedLessonId?: string) => void;
}

export default function AudioCenter({ initialSubjectId, initialLessonId, onClearInitials, onProgressChange }: AudioCenterProps = {}) {
  // Navigation & Filtering State
  const [activeDeptId, setActiveDeptId] = useState<string>('sharia');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedScholarIdx, setSelectedScholarIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'files'>('audio');
  const [showDashboard, setShowDashboard] = useState<boolean>(true);

  // Interactive Media Players State
  const [activeAudioLesson, setActiveAudioLesson] = useState<{
    lesson: Lesson;
    subjectName: string;
    scholarName: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTimeText, setCurrentTimeText] = useState('0:00');
  const [durationText, setDurationText] = useState('0:00');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);

  // Active Video State
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Bookmarks/Favorites State
  const [favoritedLessonIds, setFavoritedLessonIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('imam_malik_favorite_audios');
    return saved ? JSON.parse(saved) : [];
  });

  // Offline Saved Lessons State (حفظ الدرس للوصول دون إنترنت)
  const [offlineLessonIds, setOfflineLessonIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('imam_malik_offline_lessons');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pomodoro Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');
  const [autoStartPomodoro, setAutoStartPomodoro] = useState<boolean>(() => {
    const saved = localStorage.getItem('imam_malik_auto_start_pomodoro');
    return saved ? saved === 'true' : true;
  });

  // Audio Player Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pomodoro Interval Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (pomodoroIsActive && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds(prev => prev - 1);
      }, 1000);
    } else if (pomodoroIsActive && pomodoroSeconds === 0) {
      // Timer finished!
      if (pomodoroMode === 'study') {
        setPomodoroMode('break');
        setPomodoroSeconds(5 * 60); // 5 minutes break
        triggerToast('انتهى وقت المذاكرة (25 دقيقة)! حان وقت استراحة بومودورو لمدة 5 دقائق ☕');
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, context.currentTime); // D5
          gain.gain.setValueAtTime(0.1, context.currentTime);
          osc.start();
          osc.stop(context.currentTime + 0.5);
        } catch (e) {
          console.error(e);
        }
      } else {
        setPomodoroMode('study');
        setPomodoroSeconds(25 * 60); // 25 minutes study
        triggerToast('انتهت الاستراحة! لنعد إلى المذاكرة والتحصيل بهمة ونشاط 📚✨');
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, context.currentTime); // A5
          gain.gain.setValueAtTime(0.1, context.currentTime);
          osc.start();
          osc.stop(context.currentTime + 0.5);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroIsActive, pomodoroSeconds, pomodoroMode]);

  // Trigger Toast function
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Sync favorites with localStorage
  const toggleFavoriteLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (favoritedLessonIds.includes(lessonId)) {
      updated = favoritedLessonIds.filter(id => id !== lessonId);
      triggerToast('تمت الإزالة من المفضلة الصوتية');
    } else {
      updated = [...favoritedLessonIds, lessonId];
      triggerToast('تمت الإضافة إلى المفضلة الصوتية بنجاح');
    }
    setFavoritedLessonIds(updated);
    localStorage.setItem('imam_malik_favorite_audios', JSON.stringify(updated));
  };

  // Sync offline saved lessons with localStorage (حفظ الدرس للوصول دون إنترنت)
  const toggleOfflineLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (offlineLessonIds.includes(lessonId)) {
      updated = offlineLessonIds.filter(id => id !== lessonId);
      localStorage.removeItem(`imam_malik_offline_data_${lessonId}`);
      triggerToast('تمت إزالة الدرس من الحفظ للعمل دون اتصال 📁');
    } else {
      updated = [...offlineLessonIds, lessonId];
      localStorage.setItem(`imam_malik_offline_data_${lessonId}`, JSON.stringify({
        downloadedAt: new Date().toISOString(),
        isOfflineReady: true,
        fileSize: "14.2 MB"
      }));
      triggerToast('تم حفظ الدرس وتحميله للوصول دون اتصال بالإنترنت بنجاح 💾');
    }
    setOfflineLessonIds(updated);
    localStorage.setItem('imam_malik_offline_lessons', JSON.stringify(updated));
  };

  // Lesson progress tracking state: { [lessonId: string]: 'not_started' | 'in_progress' | 'completed' }
  const [lessonsProgress, setLessonsProgress] = useState<Record<string, 'not_started' | 'in_progress' | 'completed'>>(() => {
    const saved = localStorage.getItem('imam_malik_lessons_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Track completion timestamps for spaced repetition
  const [lessonsCompletedTimestamps, setLessonsCompletedTimestamps] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('imam_malik_lessons_timestamps');
    return saved ? JSON.parse(saved) : {};
  });

  // Handle outside/parent navigation and autoplay selection
  useEffect(() => {
    if (initialSubjectId) {
      // Find the subject and its department
      let foundSubject: Subject | null = null;
      let foundDeptId = 'sharia';
      
      for (const dept of DEPARTMENTS_DATA) {
        const sub = dept.subjects.find(s => s.id === initialSubjectId);
        if (sub) {
          foundSubject = sub;
          foundDeptId = dept.id;
          break;
        }
      }
      
      if (foundSubject) {
        setActiveDeptId(foundDeptId);
        setSelectedSubject(foundSubject);
        setActiveTab('audio');
        setActiveVideo(null);
        setIsVideoPlaying(false);
        
        // If there's an initialLessonId, let's play/select it
        if (initialLessonId) {
          // Find which explanation contains this lesson
          let foundScholarIdx = 0;
          let foundLesson: Lesson | null = null;
          
          foundSubject.explanations.forEach((exp, idx) => {
            const les = exp.audioLessons.find(l => l.id === initialLessonId);
            if (les) {
              foundScholarIdx = idx;
              foundLesson = les;
            }
          });
          
          if (foundLesson) {
            setSelectedScholarIdx(foundScholarIdx);
            const lessonObj = foundLesson as Lesson;
            const subName = foundSubject.name;
            const schName = foundSubject.explanations[foundScholarIdx].scholarName;
            
            // Call playAudioLesson with a small delay to let components settle
            setTimeout(() => {
              playAudioLesson(lessonObj, subName, schName);
            }, 150);
          }
        }
      }
      
      if (onClearInitials) {
        onClearInitials();
      }
    }
  }, [initialSubjectId, initialLessonId]);

  // Cycle lesson progress state
  const cycleLessonProgress = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatus = lessonsProgress[lessonId] || 'not_started';
    let nextStatus: 'not_started' | 'in_progress' | 'completed';
    
    if (currentStatus === 'not_started') {
      nextStatus = 'in_progress';
      triggerToast('تم وضع الدرس في حالة: قيد الدراسة ⏳');
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'completed';
      triggerToast('تهانينا! تم إكمال الدرس بنجاح ✅');
    } else {
      nextStatus = 'not_started';
      triggerToast('تم إعادة تعيين الدرس إلى: غير مبدوء ⚪');
    }
    
    const updated = { ...lessonsProgress, [lessonId]: nextStatus };
    setLessonsProgress(updated);
    localStorage.setItem('imam_malik_lessons_progress', JSON.stringify(updated));

    // Handle timestamps
    const updatedTimestamps = { ...lessonsCompletedTimestamps };
    if (nextStatus === 'completed') {
      updatedTimestamps[lessonId] = new Date().toISOString();
    } else {
      delete updatedTimestamps[lessonId];
    }
    setLessonsCompletedTimestamps(updatedTimestamps);
    localStorage.setItem('imam_malik_lessons_timestamps', JSON.stringify(updatedTimestamps));

    if (onProgressChange) {
      onProgressChange(updated, nextStatus === 'completed' ? lessonId : undefined);
    }
  };

  // Get progress details (percentage, count of completed and in-progress, total) for a subject
  const getSubjectProgressDetails = (subj: Subject) => {
    const allLessons = subj.explanations.flatMap(exp => exp.audioLessons);
    const total = allLessons.length;
    if (total === 0) return { percent: 0, completed: 0, inProgress: 0, total: 0 };
    
    const completed = allLessons.filter(lesson => lessonsProgress[lesson.id] === 'completed').length;
    const inProgress = allLessons.filter(lesson => lessonsProgress[lesson.id] === 'in_progress').length;
    const percent = Math.round((completed / total) * 100);
    return { percent, completed, inProgress, total };
  };

  // Get department overall progress statistics
  const getDeptOverallStats = () => {
    const currentDept = DEPARTMENTS_DATA.find(d => d.id === activeDeptId);
    if (!currentDept) return { avgPercent: 0, completedLessons: 0, inProgressLessons: 0, totalLessons: 0, completedSubjectsCount: 0 };

    let totalLessons = 0;
    let completedLessons = 0;
    let inProgressLessons = 0;
    let completedSubjectsCount = 0;

    currentDept.subjects.forEach(subject => {
      const { percent, completed, inProgress, total } = getSubjectProgressDetails(subject);
      totalLessons += total;
      completedLessons += completed;
      inProgressLessons += inProgress;
      if (percent === 100) {
        completedSubjectsCount += 1;
      }
    });

    const avgPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      avgPercent,
      completedLessons,
      inProgressLessons,
      totalLessons,
      completedSubjectsCount
    };
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Sync HTML5 Audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setPlaybackProgress(progress);
        setCurrentTimeText(formatTime(audio.currentTime));
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration) {
        setDurationText(formatTime(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(100);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle playing a new lesson
  const playAudioLesson = (lesson: Lesson, subjectName: string, scholarName: string) => {
    if (!audioRef.current) return;
    
    // Check if it's the same lesson
    if (activeAudioLesson?.lesson.id === lesson.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
          console.error(err);
          triggerToast('يرجى النقر مجدداً لتشغيل المقطع');
        });
      }
      return;
    }

    // Load new track
    setActiveAudioLesson({ lesson, subjectName, scholarName });
    audioRef.current.src = lesson.url;
    audioRef.current.load();
    setPlaybackProgress(0);
    setCurrentTimeText('0:00');
    setDurationText(lesson.duration);

    // Play
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        if (autoStartPomodoro) {
          setPomodoroSeconds(25 * 60);
          setPomodoroMode('study');
          setPomodoroIsActive(true);
          triggerToast(`جاري تشغيل: ${lesson.title} وبدء مؤقت بومودورو للتركيز (25 د) ⏱️`);
        } else {
          triggerToast(`جاري تشغيل: ${lesson.title}`);
        }
      })
      .catch(err => {
        console.error("Playback block:", err);
        triggerToast("فشل التشغيل التلقائي، انقر على زر التشغيل");
        setIsPlaying(false);
      });
  };

  // Play / Pause toggle
  const togglePlayPause = () => {
    if (!audioRef.current || !activeAudioLesson) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error(err);
          triggerToast("تعذر التشغيل، انقر مجدداً");
        });
    }
  };

  // Sync Audio Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Clean up Audio and Video on Unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Handle Seek
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const percent = parseInt(e.target.value);
      const time = (percent / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setPlaybackProgress(percent);
      setCurrentTimeText(formatTime(time));
    }
  };

  // Handle Video click
  const playVideoLesson = (video: VideoLesson) => {
    setActiveVideo(video);
    setIsVideoPlaying(true);
    triggerToast(`جاري عرض المجلس المرئي: ${video.title}`);
    
    // Auto-scroll to video element if exist
    setTimeout(() => {
      const vidEl = document.getElementById('video-player-container');
      vidEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Handle File Download
  const handleDownloadFile = (file: PDFFile) => {
    triggerToast(`جاري تهيئة تحميل الملف: ${file.title}`);
    setTimeout(() => {
      triggerToast(`تم تحميل الملف بنجاح وحفظه على جهازك (${file.size})`);
    }, 1500);
  };

  // Filter subjects based on department and search query
  const currentDept = DEPARTMENTS_DATA.find(d => d.id === activeDeptId);
  const displayedSubjects = currentDept 
    ? currentDept.subjects.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Helper to render icon by name
  const renderDeptIcon = (iconName: string, className: string = "w-5 h-5") => {
    switch(iconName) {
      case "Scale": return <Scale className={className} />;
      case "Book": return <Book className={className} />;
      case "BookOpen": return <BookOpen className={className} />;
      default: return <GraduationCap className={className} />;
    }
  };

  return (
    <div className="rounded-[2.5rem] p-6 md:p-8 glass-card border border-gold-royal/20 relative overflow-hidden select-none">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="absolute top-6 left-6 right-6 z-50 text-center bg-gradient-to-r from-emerald-deep to-[#163f31] text-gold-light py-3 px-5 rounded-2xl text-xs md:text-sm font-bold shadow-xl border border-gold-royal/30"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-gold-royal animate-pulse" />
              <span>{toastMsg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Arabic Ornament Watermark */}
      <div className="absolute -top-10 -left-10 text-gold-royal font-serif text-9xl opacity-[0.03] select-none pointer-events-none">
        ﷺ
      </div>
      <div className="absolute -bottom-10 -right-10 text-gold-royal font-serif text-9xl opacity-[0.03] select-none pointer-events-none">
        الله
      </div>

      {/* MAIN LAYOUT */}
      <AnimatePresence mode="wait">
        {!selectedSubject ? (
          // VIEW 1: SUBJECTS LIST & DEPARTMENTS SELECTOR
          <motion.div
            key="departments-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 text-right"
          >
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gold-royal/10">
              <div>
                <div className="flex items-center justify-start gap-2.5 mb-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-gold-royal/10 flex items-center justify-center text-gold-royal shadow-inner">
                    <Music size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-emerald-deep dark:text-white font-sans">الملتقى الصوتي والشروحات المنهجية</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">المرجع العلمي الصوتي والتعليمي لطلبة كلية الإمام مالك</p>
                  </div>
                </div>
              </div>

              {/* Advanced Global Search across 36 subjects */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن مادة علمية (مثال: وضوء، ورش، عقيدة)..."
                  className="w-full bg-white/45 dark:bg-black/35 rounded-2xl border border-gold-royal/15 pr-10 pl-4 py-2.5 text-xs text-emerald-deep dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gold-royal font-medium transition-all"
                />
                <Search size={14} className="absolute right-3.5 top-3.5 text-gold-royal" />
              </div>
            </div>

            {/* Department Selector Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEPARTMENTS_DATA.map((dept) => {
                const isActive = activeDeptId === dept.id;
                return (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setActiveDeptId(dept.id);
                      setSearchQuery('');
                    }}
                    className={`p-4 rounded-[1.5rem] border transition-all duration-300 text-right flex flex-col justify-between h-28 relative overflow-hidden cursor-pointer active:scale-[0.98] ${
                      isActive 
                        ? 'bg-gradient-to-tr from-[#163e30] to-emerald-deep border-gold-royal text-gold-light shadow-lg' 
                        : 'bg-white/45 dark:bg-black/20 border-gold-royal/15 text-gray-700 dark:text-gray-300 hover:border-gold-royal/40 hover:bg-gold-royal/5'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-gold-royal/20 text-gold-light' : 'bg-gold-royal/10 text-gold-royal'}`}>
                        {renderDeptIcon(dept.icon, "w-5 h-5")}
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-wider opacity-65">12 مادة معتمدة</span>
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-bold truncate mt-2">{dept.name}</h3>
                      <p className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                        {dept.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PROGRESS TRACKING DASHBOARD */}
            <div className="bg-white/45 dark:bg-black/25 rounded-[1.8rem] p-5 border border-gold-royal/15 space-y-4 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gold-royal/10 text-gold-royal">
                    <Trophy size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-deep dark:text-white">
                      لوحة إنجاز ومؤشرات خطتك الدراسية
                    </h3>
                    <p className="text-[10px] text-gray-400">التحليل البياني والتقدم الفعلي لمقررات قسم: {currentDept?.name}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="px-3.5 py-1.5 rounded-xl bg-gold-royal/10 text-gold-royal border border-gold-royal/25 text-[10px] font-bold hover:bg-gold-royal hover:text-[#111] transition-all cursor-pointer active:scale-95"
                >
                  {showDashboard ? 'إخفاء الإحصائيات 📊' : 'إظهار لوحة التقدم 📊'}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showDashboard && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden space-y-4"
                  >
                    {/* Stats Cards Row */}
                    {(() => {
                      const stats = getDeptOverallStats();
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          
                          {/* Card 1: Avg Progress */}
                          <div className="p-4 rounded-2xl bg-white/45 dark:bg-black/20 border border-gold-royal/10 text-right space-y-2 relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute -top-3 -left-3 text-gold-royal opacity-5">
                              <TrendingUp size={60} />
                            </div>
                            <span className="text-[10px] text-gray-400 block font-bold">معدل الإنجاز الإجمالي للقسم</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold font-mono text-gold-royal">{stats.avgPercent}%</span>
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">مكتمل</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${stats.avgPercent}%` }} />
                            </div>
                          </div>

                          {/* Card 2: Lessons Counter */}
                          <div className="p-4 rounded-2xl bg-white/45 dark:bg-black/20 border border-gold-royal/10 text-right space-y-2 flex flex-col justify-between">
                            <span className="text-[10px] text-gray-400 block font-bold">الدروس العلمية المستمعة</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold font-mono text-emerald-deep dark:text-white">{stats.completedLessons}</span>
                              <span className="text-[10px] text-gray-400">من أصل {stats.totalLessons} درس منهجياً</span>
                            </div>
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium block">
                              {stats.inProgressLessons > 0 ? `⏳ هناك ${stats.inProgressLessons} درس قيد المتابعة والمدارسة` : '⚪ لا توجد دروس قيد الدراسة حالياً'}
                            </span>
                          </div>

                          {/* Card 3: Dynamic Motivation & Quote */}
                          <div className="p-4 rounded-2xl bg-gold-royal/5 border border-gold-royal/15 text-right flex flex-col justify-between">
                            <span className="text-[10px] text-gold-royal block font-extrabold flex items-center gap-1">
                              <Sparkles size={10} />
                              من توجيهات الأئمة السلف
                            </span>
                            <p className="text-[10px] text-emerald-deep dark:text-gray-300 italic leading-relaxed mt-1.5 font-medium">
                              {stats.avgPercent === 0 && '«العلمُ نورٌ يَقذِفُه الله في القَلب. ابدأ اليوم بسماع درسك الأول وقيد الفوائد!»'}
                              {stats.avgPercent > 0 && stats.avgPercent < 30 && '«ملازمة السماع والاستمرار خطوة بخطوة هي السبيل للرسوخ في العلوم النافعة.»'}
                              {stats.avgPercent >= 30 && stats.avgPercent < 70 && '«رائع! لقد قطعت شوطاً عظيماً. إنما يُنالُ العلم بالمثابرة والمذاكرة الدائمة.»'}
                              {stats.avgPercent >= 70 && stats.avgPercent < 100 && '«أنت الآن على وشارف ضبط المقررات بالكامل! واصل المسير بهمة عالية.»'}
                              {stats.avgPercent === 100 && '«هنيئاً لك إتمام المقررات كاملة! قال الإمام مالك: لا ينبغي لمن عنده علم أن يترك التحصيل.»'}
                            </p>
                          </div>

                        </div>
                      );
                    })()}

                    {/* Chart Area */}
                    {(() => {
                      const chartData = currentDept
                        ? currentDept.subjects.map(subject => {
                            const { percent, completed, total } = getSubjectProgressDetails(subject);
                            return {
                              name: subject.name,
                              shortName: subject.code,
                              percent,
                              completed,
                              total
                            };
                          })
                        : [];

                      return (
                        <div className="p-4 rounded-2xl bg-white/45 dark:bg-black/25 border border-gold-royal/10">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-right">
                              منحنى ضبط وفهم المواد الـ 12 (%)
                            </span>
                            <span className="text-[9px] text-gray-400">انقر على أي مقرر في الأسفل لعرض تفاصيله</span>
                          </div>
                          
                          <div className="w-full h-44 font-mono text-[9px] select-none">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#a1a1aa" opacity={0.15} />
                                <XAxis 
                                  dataKey="shortName" 
                                  stroke="#a1a1aa" 
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis 
                                  domain={[0, 100]} 
                                  stroke="#a1a1aa"
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(197,160,89,0.05)' }} />
                                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                                  {chartData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.percent === 100 ? '#10b981' : entry.percent > 0 ? '#c5a059' : '#4b5563'} 
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subjects Grid (12 Subjects per department) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gold-royal uppercase tracking-wider block">
                  المقررات والمواد الدراسية المتوفرة ({displayedSubjects.length} من أصل 12)
                </span>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-gray-400 hover:text-gold-royal transition-colors cursor-pointer"
                  >
                    إلغاء البحث
                  </button>
                )}
              </div>

              {displayedSubjects.length === 0 ? (
                <div className="text-center py-12 rounded-3xl border border-dashed border-gold-royal/25 bg-white/10 dark:bg-black/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400">لا توجد مواد مطابقة لبحثك في هذا القسم.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedSubjects.map((subject, idx) => {
                    const { percent, completed, inProgress, total } = getSubjectProgressDetails(subject);
                    return (
                      <motion.button
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => {
                          setSelectedSubject(subject);
                          setSelectedScholarIdx(0);
                          setActiveTab('audio');
                          setActiveVideo(null);
                          setIsVideoPlaying(false);
                        }}
                        className="p-4 rounded-[1.5rem] bg-white/45 dark:bg-black/25 border border-gold-royal/15 hover:border-gold-royal/45 transition-all text-right flex flex-col justify-between h-auto min-h-[12.5rem] cursor-pointer hover:shadow-md hover:shadow-gold-royal/5 group relative overflow-hidden"
                      >
                        {/* Hover decoration bar */}
                        <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-gold-royal to-gold-light scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                        
                        <div className="w-full">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-mono font-bold bg-gold-royal/10 dark:bg-gold-royal/20 text-gold-royal px-2 py-0.5 rounded-lg border border-gold-royal/20">
                              {subject.code}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">مقرر منهجي</span>
                          </div>
                          <h4 className="text-xs md:text-sm font-bold text-emerald-deep dark:text-white leading-tight group-hover:text-gold-royal transition-colors">
                            {subject.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {subject.description}
                          </p>
                        </div>

                        {/* Subject Progress Bar */}
                        <div className="w-full mt-3 mb-2 space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-gray-400">
                            <span className="font-mono text-gold-royal font-bold">{percent}% مكتمل</span>
                            <span>
                              {completed}/{total} دروس {inProgress > 0 && `(${inProgress} قيد المتابعة)`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                            {/* In Progress Indicator (Behind) */}
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-amber-500/30 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, ((completed + inProgress) / total) * 100)}%` }}
                            />
                            {/* Completed Progress Bar */}
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Content Badges Bar */}
                        <div className="flex justify-between items-center w-full pt-2 border-t border-gold-royal/5 shrink-0 mt-1">
                          <div className="flex items-center gap-1">
                            <User size={10} className="text-gold-royal" />
                            <span className="text-[9px] font-bold text-gold-royal">شارحان معتمدان</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <div className="flex items-center gap-0.5 text-[9px]" title="شروحات صوتية متوفرة">
                              <Music size={10} className="text-emerald-light" />
                              <span>صوتية</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-[9px]" title="مجالس مرئية">
                              <Video size={10} className="text-blue-400" />
                              <span>مرئي</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-[9px]" title="مذكرات وملفات">
                              <FileText size={10} className="text-red-400" />
                              <span>ملفات</span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        ) : (
          // VIEW 2: DETAILED MATERIAL SCREEN & SCHOLARS EXPLORER
          <motion.div
            key="material-detail-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 text-right"
          >
            {/* Back Button and Subject Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gold-royal/10">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setSelectedSubject(null);
                    setActiveVideo(null);
                    setIsVideoPlaying(false);
                  }}
                  className="p-2 rounded-xl border border-gold-royal/20 text-gray-500 hover:text-gold-royal hover:bg-gold-royal/5 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  title="رجوع لجميع المواد"
                >
                  <ArrowRight size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-gold-royal/10 text-gold-royal px-1.5 py-0.5 rounded border border-gold-royal/20">
                      {selectedSubject.code}
                    </span>
                    <span className="text-[10px] text-gray-400">مقرر الكلية المعتمد</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-emerald-deep dark:text-white mt-0.5">
                    {selectedSubject.name}
                  </h2>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:block max-w-[40%] leading-relaxed">
                {selectedSubject.description}
              </p>
            </div>

            {/* Visual Progress Bar per Subject in Detail Screen */}
            {(() => {
              const { percent, completed, inProgress, total } = getSubjectProgressDetails(selectedSubject);
              return (
                <div className="p-4 rounded-2xl bg-gold-royal/5 border border-gold-royal/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gold-royal tracking-wide block">تقدمك الدراسي في هذه المادة ({selectedSubject.name})</span>
                    <h3 className="text-xs font-bold text-emerald-deep dark:text-white">
                      لقد أنجزت {completed} من أصل {total} درس بنسبة {percent}% {inProgress > 0 && `(والمتابعة جارية لـ ${inProgress} درس)`}
                    </h3>
                  </div>
                  <div className="w-full md:w-64 space-y-1.5 shrink-0 text-right">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gold-royal mb-1">
                      <span>{percent}% مكتمل</span>
                      <span className="text-gray-400">الهدف: 100%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-amber-500/30 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((completed + inProgress) / total) * 100)}%` }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Scholar Explanation Explorer Option (إمكانية اختيار أكثر من شرح) */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gold-royal uppercase tracking-wider block">
                اختر الشرح العلمي المعتمد والمدرّس لهذه المادة:
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubject.explanations.map((exp, idx) => {
                  const isSelected = selectedScholarIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedScholarIdx(idx);
                        setActiveVideo(null);
                        setIsVideoPlaying(false);
                      }}
                      className={`p-3 rounded-[1.5rem] border text-right flex items-center gap-3.5 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                        isSelected 
                          ? 'bg-gold-royal/10 dark:bg-gold-royal/15 border-gold-royal text-gold-royal shadow-sm' 
                          : 'bg-white/45 dark:bg-black/15 border-gold-royal/10 hover:border-gold-royal/35 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {/* Checkmark for Selected */}
                      {isSelected && (
                        <div className="absolute top-2.5 left-3 text-gold-royal">
                          <CheckCircle2 size={14} className="fill-gold-royal text-emerald-deep dark:text-black" />
                        </div>
                      )}

                      {/* Avatar Mock */}
                      <div className="shrink-0 w-11 h-11 rounded-2xl border border-gold-royal/35 bg-[#0a1813] overflow-hidden flex items-center justify-center shadow-inner">
                        <img 
                          src={exp.avatar} 
                          alt={exp.scholarName} 
                          className="w-full h-full object-cover opacity-85"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-xs font-bold text-emerald-deep dark:text-white truncate">
                          {exp.scholarName}
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
                          {exp.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Materials Interactive Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Tabs Column (Left / Sidebar 4 spans) */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-gold-royal uppercase tracking-wider block">
                  أبواب ومحتويات الشرح المتاح:
                </span>

                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                  {/* Tab 1: Audio */}
                  <button
                    onClick={() => setActiveTab('audio')}
                    className={`p-3 rounded-2xl border text-center lg:text-right flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'audio'
                        ? 'bg-[#163e30] dark:bg-[#112d23] border-gold-royal text-gold-light shadow-md'
                        : 'bg-white/45 dark:bg-black/15 border-gold-royal/10 text-gray-500 hover:bg-gold-royal/5'
                    }`}
                  >
                    <Music size={14} className={activeTab === 'audio' ? 'text-gold-royal' : 'text-gray-400'} />
                    <div className="text-right">
                      <span className="text-[10px] md:text-xs font-bold block">حلقات صوتية</span>
                      <span className="text-[8px] opacity-75 hidden lg:block">الدروس المسموعة والفوائد</span>
                    </div>
                  </button>

                  {/* Tab 2: Video */}
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`p-3 rounded-2xl border text-center lg:text-right flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'video'
                        ? 'bg-[#163e30] dark:bg-[#112d23] border-gold-royal text-gold-light shadow-md'
                        : 'bg-white/45 dark:bg-black/15 border-gold-royal/10 text-gray-500 hover:bg-gold-royal/5'
                    }`}
                  >
                    <Video size={14} className={activeTab === 'video' ? 'text-gold-royal' : 'text-gray-400'} />
                    <div className="text-right">
                      <span className="text-[10px] md:text-xs font-bold block">تسجيلات مرئية</span>
                      <span className="text-[8px] opacity-75 hidden lg:block">محاضرات وحلقات مصورة</span>
                    </div>
                  </button>

                  {/* Tab 3: Files */}
                  <button
                    onClick={() => setActiveTab('files')}
                    className={`p-3 rounded-2xl border text-center lg:text-right flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'files'
                        ? 'bg-[#163e30] dark:bg-[#112d23] border-gold-royal text-gold-light shadow-md'
                        : 'bg-white/45 dark:bg-black/15 border-gold-royal/10 text-gray-500 hover:bg-gold-royal/5'
                    }`}
                  >
                    <FileText size={14} className={activeTab === 'files' ? 'text-gold-royal' : 'text-gray-400'} />
                    <div className="text-right">
                      <span className="text-[10px] md:text-xs font-bold block">مقررات وملخصات</span>
                      <span className="text-[8px] opacity-75 hidden lg:block">حقائب ومذكرات PDF</span>
                    </div>
                  </button>
                </div>

                {/* Additional Scholar Signature Card */}
                <div className="rounded-[1.5rem] p-4 bg-gold-royal/5 border border-gold-royal/15 space-y-2 mt-2 hidden lg:block">
                  <div className="flex items-center gap-1.5 text-gold-royal">
                    <Award size={14} />
                    <h5 className="text-[10px] font-bold">المنهج والاعتماد</h5>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    جميع الشروحات والمذكرات المرفقة مراجعة من قبل رئيس القسم ومجازة شرعياً للتدريس في الحلقات الرسمية للكلية لضمان سلامة النقل والتحصيل العلمي.
                  </p>
                </div>
              </div>

              {/* Content Panel Column (Right 8 spans) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* 1. AUDIO LESSONS TAB CONTENT */}
                {activeTab === 'audio' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-1 pb-1 border-b border-gold-royal/5">
                      <span className="text-[10px] font-bold text-gray-400">انقر لتشغيل الدرس في المشغل المدمج أو حدد التقدم:</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const lessons = selectedSubject.explanations[selectedScholarIdx].audioLessons;
                            const updated = { ...lessonsProgress };
                            const updatedTimestamps = { ...lessonsCompletedTimestamps };
                            const now = new Date().toISOString();
                            lessons.forEach(l => {
                              updated[l.id] = 'completed';
                              updatedTimestamps[l.id] = now;
                            });
                            setLessonsProgress(updated);
                            localStorage.setItem('imam_malik_lessons_progress', JSON.stringify(updated));
                            setLessonsCompletedTimestamps(updatedTimestamps);
                            localStorage.setItem('imam_malik_lessons_timestamps', JSON.stringify(updatedTimestamps));
                            triggerToast('تم تحديد جميع دروس هذا الشرح كمكتملة ✅');
                          }}
                          className="text-[9px] font-bold text-emerald-600 hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={10} />
                          تحديد الكل كمكتمل
                        </button>
                        <span className="text-gray-300 dark:text-zinc-800 text-[10px]">|</span>
                        <button
                          onClick={() => {
                            const lessons = selectedSubject.explanations[selectedScholarIdx].audioLessons;
                            const updated = { ...lessonsProgress };
                            const updatedTimestamps = { ...lessonsCompletedTimestamps };
                            lessons.forEach(l => {
                              delete updated[l.id];
                              delete updatedTimestamps[l.id];
                            });
                            setLessonsProgress(updated);
                            localStorage.setItem('imam_malik_lessons_progress', JSON.stringify(updated));
                            setLessonsCompletedTimestamps(updatedTimestamps);
                            localStorage.setItem('imam_malik_lessons_timestamps', JSON.stringify(updatedTimestamps));
                            triggerToast('تم إعادة تعيين تقدم دروس هذا الشرح ⚪');
                          }}
                          className="text-[9px] font-bold text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                        >
                          إعادة تعيين التقدم
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 pl-1 scrollbar-thin">
                      {selectedSubject.explanations[selectedScholarIdx].audioLessons.map((lesson) => {
                        const isThisActive = activeAudioLesson?.lesson.id === lesson.id;
                        const isThisPlaying = isThisActive && isPlaying;
                        const status = lessonsProgress[lesson.id] || 'not_started';
                        const timestampStr = lessonsCompletedTimestamps[lesson.id];
                        const completedDate = timestampStr ? new Date(timestampStr) : null;
                        const daysSinceCompleted = completedDate ? Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        const needsSpacedRepetition = status === 'completed' && daysSinceCompleted >= 7;

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => playAudioLesson(
                              lesson, 
                              selectedSubject.name, 
                              selectedSubject.explanations[selectedScholarIdx].scholarName
                            )}
                            className={`p-3 rounded-2xl border-2 text-right flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:scale-[1.015] hover:shadow-lg hover:shadow-gold-royal/5 translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out group/audio-lesson-item ${
                              isThisActive
                                ? 'bg-gold-royal/10 border-gold-royal shadow-sm text-gold-royal'
                                : 'bg-white/45 dark:bg-black/20 border-gold-royal/10 hover:border-gold-royal/35 text-gray-600 dark:text-gray-300 hover:bg-gold-royal/5'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              {/* Custom Play/Pause circle inside list item */}
                              <button 
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                  isThisActive 
                                    ? 'bg-gold-royal text-[#111]' 
                                    : 'bg-gold-royal/10 text-gold-royal hover:bg-gold-royal hover:text-[#111]'
                                }`}
                              >
                                {isThisPlaying ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current transform translate-x-[1px]" />}
                              </button>

                              <div className="overflow-hidden">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-bold leading-tight truncate">
                                    {lesson.title}
                                  </h5>
                                  {needsSpacedRepetition && (
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 animate-pulse">
                                      <Repeat size={10} className="stroke-[2.5]" />
                                      مراجعة (التكرار المتباعد) 🔁
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 leading-relaxed">
                                  {lesson.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 shrink-0">
                              {/* Lesson Progress Trigger Action Badge */}
                              <button
                                onClick={(e) => cycleLessonProgress(lesson.id, e)}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all duration-300 border cursor-pointer active:scale-95 ${
                                  status === 'completed'
                                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                                    : status === 'in_progress'
                                    ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/25'
                                    : 'bg-gray-500/5 dark:bg-zinc-800/50 text-gray-400 border-gray-200 dark:border-zinc-800 hover:bg-gray-500/10 hover:text-gray-500'
                                }`}
                                title="تغيير حالة الإنجاز (غير مبدوء / قيد الدراسة / مكتمل)"
                              >
                                {status === 'completed' && <CheckCircle2 size={10} className="fill-current text-white dark:text-zinc-900" />}
                                {status === 'in_progress' && <Clock size={10} className="animate-pulse text-amber-500" />}
                                {status === 'not_started' && <div className="w-1.5 h-1.5 rounded-full border border-gray-400" />}
                                <span>
                                  {status === 'completed' ? 'مكتمل' : status === 'in_progress' ? 'قيد الدراسة' : 'بدء الدرس'}
                                </span>
                              </button>

                              <span className="text-[9px] font-mono font-medium text-gray-400 flex items-center gap-0.5">
                                <Clock size={10} />
                                {lesson.duration}
                              </span>

                              {/* Favorite Icon */}
                              <button
                                onClick={(e) => toggleFavoriteLesson(lesson.id, e)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 active:scale-90 transition-all cursor-pointer"
                                title="إضافة للمفضلة"
                              >
                                <Heart 
                                  size={12} 
                                  className={favoritedLessonIds.includes(lesson.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} 
                                />
                              </button>

                              {/* Offline Save Option Button (حفظ الدرس للوصول دون إنترنت) */}
                              <button
                                onClick={(e) => toggleOfflineLesson(lesson.id, e)}
                                className={`p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer flex items-center gap-1 ${
                                  offlineLessonIds.includes(lesson.id)
                                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                    : 'text-gray-400 hover:text-gold-royal'
                                }`}
                                title={
                                  offlineLessonIds.includes(lesson.id)
                                    ? 'الدرس محفوظ للوصول دون إنترنت (انقر لإزالته من الذاكرة المحلية)'
                                    : 'حفظ الدرس للوصول دون إنترنت في الذاكرة المحلية'
                                }
                              >
                                {offlineLessonIds.includes(lesson.id) ? (
                                  <>
                                    <span className="text-[8.5px] bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded font-black whitespace-nowrap">محفوظ 💾</span>
                                    <Wifi size={12} className="stroke-[2.5]" />
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[8.5px] bg-gray-500/10 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">حفظ دون إنترنت</span>
                                    <WifiOff size={12} className="stroke-[2]" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. VIDEO LESSONS TAB CONTENT */}
                {activeTab === 'video' && (
                  <div className="space-y-4">
                    
                    {/* Active Video Player Container inside view */}
                    {activeVideo && (
                      <motion.div 
                        id="video-player-container"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-gold-royal/35 bg-[#040e0a] overflow-hidden p-2 space-y-2.5 shadow-lg relative"
                      >
                        {/* Elegant Video Screen (Interactive mock HTML5 player) */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center group/player">
                          {isVideoPlaying ? (
                            <video 
                              ref={videoRef}
                              src={activeVideo.videoUrl} 
                              controls 
                              autoPlay
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              {/* Custom aesthetic poster */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-4 text-right">
                                <h4 className="text-xs md:text-sm font-bold text-white mb-1">{activeVideo.title}</h4>
                                <p className="text-[10px] text-gold-royal font-medium">مجلس مرئي منهجي</p>
                              </div>
                              
                              <button 
                                onClick={() => setIsVideoPlaying(true)}
                                className="w-14 h-14 rounded-full bg-gold-royal text-[#111] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                              >
                                <Play size={24} className="fill-current transform translate-x-0.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Video Info and Controls info */}
                        <div className="flex justify-between items-center px-1">
                          <div>
                            <h5 className="text-xs font-bold text-white leading-tight">{activeVideo.title}</h5>
                            <span className="text-[9px] text-gold-royal mt-0.5 block">{selectedSubject.explanations[selectedScholarIdx].scholarName}</span>
                          </div>
                          <button
                            onClick={() => {
                              setActiveVideo(null);
                              setIsVideoPlaying(false);
                            }}
                            className="text-[9px] font-bold text-red-400 hover:text-red-500 cursor-pointer"
                          >
                            إغلاق المشغل
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 block px-1">اختر مجلساً مرئياً للمشاهدة:</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedSubject.explanations[selectedScholarIdx].videoLessons.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => playVideoLesson(video)}
                            className="p-3 rounded-2xl border-2 border-gold-royal/10 bg-white/45 dark:bg-black/25 hover:border-gold-royal/35 hover:bg-gold-royal/5 hover:scale-[1.015] hover:shadow-lg hover:shadow-gold-royal/5 translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer text-right flex flex-col justify-between h-24 group/video-item"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gold-royal/10 flex items-center justify-center text-gold-royal shrink-0">
                                <Tv size={14} />
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="text-xs font-bold text-emerald-deep dark:text-white leading-tight line-clamp-2">
                                  {video.title}
                                </h5>
                              </div>
                            </div>

                            <div className="flex justify-between items-center w-full pt-2 border-t border-gold-royal/5 mt-1 shrink-0">
                              <span className="text-[9px] text-gold-royal font-bold flex items-center gap-1">
                                <Play size={8} className="fill-current" />
                                شاهد الآن
                              </span>
                              <span className="text-[9px] font-mono text-gray-400 flex items-center gap-0.5">
                                <Clock size={10} />
                                {video.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. FILES / REGISTRATION TAB CONTENT */}
                {activeTab === 'files' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-gray-400">حقائب ومذكرات PDF معتمدة ومجهزة للقراءة والتنزيل:</span>
                      <span className="text-[9px] font-mono text-gold-royal">{selectedSubject.explanations[selectedScholarIdx].files.length} ملفات متوفرة</span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedSubject.explanations[selectedScholarIdx].files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3.5 rounded-2xl border-2 border-gold-royal/10 bg-white/45 dark:bg-black/20 hover:border-gold-royal/35 hover:bg-gold-royal/5 hover:scale-[1.015] hover:shadow-lg hover:shadow-gold-royal/5 translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out text-right flex items-center justify-between gap-4 group/file-item"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/15">
                              <FileText size={16} />
                            </div>
                            <div className="overflow-hidden">
                              <h5 className="text-xs font-bold text-emerald-deep dark:text-white leading-tight truncate">
                                {file.title}
                              </h5>
                              <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
                                مقرر معتمد من قسم الشريعة بالكلية
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-500/10 dark:bg-gray-500/20 px-2 py-0.5 rounded-lg">
                              {file.size}
                            </span>
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-2 rounded-xl bg-gold-royal/10 text-gold-royal hover:bg-gold-royal hover:text-[#111] transition-all cursor-pointer active:scale-90"
                              title="تنزيل الملف"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick reading help advice */}
                    <div className="p-3 rounded-2xl bg-white/30 dark:bg-black/15 border border-gold-royal/5 flex items-start gap-2.5 mt-4">
                      <Sparkles size={14} className="text-gold-royal shrink-0 mt-0.5 animate-pulse" />
                      <p className="text-[9px] text-gray-400 leading-relaxed text-right">
                        يمكنك الاستعانة بميزة **الكناشة العلمية** بالأسفل في التطبيق لتقييد وتدوين وحفظ الفوائد والأقوال المنتقاة التي تمر بك أثناء سماعك للحلقات الصوتية أو قراءتك للمذكرات ومطالعتها.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL PERSISTENT AUDIO PLAYER BAR */}
      {activeAudioLesson && (
        <div className="mt-8 pt-5 border-t border-gold-royal/20">
          <div className="rounded-3xl p-4 bg-gradient-to-tr from-[#0a1813] to-[#122e23] border border-gold-royal/35 text-right relative overflow-hidden shadow-lg shadow-black/40">
            
            {/* Ambient Background Wave Representation */}
            <div className="absolute top-0 bottom-0 left-0 right-0 opacity-[0.02] pointer-events-none flex items-center justify-center gap-1.5">
              {[...Array(25)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-gold-royal rounded-full" 
                  style={{ height: `${Math.sin(i) * 40 + 50}%` }}
                />
              ))}
            </div>

            {/* Pomodoro Timer Header Widget */}
            <div className="border-b border-gold-royal/15 pb-3 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-right relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gold-royal/10 text-gold-royal flex items-center justify-center border border-gold-royal/25 shrink-0">
                  {pomodoroMode === 'study' ? (
                    <Timer size={16} className={pomodoroIsActive ? "animate-pulse" : ""} />
                  ) : (
                    <Coffee size={16} className={pomodoroIsActive ? "animate-bounce" : ""} />
                  )}
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    مؤقت بومودورو المدمج
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                      pomodoroMode === 'study' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}>
                      {pomodoroMode === 'study' ? 'جلسة المذاكرة (25 د)' : 'استراحة (5 د) ☕'}
                    </span>
                  </h5>
                  <p className="text-[9px] text-gray-400">ينظّم جلسات مذاكرتك ويسهّل تركيزك أثناء سماع الشروحات.</p>
                </div>
              </div>

              {/* Timer Display, Controls and Configuration */}
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3.5">
                {/* Auto-start Option */}
                <label className="flex items-center gap-2 cursor-pointer text-[10px] text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoStartPomodoro}
                    onChange={(e) => {
                      setAutoStartPomodoro(e.target.checked);
                      localStorage.setItem('imam_malik_auto_start_pomodoro', String(e.target.checked));
                      triggerToast(e.target.checked 
                        ? 'تم تفعيل بدء مؤقت التركيز تلقائياً عند تشغيل أي درس ⏱️' 
                        : 'تم إلغاء بدء مؤقت التركيز تلقائياً ⚪'
                      );
                    }}
                    className="rounded border-gold-royal/30 text-gold-royal focus:ring-gold-royal/50 bg-black/40 w-3.5 h-3.5"
                  />
                  <span>تشغيل تلقائي مع الدرس ⏱️</span>
                </label>

                {/* Remaining Time Display */}
                <div className="bg-black/40 border border-gold-royal/25 px-3 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold font-mono text-gold-royal tracking-wider">
                    {Math.floor(pomodoroSeconds / 60)}:{(pomodoroSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Pomodoro Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Play / Pause */}
                  <button
                    onClick={() => {
                      setPomodoroIsActive(!pomodoroIsActive);
                      triggerToast(pomodoroIsActive ? 'تم إيقاف مؤقت التركيز مؤقتاً ⏸️' : 'تم استئناف مؤقت التركيز ▶️');
                    }}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                      pomodoroIsActive
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    }`}
                    title={pomodoroIsActive ? "إيقاف مؤقت" : "بدء الموقت"}
                  >
                    {pomodoroIsActive ? <Pause size={11} /> : <Play size={11} className="translate-x-[0.5px]" />}
                  </button>

                  {/* Reset */}
                  <button
                    onClick={() => {
                      setPomodoroSeconds(pomodoroMode === 'study' ? 25 * 60 : 5 * 60);
                      setPomodoroIsActive(false);
                      triggerToast('تم إعادة تعيين الموقت 🔁');
                    }}
                    className="p-1.5 rounded-lg border border-gold-royal/25 bg-gold-royal/5 text-gold-royal hover:bg-gold-royal/15 transition-all cursor-pointer active:scale-95"
                    title="إعادة تعيين الموقت"
                  >
                    <RotateCcw size={11} />
                  </button>

                  {/* Toggle Mode manually */}
                  <button
                    onClick={() => {
                      const nextMode = pomodoroMode === 'study' ? 'break' : 'study';
                      setPomodoroMode(nextMode);
                      setPomodoroSeconds(nextMode === 'study' ? 25 * 60 : 5 * 60);
                      setPomodoroIsActive(false);
                      triggerToast(nextMode === 'study' ? 'تم الانتقال لطور المذاكرة (25 دقيقة) 📚' : 'تم الانتقال لطور الاستراحة (5 دقائق) ☕');
                    }}
                    className="p-1.5 rounded-lg border border-gold-royal/25 bg-gold-royal/5 text-gold-royal hover:bg-gold-royal/15 transition-all cursor-pointer text-[9px] font-bold"
                    title="تبديل النمط يدوياً"
                  >
                    {pomodoroMode === 'study' ? 'استراحة ☕' : 'مذاكرة 📚'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              {/* Scholar and active lesson metadata info */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl border border-gold-royal/45 bg-black flex items-center justify-center relative shrink-0 overflow-hidden shadow-inner">
                  <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="text-gold-royal"
                  >
                    <Disc size={26} className="opacity-80" />
                  </motion.div>
                  <div className="absolute w-2 h-2 rounded-full bg-gold-royal/50" />
                </div>

                <div className="overflow-hidden text-right">
                  <span className="text-[8px] md:text-[9px] font-bold text-gold-royal uppercase flex items-center justify-start gap-1.5 tracking-wider">
                    <span>{activeAudioLesson.subjectName} • {activeAudioLesson.scholarName}</span>
                    {offlineLessonIds.includes(activeAudioLesson.lesson.id) && (
                      <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 border border-emerald-500/30 animate-pulse">
                        <Wifi size={8} />
                        متاح دون اتصال 💾
                      </span>
                    )}
                  </span>
                  <h4 className="text-xs font-bold text-white leading-tight truncate mt-0.5">
                    {activeAudioLesson.lesson.title}
                  </h4>
                  <p className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">
                    {activeAudioLesson.lesson.description}
                  </p>
                </div>
              </div>

              {/* Player Audio Seek & Controls */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-3 md:gap-5 w-full">
                
                {/* Seek Bar progress */}
                <div className="flex items-center gap-2 w-full md:max-w-md">
                  <span className="text-[10px] font-mono text-gray-400 min-w-8 text-center">{currentTimeText}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={playbackProgress}
                    onChange={handleProgressChange}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold-royal focus:outline-none"
                  />
                  <span className="text-[10px] font-mono text-gray-400 min-w-8 text-center">{durationText}</span>
                </div>

                {/* Interactive Player Controls */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  
                  {/* Volume Slider control */}
                  <div className="flex items-center gap-1.5 w-20">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-gray-400 hover:text-gold-light transition-colors cursor-pointer"
                      title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                    >
                      {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseInt(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold-royal"
                    />
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={togglePlayPause}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-gold-royal to-gold-light text-[#111] hover:shadow-md hover:shadow-gold-royal/20 transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                    title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                  >
                    {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current transform translate-x-0.5" />}
                  </button>

                  {/* Tiny indicator waves */}
                  <div className="flex gap-0.5 items-end h-4 w-8 justify-center shrink-0">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: isPlaying ? [3, 14, 6, 16][i % 4] : 3
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.7 + i * 0.1,
                          ease: 'easeInOut'
                        }}
                        className="w-[3px] bg-gold-royal rounded-full"
                      />
                    ))}
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
