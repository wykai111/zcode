// App.tsx - 根布局:含底部 TabBar,Outlet 渲染 tab 页面
import { Outlet } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';
import { Toast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import './App.css';

export function App() {
  return (
    <div className="app-shell">
      <div className="app-content">
        <Outlet />
      </div>
      <TabBar />
      <Toast />
      <Modal />
    </div>
  );
}

export default App;
