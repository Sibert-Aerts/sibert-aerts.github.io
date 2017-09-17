///////////////////////////////////////////
//                 Ready                 //
///////////////////////////////////////////

var wormFunc = _ => 'black';

var dungeonFunc = function(tile, grid){
    var whiteFriends = 0;
    var grayFriends = 0;
    var adjacent = grid.getAdjacent(tile);
    adjacent.forEach(t=>t.state=='white'?whiteFriends++:t.state=='gray'?grayFriends++:0);
    var p = whiteFriends * 0.3 + grayFriends * 0.1 - (whiteFriends > 2 ? 10 : 0);
    p += (tile.x % 4 == 0) * 0.5 + (tile.y % 4==0) * 0.5 - 0.3;
    return chance(p) ? 'white' : 'black';
}

async function reset(){
    var $maze = await $('#maze-container');
    var xtiles = parseInt($('#width').val());
    var ytiles = parseInt($('#height').val());
    var func;
    if($('#worm').prop('checked')) func = wormFunc;
    if($('#worm2').prop('checked')) func = wormFunc2;
    if($('#dungeon').prop('checked')) func = dungeonFunc;
    maze = new Maze($maze, xtiles, ytiles, func);
}

async function ready(){
    $('button#validate-button').click(_=>maze.validateVisually());
    $('button#reset-button').click(reset);
    await reset();
}

$(document).ready(_=>ready())

//////////////////////////////////////////
//                 Tile                 //
//////////////////////////////////////////

Tile = function($tile, x, y){
    this.$tile = $tile;
    this.x = x;
    this.y = y;
    this.state = choose(['white', 'black', 'gray']);
    this.state = 'gray';
    this.$tile.addClass(this.state);
}

Tile.prototype.set = async function(state){
    await this.$tile.removeClass(this.state);
    this.state = state;
    await this.$tile.addClass(this.state);
}

// Manhattan distance between 2 tiles.
Tile.prototype.dist = function(t){
    return Math.abs(this.x - t.x) + Math.abs(this.y - t.y);
}

//////////////////////////////////////////
//                 Grid                 //
//////////////////////////////////////////

Grid = function($cont, width=1, height=1){
    this.$cont = $cont;
    this.$cont.html('');
    this.width = width;
    this.height = height;
    this.initialize();
}

Grid.prototype.initialize = function(){
    this.tiles = [];
    for(var x=0; x < this.width; x++) this.tiles.push([]);
    w = percentFormat(1/this.width);
    h = percentFormat(1/this.height);

    for(var y=0; y < this.height; y++){
        for(var x=0; x < this.width; x++){
            let $tile = $('<div>', {
                class: 'tile ',
                style: 'width:' + w + ';height:' + h
            });
            this.$cont.append($tile);
            this.tiles[x].push(new Tile($tile, x, y));
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
    var speed = $('#speed-range').val();
    var i = 0;

    this.explored = [];
    while(this.queue.length){
        var tile = popRandom(this.queue);
        if(tile.state != 'gray') continue;

        await tile.set('red')

        var valid = await this.validate();
        if (!valid)
            await tile.set('white');
        else
            await tile.set(this.func(tile, this.grid));

        if(tile.state=='white'){
            this.explored.push(tile);
            this.queue = this.queue.concat(this.grid.getAdjacent(tile).filter(t=>this.queue.indexOf(t)<0)).filter(t=>t.state=='gray');
        }
        if(chance(speed/this.queue.length))
            await sleep(0); // sleep(0) ~=~ sleep(3) because javascript
    }
    console.timeEnd('maze');
}

// Test whether or not a path exists from the start to the goal
Maze.prototype.validate = async function(){
    var getMinDist = q => q.reduce(
        (acc, val, i) => acc.dist < (d=this.goal.dist(val)) ? acc : {dist: d, i:i},
        {dist: 10000000, i:-1}
    );

    var solved = this.grid.getAdjacent(this.goal).reduce((b,t)=>b=b||t.state=='white', false)
    if(solved)
        return true;

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