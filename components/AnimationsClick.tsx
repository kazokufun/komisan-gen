import React, { useEffect, useRef } from 'react';

// This component assumes the anime.js library is loaded globally via a script tag.
declare const anime: any;

const AnimationsClick: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Use a ref to store animations so it persists across renders without causing effect re-runs
    const animationsRef = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        // Ensure anime.js is loaded and canvas is available
        if (!canvas || typeof anime === 'undefined') {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const numberOfParticules = 24;
        const distance = 200;
        let pointerX = 0;
        let pointerY = 0;

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const updateCoords = (e: MouseEvent | TouchEvent) => {
            if (e instanceof MouseEvent) {
                pointerX = e.clientX;
                pointerY = e.clientY;
            } else if (e.touches && e.touches.length > 0) {
                pointerX = e.touches[0].clientX;
                pointerY = e.touches[0].clientY;
            }
        };

        const colors = ['#FF324A', '#31FFA6', '#206EFF', '#FFFF99'];

        const createCircle = (x: number, y: number) => {
            const p: any = {};
            p.x = x;
            p.y = y;
            p.color = '#FFF';
            p.radius = 0;
            p.alpha = 1;
            p.lineWidth = 6;
            p.draw = () => {
                if (!ctx) return;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
                ctx.lineWidth = p.lineWidth;
                ctx.strokeStyle = p.color;
                ctx.stroke();
                ctx.globalAlpha = 1;
            };
            return p;
        };

        const createParticule = (x: number, y: number) => {
            const p: any = {};
            p.x = x;
            p.y = y;
            p.color = colors[anime.random(0, colors.length - 1)];
            p.radius = anime.random(16, 32);
            p.draw = () => {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
                ctx.fillStyle = p.color;
                ctx.fill();
            };
            return p;
        };

        const createParticles = (x: number, y: number) => {
            const particules = [];
            for (let i = 0; i < numberOfParticules; i++) {
                const p = createParticule(x, y);
                particules.push(p);
            }
            return particules;
        };
        
        const removeAnimation = (animation: any) => {
            const index = animationsRef.current.indexOf(animation);
            if (index > -1) animationsRef.current.splice(index, 1);
        };

        const animateParticules = (x: number, y: number) => {
            const particules = createParticles(x, y);
            const circle = createCircle(x, y);
            
            const particulesAnimation = anime({
                targets: particules,
                x: (p: any) => p.x + anime.random(-distance, distance),
                y: (p: any) => p.y + anime.random(-distance, distance),
                radius: 0,
                duration: () => anime.random(1200, 1800),
                easing: 'easeOutExpo',
                complete: removeAnimation
            });

            const circleAnimation = anime({
                targets: circle,
                radius: () => anime.random(125, 175),
                lineWidth: 0,
                alpha: {
                    value: 0,
                    easing: 'linear',
                    duration: () => anime.random(400, 600)
                },
                duration: () => anime.random(1200, 1800),
                easing: 'easeOutExpo',
                complete: removeAnimation
            });

            animationsRef.current.push(particulesAnimation);
            animationsRef.current.push(circleAnimation);
        };

        const mainLoop = anime({
            duration: Infinity,
            update: () => {
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                animationsRef.current.forEach(anim => {
                    anim.animatables.forEach((animatable: any) => {
                        animatable.target.draw();
                    });
                });
            }
        });

        const handleEvent = (e: MouseEvent | TouchEvent) => {
            updateCoords(e);
            animateParticules(pointerX, pointerY);
        };
        
        document.addEventListener('mousedown', handleEvent);
        document.addEventListener('touchstart', handleEvent);
        window.addEventListener('resize', setCanvasSize);
        
        setCanvasSize();

        return () => {
            document.removeEventListener('mousedown', handleEvent);
            document.removeEventListener('touchstart', handleEvent);
            window.removeEventListener('resize', setCanvasSize);
            mainLoop.pause();
            animationsRef.current = [];
        };
    }, []);

    return (
        <>
            <style>{`
                .fireworks {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    pointer-events: none;
                }
            `}</style>
            <canvas ref={canvasRef} className="fireworks"></canvas>
        </>
    );
};

export default AnimationsClick;