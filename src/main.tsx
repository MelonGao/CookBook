// 应用入口：挂载 React、注册 GSAP 插件、引入全局样式
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@/lib/gsapSetup';
// 手写字体（npm 自托管，见 DESIGN_SYSTEM §2.2）：标题 Kalam、正文 Patrick Hand、中文霞鹜文楷
import '@fontsource/kalam/400.css';
import '@fontsource/kalam/700.css';
import '@fontsource/patrick-hand/400.css';
import 'lxgw-wenkai-webfont/style.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
