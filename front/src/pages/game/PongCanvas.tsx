import { useCallback, useEffect, useRef, useState } from 'react';
import { GameStatus } from './Game';

interface PongCanvasProperties {
    paddleWidth: number;
    paddleHeight: number;
    leftPaddlePositionY: number;
    rightPaddlePositionY: number;
    ballRadius: number;
    ballPositionX: number;
    ballPositionY: number;
    ballSpeedX: number;
    ballSpeedY: number;
    scoreLeft: number;
    scoreRight: number;
    scorePositionOffsetY: number;
    scorePositionOffsetX: number;
    boardWidth: number;
    boardHeight: number;
    playingSide: 'LEFT' | 'RIGHT';
    gameStatus: GameStatus;
    initializeCanvas: (canvas: HTMLCanvasElement) => void;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    draw: () => void;
}

function PongCanvas(
    {
        paddleWidth,
        paddleHeight,
        leftPaddlePositionY,
        rightPaddlePositionY,
        ballRadius,
        ballPositionX,
        ballPositionY,
        ballSpeedX,
        ballSpeedY,
        scoreLeft,
        scoreRight,
        scorePositionOffsetY,
        scorePositionOffsetX,
        boardWidth,
        boardHeight,
        playingSide,
        gameStatus,
        initializeCanvas,
        canvasRef,
        draw,
    }: PongCanvasProperties,
) {
    // Callback ref to ensure canvas is mounted
    useEffect(() => {
        if (canvasRef.current) {
            console.log('Canvas mounted');
            initializeCanvas(canvasRef.current);
        }
    }, []);

    useEffect(() => {
        draw();
    }, [
        ballPositionY,
        ballPositionX,
        leftPaddlePositionY,
        rightPaddlePositionY,
        playingSide,
        gameStatus,
        scoreLeft,
        scoreRight,
        ballSpeedX,
        ballSpeedY,
        paddleWidth,
        paddleHeight,
        ballRadius,
        scorePositionOffsetY,
        scorePositionOffsetX,
    ]);

    return (
        <div className='flex justify-center'>
            <canvas
                ref={canvasRef}
                id='pong'
                width={boardWidth}
                height={boardHeight}
                // TODO - Make shadow more strict
                className='border border-black rounded-3xl bg-black shadow shadow-md max-w-full'
            ></canvas>
        </div>
    );
}

export default PongCanvas;
