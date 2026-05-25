import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';

export default function Hero3DScene() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setHasWebGL(support);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-auto overflow-hidden">
      {hasWebGL ? (
        <Spline 
          scene="https://prod.spline.design/wOss701A0-w5lkkt/scene.splinecode" 
          className="w-full h-full scale-105"
        />
      ) : (
        /* Premium cosmos fallback background for Hero */
        <div className="relative w-full h-full bg-slate-950">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] animate-[pulse_8s_infinite]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[110px] animate-[pulse_6s_infinite]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-950/80 to-slate-950"></div>
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]"></div>
        </div>
      )}
    </div>
  );
}
