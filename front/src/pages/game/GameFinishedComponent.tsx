import { useEffect, useState } from 'react';
import { FinishedGameState, Player } from './Game';

interface GameFinishedComponentProperties {
    finishedGameState: FinishedGameState;
}

type WinnerNameColor = 'text-green-300' | 'text-green-500';

function GameFinishedComponent({
   finishedGameState,
}: GameFinishedComponentProperties) {

    const [winnerNameColor, setWinnerNameColor] = useState<WinnerNameColor>('text-green-300');

    // Interval to change the color of the winner name
    useEffect(() => {
        const interval = setInterval(() => {
            setWinnerNameColor((prevColor) => {
                if (prevColor === 'text-green-300')
                    return 'text-green-500';
                if (prevColor === 'text-green-500')
                    return 'text-green-300';
                return 'text-green-300';
            });
        }, 100);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <>
            <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                    <h1 className={`text-4xl col-span-2 text-center font-display text-green-400 NewGame mb-32 ml-16 mr-16 ${winnerNameColor} xs:text-l sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl break-all`}>
                        {
                            finishedGameState.winner!.name === finishedGameState.currentPlayer!.name
                                ? 'You won' + ' with ' + finishedGameState.winner!.score + ' pts'
                                : finishedGameState.winner!.name + ' won' + ' with ' + finishedGameState.winner!.score + ' pts'
                        }
                    </h1>
                    <h1 className={`text-4xl col-span-2 text-center font-display text-red-400 NewGame ml-16 mr-16 xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl break-all`}>
                        {
                            finishedGameState.looser!.name === finishedGameState.currentPlayer!.name
                                ? 'You lost' + ' with ' + finishedGameState.looser!.score + ' pts'
                                : finishedGameState.looser!.name + ' lost' + ' with ' + finishedGameState.looser!.score + ' pts'
                        }
                    </h1>
                </div>
            </div>
        </>
    );
}

export default GameFinishedComponent;