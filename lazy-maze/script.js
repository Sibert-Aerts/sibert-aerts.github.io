///////////////////////////////////////////
//                 Ready                 //
///////////////////////////////////////////

var configs = {
    worm: {
        base: 0, friendBias: 0,
        vSpace: 2, vBias: 0,
        hSpace: 2, hBias: 0,
    },
    labyrinth: {
        base: -0.1, friendBias: 0,
        vSpace: 2, vBias: 0.6,
        hSpace: 2, hBias: 0.6,
    },
    dungeon: {
        base: -0.3, friendBias: 0.3,
        vSpace: 4, vBias: 0.5,
        hSpace: 4, hBias: 0.5,
    },
    metroid: {
        base: -0.5, friendBias: 0.2,
        vSpace: 2, vBias: 1,
        hSpace: 5, hBias: 0.5,
    },
    classicvania: {
        base: 0, friendBias: -0.2,
        vSpace: 2, vBias: 0.3,
        hSpace: 5, hBias: 1.2,
    },
    modernvania: {
        base: -0.5, friendBias: 0.2,
        vSpace: 2, vBias: 0.6,
        hSpace: 4, hBias: 0.9,
    },
    usa: {
        base: -0.2, friendBias: -0.2,
        vSpace: 6, vBias: 1.4,
        hSpace: 6, hBias: 1.4,
    },
    mansion: {
        base: 0.6, friendBias: 0.5,
        vSpace: 4, vBias: -1.2,
        hSpace: 4, hBias: -1.2,
    }
}

var selectedConfig;

var dungeonFunc = function(tile, grid){
    var cfg = selectedConfig;
    p = cfg.base;
    if(cfg.friendBias){
        var whiteFriends = 0;
        var grayFriends = 0;
        var adjacent = grid.getAdjacent(tile);
        adjacent.forEach(t=>t.state=='white'?whiteFriends++:t.state=='gray'?grayFriends++:0);
        p += (whiteFriends + grayFriends/3) * cfg.friendBias - (whiteFriends > 2 ? 0 : 0);
    }
    p += (tile.x % cfg.vSpace == 0) * cfg.vBias + (tile.y % cfg.hSpace==0) * cfg.hBias;
    return chance(p) ? 'white' : 'black';
};

async function reset(){
    var $maze = await $('#maze-container');
    var xtiles = parseInt($('#width').val());
    var ytiles = parseInt($('#height').val());
    var func = dungeonFunc;
    maze = new Maze($maze, xtiles, ytiles, func);
}

function readConfig(){
    var $fields = $('#config input');
    $fields.each((i,e)=>selectedConfig[$(e).attr('name')]=parseFloat($(e).val()));
    console.log(selectConfig);
}

function writeConfig(){
    var $fields = $('#config input');
    $fields.each((i,e)=>$(e).val(selectedConfig[$(e).attr('name')]));
}

function selectConfig(cfg){
    selectedConfig = cfg;
    writeConfig();
}

async function ready(){
    $('button#validate-button').click(_=>maze.validateVisually());
    $('button#reset-button').click(reset);
    $('#presets>button').each((i, e)=>$(e).click(_=>selectConfig(configs[$(e).attr('name')])));
    $('#config input').on('input', readConfig);
    selectConfig(configs.dungeon);
    await reset();
}

$(document).ready(_=>ready())

//////////////////////////////////////////
//                 Tile                 //
//////////////////////////////////////////

Tile = function(grid, x, y){
    this.grid = grid;
    this.ctx = this.grid.canvas.getContext('2d');
    this.x = x;
    this.y = y;
    this.set('gray');
}

Tile.prototype.set = async function(state){
    this.state = state;
    this.ctx.fillStyle = state;
    this.ctx.fillRect(this.x, this.y, 1, 1);
}

// Manhattan distance between 2 tiles.
Tile.prototype.dist = function(t){
    return Math.abs(this.x - t.x) + Math.abs(this.y - t.y);
}

Tile.stateSequence = ['white', 'gray', 'black']

Tile.prototype.nextState = function(){
    var i = Tile.stateSequence.indexOf(this.state);
    var s = Tile.stateSequence[(i+1)%Tile.stateSequence.length];
    this.set(s);
}

//////////////////////////////////////////
//                 Grid                 //
//////////////////////////////////////////

// Width and height are the number of tiles
Grid = function($canvas, width=1, height=1){
    this.canvas = $canvas.get()[0];
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.initialize();
}

Grid.prototype.initialize = function(){
    this.tiles = [];
    for(var x=0; x < this.width; x++) this.tiles.push([]);

    for(var y=0; y < this.height; y++){
        for(var x=0; x < this.width; x++){
            // let $tile = $('<div>', {
            //     class: 'tile ',
            //     style: 'width:' + w + ';height:' + h
            // });
            let tile = new Tile(this, x, y);
            // $tile.click(_=>tile.nextState());
            // this.$cont.append($tile);
            this.tiles[x].push(tile);
        }
    }
}

Grid.prototype.reset = function(){
    this.each(t=>t.set('gray'));
}

Grid.prototype.get = function(x, y){
    return this.tiles[x][y];
}

Grid.prototype.getAdjacent = function(tile){
    var x = tile.x; var y = tile.y;
    out = [];
    for(var dx = -1; dx <= 1; dx += 2)
        if(bounded(x+dx, 0, this.width-1))
            out.push(this.tiles[x+dx][y]);
    for(var dy = -1; dy <= 1; dy += 2)
        if(bounded(y+dy, 0, this.height-1))
            out.push(this.tiles[x][y+dy]);
    return out;
}

Grid.prototype.each = function(f){
    for(var y=0; y < this.height; y++)
        for(var x=0; x < this.width; x++)
            f(this.tiles[x][y]);
}

Grid.prototype.filter = function(f){
    var out = [];
    this.each(t=>{if(f(t))out.push(t)});
    return out;
}

//////////////////////////////////////////
//                 Maze                 //
//////////////////////////////////////////


Maze = function($cont, width=1, height=1, func){
    this.grid = new Grid($cont, width, height);
    this.func = func;
    this.initialize();
}

Maze.prototype.initialize = async function(){
    var w = this.grid.width;
    var h = this.grid.height;
    // Make the walls
    for(var x=0; x < w; x++){
        await this.grid.get(x, 0).set('black');
        await this.grid.get(x, h-1).set('black');
    }
    for(var y=0; y < h; y++){
        await this.grid.get(0, y).set('black');
        await this.grid.get(w-1, y).set('black');
    }
    // Make start, goal and start queue
    this.goal = this.grid.get(randInt(1, w-2), 0)
    this.start = this.grid.get(randInt(1, w-2), h-1)
    await this.goal.set('green');
    await this.start.set('yellow');
    this.queue = this.grid.getAdjacent(this.start).filter(t=>t.state=='gray');
    this.generate();
}

Maze.prototype.reset = function(){
    this.grid.reset();
    this.initialize();
}

Maze.prototype.generate = async function(){
    console.time('maze');
    var speed = 1000;
    var i = 0;

    this.explored = [];
    while(this.queue.length){
        var tile = popRandom(this.queue);
        if(tile.state != 'gray') continue;

        await this.generateTile(tile);

        if(chance(speed/this.queue.length)){
            speed = Math.pow($('#speed-range').val(), 2);
            await sleep(speed/20); // sleep(0) ~=~ sleep(3) because javascript
        }
    }
    console.timeEnd('maze');
}

Maze.prototype.generateTile = async function(tile){
    if(tile.state!='gray') return;
    // Set the tile red to test if closing it off would make the maze unsolvable
    await tile.set('red')

    var valid = await this.validate();
    if (!valid)
        await tile.set('white');
    else
        // The maze would still be solvable even if the tile were black!
        // Now we get to decide what the tile will be based on our whims.
        await tile.set(this.func(tile, this.grid));

    if(tile.state=='white'){
        // Expand the queue and explored list
        this.explored.push(tile);
        this.queue = this.queue.concat(this.grid.getAdjacent(tile).filter(t=>this.queue.indexOf(t)<0)).filter(t=>t.state=='gray');
    }
}

// Test whether or not a path exists from the start to the goal
Maze.prototype.validate = async function(){
    var getMinDist = q => q.reduce(
        (acc, val, i) => acc.dist < (d=this.goal.dist(val)) ? acc : {dist: d, i:i},
        {dist: 10000000, i:-1}
    );

    var solved = this.grid.getAdjacent(this.goal).reduce((b,t)=>b=b||t.state=='white', false)
    if(solved){
        return true;
    }
    var explored = this.explored.slice();
    var queue = this.queue.slice();

    var validTile = t => t.state != 'black' && t.state != 'red' && explored.indexOf(t) < 0;

    // A* search!
    var count = 0;
    while(queue.length){
        count++;
        var i = getMinDist(queue).i;
        var tile = queue.splice(i, 1)[0];

        if(tile.state == 'green') {
            // console.log('True effort:', count);
            return true;
        }
        if(!validTile(tile)) continue;

        explored.push(tile);

        var discovered = this.grid.getAdjacent(tile).filter(validTile).filter(t=>queue.indexOf(t)<0);
        queue = queue.concat(discovered);
    }
    // console.log('False effort:', count);
    return false;
}

// Show whether or not a path to the goal exists
Maze.prototype.validateVisually = async function(){
    var getMinDist = q => q.reduce(
        (acc, val, i) => acc.dist < (d=this.goal.dist(val)) ? acc : {dist: d, i:i},
        {dist: 10000000, i:-1}
    );

    this.grid.each(async t=>t.state=='yellow'?t.set('white'):0);
    var explored = [];
    var queue = [this.start];
    var validTile = t => t.state != 'black' && explored.indexOf(t) < 0;

    // A* search!
    while(queue.length){
        var i = getMinDist(queue).i;
        var tile = queue.splice(i, 1)[0];

        if(tile.state == 'green') return;
        if(!validTile(tile)) continue;

        explored.push(tile);
        tile.set('yellow');

        var discovered = this.grid.getAdjacent(tile).filter(validTile).filter(t=>queue.indexOf(t)<0);
        queue = queue.concat(discovered);
        await sleep(5);
    }
}