import React from 'react';
import { MapPin, BookOpen, Image as ImageIcon, BarChart3, Settings, Plus, Compass, Moon, Sun, Luggage, Globe } from 'lucide-react';
import { CountryCode } from '../../types/travel';

export type NavTab = 'home' | 'map' | 'timeline' | 'photos' | 'pocket' | 'stats' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onNewTrip: () => void;
  onOpenSettings?: () => void;
  visitedCount: number;
  totalCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  selectedCountry,
  onCountryChange,
  onNewTrip,
  onOpenSettings,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="logo-group" onClick={() => onTabChange('home')}>
            <div className="logo-badge" style={{ background: selectedCountry === 'JP' ? '#f43f5e' : undefined }}>
              <Compass size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="logo-text">
                TravelLog <span className="logo-sub">{selectedCountry === 'JP' ? 'Japan' : 'Korea'}</span>
              </div>
            </div>
          </div>

          {/* 🌐 글로벌 국가 선택 스위처 (🇰🇷 대한민국 / 🇯🇵 일본) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-hover)',
              borderRadius: '9999px',
              padding: '3px',
              border: '1px solid var(--border-light)',
            }}
          >
            <button
              onClick={() => onCountryChange('KR')}
              style={{
                background: selectedCountry === 'KR' ? 'var(--bg-surface)' : 'transparent',
                color: selectedCountry === 'KR' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: selectedCountry === 'KR' ? 800 : 600,
                cursor: 'pointer',
                boxShadow: selectedCountry === 'KR' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇰🇷</span>
              <span>한국</span>
            </button>

            <button
              onClick={() => onCountryChange('JP')}
              style={{
                background: selectedCountry === 'JP' ? 'var(--bg-surface)' : 'transparent',
                color: selectedCountry === 'JP' ? '#f43f5e' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: selectedCountry === 'JP' ? 800 : 600,
                cursor: 'pointer',
                boxShadow: selectedCountry === 'JP' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇯🇵</span>
              <span>일본</span>
            </button>
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
            {selectedCountry === 'JP' ? '일본 지도' : '한국 지도'}
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
            정복률 ({percent}%)
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

          <button
            className="btn btn-primary"
            onClick={onNewTrip}
            style={{ background: selectedCountry === 'JP' ? '#f43f5e' : undefined }}
          >
            <Plus size={18} />
            <span>기록하기</span>
          </button>

          <button
            className={`btn-icon ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else onTabChange('settings');
            }}
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
