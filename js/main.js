const game_area_element = document.getElementById("game-area");
let game_area_rect = game_area_element.getBoundingClientRect();
const score_element = document.getElementById("score");
const start_button = document.getElementById("start-button");
start_button?.addEventListener("click", start);
let playing = false;
let score = 0;
let highscore = 0;
let flower_amount = 0;
// TODO achievements, shop, coins?
document.getElementById("dash-button")?.addEventListener("click", () => {
    butterfly.ability = "dashing";
});
document.getElementById("teleport-button")?.addEventListener("click", () => {
    butterfly.ability = "teleport";
});
document.getElementById("time-button")?.addEventListener("click", () => {
    butterfly.ability = "time freeze";
});
let ABILITIES = ["dashing", "teleport", "time freeze"];
class Butterfly {
    element = document.getElementById("butterfly-container");
    init_y = game_area_rect.height / 2;
    pos = { x: game_area_rect.width - 50, y: this.init_y };
    SIZE = 80;
    GRAVITY = 0.002;
    velocity = 0;
    state = "normal";
    state_start = 0;
    _invincible = false;
    INIT_JUMP_POWER = -0.7;
    jump_power = this.INIT_JUMP_POWER;
    time_dilation = 0.6;
    get invincible() {
        return this._invincible;
    }
    set invincible(value) {
        if (value) {
            this.element.style.opacity = "0.5";
        }
        else {
            this.element.style.opacity = "1";
        }
        this._invincible = value;
    }
    ability = "dashing";
    // TODO cooldown upgrades
    // dashing could slow down and increase duration
    // tp could increase invincibility frames
    // time freeze could increase duration and time dilation
    // also more common flowers and chance to get multiple
    // changes of terrain???
    // slower increase in difficulty???
    ABILITY_COOLDOWNS = {
        dashing: 2000,
        teleport: 5000,
        "time freeze": 9000,
    };
    ABILITY_DURATION = {
        dashing: 350,
        teleport: 200,
        "time freeze": 7000,
    };
    cooldown = 0;
    reset() {
        game_area_rect = game_area_element.getBoundingClientRect();
        this.pos = { x: game_area_rect.width - 50, y: this.init_y };
        this.velocity = 0;
        this.jump_power = this.INIT_JUMP_POWER;
        this.cooldown = 0;
        this.invincible = false;
        this.change_state("normal");
        this.update();
    }
    process(delta) {
        let state_time = performance.now() - this.state_start;
        switch (this.state) {
            case "normal": {
                this.velocity += this.GRAVITY * delta;
                this.cooldown = Math.max(0, this.cooldown - delta);
                break;
            }
            case "jumping": {
                this.change_state("normal");
                break;
            }
            case "dashing": {
                if (state_time >= this.ABILITY_DURATION.dashing) {
                    this.change_state("normal");
                }
                break;
            }
            case "teleport": {
                if (state_time > 40) {
                    Scale.temp_speed = 0;
                }
                if (state_time >= this.ABILITY_DURATION.teleport) {
                    this.change_state("normal");
                }
                break;
            }
            case "time freeze": {
                this.velocity += this.GRAVITY * delta * this.time_dilation;
                if (state_time >= this.ABILITY_DURATION["time freeze"]) {
                    this.change_state("normal");
                }
                break;
            }
        }
        this.pos.y += this.velocity * delta;
        this.update();
    }
    update() {
        let state_time = performance.now() - this.state_start;
        this.element.style.top = this.pos.y + "px";
        if (this.state === "normal" || this.state === "jumping") {
            this.element.style.background =
                "conic-gradient(#444872 " + (0.98 - this.cooldown / this.ABILITY_COOLDOWNS[this.ability]) * 100 + "%, transparent 0)";
            if (this.cooldown === 0) {
                this.element.style.background = "conic-gradient(#353858 100%, transparent 0)";
            }
        }
        else {
            this.element.style.background =
                "conic-gradient(#444872 " + (1 - state_time / this.ABILITY_DURATION[this.ability]) * 100 + "%, transparent 0)";
        }
    }
    change_state(new_state) {
        // @ts-ignore
        if (ABILITIES.includes(new_state)) {
            if (this.cooldown !== 0) {
                if (new_state === "dashing") {
                    Scale.temp_speed = 0;
                    butterfly.change_state("normal");
                }
                return;
            }
            //@ts-ignore
            this.cooldown = this.ABILITY_COOLDOWNS[new_state];
        }
        Scale.temp_speed = 0;
        this.invincible = false;
        this.jump_power = this.INIT_JUMP_POWER;
        switch (new_state) {
            case "normal": {
                break;
            }
            case "jumping": {
                if (this.state === "teleport") {
                    return;
                }
                if (this.state === "time freeze") {
                    Scale.temp_speed = Scale.speed * this.time_dilation;
                    this.jump_power = this.INIT_JUMP_POWER * this.time_dilation;
                }
                this.velocity = this.jump_power;
                if (this.state === "time freeze") {
                    return;
                }
                break;
            }
            case "dashing": {
                Scale.temp_speed = 0.9;
                this.velocity = 0;
                break;
            }
            case "teleport": {
                this.invincible = true;
                Scale.temp_speed = 5;
                this.velocity = 0;
                break;
            }
            case "time freeze": {
                butterfly.velocity *= this.time_dilation;
                Scale.temp_speed = Scale.speed * this.time_dilation;
                this.jump_power = this.INIT_JUMP_POWER * this.time_dilation;
                break;
            }
        }
        this.state_start = performance.now();
        this.state = new_state;
    }
}
const butterfly = new Butterfly();
window.addEventListener("keypress", key_pressed);
function key_pressed(e) {
    if (!playing) {
        start();
        return;
    }
    switch (e.key.toLowerCase()) {
        case " ":
        case "w": {
            butterfly.change_state("jumping");
            break;
        }
        case "e": {
            butterfly.change_state(butterfly.ability);
            break;
        }
    }
}
class Scale {
    static WIDTH = 100;
    static HEIGHT = 750;
    static INIT_SPEED = 0.18;
    static SPEED_MAX = 0.35;
    static SPEED_STEP = 0.005;
    static speed = this.INIT_SPEED;
    static temp_speed = -1;
    static INIT_HORIZONTAL_GAP = 320;
    static HORIZONTAL_GAP_MIN = 200;
    static HORIZONTAL_GAP_STEP = -3;
    static horizontal_gap = this.INIT_HORIZONTAL_GAP;
    static INIT_VERTICAL_GAP = 220;
    static VERTICAL_GAP_MIN = 155;
    static VERTICAL_GAP_STEP = -2;
    static vertical_gap = this.INIT_VERTICAL_GAP;
    static INIT_SPAWN_MARGIN = 300;
    static SPAWN_MARGIN_MIN = 150;
    static SPAWN_MARGIN_STEP = -4;
    static spawn_margin = this.INIT_SPAWN_MARGIN;
    static COLLISION_MARGINS = { x: 50, y: 25 };
    can_give_point = true;
    static SCALE_ELEMENTS = {
        bottom: document.getElementsByClassName("scale-bottom")[0],
        top: document.getElementsByClassName("scale-top")[0],
    };
    elements = {
        bottom: Scale.SCALE_ELEMENTS.bottom.cloneNode(),
        top: Scale.SCALE_ELEMENTS.top.cloneNode(),
    };
    pos = { x: -Scale.WIDTH, y: 0 };
    constructor() {
        game_area_element?.appendChild(this.elements.bottom);
        game_area_element?.appendChild(this.elements.top);
        this.pos.y = Math.random() * (game_area_rect.height - Scale.spawn_margin - Scale.vertical_gap) + Scale.spawn_margin / 2;
        this.elements.top.style.top = this.pos.y - Scale.HEIGHT + "px";
        this.elements.bottom.style.top = this.pos.y + Scale.vertical_gap + "px";
        Scale.horizontal_gap = Math.max(Scale.HORIZONTAL_GAP_MIN, Scale.horizontal_gap + Scale.HORIZONTAL_GAP_STEP);
        Scale.vertical_gap = Math.max(Scale.VERTICAL_GAP_MIN, Scale.vertical_gap + Scale.VERTICAL_GAP_STEP);
        Scale.spawn_margin = Math.max(Scale.SPAWN_MARGIN_MIN, Scale.spawn_margin + Scale.SPAWN_MARGIN_STEP);
        console.log(Scale.horizontal_gap, Scale.vertical_gap, Scale.spawn_margin, Scale.speed);
    }
    static reset() {
        for (const scale of scale_list) {
            scale.remove_elements();
        }
        scale_list.length = 0;
        this.speed = this.INIT_SPEED;
        this.horizontal_gap = this.INIT_HORIZONTAL_GAP;
        this.vertical_gap = this.INIT_VERTICAL_GAP;
        this.spawn_margin = this.INIT_SPAWN_MARGIN;
    }
    remove_elements() {
        this.elements.top.remove();
        this.elements.bottom.remove();
    }
    process(delta) {
        if (Scale.temp_speed > 0) {
            this.pos.x += Scale.temp_speed * delta;
        }
        else {
            this.pos.x += Scale.speed * delta;
        }
        if (this.pos.x > game_area_rect?.width + Scale.WIDTH) {
            this.remove_elements();
            scale_list.shift();
            return;
        }
        if (this.pos.x + Scale.COLLISION_MARGINS.x < butterfly.pos.x &&
            this.pos.x + Scale.WIDTH - Scale.COLLISION_MARGINS.x > butterfly.pos.x - butterfly.SIZE) {
            if (this.pos.y - Scale.COLLISION_MARGINS.y > butterfly.pos.y ||
                this.pos.y + Scale.vertical_gap + Scale.COLLISION_MARGINS.y < butterfly.pos.y + butterfly.SIZE) {
                if (!butterfly.invincible) {
                    playing = false;
                    save();
                }
            }
        }
        else if (this.pos.x + Scale.COLLISION_MARGINS.x > butterfly.pos.x && this.can_give_point) {
            this.can_give_point = false;
            score++;
            score_element.textContent = "Score: " + score;
            if (score > highscore) {
                highscore = score;
            }
            Scale.speed = Math.min(Scale.SPEED_MAX, Scale.speed + Scale.SPEED_STEP);
        }
        this.update();
    }
    update() {
        for (let e of Object.values(this.elements)) {
            e.style.right = this.pos.x + "px";
        }
    }
}
const scale_list = [];
class Flower {
    static ELEMENTS = document.getElementsByClassName("flower");
    static AMOUNT_ELEMENTS = document.getElementsByClassName("flower-amount");
    element = Flower.ELEMENTS[Math.floor(Math.random() * 6)]?.cloneNode();
    size = 65;
    pos = { x: -Scale.WIDTH - Scale.horizontal_gap / 2, y: 0 }; // TODO
    // this could change throughout the run + with upgrades
    static spawn_chance = 0.3;
    static spawn_margin = 200;
    constructor() {
        game_area_element?.appendChild(this.element);
        this.size = Math.floor(Math.random() * 20) + 40;
        this.pos.y = Math.random() * (game_area_rect.height - Flower.spawn_margin) + Scale.spawn_margin / 2 - this.size / 2;
        this.pos.x -= this.size / 2;
        this.element.style.top = this.pos.y + this.size / 2 + "px";
        this.element.style.height = this.size + "px";
    }
    static reset() {
        for (const flower of flower_list) {
            flower.remove_element();
        }
        flower_list.length = 0;
    }
    remove_element() {
        this.element.remove();
    }
    process(delta) {
        if (Scale.temp_speed > 0) {
            this.pos.x += Scale.temp_speed * delta;
        }
        else {
            this.pos.x += Scale.speed * delta;
        }
        if (this.pos.x > game_area_rect?.width + this.size) {
            this.remove_element();
            flower_list.shift();
            return;
        }
        if (this.pos.x < butterfly.pos.x && this.pos.x + this.size > butterfly.pos.x - butterfly.SIZE) {
            if (this.pos.y < butterfly.pos.y + butterfly.SIZE && this.pos.y + this.size > butterfly.pos.y) {
                this.remove_element();
                flower_list.splice(flower_list.indexOf(this), 1);
                flower_amount++;
                for (const element of Flower.AMOUNT_ELEMENTS) {
                    element.textContent = flower_amount + "";
                }
                return;
            }
        }
        this.update();
    }
    update() {
        this.element.style.right = this.pos.x + "px";
    }
}
const flower_list = [];
let last_frame = 0;
function start() {
    butterfly.reset();
    Scale.reset();
    Flower.reset();
    playing = true;
    last_frame = 0;
    score = 0;
    score_element.textContent = "Score: " + score;
    requestAnimationFrame(game_loop);
}
function game_loop() {
    if (!playing) {
        return;
    }
    let current_frame = performance.now();
    let delta = current_frame - last_frame;
    if (last_frame === 0) {
        delta = 0;
    }
    if (scale_list.length === 0 || scale_list[scale_list.length - 1].pos.x > Scale.horizontal_gap) {
        scale_list.push(new Scale());
        game_area_rect = game_area_element.getBoundingClientRect();
        if (Math.random() < Flower.spawn_chance) {
            flower_list.push(new Flower());
        }
    }
    for (const scale of scale_list) {
        scale.process(delta);
    }
    for (const flower of flower_list) {
        flower.process(delta);
    }
    butterfly.process(delta);
    last_frame = current_frame;
    requestAnimationFrame(game_loop);
}
function save() {
    window.localStorage.setItem("highscore", highscore + "");
    window.localStorage.setItem("flower_amount", flower_amount + "");
}
load();
function load() {
    let values = {
        highscore: window.localStorage.getItem("highscore"),
        flower_amount: window.localStorage.getItem("flower_amount"),
    };
    console.log(values);
    if (values.highscore !== null)
        highscore = parseInt(values.highscore);
    if (values.flower_amount !== null)
        flower_amount = parseInt(values.flower_amount);
    for (const element of Flower.AMOUNT_ELEMENTS) {
        element.textContent = flower_amount + "";
    }
}
export {};
//# sourceMappingURL=main.js.map