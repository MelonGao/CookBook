// GSAP 插件统一注册入口 —— 在应用启动时 import 一次即可。
// Draggable / InertiaPlugin / DrawSVGPlugin 自 GSAP 3.13 起全部免费，可直接 npm 使用。
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(Draggable, InertiaPlugin, DrawSVGPlugin);

export { gsap, Draggable, InertiaPlugin, DrawSVGPlugin };
