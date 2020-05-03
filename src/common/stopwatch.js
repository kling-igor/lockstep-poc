export default class StopWatch {
    constructor () {
        this.reset();
    }

    get elapsedMilliseconds () {
        return this.accumulatedTime;
    }

    start () {
        this.startTime = Date.now();
    }

    stop () {
        this.stopTime = Date.now();
        this.accumulatedTime += this.stopTime - this.startTime;
    }
    
    reset () {
        this.startTime = 0;
        this.stopTime = 0;
        this.accumulatedTime = 0;
    }
}