import { useEffect, useRef, useState } from 'react';
import PongCanvas from './PongCanvas';
import { io, Socket } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '../../api/queries';
import GameStatusesComponent from './GameStatusesComponent';
import { ThreeDots } from 'react-loader-spinner';
import Cookies from "js-cookie";
import { useUser } from "../../context/UserContext";


export enum GameStatus {
    WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
}

export interface Player {
    firstName: string | undefined;
}

interface JoinRoomMessage {
    room: string;
}

export interface FinishedGameState {
    gameStatus: GameStatus;
    winner: {
        name: string;
        side: string;
        score: number;
    } | null;
    looser: {
        name: string;
        side: string;
        score: number;
    } | null;
    scoreLeft: number;
    scoreRight: number;
    currentPlayer: {
        name: string | undefined ;
        side: string;
        score: number;
    } | null;
}

export interface GameParameters {
    scoreLeft: number,
    scoreRight: number,
    xBall: number,
    yBall: number,
    xSpeed: number,
    ySpeed: number,
    canvasWidth: number,
    canvasHeight: number,
    paddleWidth: number,
    paddleHeight: number,
    leftPaddlePositionY: number,
    rightPaddlePositionY: number,
    victoryPoints: number,
    ballRadius: number,
}

function Game() {
    //const [user, setUser] = useState<User | null>(null);
    const {user} = useUser(); // Recuperation de la session de l'utilisateur
    const socketRef = useRef<Socket | null>(null);

    const token = Cookies.get('jwtToken');
    if (!token) {
        return; //TODO: redirect vers login ?
    }

    useEffect(() => {
        socketRef.current = io('http://localhost:3333/events', { //TODO: add variable environment
            auth: {
                token: token
            }
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    if (socketRef === null || socketRef.current === undefined) {
        return <ThreeDots color='#000000' height={100} width={100} />;
    }

    // useEffect(() => {
    //     // TODO change = Ask username with js
    //     const username = prompt('Enter your username');
    //     if (username) {
    //         setUser({
    //             pseudo: username,
    //             avatar: null,
    //             friends: [],
    //             isF2Active: false,
    //         });
    //     }
    // }, []);

    const handleResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        console.log("newWidth: " + newWidth)
        console.log("newHeight: " + newHeight)
        /* if (newWidth < 600 || newHeight < 700) {
            //divide by 4
        }
        if (newWidth < 1000 || newHeight < 800) {
            //divide by 2
        }*/
    };

    const [rightPaddlePositionY, setRightPaddlePositionY] = useState<number>(100);
    const [leftPaddlePositionY, setLeftPaddlePositionY] = useState<number>(100);

    const [gameStatus, setGameStatus] = useState(GameStatus.WAITING_FOR_PLAYERS);
    const [leftPlayer, setLeftPlayer] = useState<Player | null>(null);
    const [rightPlayer, setRightPlayer] = useState<Player | null>(null);
    const [finishedGameState, setFinishedGameState] = useState<FinishedGameState | null>({
        gameStatus: gameStatus,
        winner: null,
        looser: null,
        scoreLeft: 100,
        scoreRight: 0,
        currentPlayer: null,
    });
    let playingSide = 'LEFT';
    const [paddleWidth, setPaddleWidth] = useState<number>(3);
    const [paddleHeight, setPaddleHeight] = useState<number>(100);

    const [ballRadius, setBallRadius] = useState<number>(6);
    const [ballPositionX, setBallPositionX] = useState<number>(120);
    const [ballPositionY, setBallPositionY] = useState<number>(150);
    const [ballSpeedX, setBallSpeedX] = useState<number>(2);
    const [ballSpeedY, setBallSpeedY] = useState<number>(2);
    const [scoreLeft, setScoreLeft] = useState<number>(0);
    const [scoreRight, setScoreRight] = useState<number>(0);
    const [scorePositionOffsetY, setScorePositionOffsetY] = useState<number>(40);
    const [scorePositionOffsetX, setScorePositionOffsetX] = useState<number>(40);
    const [boardWidth, setBoardWidth] = useState<number>(800);
    const [boardHeight, setBoardHeight] = useState<number>(400);

    const setGameParameters = (gameData: GameParameters) => {
        setScoreLeft((gameData.scoreLeft));
        setScoreRight(gameData.scoreRight);
        setBallRadius(gameData.ballRadius);
        setBallPositionX(gameData.xBall);
        setBallPositionY(gameData.yBall);
        setBallSpeedX(gameData.xSpeed);
        setBallSpeedY(gameData.ySpeed);
        setBoardWidth(gameData.canvasWidth);
        setBoardHeight(gameData.canvasHeight);
        setLeftPaddlePositionY(gameData.leftPaddlePositionY);
        setRightPaddlePositionY(gameData.rightPaddlePositionY);
        setPaddleHeight(gameData.paddleHeight);
        setPaddleWidth(gameData.paddleWidth);
    }

    const { gameId } = useParams<{ gameId: string }>();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const navigate = useNavigate();

    const updateGameStatus = (gameStatus: GameStatus) => {
        setGameStatus(gameStatus);
    };

    const canvasHeight = boardHeight;

    const drawPaddles = () => {
        const paddleOffset = 30; // change in backend to 30
        canvasRef.current!.getContext('2d')!.fillStyle = 'white';
        canvasRef.current!.getContext('2d')!.fillRect(paddleOffset, leftPaddlePositionY, paddleWidth, paddleHeight); // Draw left paddle
        canvasRef.current!.getContext('2d')!.fillRect(canvasRef.current!.width - paddleWidth - paddleOffset, rightPaddlePositionY, paddleWidth, paddleHeight); // Draw right paddle
    };

    const drawBall = () => {
        canvasRef.current!.getContext('2d')!.beginPath();
        canvasRef.current!.getContext('2d')!.fillStyle = 'white';
        canvasRef.current!.getContext('2d')!.arc(ballPositionX, ballPositionY, ballRadius, 0, Math.PI * 2); // Use ballRadius for the ball's size
        canvasRef.current!.getContext('2d')!.fill();
        canvasRef.current!.getContext('2d')!.closePath();
    };

    const drawNet = () => {
        canvasRef.current!.getContext('2d')!.beginPath();
        canvasRef.current!.getContext('2d')!.strokeStyle = 'white';
        canvasRef.current!.getContext('2d')!.setLineDash([5, 6]);
        canvasRef.current!.getContext('2d')!.moveTo(canvasRef.current!.width / 2, 0);
        canvasRef.current!.getContext('2d')!.lineTo(canvasRef.current!.width / 2, canvasRef.current!.height);
        canvasRef.current!.getContext('2d')!.stroke();
        canvasRef.current!.getContext('2d')!.closePath();
    };

    const drawScore = () => {
        canvasRef.current!.getContext('2d')!.font = '32px Arial';
        const leftScore = `${scoreLeft}`;
        const rightScore = `${scoreRight}`;
        canvasRef.current!.getContext('2d')!.textAlign = 'right';
        canvasRef.current!.getContext('2d')!.fillText(leftScore, canvasRef.current!.width / 2 - scorePositionOffsetX, scorePositionOffsetY);
        canvasRef.current!.getContext('2d')!.textAlign = 'left';
        canvasRef.current!.getContext('2d')!.fillText(rightScore, canvasRef.current!.width / 2 + scorePositionOffsetX, scorePositionOffsetY);
    };

    const drawWalls = () => {
        canvasRef.current!.getContext('2d')!.fillStyle = 'white';
        canvasRef.current!.getContext('2d')!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    };

    const draw = () => {
        if (canvasRef.current === null) {
            return;
        }
        if (canvasRef.current.getContext('2d')! === null) {
            return;
        }
        if (gameStatus === GameStatus.FINISHED || gameStatus === GameStatus.WAITING_FOR_PLAYERS) {
            return;
        }

        drawWalls();
        drawNet();
        drawScore();
        drawPaddles();
        drawBall();
    };

    const initializeCanvas = (canvasEl: HTMLCanvasElement) => {
        canvasRef.current = canvasEl;
    };

    useEffect(() => {
        if (!gameId) return;
        if (user && socketRef && socketRef.current) {
            console.log('joinRoom', gameId, 'user', user); //TODO: remove ?
            const joinRoomMessage: { room: string } = {
                room: gameId,
            };
            socketRef.current.emit('joinRoom', joinRoomMessage);
            console.log("joinRoom emitted");
        }
    }, [user]);

    function movePaddle(e: { key: string; }) {
        if (canvasRef.current === null) {
            return;
        }
        if (socketRef.current === null) {
            return;
        }
        if (playingSide == 'LEFT') {
            if (e.key === 'ArrowUp' && leftPaddlePositionY > 0) {
                console.log('player left movePaddle UP');
                socketRef.current.emit('movePaddleClient', { direction: 'UP', room: gameId });
            } else if (e.key === 'ArrowDown' && leftPaddlePositionY < canvasHeight - paddleHeight) {
                console.log('player left movePaddle DOWN');
                socketRef.current.emit('movePaddleClient', { direction: 'DOWN', room: gameId });
            }
        } else if (playingSide == 'RIGHT') {
            if (e.key === 'ArrowUp' && rightPaddlePositionY > 0) {
                console.log('player right movePaddle UP');
                socketRef.current.emit('movePaddleClient', { direction: 'UP', room: gameId });
            } else if (e.key === 'ArrowDown' && rightPaddlePositionY < canvasHeight - paddleHeight) {
                console.log('player right movePaddle DOWN');
                socketRef.current.emit('movePaddleClient', { direction: 'DOWN', room: gameId });
            }
        }
    }

    useEffect(() => {

        const handleKeyDown = (event) => {
            console.log("addEventListener");
            event.preventDefault();
            movePaddle(event);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            console.log("return removeEventListener");
            document.removeEventListener('keydown', handleKeyDown);
        }
        }, []);

    useEffect(() => {
        if (!user) return;

        socketRef.current?.on('movePaddleOpponent', function (data) {
            if (playingSide === 'LEFT') {
                setRightPaddlePositionY(data.y);
            } else if (playingSide === 'RIGHT') {
                setLeftPaddlePositionY(data.y);
            }
        });

        socketRef.current?.on('moveMyPaddle', function (data) {
            console.log('moveMyPaddle - playingSide', playingSide, 'data', data);
            if (playingSide === 'LEFT') {
                setLeftPaddlePositionY(data.y);
            } else if (playingSide === 'RIGHT') {
                setRightPaddlePositionY(data.y);
            }
        });

        socketRef.current?.on('scoring', function (data) {
            console.log('scoring', data);
            setScoreLeft(data.score_left);
            setScoreRight(data.score_right);
        });

        socketRef.current?.on('yourPosition', function (data) {
            console.log("event Your Position: USER PSEUDO = " + user.pseudo);
            if (data.side === 'RIGHT') {
                playingSide = 'RIGHT';
                setRightPlayer({
                    firstName: user.pseudo,
                });
                setRightPaddlePositionY(data.y);
            } else if (data.side === 'LEFT') {
                setLeftPlayer({
                    firstName: user.pseudo,
                });
                setLeftPaddlePositionY(data.y);
            } else {
                console.error('yourPosition error');
            }

        });

        socketRef.current?.on('gameData', function (data) {
            setLeftPlayer({
                firstName: data.playerLeft,
            });
            setRightPlayer({
                firstName: data.playerRight,
            });
            setGameParameters(data.gameData);
        });

        socketRef.current?.on('startGame', function (data) {
            if (data.eventName === 'start') {
                // todo change to get the whole user ?
                setLeftPlayer({
                    firstName: data.playerLeft,
                });
                setRightPlayer({
                    firstName: data.playerRight,
                });
                setGameParameters(data.gameData);
                setGameStatus(GameStatus.IN_PROGRESS);
            } else if (data.eventName === 'waiting') {
                setGameStatus(GameStatus.WAITING_FOR_PLAYERS);
            }
        });

        socketRef.current?.on('gameDoesNotExist', function (data) {
            console.log('gameDoesNotExist', data);
            navigate('/')
        })

        socketRef.current?.on('endGame', function (data) {
            setFinishedGameState({
                gameStatus: GameStatus.FINISHED,
                winner: data.winner,
                looser: data.looser,
                scoreLeft: data.left_score,
                scoreRight: data.right_score,
                currentPlayer: user ? {
                    name: user.pseudo,
                    side: playingSide,
                    score: 0,
                } : null
            })

            setGameStatus(GameStatus.FINISHED);
        });
        socketRef.current?.on('ballPositionEvent', function (data) {
            updateGameStatus(GameStatus.IN_PROGRESS);
            setBallPositionX(data.x);
            setBallPositionY(data.y);
        });
    }, [user]);

    return (
        <>
            <div className='flex items-stretch relative flex-col-reverse md:flex-row '>
                <div className='flex flex-1 flex-col items-center justify-center sm:py-2 sm:px-5'>
                    <GameStatusesComponent
                        gameStatus={gameStatus}
                        leftPlayer={leftPlayer}
                        rightPlayer={rightPlayer}
                        finishedGameState={finishedGameState}
                    />
                    {
                        socketRef.current && gameStatus === GameStatus.IN_PROGRESS && (
                            <PongCanvas
                                initializeCanvas={initializeCanvas}
                                canvasRef={canvasRef}
                                gameStatus={gameStatus}
                                paddleWidth={paddleWidth}
                                paddleHeight={paddleHeight}
                                leftPaddlePositionY={leftPaddlePositionY}
                                rightPaddlePositionY={rightPaddlePositionY}
                                ballRadius={ballRadius}
                                ballPositionX={ballPositionX}
                                ballPositionY={ballPositionY}
                                ballSpeedX={ballSpeedX}
                                ballSpeedY={ballSpeedY}
                                scoreLeft={scoreLeft}
                                scoreRight={scoreRight}
                                scorePositionOffsetY={scorePositionOffsetY}
                                scorePositionOffsetX={scorePositionOffsetX}
                                boardWidth={boardWidth}
                                boardHeight={boardHeight}
                                playingSide={'LEFT'}
                                draw={draw}
                            />
                        )
                    }

                    <button
                        className='text-3xl font-display text-orangeNG hover:text-4xl ease-i-out duration-300 NewGame mt-32'
                        onClick={() => {
                            navigate('/');
                        }}>
                        Go home
                    </button>
                </div>
            </div>
        </>
    );
}

export default Game;