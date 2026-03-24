class windowModel {
    constructor() {
        this.hw_bath_duration_updater_id = undefined;
        this.cw_bath_duration_updater_id = undefined;
        this.over_time = false;
    }
    /**
    * Link a html text input to a timer instance and update each second
    * @param {HTMLInputElement} text_input 
    * @param {Timer} timer 
    */
    bind_to_timer(text_input, timer, countdown_elem, hw_cw, timeout_audio) {
        text_input.setAttribute("class", "grey");
        this.timeout_audio = timeout_audio;
        let intervalId = setInterval((t, d, c, windowModel) => {
            var elapsed_minutes = t.get_elapsed_ms() / 1000 / 60;
            var seconds_remaining = t.get_time_left_ms() / 1000;
            d.value = elapsed_minutes.toFixed(1);
            c.innerHTML = `Time left<br> ${seconds_remaining.toFixed(0)}`;
            if (seconds_remaining < 0 && !windowModel.over_time) {timeout_audio.play();};
        }, 1000, timer, text_input, countdown_elem, this);

        (hw_cw === "hw") ? this.hw_bath_duration_updater_id = intervalId : this.cw_bath_duration_updater_id = intervalId;

    };
    stop_hw_duration_updater() {
        clearInterval(this.hw_bath_duration_updater_id);
        this.timeout_audio.pause();
        this.timeout_audio.current_time = 0;
        this.over_time = false;
    };
    stop_cw_duration_updater() {
        clearInterval(this.cw_bath_duration_updater_id);
        this.timeout_audio.pause();
        this.timeout_audio.current_time = 0;
        this.over_time = false;
    };
};

var window_model = new windowModel();

export default window_model;