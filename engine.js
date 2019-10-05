const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const TAU = Math.PI * 2;

function vec_equals(a, b) {
    return a[0] === b[0] && a[1] == b[1];
}

function vec_sub(a, b) {
    return [
        a[0] - b[0],
        a[1] - b[1]
    ];
}

function vec_add(a, b) {
    return [
        a[0] + b[0],
        a[1] + b[1]
    ];
}

function do_lines_intersect(
    a_start, a_end,
    b_start, b_end
) {
    const delta = vec_sub(a_start, b_start);

    const mat = [
        a_end[0] - a_start[0], b_end[0] - b_start[0],
        a_end[1] - a_start[1], b_end[1] - b_start[1],
    ];

    const det = mat[0] * mat[3] - mat[1] * mat[2];

    const epsi = 1/(1024*16);

    if(Math.abs(det) < epsi) {
        return false;
    }

    const inv_det = 1/det;

    const inverse = [
        mat[3] * inv_det, -mat[1] * inv_det,
        -mat[2] * inv_det, mat[0] * inv_det
    ];

    const weights = [
        inverse[0] * delta[0] + inverse[1] * delta[1],
        inverse[2] * delta[0] + inverse[3] * delta[1]
    ];

    return weights;
}

function dot(a, b) {
    return a[0] * b[0] + b[1] * a[1];
}

function vec_len(a) {
    return Math.sqrt(dot(a,a));
}

function atan2(y,x) {
    let ret = Math.atan2(y,x);

    if(ret < 0) {
        ret += TAU;
    }

    return ret;
}

function vec_normalize(a) {
    const len = vec_len(a);
    const epsi = 1/(1024*16);

    if(Math.abs(len) < epsi) {
        return [0, 0];
    }

    return [a[0] / len, a[1] / len];
}

function vec_copy(a) {
    return [a[0], a[1]];
}


function lerp(a, t, b) {
    return (b - a) * t + a;
}

function vec_lerp(a, t, b) {
    return [
        (b[0] - a[0]) * t + a[0],
        (b[1] - a[1]) * t + a[1]
    ];
}

function is_point_in_circle(
        point,
        origin,
        radius
) {
    const origin_to_point = [
        point[0] - origin[0],
        point[1] - origin[1]
    ];

    const otp_length_sq = dot(origin_to_point, origin_to_point);

    radius *= radius;

    if(otp_length_sq > radius) {
        return false;
    }

    return true;
}

function is_point_in_rect(
        point,
        rect
) {
    let x_ok = point[0] > rect[0] && (rect[0] + rect[2]) > point[0];
    let y_ok = point[1] > rect[1] && (rect[1] + rect[3]) > point[1];

    return x_ok && y_ok;
}

function do_rects_intersect(
    rect_a,
    rect_b
) {
    const point = [
        rect_a[0] + rect_a[2] * .5,
        rect_a[1] + rect_a[3] * .5
    ];

    const rect = [
        rect_b[0] - rect_a[2] * .5,
        rect_b[1] - rect_a[3] * .5,
        rect_a[2] + rect_b[2],
        rect_a[3] + rect_b[3]
    ];

    return is_point_in_rect(point, rect);
}

function sign(x) {
    if(x >= 0) return 1;
    return -1;
}

function clamp(v, min, max) {
    if(min > v) return min;
    if(v > max) return max;
    return v;
}


const rng = new RNG(String(new Date()));

function update_axis_shake(
    shake,
    dt
) {
    if(shake.time_seconds <= 0) {
        shake.output_sample = 0;
        return;
    }

    shake.time_seconds -= dt;
    const sample_index = Math.floor(shake.time_seconds / shake.samples_per_second);

    let sample = 0;
    if(shake.prev_shake_sample_index == sample_index) {
        sample = shake.prev_sample;
    }
    else {
        sample = rng.uniform() * 2.0 - 1.0;
    }

    shake.prev_shake_sample_index = sample_index;
    shake.prev_sample = sample;

    let amplitude_t = shake.time_seconds / shake.time_max;
    shake.output_sample = sample * shake.amplitude * amplitude_t;
}

/*
let shake_cam_x = {time_seconds: 0};
let shake_cam_y = {time_seconds: 0};

function do_camera_shake(amp) {
    const do_shake_for = (shake) => {
        if(shake.time_seconds > 0) {
            shake.time_seconds += shake.time_max * .5;
            shake.time_seconds = clamp(shake.time_seconds, 0, shake.time_max);
            shake.amplitude += amp * .25;
            shake.prev_shake_sample_index = -1;
        }
        else {
            shake.time_seconds = 1;
            shake.time_max = 1;
            shake.samples_per_second = .01;
            shake.prev_shake_sample_index = -1;
            shake.amplitude = amp;
        }
    };

    do_shake_for(shake_cam_x);
    do_shake_for(shake_cam_y);
}
*/

/*
const image_names = [
    "t_i",
    "rock_1",
    "particle_circle",
    "particle_block",
];

let images = [];
for(var i=0; i< image_names.length; i++) {
	var image = new Image();

	image.src = image_names[i]+".png";
	images[image_names[i]]=image;
}
*/

function smoothstep(x) {
    return x * x * (3.0 - 2.0 * x);
}

function get_mouse_pos(e) {
	var rect = e.target.getBoundingClientRect();
	var scaleX = e.target.width / rect.width;    // relationship bitmap vs. element for X
	var scaleY = e.target.height / rect.height;  // relationship bitmap vs. element for Y

	var clientX=e.clientX;
	var clientY=e.clientY;

	if (scaleX < scaleY){
		scaleX=scaleY;
		clientX-=rect.width/2-(e.target.width/scaleX)/2;
	} else {
		scaleY=scaleX;
		clientY-=rect.height/2-(e.target.height/scaleY)/2;
	}
	var x = (clientX - rect.left) * scaleX;   // scale mouse coordinates after they have
	var y =(clientY - rect.top) * scaleY     // been adjusted to be relative to element

    return [x,y];
}

const COROUTINE_SLEEP_ID = 0;
function coroutine_sleep(seconds) {
    return [COROUTINE_SLEEP_ID, seconds];
};

let coroutines = [];
function begin_coroutine(co) {
    coroutines.push({
        sleep_seconds: 0,
        coroutine: co
    });
};

function stop_coroutine(co) {
    if(!co) {
        return;
    }

    let i = 0;
    while(true) {
        if(coroutines.length <= i) {
            break;
        }

        if(coroutines[i] == co) {
            coroutines.splice(i, 1);
            break;
        }
    }
}

let once_coroutines = {};

function begin_coroutine_once(co, key) {
    if(once_coroutines[key]) {
        return;
    }

    once_coroutines[key] = true;

    begin_coroutine(co);
}

const sleep = (ms) => new Promise(ok => setTimeout(ok, ms));

function coroutines_tick(dt) {
    if(coroutines.length > 0) {
        let i = 0;
        while(true) {

            if(coroutines.length <= i) {
                break;
            }
            const co = coroutines[i];

            if(co.sleep_seconds > 0) {
                co.sleep_seconds -= dt;
                i += 1;
            }
            else {
                const result = co.coroutine.next(dt);

                if(result.done) {
                    coroutines.splice(i, 1);
                }
                else {
                    i += 1;

                    if(Array.isArray(result.value)) {
                        if(result.value[0] == COROUTINE_SLEEP_ID) {
                            co.sleep_seconds = result.value[1];
                        }
                    }
                }
            }
        }
    }
};

function evaluate_table(table) {

    let total_score = 0;
    for(const key in table) {
        total_score += table[key];
    }

    if(total_score == 0) {
        return 0;
    }


    const val = rng.random(0, total_score);

    let min = 0;
    let winner = "";
    for(const key in table) {
        let max = min + table[key];

        if(min <= val && max > val) {
            winner = key;
            break;
        }

        min = max;
    }

    return winner;
}

function flip01(x) {
    return 1 - x;
}

function square01(x) {
    return x * x;
}

function cubic01(x) {
    return x * x * x;
}

function * co_fade(max_time, count_fn = null, done_fn = null) {
    let time = max_time;

    while(true) {
        if(time <= 0) {
            if(done_fn) {
                done_fn();
            }
            break;
        }
        else {
            time -= yield 0;
            let t = time / max_time;
            t = clamp(t, 0, 1);

            if(count_fn) {
                count_fn(t);
            }
        }
    }
}

function deep_copy_data(obj) {
    if(Array.isArray(obj)) {
        let copy = [];

        for(let key in obj) {
            copy[key] = deep_copy_data(obj[key]);
        }

        return copy;
    }
    else if(typeof(obj) == "object") {
        let copy = {};
        for(let key in obj) {
            copy[key] = deep_copy_data(obj[key]);
        }

        return copy;
    }
    else if(typeof(obj) == "undefined") {
        return undefined;
    }
    else if(typeof(obj) == "boolean") {
        return obj;
    }
    else if(typeof(obj) == "number") {
        return obj;
    }
    else if(typeof(obj) == "string") {
        return obj; // NOTE(justas): strings are immutable
    }
    else {
        log("unknown obj in deep_copy_data", obj);
    }

    return obj;
}

function calc_dt(time, prev) {
    if(prev == 0) {
        return 1/60;
    }

    return (time - prev) / 1000;
}

function static_var(varname, value) {
    if(this[varname] == undefined) {
        this[varname] = value;
    }
}

const KEY_IDLE = 0;
const KEY_JUST_CLICKED = 1;
const KEY_HOLDING = 2;
const KEY_JUST_RELEASED = 3;

function update_key_state(old_state, is_down) {
    if(is_down) {
        if(old_state == KEY_IDLE) {
            return KEY_JUST_CLICKED;
        }
        else if(old_state == KEY_JUST_CLICKED) {
            return KEY_HOLDING;
        }
        else if(old_state == KEY_HOLDING) {
            return KEY_HOLDING;
        }
        else if(old_state == KEY_JUST_RELEASED) {
            return KEY_JUST_CLICKED;
        }
        else {
            return KEY_JUST_CLICKED;
        }
    }
    else {
        if(old_state == KEY_IDLE) {
            return KEY_IDLE;
        }
        else if(old_state == KEY_JUST_CLICKED) {
            return KEY_IDLE;
        }
        else if(old_state == KEY_HOLDING) {
            return KEY_JUST_RELEASED;
        }
        else if(old_state == KEY_JUST_RELEASED) {
            return KEY_IDLE;
        }
        else {
            return KEY_IDLE;
        }
    }
}
