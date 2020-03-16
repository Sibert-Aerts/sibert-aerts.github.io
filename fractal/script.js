// Useful aliases
const int = Math.floor;
const byId = i => document.getElementById(i);
const $ = s => document.querySelector(s);

// Useful functions
const chance = (x, y=1) => Math.random()*y < x;
const randInt = a => int( Math.random()*a );

// Useful methods
CanvasRenderingContext2D.prototype.clear = function(){ this.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT) }

// Useful globals
const canvas = byId('screen');
const CANVASWIDTH = +canvas.width;
const CANVASHEIGHT = +canvas.height;
const PIXELFACTOR = 1;
const WIDTH = CANVASWIDTH * PIXELFACTOR;
const HEIGHT = CANVASHEIGHT * PIXELFACTOR;
const CTX = canvas.getContext('2d');

/****************************************************************************************/
/*                                       NEW CODE                                       */
/****************************************************************************************/

class Grid {
    constructor(width=WIDTH, height=HEIGHT, pixelFactor=PIXELFACTOR) {
        this.width = width;
        this.height = height;
        this.pixelFactor = pixelFactor;
        // Initialise data grid
        this.grid = new Array(width);
        // Uint8Array but we only really put 0's or 1's in there.
        for( let x=0; x<width; x++ ) this.grid[x] = new Uint8Array(height);
    }

    clear() {
        for( let x=0; x<this.width; x++ ) this.grid[x].fill(0);
    }

    draw(ctx=CTX) {
        ctx.clear();
        let id = ctx.getImageData(0, 0, CANVASWIDTH, CANVASHEIGHT);
        let pixels = id.data;
        let grid = this.grid;
        let i = 0, x, y;

        if( PIXELFACTOR == 1 ){
            for( y=0; y<this.width; y++ )
                for( x=0; x<this.height; x++, i+=4 )
                    if( grid[x][y] ) pixels[i+3] = 255;

        } else if( PIXELFACTOR == 2 ){
            for( y=0; y<this.width; y+=2 )
                for( x=0; x<this.height; x+=2, i+=4 )
                    pixels[i+3] = 64 * (grid[x][y] + grid[x+1][y] + grid[x][y+1] + grid[x+1][y+1]) - 1;
        }
    
        ctx.putImageData(id, 0, 0);
    }
    
    step(transform=TRANSFORM){
        let newGrid = new Grid();
        let nGrid = newGrid.grid;
        for( let x=0; x<WIDTH; x++)
            for( let y=0; y<HEIGHT; y++)
                if( this.grid[x][y] )
                    for( let [px, py] of transform(x, y) )
                        if( 0 <= px && px < WIDTH && 0 <= py && py < HEIGHT )
                            nGrid[px][py] = 1;
        return newGrid;
    }
}



/****************************************************************************************/
/*                                       OLD CODE                                       */
/****************************************************************************************/


var getterCache = []; var cacheIndex = 0;
function makeGetter(func){
    let i = cacheIndex++;
    return function(){
        if( !getterCache[i] ) getterCache[i] = func();
        return getterCache[i];
    }
}

// Draw a square
const getSquare = makeGetter(function(){
    let square = new Grid();
    for(let i=int(WIDTH/4); i<int(3*WIDTH/4); i++)
        square.grid[i].fill( 1, int(HEIGHT/4), int(3*HEIGHT/4) );
    return square;
});
// Draw an empty square
const getEmptySquare = makeGetter(function(){
    let empty = new Grid();
    for(let x=0; x<WIDTH; x++)
        empty.grid[x][0] = empty.grid[x][HEIGHT-1] = 1;
    empty.grid[0].fill(1)
    empty.grid[WIDTH-1].fill(1);
    return empty;
});
// Draw a circle
const getCircle = makeGetter(function(){
    let circle = new Grid();
    const rsq = Math.pow((WIDTH/4), 2);
    for( let x=0; x<WIDTH; x++ ){
        let D = rsq - Math.pow(x-WIDTH/2, 2);
        if( D < 0 ) continue;
        let sqD = Math.sqrt( D );
        circle.grid[x].fill(1, int(HEIGHT/2-sqD), int(HEIGHT/2+sqD))
    }
    return circle;
});
// Draw a path
const getPath = function(){
    let path = new Grid();
    const dxdy = WIDTH/HEIGHT/2;
    for( let y=0; y<HEIGHT; y++ )
        path.grid[int(y*dxdy)][HEIGHT-1-y] = path.grid[int(WIDTH-1-y*dxdy)][HEIGHT-1-y] = true;
    return path;
};

const transforms = {
    sierpinski_square: (x, y) => [
        [ int(x/2), int(y/2) ],
        [ int(x/2 + WIDTH/2), int(y/2) ],
        [ int(x/2), int(y/2 + HEIGHT/2) ] 
    ],

    square_2x2: (x, y) => [
        [ int(x/2), int(y/2) ],
        [ int(x/2 + WIDTH/2), int(y/2) ],
        [ int(x/2), int(y/2 + HEIGHT/2) ],
        [ int(x/2 + WIDTH/2), int(y/2 + HEIGHT/2) ]
    ],

    square_3x3: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            [ x0, y0 ], [ x1, y0 ], [ x2, y0 ],
            [ x0, y1 ],	[ x1, y1 ], [ x2, y1 ],
            [ x0, y2 ], [ x1, y2 ], [ x2, y2 ],
        ]
    },

    make_path_fill_space: (x, y) => [
        [ int(x/2), int(y/2) ],
        [ int(x/2 + WIDTH/2), int(y/2) ],
        [ int((WIDTH-1)/2 - y/2), int(x/2 + HEIGHT/2) ],
        [ int(y/2 + WIDTH/2), int(x/2 + HEIGHT/2) ]
    ],

    sponge: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            [ x0, y0 ], [ x1, y0 ], [ x2, y0 ],
            [ x0, y1 ],				[ x2, y1 ],
            [ x0, y2 ], [ x1, y2 ], [ x2, y2 ],
        ]
    },

    sierpinski_triangle: (x, y) => [
        [ int(x/2 + WIDTH/4), int(y/2) ],
        [ int(x/2), int(y/2 + HEIGHT/2) ],
        [ int(x/2 + WIDTH/2), int(y/2 + HEIGHT/2) ]
    ],

    triangle: (x, y) => [
        [ int(x/2 + WIDTH/4), int(y/2) ],
        [ int(x/2), int(y/2 + HEIGHT/2) ],
        [ int(x/2) + WIDTH/2, int(y/2 + HEIGHT/2) ],
        [ int(x/2 + WIDTH/4), int((HEIGHT - y)/2 + HEIGHT/2) ]
    ],

    X: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            [ x0, y0 ],            [ x2, y0 ],
                        [ x1, y1 ],
            [ x0, y2 ],            [ x2, y2 ],
        ]
    },

    film: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            [ x0, y0 ], [ x1, y0 ], [ x2, y0 ],
                        [ x1, y1 ],
            [ x0, y2 ], [ x1, y2 ], [ x2, y2 ],
        ]
    },

    flower: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
                        [ x1, y0 ],
            [ x0, y1 ],				[ x2, y1 ],
                        [ x1, y2 ],
        ]
    },

    hexagon_flower: (x, y) => {
        let x0 = int(x/3 + WIDTH/6), x1 = int(x/3 + WIDTH/2);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
                    [ x0, y0 ], [ x1, y0 ],
            [ int(x/3), y1 ],	    [ int(x/3+2*WIDTH/3), y1 ],
                    [ x0, y2 ], [ x1, y2 ],
        ]
    },
}

var fracSelect = byId('frac-select');
var TRANSFORM;
for( let t in transforms )
    fracSelect.innerHTML += `<label><input type="radio" name="frac" value="${t}"> ${t.replace(/_/g, ' ')}</label>`
fracSelect.onchange = e => TRANSFORM = transforms[e.target.value] 
$('input[value=sierpinski_triangle]').click();

$('button[target=clear]').onclick = ()=>{ GRID = new Grid(); GRID.draw() };
$('button[target=dot]').onclick = ()=>{ GRID = new Grid(); GRID.grid[int(WIDTH/2)][int(HEIGHT/2)] = true; GRID.draw() };
$('button[target=square]').onclick = ()=>{ GRID = getSquare(); GRID.draw() };
$('button[target=esquare]').onclick = ()=>{ GRID = getEmptySquare(); GRID.draw() };
$('button[target=circle]').onclick = ()=>{ GRID = getCircle(); GRID.draw() };
$('button[target=path]').onclick = ()=>{ GRID = getPath(); GRID.draw() };


function step_and_render(){
    GRID = GRID.step();
    GRID.draw();
}

const random_sierpinski =  [
    (x, y) => [ int(x/2 + WIDTH/4), int(y/2) ],
    (x, y) => [ int(x/2), int(y/2 + HEIGHT/2) ],
    (x, y) => [ int(x/2 + WIDTH/2), int(y/2 + HEIGHT/2) ]
]

function random_render(){
    GRID = new Grid();
    let nsteps = parseInt(byId('rand-steps').value);
    let [x, y] = [randInt(WIDTH), randInt(HEIGHT)];
    for( let i=0; i<nsteps; i++ ){
        [x, y] = random_sierpinski[randInt(3)](x, y);
        GRID.grid[x][y] = 1;
    }
    GRID.draw();
}

document.onkeypress = e => {
    if( e.key == 'Enter' && document.activeElement === document.body )
        step_and_render();
}

let GRID = getSquare();
GRID.draw();
        
function time(){
    console.time('TIMER');
    GRID = getSquare();
    for( let i=0; i<10; i++ )
        GRID = GRID.step();
    GRID.draw();    
    console.timeEnd('TIMER');
}