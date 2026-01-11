import { useEffect, useRef } from 'react';

/**
 * キーボードとマウスの入力を管理するカスタムフック
 */
export const useGameInput = () => {
  // レンダリングを引き起こさないよう Ref で管理
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouse = useRef({ x: 0, y: 0, leftDown: false, rightDown: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current.x = e.clientX - rect.left;
    mouse.current.y = e.clientY - rect.top;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) mouse.current.leftDown = true;
    if (e.button === 2) mouse.current.rightDown = true;
  };

  const handleMouseUp = () => {
    mouse.current.leftDown = false;
    mouse.current.rightDown = false;
  };

  return {
    keys,
    mouse,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(), // 右クリックメニュー抑制
    }
  };
};
