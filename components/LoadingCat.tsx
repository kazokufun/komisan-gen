import React from 'react';

const LoadingCat: React.FC = () => {
    return (
        <>
            <style>{`
                .loader {
                  position: relative; /* Changed from fixed to work inside flex container */
                  width: 160px;
                  height: 160px;
                  background-color: transparent;
                  border-radius: 50%;
                  border: 2px solid #415A77; /* dark-surface */
                }
                html.light .loader {
                    border: 2px solid #BAE6FD; /* light-accent */
                }
                .loader:before {
                  content: '';
                  width: 164px;
                  height: 164px;
                  display: block;
                  position: absolute;
                  border: 2px solid #778DA9; /* dark-accent */
                  border-radius: 50%;
                  top: -2px;
                  left: -2px;
                  box-sizing: border-box;
                  clip: rect(0px, 35px, 35px, 0px);
                  z-index: 10;
                  animation: rotate 3s linear infinite;
                }
                html.light .loader:before {
                    border: 2px solid #075985; /* light-text-secondary */
                }
                .loader:after {
                  content: '';
                  width: 164px;
                  height: 164px;
                  display: block;
                  position: absolute;
                  border: 2px solid #E0E1DD; /* dark-text */
                  border-radius: 50%;
                  top: -2px;
                  left: -2px;
                  box-sizing: border-box;
                  clip: rect(0px, 164px, 150px, 0px);
                  z-index: 9;
                  animation: rotate2 3s linear infinite;
                }
                html.light .loader:after {
                    border: 2px solid #082F49; /* light-text-primary */
                }

                .hexagon-container {
                  list-style: none;
                  margin: 0;
                  padding: 0;
                  position: relative;
                  top: 33px;
                  left: 41px;
                  border-radius: 50%;
                }

                .hexagon {
                  position: absolute;
                  width: 40px;
                  height: 23px;
                  background-color: #415A77; /* dark-surface */
                }
                html.light .hexagon {
                  background-color: #BAE6FD; /* light-accent */
                }
                .hexagon:before {
                  content: "";
                  position: absolute;
                  top: -11px;
                  left: 0;
                  width: 0;
                  height: 0;
                  border-left: 20px solid transparent;
                  border-right: 20px solid transparent;
                  border-bottom: 11.5px solid #415A77; /* dark-surface */
                }
                 html.light .hexagon:before {
                    border-bottom-color: #BAE6FD; /* light-accent */
                }
                .hexagon:after {
                  content: "";
                  position: absolute;
                  top: 23px;
                  left: 0;
                  width: 0;
                  height: 0;
                  border-left: 20px solid transparent;
                  border-right: 20px solid transparent;
                  border-top: 11.5px solid #415A77; /* dark-surface */
                }
                html.light .hexagon:after {
                    border-top-color: #BAE6FD; /* light-accent */
                }


                /* Expanded SCSS @each loop */
                .hexagon.hex_1 { top: 0px; left: 0px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 0.214s; }
                .hexagon.hex_2 { top: 0px; left: 42px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 0.428s; }
                .hexagon.hex_3 { top: 36px; left: 63px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 0.642s; }
                .hexagon.hex_4 { top: 72px; left: 42px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 0.857s; }
                .hexagon.hex_5 { top: 72px; left: 0px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 1.071s; }
                .hexagon.hex_6 { top: 36px; left: -21px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 1.285s; }
                .hexagon.hex_7 { top: 36px; left: 21px; animation: Animasearch 3s ease-in-out infinite; animation-delay: 1.5s; }

                @keyframes Animasearch {
                  0% { transform: scale(1); opacity: 1; }
                  15%, 50% { transform: scale(0.5); opacity: 0; }
                  65% { transform: scale(1); opacity: 1; }
                }

                @keyframes rotate {
                  0% { transform: rotate(0); clip: rect(0px, 35px, 35px, 0px); }
                  50% { clip: rect(0px, 40px, 40px, 0px); }
                  100% { transform: rotate(360deg); clip: rect(0px, 35px, 35px, 0px); }
                }

                @keyframes rotate2 {
                  0% { transform: rotate(0deg); clip: rect(0px, 164px, 150px, 0px); }
                  50% { clip: rect(0px, 164px, 0px, 0px); transform: rotate(360deg); }
                  100% { transform: rotate(720deg); clip: rect(0px, 164px, 150px, 0px); }
                }
            `}</style>
            <div className="loader">
                <ul className="hexagon-container">
                    <li className="hexagon hex_1"></li>
                    <li className="hexagon hex_2"></li>
                    <li className="hexagon hex_3"></li>
                    <li className="hexagon hex_4"></li>
                    <li className="hexagon hex_5"></li>
                    <li className="hexagon hex_6"></li>
                    <li className="hexagon hex_7"></li>
                </ul>
            </div>
        </>
    );
};

export default LoadingCat;