// router.tsx - 路由表
// 路由用 HashRouter:TikTok Minis 在 WebView 内运行,Hash 路由无需服务端配合。
// tab 页 3 个(Home / My List / Profile);其余为全屏页(无 TabBar)。
import { createHashRouter, type RouteObject } from 'react-router-dom';
import { App } from './App';
import { HomePage } from '@/pages/HomePage';
import { MyListPage } from '@/pages/MyListPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { PlayerPage } from '@/pages/PlayerPage';
import { ListPage } from '@/pages/ListPage';
import { WatchHistoryPage } from '@/pages/WatchHistoryPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />, // App 含 TabBar 布局,Outlet 渲染 tab 页
    children: [
      { index: true, element: <HomePage /> },
      { path: 'mylist', element: <MyListPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  // 非 tab 页(全屏,无 TabBar)
  { path: '/profile/watch-history', element: <WatchHistoryPage /> },
  { path: '/player/:id', element: <PlayerPage /> },
  { path: '/list', element: <ListPage /> },
];

export const router = createHashRouter(routes);

/** tab 路由路径常量(对应底部 TabBar) */
export const TAB_PATHS = ['/', '/mylist', '/profile'] as const;
