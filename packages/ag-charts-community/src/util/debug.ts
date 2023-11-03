import { toArray } from './array';
import { Logger } from './logger';
import { windowValue } from './window';

type DebugLogger = (...logContent: any[]) => void;

const LONG_TIME_PERIOD_THRESHOLD = 2000;

let timeOfLastLog = Date.now();
const logTimeGap = () => {
    const timeSinceLastLog = Date.now() - timeOfLastLog;
    if (timeSinceLastLog > LONG_TIME_PERIOD_THRESHOLD) {
        const prettyDuration = (Math.floor(timeSinceLastLog / 100) / 10).toFixed(1);
        Logger.log(`**** ${prettyDuration}s since last log message ****`);
    }
    timeOfLastLog = Date.now();
};

export const Debug = {
    create(...debugSelectors: Array<boolean | string>): DebugLogger {
        return (...logContent: any[]) => {
            if (Debug.check(...debugSelectors)) {
                if (typeof logContent[0] === 'function') {
                    logContent = toArray(logContent[0]());
                }
                logTimeGap();
                Logger.log(...logContent);
            }
        };
    },

    check(...debugSelectors: Array<boolean | string>) {
        if (debugSelectors.length === 0) {
            debugSelectors.push(true);
        }
        const chartDebug: Array<boolean | string> = toArray(windowValue('agChartsDebug'));
        return chartDebug.some((selector) => debugSelectors.includes(selector));
    },
};
