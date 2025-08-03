import React, { useEffect, useState } from 'react';

interface LoadingPageProps {
  onAnimationEnd: () => void;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ onAnimationEnd }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 3000); // Start fading after 3 seconds

    const unmountTimer = setTimeout(() => {
      onAnimationEnd();
    }, 3500); // Unmount after fade animation (500ms) completes

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onAnimationEnd]);

  return (
    <>
      <style>{`
        .loading-page-wrapper {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: #b8daf8; /* Fallback */
          background-color: var(--secondary-color-tint, #b8daf8);
          opacity: 1;
          transition: opacity 0.5s ease-in-out;
          display: grid;
          place-items: center;
          font-size: 16px;
          line-height: 1;
        }

        .loading-page-wrapper.fading {
          opacity: 0;
        }

        .loading-page-wrapper * {
          box-sizing: border-box;
        }

        :root {
          --black: #444;
          --white: #fff;
          --primary-color-tint: #fff;
          --primary-color: #f8f800;
          --primary-color-dark: #d3e54a;
          --secondary-color-tint: #b8daf8;
          --secondary-color: #58b8f8;
          --secondary-color-dark: #1992e3;
          --accent-color: #f80808;
          --mouth-stroke-width: 3px;
        }

        .pika {
          position: relative;
          animation: surf 5s infinite ease-in-out;
        }

        .pika *,
        .pika *::before,
        .pika *::after {
          position: absolute;
        }

        .pika-eye {
          border-radius: 50% 55% 50% 45%;
          background-color: var(--black);
          animation: blinky 7s infinite;
        }

        .pika-eye::before {
          content: '';
          border-radius: 100%;
          background-color: var(--white);
          height: 40%;
          width: 40%;
        }

        .pika-eye-left {
          top: 20%;
          left: 35%;
          height: 1.875rem;
          width: 1.875rem;
        }

        .pika-eye-left::before {
          top: 15%;
          right: 15%;
        }

        .pika-eye-right {
          top: 24%;
          right: 12%;
          height: 1.625rem;
          width: 1.375rem;
        }

        .pika-eye-right::before {
          top: 20%;
          left: 25%;
        }

        .pika-nose {
          border-radius: 50% 30% 50% 70%;
          top: 40%;
          left: 65%;
          height: 0.325rem;
          width: 0.5rem;
          background-color: var(--black);
        }

        .pika-mouth {
          top: 47%;
          left: 52%;
          width: 3rem;
          height: 0.625rem;
        }

        .pika-mouth-outline {
          inset: 0;
          overflow: hidden;
        }

        .pika-mouth-outline::before,
        .pika-mouth-outline::after {
          content: '';
          height: 200%;
          border-radius: 100%;
          border-bottom: var(--mouth-stroke-width) solid var(--black);
        }

        .pika-mouth-outline::before {
          bottom: 0;
          width: calc(65% - var(--mouth-stroke-width));
          border-right: var(--mouth-stroke-width) solid var(--black);
        }

        .pika-mouth-outline::after {
          bottom: 5%;
          right: 0;
          width: 35%;
          border-left: var(--mouth-stroke-width) solid var(--black);
        }

        .pika-cheek {
          border-radius: 100%;
          background-color: var(--accent-color);
        }

        .pika-cheek-left {
          top: 35%;
          left: 20%;
          height: 2.5rem;
          width: 2.25rem;
          rotate: 15deg;
        }

        .pika-cheek-right {
          top: 40%;
          right: 2%;
          height: 2.25rem;
          width: 1.5rem;
          rotate: -8deg;
        }

        .pika-face {
          z-index: 2;
          inset: 0;
          border-top-left-radius: 40% 75%;
          border-top-right-radius: 50% 60%;
          border-bottom-left-radius: 40% 25%;
          border-bottom-right-radius: 60% 40%;
          background-color: var(--primary-color);
        }

        .pika-ear {
          background-color: var(--black);
          transform-origin: center bottom;
          overflow: hidden;
        }

        .pika-ear::before,
        .pika-ear::after {
          border-radius: 100%;
        }

        .pika-ear::before {
          content: '';
          top: 25%;
          height: 100%;
          width: 200%;
          background-color: var(--primary-color);
        }

        .pika-ear::after {
          height: 30%;
          width: 120%;
          background-color: var(--primary-color-dark);
        }

        .pika-ear-left {
          bottom: 80%;
          left: 15%;
          height: 8.5rem;
          width: 4rem;
          border-top-left-radius: 75% 100%;
          border-top-right-radius: 25% 80%;
          border-bottom-right-radius: 20%;
          rotate: -70deg;
          animation: earLeftRotate 5s infinite;
        }

        .pika-ear-left::before {
          left: -10%;
        }

        .pika-ear-right {
          bottom: 70%;
          right: 10%;
          height: 8rem;
          width: 3.75rem;
          border-top-left-radius: 25% 80%;
          border-top-right-radius: 75% 100%;
          border-bottom-left-radius: 20%;
          rotate: 15deg;
          animation: earRightRotate 5s infinite;
        }

        .pika-ear-right::before {
          right: -10%;
        }

        .pika-ear-right::after {
          content: '';
          bottom: 5%;
          left: -50%;
          rotate: 30deg;
        }

        .pika-head {
          position: relative;
          height: 10rem;
          width: 12rem;
        }

        .pika-back-stripes {
          z-index: 3;
          top: 25%;
          height: 35%;
        }

        .pika-back-stripes::before,
        .pika-back-stripes::after {
          content: '';
          height: 1.5rem;
          border-top-right-radius: 2rem 40%;
          border-bottom-right-radius: 2rem 60%;
          background-color: var(--black);
          rotate: 20deg;
        }

        .pika-back-stripes::before {
          width: 2rem;
        }

        .pika-back-stripes::after {
          left: -0.5rem;
          bottom: 0;
          width: 2.5rem;
        }

        .pika-leg {
          bottom: 0;
          left: 2rem;
          height: 4rem;
          width: 4rem;
          border-top-right-radius: 50%;
          background-color: var(--primary-color);
        }

        .pika-torso {
          inset: 0;
          border-top-left-radius: 30% 70%;
          border-top-right-radius: 30% 40%;
          border-bottom-left-radius: 40% 30%;
          border-bottom-right-radius: 30% 50%;
          background-color: var(--primary-color);
          overflow: hidden;
        }

        .pika-torso::before {
          content: '';
          top: 12%;
          right: -20%;
          width: 40%;
          height: 30%;
          border-radius: 100%;
          background-color: var(--primary-color-dark);
        }

        .pika-torso-shadow {
          inset: 0;
        }

        .pika-torso-shadow::before,
        .pika-torso-shadow::after {
          content: '';
          border-radius: 100%;
        }

        .pika-torso-shadow::before {
          left: 20%;
          bottom: -15%;
          height: 50%;
          width: 100%;
          background-color: var(--primary-color-dark);
        }

        .pika-torso-shadow::after {
          left: 35%;
          bottom: 21%;
          height: 40%;
          width: 70%;
          background-color: var(--primary-color);
        }
        
        .pika-fingers {
          left: 50%;
          translate: -50% -30%;
        }

        .pika-fingers,
        .pika-fingers::before,
        .pika-fingers::after {
          border-radius: 50% 80% 50% 20%;
          height: 0.75rem;
          width: 0.4375rem;
          background-color: inherit;
        }

        .pika-fingers::before,
        .pika-fingers::after {
          content: '';
          top: 20%;
        }

        .pika-fingers::before {
          right: 90%;
        }

        .pika-fingers::after {
          left: 90%;
        }

        .pika-arm {
          transform-origin: center bottom;
          background-color: var(--primary-color);
        }

        .pika-arm-left {
          z-index: 10;
          top: 22%;
          left: 28%;
          height: 2.5rem;
          width: 2.75rem;
          rotate: 30deg;
          border-top-left-radius: 60% 60%;
          border-top-right-radius: 40% 70%;
          border-bottom-left-radius: 60% 40%;
          border-bottom-right-radius: 40% 30%;
        }

        .pika-arm-left::before {
          content: '';
          z-index: 2;
          inset: 0;
          top: 3px;
          border-radius: inherit;
          background-color: var(--primary-color);
        }

        .pika-arm-left::after {
          content: '';
          inset: 0;
          border-radius: inherit;
          background-color: var(--primary-color);
          border-top: 3px solid var(--primary-color-dark);
        }

        .pika-arm-left .pika-fingers {
          box-sizing: content-box;
          z-index: 1;
          top: 0.125rem;
          left: 70%;
          rotate: 20deg;
        }

        .pika-arm-left .pika-fingers,
        .pika-arm-left .pika-fingers::before,
        .pika-arm-left .pika-fingers::after {
          border: 2px solid var(--primary-color-dark);
          border-bottom: 0;
        }

        .pika-arm-left .pika-fingers::before {
          translate: 1px -2px;
        }

        .pika-arm-left .pika-fingers::after {
          translate: -1px -2px;
        }

        .pika-arm-right {
          border-radius: 50% 70% 50% 30%;
          top: 25%;
          right: 0.25rem;
          height: 3rem;
          width: 3rem;
          rotate: 85deg;
        }

        .pika-arm-right .pika-arm-shadow {
          inset: 0;
          border-radius: inherit;
          overflow: hidden;
        }

        .pika-arm-right .pika-arm-shadow::before {
          content: '';
          top: 25%;
          left: -60%;
          height: 80%;
          width: 100%;
          border-radius: 100%;
          background-color: var(--primary-color-dark);
        }

        .pika-tail {
          z-index: -1;
          transform-origin: right bottom;
          background-color: var(--primary-color);
          border-radius: 0.25rem;
        }

        .pika-tail-1 {
          right: 95%;
          bottom: 40%;
          height: 1.5rem;
          width: 3.75rem;
          rotate: 40deg;
          transform: skewX(10deg);
          background-color: var(--accent-color);
          animation: tail 5s infinite;
        }

        .pika-tail-2 {
          left: 0;
          bottom: 0;
          height: 3rem;
          width: 1.75rem;
        }

        .pika-tail-2-highlight {
          inset: 0;
          border-radius: inherit;
          overflow: hidden;
        }

        .pika-tail-2-highlight::before {
          content: '';
          left: -10%;
          bottom: -45%;
          height: 100%;
          width: 200%;
          rotate: -40deg;
          background-color: var(--accent-color);
        }

        .pika-tail-3 {
          right: 0;
          height: 2rem;
          width: 4.75rem;
        }

        .pika-tail-4 {
          left: 0;
          bottom: 0;
          height: 4.5rem;
          width: 2rem;
          rotate: 10deg;
        }

        .pika-tail-5 {
          right: 0;
          height: 3.25rem;
          width: 5.5rem;
          transform: skewX(20deg);
        }

        .pika-body {
          position: relative;
          margin-top: -5.5rem;
          left: -12%;
          height: 11rem;
          width: 12.5rem;
        }

        .pika-surf {
          left: -45%;
          bottom: -25%;
          height: 6rem;
          width: 25rem;
          border-top-left-radius: 60% 55%;
          border-top-right-radius: 30% 45%;
          border-bottom-left-radius: 35% 45%;
          border-bottom-right-radius: 65% 55%;
          background-color: var(--secondary-color-dark);
        }

        .pika-surf::after {
          content: '';
          left: 4rem;
          bottom: -1rem;
          height: 3rem;
          width: 3.5rem;
          border-bottom-left-radius: 0.5em;
          border-bottom-right-radius: 80% 100%;
          background-color: var(--secondary-color);
        }

        .pika-surf-highlight {
          overflow: hidden;
        }
        
        .pika-surf-highlight,
        .pika-surf-highlight::after {
          inset: 0;
          border-radius: inherit;
        }

        .pika-surf-highlight::before,
        .pika-surf-highlight::after {
          content: '';
        }

        .pika-surf-highlight::before {
          top: 5%;
          left: -10%;
          height: 70%;
          width: 90%;
          border-radius: 100%;
          background-color: var(--secondary-color);
          rotate: -7deg;
        }

        .pika-surf-highlight::after {
          box-shadow: inset -1.5rem 1rem 0 var(--primary-color);
          opacity: 0.7;
        }

        @keyframes tail {
          0%, 100% { rotate: 40deg; }
          50% { rotate: 10deg; }
        }

        @keyframes earLeftRotate {
          0%, 100% { rotate: -70deg; }
          50% { rotate: -60deg; }
        }

        @keyframes earRightRotate {
          0%, 100% { rotate: 15deg; }
          50% { rotate: 20deg; }
        }

        @keyframes surf {
          0%, 100% { translate: 0; }
          50% { translate: 0 2rem; rotate: 2deg; }
        }
        
        @keyframes blinky {
           0%, 9%, 11%, 19%, 21%, 69%, 71%, 100% { transform: scaleY(1); }
          10%, 20%, 70% { transform: scaleY(0.1); }
        }
      `}</style>
      <div className={`loading-page-wrapper ${isFading ? 'fading' : ''}`}>
        <div className="pika">
          <div className="pika-head">
            <div className="pika-face">
              <div className="pika-eye pika-eye-left"></div>
              <div className="pika-eye pika-eye-right"></div>
              <div className="pika-nose"></div>
              <div className="pika-mouth">
                <div className="pika-mouth-outline"></div>
                <div className="pika-mouth-inner"></div>
              </div>
              <div className="pika-cheek pika-cheek-left"></div>
              <div className="pika-cheek pika-cheek-right"></div>
            </div>
            <div className="pika-ear pika-ear-left"></div>
            <div className="pika-ear pika-ear-right"></div>
          </div>
          <div className="pika-body">
            <div className="pika-arm pika-arm-left">
              <div className="pika-fingers"></div>
            </div>
            <div className="pika-arm pika-arm-right">
              <div className="pika-fingers"></div>
              <div className="pika-arm-shadow"></div>
            </div>
            <div className="pika-torso">
              <div className="pika-torso-shadow"></div>
              <div className="pika-back-stripes"></div>
              <div className="pika-leg"></div>
            </div>
            <div className="pika-tail pika-tail-1">
              <div className="pika-tail pika-tail-2">
                <div className="pika-tail pika-tail-3">
                  <div className="pika-tail pika-tail-4">
                    <div className="pika-tail pika-tail-5"></div>
                  </div>
                </div>
                <div className="pika-tail-2-highlight"></div>
              </div>
            </div>
          </div>
          <div className="pika-surf">
            <div className="pika-surf-highlight"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoadingPage;
