// components/TabBar.tsx - 底部导航(3 个 tab:Home / My List / Profile)
// 用 SVG 图标替代 PNG:清晰、可着色、对比度可控,避免黑底看不清的问题。
import { NavLink } from 'react-router-dom';
import { vibrate } from '@/lib/util';
import './TabBar.css';

interface TabItem {
  path: string;
  text: string;
  icon: (active: boolean) => React.ReactNode;
}

// 24x24 stroke 图标,stroke 颜色随 active 变化
const HomeIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#8a8a8e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
  </svg>
);

// My List:收藏语义,用书签图标(收藏夹)
const MyListIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#fff' : 'none'} stroke={active ? '#fff' : '#8a8a8e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
  </svg>
);

const ProfileIcon = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#8a8a8e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);

const TABS: TabItem[] = [
  { path: '/', text: 'Home', icon: HomeIcon },
  { path: '/mylist', text: 'My List', icon: MyListIcon },
  { path: '/profile', text: 'Profile', icon: ProfileIcon },
];

export function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className="tabbar-item"
          onClick={() => vibrate()}
        >
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span className={`tabbar-text ${isActive ? 'active' : ''}`}>{tab.text}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
