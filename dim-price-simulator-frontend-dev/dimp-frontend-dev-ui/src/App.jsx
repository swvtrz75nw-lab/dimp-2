// App.jsx — root: routing, theme, sidebar, modals, tweaks, toast.
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar.jsx';
import ChatPage from './Chat.jsx';
import HomePage from './pages/HomePage.jsx';
import DomainPage from './pages/DomainPage.jsx';
import InflationPage from './pages/InflationPage.jsx';
import MaterialPage from './pages/MaterialPage.jsx';
import PlatformPage from './pages/PlatformPage.jsx';
import CategoryManagement from './pages/CategoryManagement.jsx';
import EquipmentCosting from './pages/EquipmentCosting.jsx';
import PdcaPage from './pages/PdcaPage.jsx';
import IndexLibraryPage from './pages/IndexLibraryPage.jsx';
import ModelCardsPage from './pages/ModelCardsPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import OnboardingAgentPage from './pages/OnboardingAgentPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import { ProfileModal, NotificationsPopover } from './components/Modals.jsx';
import { Icon } from './components/Icon.jsx';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider, TweakColor,
} from './components/TweaksPanel.jsx';
import { USER } from './mockData/user.js';
import { NAV } from './mockData/navigation.js';
import { NOTIFICATIONS, NOTIF_RULES } from './mockData/notifications.js';
import { getUser, getNotifications, getNotificationRules } from './services/api.js';
import './App.css';

// Build a lookup: path -> page id, and page id -> path
const PATH_TO_PAGE = {};
const PAGE_TO_PATH = {};
NAV.forEach((item) => {
  if (item.path && item.id) {
    PATH_TO_PAGE[item.path] = item.id;
    PAGE_TO_PATH[item.id] = item.path;
  }
});
// Additional routes not in sidebar
PAGE_TO_PATH['history'] = '/history';
PAGE_TO_PATH['onboarding-agent'] = '/onboarding-agent';
PAGE_TO_PATH['notifications'] = '/notifications';
PATH_TO_PAGE['/history'] = 'history';
PATH_TO_PAGE['/onboarding-agent'] = 'onboarding-agent';
PATH_TO_PAGE['/notifications'] = 'notifications';

function getPageFromPath(pathname) {
  if (PATH_TO_PAGE[pathname]) return PATH_TO_PAGE[pathname];
  // Handle sub-paths (e.g. /category-management/{id})
  if (pathname.startsWith('/category-management')) return 'category-management';
  return 'chat';
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "islandVariant": "spring",
  "motion": 7,
  "clarify": true,
  "accent": "#009cde"
}/*EDITMODE-END*/;

const ACCENT_SOFT = { '#009cde': 'rgba(0,156,222,0.16)', '#003da5': 'rgba(0,61,165,0.16)', '#a51890': 'rgba(165,24,144,0.16)' };

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState(() => ({ page: getPageFromPath(window.location.pathname) }));
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileStartTab, setProfileStartTab] = useState('profile');
  const [user, setUser] = useState(USER);
  const [rules, setRules] = useState(NOTIF_RULES);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [toast, setToast] = useState(null);
  const [chatSeed, setChatSeed] = useState({ nonce: 0, prefill: '' });
  const toastTimer = useRef(null);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setRoute({ page: getPageFromPath(window.location.pathname) });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Hydrate session data through the services layer (falls back to mock data).
  useEffect(() => {
    let alive = true;
    getUser().then((d) => alive && d && setUser(d));
    getNotifications().then((d) => alive && d && setNotifs(d));
    getNotificationRules().then((d) => alive && d && setRules(d));
    return () => { alive = false; };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  function navigate(r) {
    if (r.page === 'chat' && (r.prefill || r.chat)) {
      setChatSeed({ nonce: Date.now(), prefill: r.prefill || '' });
    }
    // Update browser URL
    const path = PAGE_TO_PATH[r.page] || '/chat';
    if (window.location.pathname !== path) {
      window.history.pushState({ page: r.page }, '', path);
    }
    setRoute(r);
    setNotifOpen(false);
  }

  const dismissNotif = (id) => setNotifs((n) => n.filter((x) => x.id !== id));
  const openSettingsNotif = () => { setNotifOpen(false); setProfileStartTab('notification'); setProfileOpen(true); };

  const rootClass = 'root ' + (t.theme === 'light' ? 'theme-light-root' : 'theme-dark');
  const rootStyle = { '--pmi-blue': t.accent, '--pmi-blue-soft': ACCENT_SOFT[t.accent] || 'rgba(0,156,222,0.16)', '--tint': t.accent };

  return (
    <div className={rootClass} style={rootStyle}>
      {/* canvas background */}
      <div className="canvas-bg">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      </div>

      <div className="app">
        <Sidebar
          collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)}
          route={route} onNavigate={navigate}
          onOpenProfile={() => { setProfileStartTab('profile'); setProfileOpen(true); }}
          onOpenNotifications={() => setNotifOpen((v) => !v)}
          notifCount={notifs.length}
          theme={t.theme} onToggleTheme={() => setTweak('theme', t.theme === 'light' ? 'dark' : 'light')}
        />

        <div className="main">
          {route.page === 'chat' && (
            <ChatPage
              key={chatSeed.nonce}
              islandVariant={t.islandVariant} motion={t.motion} clarifyEnabled={t.clarify}
              onToast={showToast} seedPrefill={chatSeed.prefill}
            />
          )}
          {route.page === 'home' && <HomePage onNavigate={navigate} />}
          {route.page === 'inflation' && <InflationPage onNavigate={navigate} islandVariant={t.islandVariant} />}
          {route.page === 'dim' && <MaterialPage onNavigate={navigate} islandVariant={t.islandVariant} />}
          {/* {route.page === 'equipment' && <DomainPage id={route.page} onNavigate={navigate} />} */}
          {route.page === 'equipment' && <EquipmentCosting />}
          {route.page === 'pdca' && <PdcaPage />}
          {route.page === 'indexlibrary' && <IndexLibraryPage />}
          {route.page === 'modelcards' && <ModelCardsPage />}
          {['supplier', 'admin'].includes(route.page) && <PlatformPage id={route.page} />}
          {route.page === 'category-management' && <CategoryManagement onNavigate={navigate} />}
          {route.page === 'history' && <HistoryPage onNavigate={navigate} />}
          {route.page === 'onboarding-agent' && <OnboardingAgentPage />}
          {route.page === 'notifications' && <NotificationsPage notifs={notifs} onDismiss={dismissNotif} onOpenSettings={openSettingsNotif} />}
        </div>
      </div>

      {/* notifications popover */}
      {notifOpen && (
        <NotificationsPopover
          notifs={notifs} onDismiss={dismissNotif} onClose={() => setNotifOpen(false)}
          onOpenSettings={openSettingsNotif}
          onSeeAll={() => { setNotifOpen(false); navigate({ page: 'notifications' }); }}
        />
      )}

      {/* profile modal */}
      {profileOpen && (
        <ProfileModal
          startTab={profileStartTab} onClose={() => setProfileOpen(false)}
          user={user} setUser={setUser} rules={rules} setRules={setRules}
        />
      )}

      {/* toast */}
      {toast && <div className="toast"><Icon name="check" size={16} className="tk" /> {toast}</div>}

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Signature input" />
        <TweakRadio label="Island morph" value={t.islandVariant} options={['spring', 'panel', 'sheet']} onChange={(v) => setTweak('islandVariant', v)} />
        <TweakToggle label="Ask clarifying questions" value={t.clarify} onChange={(v) => setTweak('clarify', v)} />
        <TweakSection label="Feel" />
        <TweakRadio label="Theme" value={t.theme} options={['dark', 'light']} onChange={(v) => setTweak('theme', v)} />
        <TweakSlider label="Motion" value={t.motion} min={0} max={10} step={1} onChange={(v) => setTweak('motion', v)} />
        <TweakColor label="Accent" value={t.accent} options={['#009cde', '#003da5', '#a51890']} onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}
