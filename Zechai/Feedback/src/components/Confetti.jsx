import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function Confetti({ trigger = true }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!trigger || fired.current) return;
    fired.current = true;

    const colors = ['#e1492c', '#2596be', '#0a0a0a', '#ffffff'];
    const end = Date.now() + 2000;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [trigger]);

  return null;
}
