import Timer from "./timer.js";
import window_model from "./windowmodel.js";

/**
 * @type {HTMLInputElement}
 */
var hw_bath_start_button, cw_bath_start_button, cw_bath_stop_button, export_data_button, hw_duration, cw_duration, form_elem, export_content_div
var hw_timer = new Timer();
window.h = hw_timer;
var cw_timer = new Timer();
var hw_intended_duration_m, cw_intended_duration_m, countdown_elem, clock_value_elem;
var s_lot_elem, n_lot_elem, d_lot_elem, is_ten_minute_cw_alarm_elem, alarm_options_elem
var alarm_audio = new Audio('./alarm.mp3');
var alarm_t_minus_s = 30;
var timeout_audio = new Audio('./timeout.mp3');
var ten_minute_cw_bath_alarm_audio = new Audio('./ten_minute_cold_water_alarm.mp3')

document.addEventListener("DOMContentLoaded", () => {
    
    hw_bath_start_button = document.getElementById("start_hw_bath");
    cw_bath_start_button = document.getElementById("start_cw_bath");
    cw_bath_stop_button = document.getElementById("stop_cw_bath");
    export_data_button = document.getElementById("export_data");
    hw_duration = document.getElementById("hw_duration");
    cw_duration = document.getElementById("cw_duration");
    countdown_elem = document.getElementById("timer_value");
    clock_value_elem = document.getElementById("clock_value");
    s_lot_elem = document.getElementById("standard_l");
    n_lot_elem = document.getElementById("ninhydrin_l");
    d_lot_elem = document.getElementById("dilution_l");
    alarm_options_elem = document.getElementById("alarm_options");
    is_ten_minute_cw_alarm_elem = document.getElementById("ten_minute_cw_l");
    form_elem = document.getElementById("ui_form");
    export_content_div = document.getElementById("export_content");
    hw_bath_start_button.onclick = hw_bath_start_button_on_click
    cw_bath_start_button.onclick = cw_bath_start_button_on_click
    cw_bath_stop_button.onclick = cw_bath_stop_button_on_click
    export_data_button.onclick = export_data_button_on_click

    if(localStorage.hasOwnProperty("fan_timer")){

        let previous_export_data = JSON.parse(localStorage.fan_timer);
        s_lot_elem.value = previous_export_data.standard_lot;
        n_lot_elem.value = previous_export_data.ninhydrin_lot;
        d_lot_elem.value = previous_export_data.dilution_lot;

    };
});

window.addEventListener("beforeunload", (event) => {  
  // Cancel the event (optional, but some browsers require it)  
  event.preventDefault();  
  // Custom message (modern browsers may ignore this and show a default message)  
  event.returnValue = "Are you sure you want to leave? Unsaved changes may be lost.";  
  return event.returnValue; // For older browsers  
});  
    
    


function hw_bath_start_button_on_click() {
    hw_intended_duration_m = hw_duration.value;
    hw_timer.start(hw_intended_duration_m * 1000 * 60);
    clock_value_elem.innerHTML = `(${hw_timer.get_eta_clock()})`;
    setTimeout(() => {alarm_audio.play()}, hw_intended_duration_m * 1000 * 60 - (alarm_t_minus_s * 1000))
    window_model.bind_to_timer(hw_duration, hw_timer, countdown_elem, "hw", timeout_audio);
    hw_bath_start_button.disabled = true;
    cw_bath_start_button.disabled = false;
}

function cw_bath_start_button_on_click() {
    cw_intended_duration_m = cw_duration.value
    cw_timer.start(cw_intended_duration_m * 1000 * 60);
    clock_value_elem.innerHTML = `(${cw_timer.get_eta_clock()})`;
    setTimeout(() => {alarm_audio.play()}, cw_intended_duration_m * 1000 * 60 - (alarm_t_minus_s * 1000));
    if(is_ten_minute_cw_alarm_elem.checked && cw_intended_duration_m > 10){
        setTimeout(() => {ten_minute_cw_bath_alarm_audio.play(); alarm_options_elem.setAttribute("class", "color_shift"); }, (cw_intended_duration_m * 1000 * 60) - (10 * 60 * 1000));
    };
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
    let f_data = new FormData(form_elem);
    let export_data = {
        hw_bath_temp: f_data.get('hw_temp'),
        cw_bath_temp: f_data.get('cw_temp'),
        cw_initial_temp: f_data.get('cw_inital_temp'),
        cw_final_temp: f_data.get('cw_final_temp'),
        ambient_temp: f_data.get('ambient_temp'),
        hw_duration_s: `${hw_timer.get_elapsed_ms() / 1000}`,
        cw_duration_s: `${cw_timer.get_elapsed_ms() / 1000}`,
        date: new Date().toLocaleDateString("en-US"),
        standard_lot: f_data.get("standard_lot"),
        dilution_lot: f_data.get("dilution_lot"),
        ninhydrin_lot: f_data.get("ninhydrin_lot"),
        centrifuge_time_s: f_data.get("centrifuge_time_s"),
        centrifuge_rcf: f_data.get("centrifuge_rcf"),
        notes: f_data.get('notes'),
    };
    export_content_div.innerHTML = JSON.stringify(export_data);
    navigator.clipboard.writeText(export_content_div.innerHTML);
    localStorage.setItem("fan_timer", export_content_div.innerHTML);
    
}






