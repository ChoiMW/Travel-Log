import React from 'react';
import { MapPin, BookOpen, Image as ImageIcon, BarChart3, Settings, Plus, Compass, Moon, Sun, Luggage } from 'lucide-react';

export type NavTab = 'home' | 'map' | 'timeline' | 'photos' | 'pocket' | 'stats' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewTrip: () => void;
  visitedCount: number;
  totalCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onNewTrip,
  visitedCount,
  totalCount,
  isDarkMode,
  onToggleTheme,
}) => {
  const percent = totalCount > 0 ? ((visitedCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="logo-group" onClick={() => onTabChange('home')}>
          <div className="logo-badge">
            <Compass size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">
              TravelLog <span className="logo-sub">Korea</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="desktop-nav">
          <button
            className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            홈
          </button>
          <button
            className={`nav-btn ${currentTab === 'map' ? 'active' : ''}`}
            onClick={() => onTabChange('map')}
          >
            <MapPin size={16} />
            여행 지도
          </button>
          <button
            className={`nav-btn ${currentTab === 'timeline' ? 'active' : ''}`}
            onClick={() => onTabChange('timeline')}
          >
            <BookOpen size={16} />
            여행 기록
          </button>
          <button
            className={`nav-btn ${currentTab === 'photos' ? 'active' : ''}`}
            onClick={() => onTabChange('photos')}
          >
            <ImageIcon size={16} />
            사진첩
          </button>
          <button
            className={`nav-btn ${currentTab === 'pocket' ? 'active' : ''}`}
            onClick={() => onTabChange('pocket')}
          >
            <Luggage size={16} />
            여행 포켓 (QR/준비물)
          </button>
          <button
            className={`nav-btn ${currentTab === 'stats' ? 'active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            <BarChart3 size={16} />
            통계 ({percent}%)
          </button>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <button
            className="btn-icon"
            onClick={onToggleTheme}
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="btn btn-primary" onClick={onNewTrip}>
            <Plus size={18} />
            <span>기록하기</span>
          </button>

          <button
            className={`btn-icon ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
            title="백업 및 설정"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Bottom TabBar */}
      <nav className="mobile-tabbar">
        <button
          className={`tab-item ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
        >
          <Compass size={22} />
          <span>홈</span>
        </button>
        <button
          className={`tab-item ${currentTab === 'map' ? 'active' : ''}`}
          onClick={() => onTabChange('map')}
        >
          <MapPin size={22} />
          <span>지도</span>
        </button>
        <button
          className={`tab-item ${currentTab === 'pocket' ? 'active' : ''}`}
          onClick={() => onTabChange('pocket')}
        >
          <Luggage size={22} />
          <span>포켓/QR</span>
        </button>
        <button
          className={`tab-item ${currentTab === 'timeline' ? 'active' : ''}`}
          onClick={() => onTabChange('timeline')}
        >
          <BookOpen size={22} />
          <span>기록</span>
        </button>
        <button
          className={`tab-item ${currentTab === 'photos' ? 'active' : ''}`}
          onClick={() => onTabChange('photos')}
        >
          <ImageIcon size={22} />
          <span>사진</span>
        </button>
      </nav>
    </>
  );
};
