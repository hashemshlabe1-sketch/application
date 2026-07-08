import React, { useState } from 'react';
import { 
  BookOpen, 
  Megaphone, 
  Scale, 
  Compass, 
  ShieldCheck, 
  Library, 
  PenTool, 
  Award, 
  Heart, 
  Sparkles, 
  Flame, 
  Users, 
  UsersRound, 
  Pin, 
  ExternalLink,
  Share2,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { Channel } from '../types';
import ReadingModeModal from './ReadingModeModal';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen,
  Megaphone,
  Scale,
  Compass,
  ShieldCheck,
  Library,
  PenTool,
  Award,
  Heart,
  Sparkles,
  Flame,
  Users,
  UsersRound
};

interface ChannelCardProps {
  key?: string | number;
  channel: Channel;
  isPinned: boolean;
  onTogglePin: () => void;
  index: number;
  onShare: (title: string, text: string, url?: string) => void;
}

export default function ChannelCard({ channel, isPinned, onTogglePin, index, onShare }: ChannelCardProps) {
  const IconComponent = iconMap[channel.icon] || BookOpen;
  const [isReadingModeOpen, setIsReadingModeOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.5) }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-[2rem] p-5 glass-card flex flex-col justify-between min-h-[170px] border-2 transition-all duration-300 group hover:scale-[1.015] hover:shadow-lg hover:shadow-gold-royal/5 translate-y-0 hover:-translate-y-1 ${
        isPinned 
          ? 'border-gold-royal/50 shadow-md shadow-gold-royal/5 bg-gold-royal/[0.03]' 
          : 'border-gold-royal/10 hover:border-gold-royal/35'
      }`}
    >
      {/* Arabic Watermark decoration in background */}
      <div className="absolute -bottom-4 -left-4 text-gold-royal font-serif text-5xl opacity-[0.03] select-none pointer-events-none transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12">
        ﷺ
      </div>

      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Channel Icon Frame */}
        <div className={`p-3 rounded-xl shrink-0 transition-all duration-300 ${
          isPinned 
            ? 'bg-gradient-to-br from-gold-royal to-gold-light text-[#111]' 
            : 'bg-emerald-deep/10 dark:bg-emerald-deep/30 text-gold-light group-hover:bg-gold-royal/20'
        }`}>
          <IconComponent size={22} className="stroke-[1.5]" />
        </div>

        {/* Share Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(
              `قناة: ${channel.name}`,
              `انضم لقناة "${channel.name}" الموثوقة عبر منصة الإمام مالك التعليمية. الوصف: ${channel.description}`,
              channel.link
            );
          }}
          className="p-1.5 rounded-lg border border-transparent text-gray-400 hover:text-gold-light hover:bg-white/5 transition-all duration-300 active:scale-90 cursor-pointer"
          title="مشاركة القناة"
        >
          <Share2 size={16} />
        </button>

        {/* Reading Mode Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsReadingModeOpen(true);
          }}
          className="p-1.5 rounded-lg border border-transparent text-gray-400 hover:text-gold-light hover:bg-white/5 transition-all duration-300 active:scale-90 cursor-pointer"
          title="وضع القراءة المريح"
        >
          <Eye size={16} />
        </button>

        {/* Pin action button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`p-1.5 rounded-lg border transition-all duration-300 active:scale-90 cursor-pointer ${
            isPinned 
              ? 'bg-gold-royal/20 border-gold-royal text-gold-light' 
              : 'border-transparent text-gray-400 hover:text-gold-light hover:bg-white/5'
          }`}
          title={isPinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
        >
          <Pin 
            size={16} 
            className={`transition-transform duration-300 ${
              isPinned ? 'fill-gold-royal rotate-45 text-gold-light' : '-rotate-45 group-hover:rotate-0'
            }`} 
          />
        </button>
      </div>

      {/* Info Section */}
      <div className="flex-1 text-right mb-4">
        <h3 className="text-base font-bold text-emerald-deep dark:text-[#ebfbf3] tracking-tight mb-1 flex items-center gap-1.5">
          {isPinned && <span className="text-xs text-gold-royal select-none">📌</span>}
          {channel.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
          {channel.description}
        </p>
      </div>

      {/* Call To Action button */}
      <div className="flex justify-end pt-2 border-t border-white/5 dark:border-white/5 light:border-emerald-deep/5">
        <a
          href={channel.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-gold-royal hover:text-gold-light transition-colors duration-300 group/link"
        >
          <span>انتقال إلى تليجرام</span>
          <ExternalLink size={12} className="transition-transform duration-300 group-hover/link:translate-x-1 group-hover/link:-translate-y-0.5 shrink-0" />
        </a>
      </div>

      {/* Focused Reading Mode Full-Screen/Focused Modal */}
      <ReadingModeModal 
        isOpen={isReadingModeOpen} 
        onClose={() => setIsReadingModeOpen(false)} 
        channelName={channel.name} 
        channelDescription={channel.description} 
      />
    </motion.div>
  );
}
