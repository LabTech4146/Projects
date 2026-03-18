import Timer from "./timer.js";
import window_model from "./windowmodel.js";

/**
 * @type {HTMLInputElement}
 */
var hw_bath_start_button, cw_bath_start_button, cw_bath_stop_button, export_data_button, hw_duration, cw_duration, form_elem, export_content_div
var hw_timer = new Timer();
window.h = hw_timer;
var cw_timer = new Timer();
var hw_intended_duration_m, cw_intended_duration_m, countdown_elem;
var alarm_audio = new Audio('./alarm.mp3');
var alarm_t_minus_s = 30;
var timeout_audio = new Audio('./timeout.mp3');

document.addEventListener("DOMContentLoaded", () => {
    hw_bath_start_button = document.getElementById("start_hw_bath");
    cw_bath_start_button = document.getElementById("start_cw_bath");
    cw_bath_stop_button = document.getElementById("stop_cw_bath");
    export_data_button = document.getElementById("export_data")
    hw_duration = document.getElementById("hw_duration");
    cw_duration = document.getElementById("cw_duration");
    countdown_elem = document.getElementById("timer_value")
    form_elem = document.getElementById("ui_form");
    export_content_div = document.getElementById("export_content");
    hw_bath_start_button.onclick = hw_bath_start_button_on_click
    cw_bath_start_button.onclick = cw_bath_start_button_on_click
    cw_bath_stop_button.onclick = cw_bath_stop_button_on_click
    export_data_button.onclick = export_data_button_on_click
});

function hw_bath_start_button_on_click() {
    hw_intended_duration_m = hw_duration.value
    hw_timer.start(hw_intended_duration_m * 1000 * 60);
    setTimeout(() => {alarm_audio.play()}, hw_intended_duration_m * 1000 * 60 - (alarm_t_minus_s * 1000))
    window_model.bind_to_timer(hw_duration, hw_timer, countdown_elem, "hw", timeout_audio);
    hw_bath_start_button.disabled = true;
    cw_bath_start_button.disabled = false;
}

function cw_bath_start_button_on_click() {
    cw_intended_duration_m = cw_duration.value
    cw_timer.start(cw_intended_duration_m * 1000 * 60);
    setTimeout(() => {alarm_audio.play()}, hw_intended_duration_m * 1000 * 60 - (alarm_t_minus_s * 1000))
    hw_timer.stop();
    window_model.stop_hw_duration_updater();
    window_model.bind_to_timer(cw_duration, cw_timer, countdown_elem, "cw", timeout_audio);
    cw_bath_start_button.disabled = true;
    cw_bath_stop_button.disabled = false;
};

function cw_bath_stop_button_on_click() {
    cw_timer.stop();
    window_model.stop_cw_duration_updater();
    cw_bath_stop_button.disabled = true;
    export_data_button.disabled = false;
}

function export_data_button_on_click() {
    let f_data = new FormData(form_elem)
    window.f_data = f_data
    f_data.append("date", new Date().toLocaleDateString("en-US"));
    export_content_div.innerHTML = [...f_data.entries()]
    
}






