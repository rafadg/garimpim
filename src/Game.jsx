// App.jsx
import { useState, useEffect } from 'react';

function Game() {

    const hit_sound = new Audio("https://cdn.rafaeldantas.dev.br/sounds/hit_stone.mp3");
    const break_sound = new Audio("https://cdn.rafaeldantas.dev.br/sounds/finish.mp3");

    // Estados do jogo
    const [ballPosition, setBallPosition] = useState(0); // Posição da bola (0-100%)
    const [score, setScore] = useState(10); // Pontuação
    const [speed, setSpeed] = useState(1); // Velocidade inicial da bola
    const [direction, setDirection] = useState(2); // 1 = direita, -1 = esquerda

    // Função para verificar acerto quando espaço é pressionado
    const handleKeyPress = (e) => {
        if (e.key === ' ') {
            // Zona verde está entre 45% e 55%
            if (ballPosition >= 0 && ballPosition <= 100) {
                setScore(score - 1);
                setSpeed(speed + 0.1); // Aumenta velocidade
                hit_sound.play();
            } else {
                setScore(10); // Reseta pontuação
                setSpeed(2); // Reseta velocidade
            }
        }
    };

    // Animação da bola
    useEffect(() => {
        const interval = setInterval(() => {
            setBallPosition((prev) => {
                let newPosition = prev + (speed * direction);

                // Inverte direção nas bordas
                if (newPosition >= 100) {
                    setDirection(-1);
                    return 100;
                }
                if (newPosition <= 0) {
                    setDirection(1);
                    return 0;
                }
                return newPosition;
            });
        }, 16); // ~60fps

        return () => clearInterval(interval);
    }, [speed, direction]);

    // Adiciona listener para tecla espaço
    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [ballPosition, score]);

    useEffect(() => {
        if (score <= 0) {
            break_sound.play();
            setScore(10);
        }
    }, [score]);


    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
            {/* Pontuação */}
            <div className="text-white text-2xl mb-4">Pontos: {score}</div>

            {/* Container da barra */}
            <div className="w-[600px] h-12 bg-gray-700 relative overflow-hidden">
                {/* Zona verde */}
                <div className="absolute w-[120px] h-full bg-green-500 left-1/2 -translate-x-1/2" />

                {/* Bola */}
                <div
                    className="absolute w-8 h-8 top-1/2 -translate-y-1/2 transition-all duration-[16ms] flex justify-center items-center"
                    style={{ left: `${ballPosition}%` }}
                >
                    <img className='w-8' src='https://cdn.rafaeldantas.dev.br/pickaxe_1.png' />
                </div>
            </div>

            {/* Instruções */}
            <div className="text-white mt-4">
                Pressione ESPAÇO quando a bola estiver na zona verde!
            </div>
        </div>
    );
}

export default Game;