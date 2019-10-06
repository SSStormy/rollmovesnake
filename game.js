const log = console.log;

const SIZE_X = 20;
const SIZE_Y = 15;

let TILE_SCALE = 10;
const cw = SIZE_X * TILE_SCALE;
const ch = SIZE_Y * TILE_SCALE;

const canvas = document.createElement("canvas");
canvas.width = cw;
canvas.height = ch;
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

document.body.appendChild(canvas);

masterVolume = 0;
muted = false;
unitTesting = false;
sfxr_has_timeouts = true;

const ROCK_MAX_HP = 4;

let max_audio_level = 9;
let audio_level = parseInt(localStorage.getItem("audio_level"));
if(Number.isNaN(audio_level)) {
    audio_level = 3;
}

let ending_snd = null;
let ambient_snd = document.createElement("audio");
ambient_snd.src = "ambientld45.ogg";
ambient_snd.loop = true;

function update_volume(playsnd) {
    audio_level = clamp(audio_level, 0, max_audio_level);

    if(audio_level <= 0) {
        audio_level = 0;
        muted = true;
    }
    else {
        muted = false;
        masterVolume = audio_level / max_audio_level;
    }

    localStorage.setItem("audio_level", audio_level);
    sfxr_clear_cache();

    begin_coroutine(co_fade(1.5, (t) => {
        render_volume_alpha = square01(t);
    }));

    if(ending_snd) {
        ending_snd.volume = masterVolume;
    }

    ambient_snd.volume = masterVolume * .5;

    playSound(38453706);
}

update_volume();

let prev_time = 0;

let image_names = [
    "snake-body-1",
    "snake-body-2",
    "snake-head-0",
    "snake-head-1",
    "snake-head-2",
    "goal-snake-body-1",
    "goal-snake-body-2",
    "goal-snake-head",
    "goal-snake-body-1-active",
    "goal-snake-body-2-active",
    "goal-snake-head-active",
    "ground",
    "ground-tl",
    "ground-tl-tr",
    "ground-tl-tr-bl",
    "ground-tl-tr-bl-br",
    "level",
    "level-done",
    "particle-square",
    "connector",
    "invalid-sq",
    "valid-sq",
    "noise-1",
    "noise-2",
    "noise-3",
    "fake-bloom",
    "confetti",
    "credits",
];

let PARTICLE_BEHIND = 0;
let PARTICLE_DUST = 1;
let PARTICLE_CONFETTI = 2;

let particles = [];
let particle_extra_vel = [0, 0];

let images_loaded = {"font": false};

fetch("m6x11.ttf").then(() => {
    images_loaded["font"] = true;
});

let images = {};

for(var i=0; i< image_names.length; i++) {
    images_loaded[image_names[i]] = false;
}
for(var i=0; i< image_names.length; i++) {
	var image = new Image();
    const name = image_names[i];

    const onload = () => {
        images_loaded[name] = true;
    };

    image.onload = onload;
    image.onerror = onload;

	image.src = name + ".png";
	images[name]=image;
}

let CHAR_AIR = '.';
let CHAR_GROUND = '#';

let CHAR_HEAD_N = '8';
let CHAR_HEAD_W = '4';
let CHAR_HEAD_S = '5';
let CHAR_HEAD_E = '6';

// NOTE(justas): yeah this is going to be cancer due to the 8 possible states the keys can be in
let CHAR_KEY_1_N = 't';
let CHAR_KEY_1_W = 'f';
let CHAR_KEY_1_S = 'g';
let CHAR_KEY_1_E = 'h';

let CHAR_KEY_2_N = 'T';
let CHAR_KEY_2_W = 'F';
let CHAR_KEY_2_S = 'G';
let CHAR_KEY_2_E = 'H';

let CHAR_GOAL_1_N = 'w';
let CHAR_GOAL_1_W = 'a';
let CHAR_GOAL_1_S = 's';
let CHAR_GOAL_1_E = 'd';

let CHAR_GOAL_2_N = 'W';
let CHAR_GOAL_2_W = 'A';
let CHAR_GOAL_2_S = 'S';
let CHAR_GOAL_2_E = 'D';

let CHAR_GOAL_HEAD_N = 'i';
let CHAR_GOAL_HEAD_W = 'j';
let CHAR_GOAL_HEAD_S = 'k';
let CHAR_GOAL_HEAD_E = 'l';

let CHAR_MM_LEVEL = 'x';

let levels = [

{
    name: "Level Select",
    level: `
....................
....................
....................
...6###xxxx#xx#.....
..............#.....
.....##########.....
.....#..............
.....##xx#xxxx#.....
..............#.....
.....##########.....
.....#..............
.....##xx#xx####l...
....................
`,
},


{
    name: "Basics",
    level: `
....................
....................
....................
....................
....###..t..........
....#6#######d##....
....###........#....
...............k....
....................
....................
....................
....................
....................
`,
},

// NOTE(justas): snake basics & 1 primitive showcase
{
    name: "Buddy",
    level: `
....................
....................
....................
....................
...........###......
........t.t####.....
.......6####dsl.....
....................
....................
....................
....................
....................
....................
`,
},


    // NOTE(justas): attach attempt order
{
    name: "Order",
    level: `
....................
....................
......####h####.....
......#########.....
......###id####.....
......###d.s###.....
......####a####.....
......####5####.....
......#########.....
..........#.........
.........f#h........
.........#g#........
....................
    `,
},

    /*
     // TODO(justas): look at webm video
`
....................
....................
......#########.....
......#########.....
......####d####.....
......###d.s###.....
......###ka####.....
......####5####.....
......#########.....
..........#.........
..........t.........
.........f#h........
.........#g#........
....................
`,
*/

// NOTE(justas): intro to two key types & 1-2 primitive shocase
{
    name: "Different Buddy",
    level: `
....................
....................
....................
....................
.........####.......
.........####.......
....Hh#6###dDl......
....................
....................
....................
....................
....................
....................
    `,
},


// NOTE(justas): intro to two key types

{
    name: "Backwards Logic",
    level: `
....................
....................
....................
....................
....##t#######......
....##########......
....##6###a#Dl......
....##########......
....##T#######......
....................
....................
....................
....................
    `,
},

// NOTE(justas): a combination of 1 and 1-2 primitive
{
    name: "Primitives",
    level: `
....................
....................
....................
....................
.........#5#........
........#####.......
.......t#id##.......
.......T#aA##.......
........####........
.........#t.........
....................
....................
....................
    `,
},

    /*
    // TODO(justas): suble variation on basic snake + two key types thats
    // unsolvable without roll (FINISHME)
`
....................
....................
....................
....................
....#ttt######......
....######dd##......
....##6###iS##......
....######aA##......
....##TT######......
....................
....................
....................
....................
`,
*/


    // NOTE(justas): intro to rolling
{
    name: "Q/E to Roll",
    level: `
....................
....................
....................
....................
....................
.......5..t.........
.......#####k.......
....................
....................
....................
....................
....................
....................
    `,
},

    // NOTE(justas): use rolling to solve a partial snake

{
    name: "Awkward",
    level: `
....................
....................
....................
....................
....................
........6t..........
........jA..........
........##..........
....................
....................
....................
....................
....................
    `,
},


    // TODO(justas): intro to keytypes but solvable only by rolling
{
    name: "Awkward Backwards Logic",
    level: `
....................
....................
....................
....................
........t...........
........#####.......
........6a#Dl.......
........#####.......
........T...........
....................
....................
....................
....................
    `,
},

// NOTE(justas): subtle variation on snake basics thats unsolvable without roll
{
    name: "Solvable",
    level: `
....................
....................
....................
....................
...........###......
........t.t####.....
.......6####ddl.....
....................
....................
....................
....................
....................
....................
    `,
},

// NOTE(justas): 2 cases of 1 key rotate and then a 2 key rotate
{
    name: "Blender",
    level: `
....................
....................
....................
....................
......##tt.##i......
......w5#t.##d......
......w###.##AA.....
......##########....
......S#...ttt##....
....................
....................
....................
....................
    `,
},

// NOTE(justas): 2 key rotate for goal + 2 key rotate for movement + 1 key snake
{
    name: "Mixed Blender", 
    level: `
....................
....................
....................
....................
........##..........
.......s#w..........
.......si#5#t.......
.......####tt.......
....................
....................
....................
....................
....................
    `,
},

    // NOTE(justas): 5 key rotate
{
    name: "Giant Steps",
    level: `
....................
....................
....................
....................
.........#i.........
.......t6#DW........
.......t###w........
.......t###dW.......
.......t##..........
.......t##..........
....................
....................
....................
    `,
},

// NOTE(justas): goal is the same as 5 key rotate but solution is a 3 key rotate and 2 key snake
{
    name: "Spiral",
    level: `
....................
....................
....................
....................
....................
.......t6#DW........
.......t###wi.......
.......t###dW.......
.......t#..##.......
.......t............
....................
....................
....................
    `,
},

{
    // NOTE(justas): certain attachment to create long snake
    name: "Long Snake",
    level: `
....................
....................
....................
.........AAS........
.........WDS........
.........jW#........
........#####.......
........#t#t#.......
........#t#t#.......
.........t8t........
..........t.........
....................
....................
    `,
},


{
    // NOTE(justas): use rolling to escape certain attachment
    name: "Tall Snake",
    level: `
....................
....................
....................
.........#W#........
.........#W#........
.........#W#........
.........#i#........
.........#W#........
.........tWt........
.........t8t........
..........t.........
....................
....................
    `,
},

{
    name: "Finale",
    level: `
....................
....................
....................
....................
....................
....................
....................
....................
....................
....................
....................
................6...
....................
....................
....................
....................
....................
....................
`,
},

    /*
{
    // TODO(justas): big roll
    name: "TODO",
    level: `
....................
.##################.
.##################.
.##################.
.##################.
.##################.
.##################.
.##################.
.########t#t#######.
.########t8t#######.
.#########t########.
.##################.
....................
    `,
},
*/


    /*
    // TODO(justas): just do a giant snake
{
    name: "Big Snake",
    level: `
....................
....................
....................
.....#####.####.....
.....#####.w###.....
.....#t##5#d###.....
.....t#########.....
.....#t##s#####.....
.....##########.....
.....##########.....
....................
....................
....................
    `,
},
*/


    /*
    // TODO(justas): dont like this one that much
`
....................
....................
....................
....................
....................
...........i........
........tTTdd.......
.........#.w#.......
.........6###.......
....................
....................
....................
....................
`,


`
....................
....................
....................
...........##.......
.........####.......
.......t6#AS........
.......t###w#.......
.......t##laW.......
.......t##..........
.......t##..........
....................
....................
....................
`,


`
....................
....................
....................
...........##.......
......#######.......
.....t#6##AW........
.....t#####w#.......
.....t####laW.......
.....t..............
.....t..............
....................
....................
....................
`,



`
....................
....................
....................
....................
.......#t#..........
....#6#####la###....
..............##....
.......#f#....##....
.......#####d###....
.......###..........
....................
....................
....................
`,


`
....................
....................
....................
....############....
....############....
....####w##p#W##....
....###a#d##A#D#....
....####s####S##....
....############....
....############....
....############....
....############....
....................
`,
*/

];

const DIR_NORTH = 0;
const DIR_EAST = 1;
const DIR_SOUTH = 2;
const DIR_WEST = 3;

let map_state = {
    finished_levels: [],
    last_map_pos: [-1, -1],
};

let player_scale = [1, 1];
let state = {
    layer_ground: [],
    layer_key: [],
    layer_goal: [],
    layer_goal_head: [],
    layer_mm_level_entry: [],
    current_level_index: 0,
    player: {
        pos: [0, 0],
        dir: DIR_NORTH,
        ignore_attach_at: [],
        walk_phase: 1,
        walk_phase_backwards: false,
    },
};

let states = [];

function push_state() {
    states.push(deep_copy_data(state));
}

function pop_state() {
    stop_showing_invalid_rotate_positions();

    if(is_entering_level) {
        return;
    }

    if(states.length <= 0) {
        return;
    }

    state = states[states.length - 1];
    states.splice(states.length - 1, 1);
}

function show_level_name() {
    draw_level_name = true;
    draw_level_name_alpha = 1;

    begin_coroutine(co_fade(3, null,
        () => {
            begin_coroutine(co_fade(1, 
                (t) => {
                    draw_level_name_alpha = square01(t);
                },
                () => {
                    draw_level_name = false;
                }
            ));
        }
    ));
}

let is_entering_level = false;
function fade_to_level(idx, wait_a_bit = false) {
    stop_showing_invalid_rotate_positions();

    if(!is_entering_level) {
        is_entering_level = true;

        const start_fade = () => {
            begin_coroutine(co_fade(1, 
                (t) => {
                    render_alpha = square01(t);
                },
                () => {
                    load_level(idx);
                    is_entering_level = false;

                    begin_coroutine(co_fade(1, 
                        (t) => {
                            render_alpha = square01(flip01(t));
                        }
                    ));

                    show_level_name();
                }
            ));
        };

        if(wait_a_bit) {
            begin_coroutine(co_fade(1,
                (t) => {
                },
                () => {
                    start_fade();
                }
            ));
        }
        else {
            start_fade();
        }

        return true;
    }
    return false;
}

function load_level(idx) {
    stop_showing_invalid_rotate_positions();

    if(state.current_level_index === 0 && idx !== 0) {
        map_state.last_map_pos = vec_copy(state.player.pos);
        save_map_state();
    }

    const level_data = levels[idx];
    const l = level_data.level;

    state.layer_ground = [];
    state.layer_key = [];
    state.layer_goal = [];
    state.layer_goal_head = [];
    state.layer_mm_level_entry = [];

    let x = 0;
    let y = 0;

    let mm_level_index = 1;

    if(idx === 17) {
        load_level(0);
    }

    localStorage.setItem("rollmovesnake_level", idx);
    state.current_level_index = idx;

    for(let i = 0; i < l.length; i += 1) {

        const c = l.charAt(i);

        if(c == '\n') {
            if(i != 0) {
                y += 1;
            }
            x = 0;
        }
        else {
            const tile_idx = SIZE_X * y + x;

            const set_ground = () => {
                state.layer_ground[tile_idx] = 1;
            };

            if(c == CHAR_AIR) {
            }
            else if(c == CHAR_HEAD_N) {
                state.player.pos[0] = x;
                state.player.pos[1] = y;
                state.player.dir = DIR_NORTH;
                set_ground();
            }
            else if(c == CHAR_HEAD_W) {
                state.player.pos[0] = x;
                state.player.pos[1] = y;
                state.player.dir = DIR_WEST;
                set_ground();
            }
            else if(c == CHAR_HEAD_S) {
                state.player.pos[0] = x;
                state.player.pos[1] = y;
                state.player.dir = DIR_SOUTH;
                set_ground();
            }
            else if(c == CHAR_HEAD_E) {
                state.player.pos[0] = x;
                state.player.pos[1] = y;
                state.player.dir = DIR_EAST;
                set_ground();
            }
            else if(c == CHAR_GROUND) {
                set_ground();
            }
            else if(c == CHAR_MM_LEVEL) {
                set_ground();
                state.layer_mm_level_entry[tile_idx] = mm_level_index;

                mm_level_index += 1;
            }

            else if(c == CHAR_GOAL_1_N) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_NORTH, 
                    roll: 1,
                };
            }
            else if(c == CHAR_GOAL_1_W) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_WEST, 
                    roll: 1,
                };
            }
            else if(c == CHAR_GOAL_1_S) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_SOUTH, 
                    roll: 1,
                };
            }
            else if(c == CHAR_GOAL_1_E) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_EAST,
                    roll: 1,
                };
            }
            else if(c == CHAR_GOAL_2_N) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_NORTH, 
                    roll: 2,
                };
            }
            else if(c == CHAR_GOAL_2_W) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_WEST, 
                    roll: 2,
                };
            }
            else if(c == CHAR_GOAL_2_S) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_SOUTH, 
                    roll: 2,
                };
            }
            else if(c == CHAR_GOAL_2_E) {
                set_ground();
                state.layer_goal[tile_idx] = {
                    dir: DIR_EAST,
                    roll: 2,
                };
            }

            else if(c == CHAR_KEY_1_N) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_NORTH, 
                    roll: 1,
                    attached_idx: -1
                };
            }
            else if(c == CHAR_KEY_1_W) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_WEST, 
                    roll: 1,
                    attached_idx: -1
                };
            }
            else if(c == CHAR_KEY_1_S) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_SOUTH, 
                    roll: 1,
                    attached_idx: -1
                };
            }
            else if(c == CHAR_KEY_1_E) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_EAST, 
                    roll: 1,
                    attached_idx: -1
                };
            }

            else if(c == CHAR_KEY_2_N) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_NORTH, 
                    roll: 2,
                    attached_idx: -1
                };
            }
            else if(c == CHAR_KEY_2_W) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_WEST, 
                    roll: 2,
                    attached_idx: -1
                };
            }
            else if(c == CHAR_KEY_2_S) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_SOUTH, 
                    roll: 2,
                    attached_idx: -1
                };
            }
            else if(c == CHAR_KEY_2_E) {
                set_ground();
                state.layer_key[tile_idx] = {
                    dir: DIR_EAST, 
                    roll: 2,
                    attached_idx: -1
                };
            }

            else if(c == CHAR_GOAL_HEAD_N) {
                set_ground();
                state.layer_goal_head[tile_idx] = {
                    dir: DIR_NORTH,
                };
            }
            else if(c == CHAR_GOAL_HEAD_W) {
                set_ground();
                state.layer_goal_head[tile_idx] = {
                    dir: DIR_WEST,
                };
            }
            else if(c == CHAR_GOAL_HEAD_S) {
                set_ground();
                state.layer_goal_head[tile_idx] = {
                    dir: DIR_SOUTH,
                };
            }
            else if(c == CHAR_GOAL_HEAD_E) {
                set_ground();
                state.layer_goal_head[tile_idx] = {
                    dir: DIR_EAST,
                };
            }

            else {
                log("unknown char at", x, y, `"${c}"`);
            }

            x += 1;
        }
    }

    if(idx == 0 && !vec_equals(map_state.last_map_pos, [-1,-1])) {
        state.player.pos = vec_copy(map_state.last_map_pos);
    }


    if(idx === 17) {

        state.layer_key = [];
        state.layer_goal_head = [];
        state.layer_goal = [];
        state.layer_mm_level_entry = [];

        remove_tile(state.layer_ground, state.player.pos);

        let last_pos = state.player.pos;
        
        let attached_idx = 0;
        while(true) {
            const top_pos = [last_pos[0], last_pos[1] - 1];
            const bottom_pos = [last_pos[0], last_pos[1] + 1];
            const left_pos = [last_pos[0] - 1, last_pos[1]];
            const right_pos = [last_pos[0] + 1, last_pos[1]];

            let dir = null;

            if(try_get_tile_at(state.layer_ground, top_pos)) {
                last_pos = top_pos;
                dir = DIR_SOUTH;
            }
            else if(try_get_tile_at(state.layer_ground, bottom_pos)) {
                last_pos = top_bottom;
                dir = DIR_NORTH;
            }
            else if(try_get_tile_at(state.layer_ground, left_pos)) {
                last_pos = left_pos;
                dir = DIR_EAST;
            }
            else if(try_get_tile_at(state.layer_ground, right_pos)) {
                last_pos = right_pos;
                dir = DIR_WEST;
            }

            if(dir) {
                remove_tile(state.layer_ground, last_pos);

                set_tile(state.layer_key, last_pos, {
                    dir: dir,
                    roll: 1,
                    attached_idx: attached_idx
                });

                attached_idx += 1;
            }
            else {
                break;
            }
        }

        function * cutscene () {
            yield coroutine_sleep(1);

            const attachments = get_all_attachments();

            for(let i = 0; i < attached_idx + 5; i += 1) {
                try_walk_guy([1, 0]);
                yield(coroutine_sleep(.01));

                const info = attachments[i - 3];
                if(info) {
                    info.data.dontdraw = true;
                }
            }

            yield coroutine_sleep(1);

            try {
                if(!ending_snd) {
                    ambient_snd.pause();

                    ending_snd = document.createElement("audio");
                    ending_snd.src = "ld45-ending.ogg";
                    ending_snd.volume = masterVolume * .5;
                    ending_snd.play().catch(() => {
                        ending_snd = null;
                        ambient_snd.play();
                    });
                }
            }
            catch(e) {
                ending_snd = null;
                ambient_snd.play();
            }

            {
                show_credits = true;

                let max_time = 27;
                let time = max_time;
                while(true) {
                    const dt = yield 0;

                    time -= dt;

                    let t = clamp(flip01(time / max_time), 0, 1);
                    
                    credits_y = 15 - 50 * t;

                    if(time <= 0) {
                        break;
                    }
                }
            }

            yield coroutine_sleep(2);

            {
                let max_time = 2;
                let time = max_time;
                while(true) {
                    time -= yield 0;
                    let t = clamp(time / max_time, 0, 1);

                    render_alpha = square01(t);

                    if(time <= 0) {
                        break;
                    }
                }
            }

            yield coroutine_sleep(1);
            show_credits = false;
            is_in_main_menu = true;
            main_menu_can_select = true;
            blink_selected_main_menu_opt = false;
            load_level(0);

            map_state = {
                finished_levels: [],
                last_map_pos: [-1, -1],
            };

            save_map_state();

            begin_coroutine(co_fade(1,
                (t) => {
                    render_alpha = square01(flip01(t));
                }
            ));
        };

        begin_coroutine(cutscene());
    }
}

function try_get_tile_at(layer, p) {
    const idx = SIZE_X * p[1] + p[0];
    return layer[idx];
}

function remove_tile(layer, p) {
    const idx = SIZE_X * p[1] + p[0];
    layer[idx] = 0;
    return true;
}

function set_tile(layer, p, t) {
    const idx = SIZE_X * p[1] + p[0];
    layer[idx] = t;
    return true;
}

let is_loading = true;
let is_done_loading = false;
let is_in_main_menu = true;
let blink_selected_main_menu_opt = false;
let render_alpha = 1;
let render_volume_alpha = 1;

// NOTE(justas): note for upcoming projects: make a draw call list that you can add
// draw calls to at any point in the program so you can have coroutines 
function blit_img(img, x, y, sx = 1, sy = 1, r = 0) {
    if(!img) {
        return;
    }

    ctx.save();

    ctx.translate(x * TILE_SCALE, y * TILE_SCALE);

    if(r != 0) {
        ctx.translate(sx * .5 * img.width, sy * .5 * img.height);
        ctx.rotate(r);
        ctx.translate(-sx * .5 * img.width, -sy * .5 * img.height);
    }

    ctx.scale(sx, sy);

    ctx.drawImage(img, 0, 0);

    ctx.restore();
}

function blit_img_dir(img, x, y, dir, sx = 1, sy = 1) {
    blit_img(img, x, y, sx, sy, (dir * 90 * DEG_TO_RAD));
}

function blit_anim(img_name, speed, count, x, y, sx = 1, sy = 1, r = 0) {
    const idx = 1 + Math.floor((animation_time / speed) % count);
    const img = images[img_name + String(idx)];
    blit_img(img, x, y, sx, sy, r);
}

function blit_text(sz, style, txt, x, y) {
    ctx.font = `${sz}px m6x11`;
    ctx.fillStyle = style;
    ctx.fillText(txt, x, y);
}

let draw_level_name = false;
let draw_level_name_alpha = 0;

let invalid_rotate_positions = [];
let invalid_rotate_positions_draw = false;

let prev_frame_idx = 0;

let show_credits = 0;
let credits_y = 0;

function redraw(time) {

    let dt = (time - prev_time) / 1000;

    if(prev_time === 0) {
        dt = 1/60;
    }

    prev_time = time;

    animation_time = time / 1000;

    sfxr_update_timeouts(dt);
    coroutines_tick(dt);

    const num_wanted_particles = 20;
    if(particles.length <= num_wanted_particles) {
        static_var("can_spawn_particles", true);

        if(can_spawn_particles) {
            this.can_spawn_particles = false;
            begin_coroutine(co_fade(2 + rng.uniform() * 2, null, () => this.can_spawn_particles = true));

            let count = Math.min(3, num_wanted_particles - particles.length);

            for(let i = 0; i < count; i++) {
                const s = .5 + rng.uniform() * 1.5;
                const s_dx = -.05 - rng.uniform() * .3;

                const p = {
                    pos: [SIZE_X * .5 + rng.normal() * .5, SIZE_Y * .5  + rng.normal() * .5],
                    vel: [.1 + rng.normal() * .4, .1 + rng.normal() * .4],

                    scale: [s,s],
                    scale_dx1: [s_dx, s_dx],
                    type: PARTICLE_BEHIND,
                };

                particles.push(p);
            }
        }
    }

    {
        let i = particles.length - 1;
        while(i >= 0 && particles.length > 0) {
            const p = particles[i];
            if(!p) {
                break;
            }

            if(p.vel) {
                let x = p.vel[0];
                let y = p.vel[1];

                if(p.type == PARTICLE_BEHIND) {
                    if(x) {
                        x += Math.sign(x) * particle_extra_vel[0];
                    }

                    if(y) {
                        y += Math.sign(y) * particle_extra_vel[1];
                    }
                }

                p.pos[0] += x * dt;
                p.pos[1] += y * dt;
            }

            if(p.rot_dx1 && typeof(p.rot) == "number") {
                p.rot += p.rot_dx1 * dt;
            }

            if(p.scale_dx1) {
                p.scale[0] += p.scale_dx1[0] * dt;
                p.scale[1] += p.scale_dx1[1] * dt;
            }

            if(p.scale[0] <= 0 || p.scale[1] <= 0) {
                particles.splice(i, 1);
                continue;
            }

            i -= 1;
        }
    }

    const blit_bg = () => {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = "#27232d";
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalAlpha = render_alpha;
    };

    const sel_color = "#f6e3f2";
    if(is_loading) {
        blit_bg();
        blit_text(16, sel_color, "LOADING", cw * .5 - 25, ch * .5);

        ctx.fillStyle = "#376457";

        let max_width = 48;
        let max = 0;
        let count = 0;

        for(let key in images_loaded) {
            max += 1;
            if(images_loaded[key]) {
                count += 1;
            }
        }

        if(!is_done_loading && max == count) {
            is_done_loading = true;

            begin_coroutine(co_fade(.5, (t) => {
                render_alpha = square01(t);

            }, () => {
                is_loading = false;

                begin_coroutine(co_fade(.5, (t) => {
                    render_alpha = square01(flip01(t));
                }));
            }));
        }

        let t = (count / max);
        ctx.fillRect(cw * .5 - 25, ch * .5 + 5, max_width * t, 10);
    }
    else if(is_in_main_menu) {
        blit_bg();

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                ctx.globalAlpha = render_alpha * .12;
                blit_img(images["invisible"], x, y);
            }
        }

        ctx.globalAlpha = render_alpha;

        blit_text(16, sel_color, "Snake Sokoban Spiral", cw * .5 - 60, ch * .5 - 20);
        blit_text(16, sel_color, "by Justas Dabrila", cw * .5 - 25, ch * .5 - 7);

        const get_col = (idx) => {
            if(blink_selected_main_menu_opt) {
                return "#b78b77";
            }
            return sel_color;
        };

        blit_text(16, get_col(0), "Play", cw * .5 - 10, ch * .5 + 30);

        blit_anim("torch", .1, 4, 9.5, 2);
    }
    else {

        let frame_idx = Math.floor(time / (1000 / 10));
        if(prev_frame_idx == frame_idx) {
            requestAnimationFrame(redraw);
            return;
        }

        prev_frame_idx = frame_idx;

        blit_bg();

        ctx.save();

        ctx.globalAlpha = render_alpha * .2;
        for(const p of particles) {
            if(p.type == PARTICLE_BEHIND) {
                blit_img(images["particle-square"], 
                    p.pos[0], p.pos[1],
                    p.scale[0], p.scale[1]
                );
            }
        }
        ctx.globalAlpha = render_alpha;

        const draw_noise = (x, y) => {
            const idx = ((x + y + ((y+x) % 6)) % 3) + 1;

            let rot = 0;
            let rot_idx = (x*y) % 4;

            if(rot_idx == 1) {
                rot = 90 * DEG_TO_RAD;
            }
            else if(rot_idx == 2) {
                rot = 180* DEG_TO_RAD;
            }
            else if(rot_idx == 3) {
                rot = 270 * DEG_TO_RAD;
            }

            blit_img(images["noise-" + String(idx)], x, y, 1, 1, rot);
        };

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x,y];

                if(try_get_tile_at(state.layer_ground, p)) {
                    const has_tl = try_get_tile_at(state.layer_ground, [p[0] - 1, p[1] - 1]);
                    const has_tr = try_get_tile_at(state.layer_ground, [p[0] + 1, p[1] - 1]);
                    const has_bl = try_get_tile_at(state.layer_ground, [p[0] - 1, p[1] + 1]);
                    const has_br = try_get_tile_at(state.layer_ground, [p[0] + 1, p[1] + 1]);
                    const has_top = try_get_tile_at(state.layer_ground, [p[0], p[1] - 1]);
                    const has_bottom = try_get_tile_at(state.layer_ground, [p[0], p[1] + 1]);
                    const has_left = try_get_tile_at(state.layer_ground, [p[0] - 1, p[1]]);
                    const has_right = try_get_tile_at(state.layer_ground, [p[0] + 1, p[1]]);

                    let do_noise = false;

                    if(!has_top && !has_left && has_right && has_bottom) {
                        blit_img(images["ground-tl"], x, y);
                        do_noise = true;
                    }
                    else if(!has_top && !has_right && has_left && has_bottom) {
                        blit_img(images["ground-tl"], x, y, 1, 1, 90 * DEG_TO_RAD);
                        do_noise = true;
                    }
                    else if(!has_bottom && !has_right && has_left && has_top) {
                        blit_img(images["ground-tl"], x, y, 1, 1, 180 * DEG_TO_RAD);
                        do_noise = true;
                    }
                    else if(!has_bottom && !has_left && has_right && has_top) {
                        blit_img(images["ground-tl"], x, y, 1, 1, 270 * DEG_TO_RAD);
                        do_noise = true;
                    }

                    else if(!has_top && !has_left && !has_right && has_bottom) {
                        blit_img(images["ground-tl-tr"], x, y);
                        do_noise = true;
                    }
                    else if(!has_top && !has_bottom && !has_right && has_left) {
                        blit_img(images["ground-tl-tr"], x, y, 1, 1, 90 * DEG_TO_RAD);
                        do_noise = true;
                    }
                    else if(!has_left && !has_bottom && !has_right && has_top) {
                        blit_img(images["ground-tl-tr"], x, y, 1, 1, 180 * DEG_TO_RAD);
                        do_noise = true;
                    }
                    else if(!has_left && !has_bottom && !has_top && has_right) {
                        blit_img(images["ground-tl-tr"], x, y, 1, 1, 270 * DEG_TO_RAD);
                        do_noise = true;
                    }

                    else {
                        blit_img(images["ground"], x, y);
                    }

                    if(do_noise) {
                        draw_noise(x, y);
                    }
                }

                if((x * y-state.current_level_index) % 31== 0) {
                    draw_noise(x, y);
                }
            }
        }

        for(const p of particles) {
            if(p.type == PARTICLE_DUST) {
                blit_img(images["particle-square"], 
                    p.pos[0], p.pos[1],
                    p.scale[0], p.scale[1]
                );
            }
            else if(p.type == PARTICLE_CONFETTI) {
                blit_img(images["confetti"], 
                    p.pos[0], p.pos[1],
                    p.scale[0], p.scale[1],
                    p.rot
                );
            }
        }



        let do_fake_bloom_in = [];
        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x,y];

                {
                    const goal = try_get_tile_at(state.layer_goal, p);

                    if(goal) {
                        let img_name = "goal-snake-body-" + String(goal.roll);
                        const is_satisfied = is_key_goal_satisfied(p);

                        if(is_satisfied) {
                            img_name = img_name + "-active";
                        }
                        blit_img_dir(images[img_name], x, y, goal.dir);

                        if(is_satisfied) {
                            do_fake_bloom_in.push(p);
                        }
                    }
                }

                {
                    const goal = try_get_tile_at(state.layer_goal_head, p);

                    if(goal) {
                        let img_name = "goal-snake-head";

                        const is_satisfied = is_player_goal_satisfied(p);

                        if(is_satisfied) {
                            img_name = img_name + "-active";
                        }

                        blit_img_dir(images[img_name], x, y, goal.dir);

                        if(is_satisfied) {
                            do_fake_bloom_in.push(p);
                        }
                    }
                }


                {
                    const idx = try_get_tile_at(state.layer_mm_level_entry, p);

                    if(idx) {
                        const img = map_state.finished_levels.includes(idx)
                            ? "level-done"
                            : "level"
                        ;
                            
                        blit_img_dir(images[img], x, y, 0);
                    }
                }


                {
                    const key = try_get_tile_at(state.layer_key, p);

                    if(key) {
                        let sx = 1;
                        let sy = 1;

                        if(key.attached_idx != -1) {
                            sx = player_scale[0];
                            sy = player_scale[1];
                        }
                        if(typeof(key.dontdraw) === "undefined") {
                            blit_img_dir(
                                images["snake-body-" + String(key.roll)], 
                                x, y, 
                                key.dir,
                                sx, sy
                            );
                        }
                    }
                }
            }
        }

        if(invalid_rotate_positions_draw) {
            for(const p of invalid_rotate_positions) {
                const img_name = p.is_valid
                    ? "valid-sq"
                    : "invalid-sq"
                ;

                blit_img_dir(images[img_name], p.pos[0], p.pos[1], 0);
            }
        }

        let attachments = get_all_attachments();

        for(let idx in attachments) {
            const info = attachments[idx];
            let prev_info = attachments[idx - 1];

            if(idx === "0") {
                prev_info = {
                    pos: state.player.pos
                };
            }

            if(info && prev_info) {
                const delta = vec_sub(prev_info.pos, info.pos);
                const dir = infer_dir_from_delta(delta);

                const pos = [
                    info.pos[0] + delta[0] * .5,
                    info.pos[1] + delta[1] * .5
                ];

                if(typeof(info.data.dontdraw) === "boolean") {
                    continue;
                }

                blit_img_dir(
                    images["connector"], 
                    pos[0], pos[1], 
                    dir,
                    player_scale[0], player_scale[1]
                );
            }
        }

        {
            if(render_volume_alpha > 0) {
                ctx.globalAlpha = render_volume_alpha * render_volume_alpha;

                blit_text(16, "#376457", String(audio_level), 
                    state.player.pos[0] * TILE_SCALE + 2, (state.player.pos[1] + 1) * TILE_SCALE
                );

                ctx.globalAlpha = 1 - ctx.globalAlpha;
            }

            blit_img_dir(images["snake-head-" + String(state.player.walk_phase)],
                state.player.pos[0], state.player.pos[1],
                state.player.dir,
                player_scale[0], player_scale[1]
            );
        }

        for(const p of do_fake_bloom_in) {
            blit_img(images["fake-bloom"], p[0], p[1]);
        }


        ctx.globalAlpha = render_alpha;

        ctx.restore();

        {
            const info = get_level_under_guy();
            if(info) {
                blit_text(16, "white", String(info.index) + ": " + info.level.name, 2, 14);
            }
        }

        if(draw_level_name) {
            ctx.globalAlpha = render_alpha * draw_level_name_alpha;
            let name = levels[state.current_level_index].name;
            if(state.current_level_index != 0) {
                name = String(state.current_level_index) + ": " + name;
            }
            blit_text(16, "white", name, 2, ch - 2);
        }

        if(show_credits) {
            ctx.globalAlpha = render_alpha;

            blit_img(images["credits"], 0, credits_y);
        }
    }

    requestAnimationFrame(redraw);
}

function infer_dir_from_delta(delta) {
    if(delta[0] != 0) {
        if(delta[0] < 0) {
            return DIR_WEST;
        }
        else if(delta[0] > 0) {
            return DIR_EAST;
        }
    }
    else {
        if(delta[1] < 0) {
            return DIR_NORTH;
        }
        else if(delta[1] > 0) {
            return DIR_SOUTH;
        }
    }
}

function count_num_attached() {
    let num_attached = 0;
    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const p = [x, y];

            const data = try_get_tile_at(state.layer_key, p);

            if(!data) {
                continue;
            }

            if(data.attached_idx != -1) {
                num_attached += 1;
            }
        }
    }

    return num_attached;
}

function get_level_under_guy() {
    if(state.current_level_index == 0) {
        const entry = try_get_tile_at(state.layer_mm_level_entry, state.player.pos);

        if(entry) {
            const oth_level = levels[entry];

            if(oth_level) {
                return {index: entry, level: oth_level};
            }
        }
    }

    return null;
}

function save_map_state() {
    localStorage.setItem("rollmovesnake_map_state", JSON.stringify(map_state));
}

function snd_play_detach_to_goal() {
    playSound(73739500);
}

function is_key_goal_satisfied(p) {
    const key = try_get_tile_at(state.layer_key, p);

    if(!key) {
        return false;
    }

    if(key.attached_idx !== -1) {
        return false;
    }

    const goal = try_get_tile_at(state.layer_goal, p);

    if(!goal) {
        return false;
    }

    if(goal.dir != key.dir) {
        return false;
    }

    if(goal.roll != key.roll) {
        return false;
    }

    return true;
}

function is_player_goal_satisfied(p) {
    const goal = try_get_tile_at(state.layer_goal_head, p);
    if(!goal) {
        return false;
    }

    if(goal.dir !== state.player.dir) {
        return false;
    }

    if(!vec_equals(p, state.player.pos)) {
        return false;
    }

    if(state.current_level_index === 0) {
        if(map_state.finished_levels.length !== 16) {
            return false;
        }
    }

    return true;
}

let last_num_satisfied_all_goals = 0;
let last_was_player_goal_satisfied = false;
function check_for_win() {

    let num_goals = 0;
    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const p = [x, y];
            const goal = try_get_tile_at(state.layer_goal, p);

            if(!goal) {
                continue;
            }
            num_goals += 1;
        }
    }

    let num_satisfied_key_goals = 0;

    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const p = [x, y];

            if(!is_key_goal_satisfied(p)) {
                continue;
            }

            num_satisfied_key_goals += 1;
        }
    }

    let is_player_in_goal  = false;
    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const p = [x, y];

            if(!is_player_goal_satisfied(p)) {
                continue;
            }

            if(!last_was_player_goal_satisfied) {
                snd_play_detach_to_goal();
            }
            is_player_in_goal = true;

            break;
        }

        if(is_player_in_goal) {
            break;
        }
    }
    last_was_player_goal_satisfied = is_player_in_goal;

    let play_unsatisfied = true;
    if(is_player_in_goal && num_satisfied_key_goals == num_goals) {
        play_unsatisfied = false;

        if(state.current_level_index == 0) {
            load_level(17);
        }
        else {
            let next_level = 0;
            if(state.current_level_index === 16) {
                next_level = 0;
            }
            else {
                next_level = state.current_level_index + 1;
            }

            if(fade_to_level(next_level, true)) {

                for(let i = 0; i < 5; i++) {
                    const s = .5 + rng.uniform() * 1.5;
                    const s_dx = -.5 - rng.uniform() * .5;

                    const p = {
                        pos: [
                            state.player.pos[0] + .5 - s * .5,
                            state.player.pos[1] + .5 - s * .5,
                        ],
                        vel: [
                            .5 + rng.normal() * 1, 
                            .5 + rng.normal() * 1
                        ],
                        scale: [s,s],
                        scale_dx1: [s_dx, s_dx],

                        rot: rng.normal() * TAU * .25,
                        rot_dx1: 90 * DEG_TO_RAD + rng.normal() * TAU * .25,

                        type: PARTICLE_CONFETTI
                    };

                    particles.push(p);
                }

                playSound(52359700);

                if(!map_state.finished_levels.includes(state.current_level_index)) {
                    map_state.finished_levels.push(state.current_level_index);
                }

                save_map_state();
            }
        }
    }

    let num_satisfied_all_goals = num_satisfied_key_goals;
    if(is_player_in_goal) {
        num_satisfied_all_goals += 1;
    }

    if(play_unsatisfied) {
        if(last_num_satisfied_all_goals > num_satisfied_all_goals) {
            playSound(22492904);
        }
    }

    last_num_satisfied_all_goals = num_satisfied_all_goals;
}

function try_detach_keys_for_goals() {

    let min_detach_idx = -1;

    for(let y = 0; y < SIZE_Y; y += 1) {
        for(let x = 0; x < SIZE_X; x += 1) {
            const p = [x, y];

            const key = try_get_tile_at(state.layer_key, p);

            if(!key) {
                continue;
            }

            if(key.attached_idx === -1) {
                continue;
            }

            const goal = try_get_tile_at(state.layer_goal, p);

            if(!goal) {
                continue;
            }

            if(goal.dir != key.dir) {
                continue;
            }

            if(goal.roll != key.roll) {
                continue;
            }

            state.player.ignore_attach_at.push(p);

            snd_play_detach_to_goal();

            if(min_detach_idx == -1) {
                min_detach_idx = key.attached_idx;
            }
            else {
                min_detach_idx = Math.min(min_detach_idx, key.attached_idx);
            }
        }
    }
    
    if(min_detach_idx != -1)  {
        for(let other_y = 0; other_y < SIZE_Y; other_y += 1) {
            for(let other_x = 0; other_x < SIZE_X; other_x += 1) {
                const other_p = [other_x, other_y];

                const other_key = try_get_tile_at(state.layer_key, other_p);
                if(!other_key) {
                    continue;
                }
                if(other_key.attached_idx < min_detach_idx) {
                    continue;
                }

                other_key.attached_idx = -1;
            }
        }
    }
}

function get_all_attachments() {
    let num_attached = count_num_attached();

    let attachments = {};

    for(let current_attached_index = 0;
        current_attached_index < num_attached;
        current_attached_index += 1
    ) {
        let found = false;

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x, y];

                const data = try_get_tile_at(state.layer_key, p);

                if(!data) {
                    continue;
                }

                if(data.attached_idx != current_attached_index) {
                    continue;
                }

                attachments[current_attached_index] = {
                    pos: p,
                    data
                };

                found = true;

                break;
            }

            if(found) {
                break;
            }
        }
    }

    return attachments;
}

function try_roll_guy(dir) {
    stop_showing_invalid_rotate_positions();

    if(is_entering_level) {
        return false;
    }

    let attachments = get_all_attachments();

    let calc_new_pos = null;

    if(state.player.dir == DIR_NORTH || state.player.dir == DIR_SOUTH) {
        let x_mirror_origin = state.player.pos[0];

        if(dir == -1) {
            calc_new_pos = (pos) => {
                let x_rel = (pos[0] - x_mirror_origin) * 2 + 1;

                return [
                    pos[0] - x_rel,
                    pos[1],
                ];
            };
        }
        else if(dir == 1) {
            calc_new_pos = (pos) => {
                let x_rel = (x_mirror_origin - pos[0]) * 2 + 1;

                return [
                    pos[0] + x_rel,
                    pos[1],
                ];
            };
        }
    }
    else if(state.player.dir == DIR_EAST || state.player.dir == DIR_WEST) {
        let y_mirror_origin = state.player.pos[1];

        if(dir == -1) {
            calc_new_pos = (pos) => {
                let y_rel = (pos[1] - y_mirror_origin) * 2 + 1;

                return [
                    pos[0],
                    pos[1] - y_rel,
                ];
            };
        }
        else if(dir == 1) {
            calc_new_pos = (pos) => {
                let y_rel = (y_mirror_origin - pos[1]) * 2 + 1;

                return [
                    pos[0],
                    pos[1] + y_rel,
                ];
            };
        }
    }

    let can_rotate = true;
    {
        const new_pp = calc_new_pos(state.player.pos);
        if(!can_stuff_go_into_square(new_pp)) {
            can_rotate = false;
        }
    }

    if(can_rotate) {
        for(let idx in attachments) {
            const info = attachments[idx];
            const new_pos = calc_new_pos(info.pos);

            if(!can_stuff_go_into_square(new_pos)) {
                can_rotate = false;
                break;
            }
        }
    }

    if(can_rotate) {
        push_state();

        state.player.pos = calc_new_pos(state.player.pos);

        for(let idx in attachments) {
            const info = attachments[idx];
            remove_tile(state.layer_key, info.pos);
        }

        for(let idx in attachments) {
            const info = attachments[idx];

            const new_pos = calc_new_pos(info.pos);

            if(info.data.roll == 1) {
                info.data.roll = 2;
            }
            else if(info.data.roll == 2) {
                info.data.roll = 1;
            }

            set_tile(state.layer_key, new_pos, info.data);

            info.pos = new_pos;
        }

        try_detach_keys_for_goals();

        let table = {
            snd1: 1,
            snd2: 1,
            snd3: 1,
        };

        let result = evaluate_table(table);

        if(result == "snd1") {
            playSound(81843707);
        }
        else if(result == "snd2") {
            playSound(58267107);
        }
        else if(result == "snd3") {
            playSound(20058707);
        }

        animate_player_movement();
    }
    else {
        invalid_rotate_positions_draw = true;
        invalid_rotate_positions = [];

        const push_pos = (p) => {
            invalid_rotate_positions.push({
                is_valid: can_stuff_go_into_square(p),
                pos: p
            });
        };

        push_pos(calc_new_pos(state.player.pos));

        for(let idx in attachments) {
            const info = attachments[idx];

            push_pos(calc_new_pos(info.pos));
        }

        playSound(93417104);
    }

    check_for_win();
}

function stop_showing_invalid_rotate_positions() {
    invalid_rotate_positions_draw = false;
}

function is_in_map(x, y) {
    if(0 > x || x >= SIZE_X) return false;
    if(0 > y || y >= SIZE_Y) return false;

    return true;
}

function can_stuff_go_into_square(pos) {
    if(state.current_level_index === 17) {
        return true;
    }

    if(!is_in_map(pos[0], pos[1])) {
        return false;
    }

    if(try_get_tile_at(state.layer_key, pos)) {
        return false;
    }

    if(!try_get_tile_at(state.layer_ground, pos)) {
        return false;
    }

    return true;
};

function try_walk_guy(delta) {

    stop_showing_invalid_rotate_positions();

    if(is_entering_level) {
        return false;
    }

    const new_pos = vec_add(state.player.pos, delta);

    if(!can_stuff_go_into_square(new_pos)) {
        return false;
    }

    push_state();


    const old_player_pos = state.player.pos;
    state.player.pos = new_pos;

    state.player.dir = infer_dir_from_delta(delta);

    const snake_move_attached_block = (data, p) => {

        const do_move = (target_pos) => {
            {
                const our_delta = vec_sub(target_pos, p);
                data.dir = infer_dir_from_delta(our_delta);
            }

            data.old_pos = p;
            remove_tile(state.layer_key, p);
            set_tile(state.layer_key, target_pos, data);
        };

        if(data.attached_idx == 0) {
            do_move(old_player_pos);
        }
        else {
            let other_found = false;

            for(let other_y = 0; other_y < SIZE_Y; other_y += 1) {
                for(let other_x = 0; other_x < SIZE_X; other_x += 1) {
                    const other_p = [other_x, other_y];

                    const other_data = try_get_tile_at(state.layer_key, other_p);

                    if(!other_data || other_data.attached_idx != data.attached_idx - 1) {
                        continue;
                    }

                    other_found = true;

                    do_move(other_data.old_pos);
                    break;
                }
                if(other_found) {
                    break;
                }
            }
        }
    };

    let num_attached = count_num_attached();

    for(let current_attached_index = 0;
        current_attached_index < num_attached;
        current_attached_index += 1
    ) {
        let found = false;

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x, y];

                const data = try_get_tile_at(state.layer_key, p);

                if(!data) {
                    continue;
                }

                if(data.attached_idx != current_attached_index) {
                    continue;
                }

                found = true;
                snake_move_attached_block(data, p);
                break;
            }

            if(found) {
                break;
            }
        }
    }

    let snake_end_pos = old_player_pos;
    {

        for(let y = 0; y < SIZE_Y; y += 1) {
            for(let x = 0; x < SIZE_X; x += 1) {
                const p = [x, y];

                const data = try_get_tile_at(state.layer_key, p);


                if(!data) {
                    continue;
                }

                if(data.attached_idx === -1) {
                    continue;
                }

                if(data.attached_idx === num_attached - 1) {
                    snake_end_pos = data.old_pos;
                }
            }
        }

        const try_attach = (attach_delta) => {
            const pos = vec_add(snake_end_pos, attach_delta);

            const data = try_get_tile_at(state.layer_key, pos);
            if(!data) {
                return false;
            }

            if(data.attached_idx != -1) {
                return false;
            }

            for(const ignore of state.player.ignore_attach_at) {
                if(vec_equals(ignore, pos)) {
                    return false;
                }
            }

            data.attached_idx = num_attached;
            snake_move_attached_block(data, pos);

            return true;
        };


        if(!try_attach([0, -1])) {
            if(!try_attach([1, 0])) {
                if(!try_attach([0, 1])) {
                    if(!try_attach([-1, 0])) {
                    }
                }
            }
        }

        state.player.ignore_attach_at = [];
    }

    try_detach_keys_for_goals();

    {
        let table = {
            snd1: 1,
            snd2: 1,
            snd3: 1,
        };

        let result = evaluate_table(table);

        if(result == "snd1") {
            playSound(32905307);
        }
        else if(result == "snd2") {
            playSound(39368507);
        }
        else if(result == "snd3") {
            playSound(36528507);
        }
    }

    check_for_win();

    for(let i = 0; i < 3; i++) {
        const s = .1 + rng.uniform() * .2;
        const s_dx = -.5;

        const p = {
            pos: [
                snake_end_pos[0] + .5 - s * .5,
                snake_end_pos[1] + .5 - s * .5,
            ],

            vel: [
                -delta[0] * (.2 + rng.normal() * .5),
                -delta[1] * (.2 + rng.normal() * .5),
            ],

            scale: [s,s],
            scale_dx1: [s_dx, s_dx],
            type: PARTICLE_DUST,
        };

        particles.push(p);
    }

    animate_player_movement();
}

let main_menu_can_select = true;

function animate_player_movement() {
    begin_coroutine(co_fade(.1,
        (t) => {
            const s = .8 + flip01(square01(t)) * .2;

            player_scale[0] = s;
            player_scale[1] = s;
        }
    ));

    function * particle_speedup() {
        let t = .1;
        particle_extra_vel = [1.5, 1.5];

        while(true) {
            dt = yield 0;
            t -= dt;

            if(t <= 0) {
                break;
            }
        }
        particle_extra_vel = [0, 0];
    };

    {
        let delta = 1;

        if(state.player.walk_phase_backwards) {
            if(state.player.walk_phase === 0) {
                state.player.walk_phase_backwards = false;
            }
        }
        else {
            if(state.player.walk_phase === 2) {
                state.player.walk_phase_backwards = true;
            }
        }

        if(state.player.walk_phase_backwards) {
            delta = -1;
        }

        state.player.walk_phase += delta;
    }

    begin_coroutine(particle_speedup());
}

function update_key(e, is_down) {
    if(state.current_level_index == 17) {
        return;
    }

    let ret = true;

    if(e.key == "q" || e.key == "Q") {
        if(is_down && !is_in_main_menu) {
            try_roll_guy(-1);
        }
    }

    if(e.key == "e" || e.key == "E") {
        if(is_down && !is_in_main_menu) {
            try_roll_guy(1);
        }
    }

    if(e.key == "w" || e.key == "W" || e.key == "ArrowUp") {
        if(is_down && !is_in_main_menu) {
            try_walk_guy([0, -1]);
            ret = false;
        }
    }

    if(e.key == "s" || e.key == "S" || e.key == "ArrowDown") {
        if(is_down && !is_in_main_menu) {
            try_walk_guy([0, 1]);
            ret = false;
        }
    }

    if(e.key == "a" || e.key == "A" || e.key == "ArrowLeft") {
        if(is_down && !is_in_main_menu) try_walk_guy([-1, 0]);
        ret = false;
    }

    if(e.key == "d" || e.key == "D" || e.key == "ArrowRight") {
        if(is_down && !is_in_main_menu) try_walk_guy([1, 0]);
        ret = false;
    }

    if(e.key == "r" || e.key == "R") {
        if(is_down && !is_in_main_menu && !is_entering_level) {
            push_state();
            load_level(state.current_level_index);
        }
        ret = false;
    }

    if(e.key == "z" || e.key == "Z") {
        if(is_down && !is_in_main_menu) {
            pop_state();
        }
        ret = false;
    }

    if(e.key == "Backspace") {
        if(state.current_level_index != 0 && state.current_level_index != 17) {
            fade_to_level(0);
        }
    }

    if(is_down) {
        if(e.key == "-") {
            audio_level -= 1;
            update_volume();
        }
        if(e.key == "+" || e.key == "=") {
            audio_level += 1;
            update_volume();
        }
    }

    if(e.key == "m" || e.key == "M") {
        if(is_down) {

            if(ending_snd && !ending_snd.paused) {
                return;
            }

            if(ambient_snd.paused) {
                ambient_snd.play();
            }
            else {
                ambient_snd.pause();
                playSound(38453706);
            }
        }
    }

    if(!is_loading && (e.key == "x" || e.key == "X" || e.key == "Enter") && is_down) {
        const lv = get_level_under_guy();

        if(is_in_main_menu && main_menu_can_select) {
            playSound(57048103);

            ambient_snd.play();

            function * co_blink() {
                for(let i = 0; i < 20; i++) {
                    blink_selected_main_menu_opt = !blink_selected_main_menu_opt;
                    yield coroutine_sleep(.05);

                    if(i == 5) {
                        begin_coroutine(co_fade(1, (t) => {
                            render_alpha = cubic01(t);

                        }, () => {
                            is_in_main_menu = false;
                            main_menu_can_select = true;

                            begin_coroutine(co_fade(.5, (t) => {
                                render_alpha = square01(flip01(t));
                            }));
                        }));
                    }
                }

                blink_selected_main_menu_opt = false;
            };

            begin_coroutine(co_blink());

            begin_coroutine(co_fade(4, (t) => {
                ambient_snd.volume = square01(flip01(t)) * masterVolume * .5;
            }));

            ret = false;
            main_menu_can_select = false;
        }
        else if(lv) {
            fade_to_level(lv.index);
        }
    }

    if(!ret) {
        e.preventDefault();
    }

    return ret;
}

function keyup(e) {
    update_key(e, false);
}

function keydown(e) {
    update_key(e, true);
}

document.body.addEventListener("keyup",keyup);
document.body.addEventListener("keydown",keydown);

try {
    const v = JSON.parse(localStorage.getItem("rollmovesnake_map_state"));
    if(v && typeof(v) == "object") {
        map_state = v;
    }
}
catch(e) {}

state.current_level_index = parseInt(localStorage.getItem("rollmovesnake_level"));

if(Number.isNaN(state.current_level_index)) {
	state.current_level_index = 0;
}

load_level(state.current_level_index);
show_level_name();

requestAnimationFrame(redraw);
