import { FinishedGameState, GameStatus, Player } from './Game';
import GameFinishedComponent from './GameFinishedComponent';
import { ThreeDots } from 'react-loader-spinner'

interface GameStatusProperties {
    gameStatus: GameStatus;
    leftPlayer: Player | null;
    rightPlayer: Player | null;
    finishedGameState: FinishedGameState | null;
}

function GameStatusesComponent({
    gameStatus, leftPlayer, rightPlayer, finishedGameState,
}: GameStatusProperties) {
    return (
        <>
            {
                gameStatus === GameStatus.WAITING_FOR_PLAYERS ? (
                    <div className='flex flex-col items-center justify-center mb-8'>
                        <p className='text-4xl font-display text-black NewGame mb-32 text-center'>
                            WAITING FOR OPPONENT
                        </p>
                        <ThreeDots
                            color='#000000'
                            height={100}
                            width={100}
                        />
                    </div>
                ) : null
            }
            {
                gameStatus === GameStatus.IN_PROGRESS ? (
                    <div className='flex flex-row items-center justify-center my-8 w-full'>
                        <div className='flex-1 flex justify-end break-all text-right'>
                            <p className='text-3xl font-display text-green-300 ease-i-out duration-300 NewGame'>
                                {leftPlayer?.firstName}
                            </p>
                        </div>

                        <div className='flex-none mx-4 text-center px-10'>
                            <p className='text-2xl font-display text-orangeNG ease-i-out duration-300 NewGame'>
                                VS
                            </p>
                        </div>

                        <div className='flex-1 flex justify-start break-all text-left'>
                            <p className='text-3xl font-display text-green-300 ease-i-out duration-300 NewGame'>
                                {rightPlayer?.firstName}
                            </p>
                        </div>
                    </div>
                ) : null
            }
            {
                gameStatus === GameStatus.FINISHED ? (
                    <GameFinishedComponent
                        finishedGameState={finishedGameState!}
                    />
                ) : null
            }
        </>
    );
}

export default GameStatusesComponent;
