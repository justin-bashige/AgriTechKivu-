import React, { useState, useMemo } from 'react';
import { Search, Play, ExternalLink, CheckCircle, Clock, BookOpen, X, ChevronRight } from 'lucide-react';
import { OFFICIAL_TRAINING_VIDEOS } from '../data/trainings';
import { TrainingVideo } from '../types';

export const TrainingView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [completedVideos, setCompletedVideos] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('agritech_completed_trainings');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Extract unique categories from official trainings list
  const categories = useMemo(() => {
    const set = new Set<string>();
    OFFICIAL_TRAINING_VIDEOS.forEach((v) => set.add(v.category));
    return ['Tous', ...Array.from(set)];
  }, []);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return OFFICIAL_TRAINING_VIDEOS.filter((v) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'Tous' || v.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const toggleVideoCompleted = (id: string) => {
    setCompletedVideos((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('agritech_completed_trainings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleOpenVideo = (video: TrainingVideo) => {
    if (!completedVideos.includes(video.id)) {
      toggleVideoCompleted(video.id);
    }
    window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Header matching mockup 1791815570701~5.jpg */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans">
            Formation
          </h1>
          <p className="text-xs text-stone-500">
            Modules pratiques et tutoriels agricoles en vidéo
          </p>
        </div>
      </div>

      {/* Search Input matching mockup */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une formation (compost, irrigation, maïs, manioc...)"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              selectedCategory === cat
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Progression Stats Banner */}
      <div className="bg-[#f0f7f2] border border-[#d3ebd7] rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>
            {completedVideos.length} sur {OFFICIAL_TRAINING_VIDEOS.length} module(s) consultés
          </span>
        </div>
        <div className="w-24 bg-emerald-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#15803d] h-full transition-all"
            style={{
              width: `${Math.round((completedVideos.length / OFFICIAL_TRAINING_VIDEOS.length) * 100)}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Video Cards List (Directly matching mockup 1791815570701~5.jpg) */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-6 text-center text-xs text-stone-500">
          Aucun module de formation ne correspond à votre recherche.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVideos.map((video) => {
            const isDone = completedVideos.includes(video.id);

            return (
              <div
                key={video.id}
                className="bg-white border border-stone-200 rounded-2xl p-3.5 hover:border-emerald-600 transition shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
              >
                {/* Left: Thumbnail + Title + Duration matching mockup */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail with duration badge and play icon */}
                  <div
                    onClick={() => handleOpenVideo(video)}
                    className="cursor-pointer relative w-24 sm:w-28 h-18 sm:h-20 rounded-xl overflow-hidden bg-stone-900 shrink-0 group"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-sm group-hover:bg-[#15803d] group-hover:text-white transition">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Texts */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                      {video.category}
                    </span>
                    <h3
                      onClick={() => handleOpenVideo(video)}
                      className="text-xs sm:text-sm font-bold text-stone-900 hover:text-emerald-700 cursor-pointer line-clamp-2 leading-snug mt-0.5"
                    >
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{video.durationMinutes} min</span>
                      </span>
                      <span>·</span>
                      <span className="text-red-700 font-medium">YouTube</span>
                    </div>

                    {/* Green progress bar indicator matching mockup 1791815570701~5.jpg */}
                    <div className="w-28 bg-stone-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDone ? 'bg-[#15803d] w-full' : 'bg-stone-200 w-0'}`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => toggleVideoCompleted(video.id)}
                    className={`p-2 rounded-lg text-xs transition flex items-center gap-1 ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                    title={isDone ? 'Marqué comme vu' : 'Marquer comme vu'}
                  >
                    <CheckCircle className={`w-4 h-4 ${isDone ? 'fill-emerald-600 text-white' : ''}`} />
                    <span className="hidden sm:inline">{isDone ? 'Terminé' : 'À voir'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenVideo(video)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold transition shadow-xs"
                  >
                    <span>Regarder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
