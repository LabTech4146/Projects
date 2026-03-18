class windowModel {
    constructor() {
        this.hw_bath_duration_updater_id = undefined
        this.cw_bath_duration_updater_id = undefined
    }
    /**
    * Link a html text input to a timer instance and update each second
    * @param {HTMLInputElement} text_input 
    * @param {Timer} timer 
    */
    bind_to_timer(text_input, timer, countdown_elem, hw_cw, timeout_audio) {
        text_input.setAttribute("class", "grey");
        let intervalId = setInterval((t, d, c) => {
            var elapsed_minutes = t.get_elapsed_ms() / 1000 / 60;
            var seconds_remaining = t.get_time_left_ms() / 1000;
            d.value = elapsed_minutes.toFixed(1);
            c.innerHTML = `Time left<br> ${seconds_remaining.toFixed(0)}`;
            if (seconds_remaining < 0) {timeout_audio.play();};
        }, 1000, timer, text_input, countdown_elem);

        (hw_cw === "hw") ? this.hw_bath_duration_updater_id = intervalId : this.cw_bath_duration_updater_id = intervalId;

    };
    stop_hw_duration_updater() {
        clearInterval(this.hw_bath_duration_updater_id);
    };
    stop_cw_duration_updater() {
        clearInterval(this.cw_bath_duration_updater_id);
    };
};

var window_model = new windowModel();

export default window_model;