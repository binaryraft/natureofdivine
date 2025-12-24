'use client';

import { useEffect, useRef } from 'react';

interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wind: number;
    opacity: number;
}

export function Snowfall() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let snowflakes: Snowflake[] = [];
        const snowflakeCount = 100; // Adjustable density

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createSnowflakes = () => {
            snowflakes = [];
            for (let i = 0; i < snowflakeCount; i++) {
                snowflakes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 1,
                    speed: Math.random() * 1 + 0.5,
                    wind: Math.random() * 0.5 - 0.25,
                    opacity: Math.random() * 0.5 + 0.3
                });
            }
        };

        const drawSnowflakes = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.beginPath();

            for (let i = 0; i < snowflakes.length; i++) {
                const f = snowflakes[i];
                ctx.globalAlpha = f.opacity;
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2, true);
            }
            ctx.fill();
            updateSnowflakes();
            animationFrameId = requestAnimationFrame(drawSnowflakes);
        };

        const updateSnowflakes = () => {
            for (let i = 0; i < snowflakes.length; i++) {
                const f = snowflakes[i];
                f.y += f.speed;
                f.x += f.wind;

                if (f.y > canvas.height) {
                    f.y = 0;
                    f.x = Math.random() * canvas.width;
                }
                if (f.x > canvas.width) {
                    f.x = 0;
                } else if (f.x < 0) {
                    f.x = canvas.width;
                }
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        createSnowflakes();
        drawSnowflakes();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 mix-blend-overlay opacity-60"
            aria-hidden="true"
        />
    );
}
