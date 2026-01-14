import { useEffect, useRef } from 'react';
export const useGameInput = () => {
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouse = useRef({ x: 0, y: 0, leftDown: false, rightDown: false });
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  const handlers = {
    onMouseMove: (e: React.MouseEvent) => { const r = e.currentTarget.getBoundingClientRect(); mouse.current.x = e.clientX - r.left; mouse.current.y = e.clientY - r.top; },
    onMouseDown: (e: React.MouseEvent) => { if (e.button === 0) mouse.current.leftDown = true; },
    onMouseUp: (e: React.MouseEvent) => { if (e.button === 0) mouse.current.leftDown = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault()
  };
  return { keys, mouse, handlers };
};
