class Timer{
    constructor() {
        this.start_time = undefined;
        this.stop_time = undefined;
        this.duration_ms = undefined;
    };
    start(duration_ms) {
        this.start_time = Date.now();
        if (typeof duration_ms !== 'undefined'){
            this.duration_ms = parseInt(duration_ms);
            this.eta = this.start_time + duration_ms;
        }
    };
    get_elapsed_ms() {
        if (typeof this.stop_time !== 'undefined') {
            return this.stop_time - this.start_time;
        } else {
            return Date.now() - this.start_time;
        };
    };
    stop() {
        this.stop_time = Date.now();
    }
    get_time_left_ms() {
        return this.duration_ms - this.get_elapsed_ms();
    }
    get_eta_clock() {
        let eta_time = new Date(this.eta);
        return `${eta_time.getHours()}:${eta_time.getMinutes()}`
    }
};

export default Timer
