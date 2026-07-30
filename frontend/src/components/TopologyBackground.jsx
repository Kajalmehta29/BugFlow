import React, { useEffect, useRef } from 'react';
import './TopologyBackground.css';

export default function TopologyBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    let intensity = 0;

    const mouse = { x: null, y: null };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    resizeCanvas();

    const draw = () => {
      time += 1.5;
      if (intensity < 1.0) {
        intensity += 0.008; // Fade in over 125 frames (~2 seconds)
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.body.classList.contains('dark');
      const lineColor = isDark 
        ? `rgba(45, 212, 191, ${0.16 * intensity})` 
        : `rgba(15, 118, 110, ${0.2 * intensity})`;
      const dotColor = isDark 
        ? `rgba(45, 212, 191, ${0.36 * intensity})` 
        : `rgba(15, 118, 110, ${0.45 * intensity})`;

      const rows = 16;
      const cols = 20;
      const xSpacing = canvas.width / (cols - 1);
      const ySpacing = canvas.height / (rows - 1);

      const grid = [];
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const baseX = c * xSpacing;
          const baseY = r * ySpacing;

          const offsetX = Math.sin(c * 0.4 + time * 0.0015) * Math.cos(r * 0.3 + time * 0.001) * 28;
          const offsetY = Math.cos(c * 0.3 + time * 0.001) * Math.sin(r * 0.4 + time * 0.0018) * 28;

          let px = baseX + offsetX;
          let py = baseY + offsetY;

          // Mouse warp effect
          if (mouse.x !== null && mouse.y !== null) {
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 220) {
              const force = (220 - dist) / 220; // 0 to 1
              px += (dx / dist) * force * 35;
              py += (dy / dist) * force * 35;
            }
          }

          grid[r][c] = { x: px, y: py };
        }
      }

      // Draw grid lines
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const current = grid[r][c];

          if (c < cols - 1) {
            const right = grid[r][c + 1];
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }

          if (r < rows - 1) {
            const bottom = grid[r + 1][c];
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.stroke();
          }

          // Intersection point dots
          ctx.beginPath();
          ctx.arc(current.x, current.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="topology-bg" />;
}
