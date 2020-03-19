'use strict';

// Useful aliases
const int = Math.floor;
const byId = i => document.getElementById(i);
const $ = s => document.querySelector(s);

// Useful functions
const chance = (x, y=1) => Math.random()*y < x;
const randInt = a => int( Math.random()*a );
const mod = (x, m) => ((x%m)+m%m);

// Useful methods
CanvasRenderingContext2D.prototype.clear = function(){ this.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT) }

// Useful globals
const CANVAS = byId('screen');
const CANVASWIDTH = +CANVAS.width;
const CANVASHEIGHT = +CANVAS.height;
const PIXELFACTOR = 1;
const WIDTH = CANVASWIDTH * PIXELFACTOR;
const HEIGHT = CANVASHEIGHT * PIXELFACTOR;
const CTX = CANVAS.getContext('2d');

/****************************************************************************************/
/*                                       NEW CODE                                       */
/****************************************************************************************/

class Grid {
    constructor(width=WIDTH, height=HEIGHT, pixelFactor=PIXELFACTOR) {
        this.width = width;
        this.height = height;
        this.pixelFactor = pixelFactor;
        // Initialise data grid
        // We use Uint8Array, but we only really put 0's or 1's in there for now.
        this.grid = new Array(width);
        for( let x=0; x<width; x++ ) this.grid[x] = new Uint8Array(height);
    }

    count() {
        if( this._count ) return this._count;
        let count = 0;
        let grid = this.grid;
        for( let x=0; x<this.width; x++ )
            for( let y=0; y<this.height; y++ )
                if( grid[x][y] )
                    count++;
        return this._count = count;
    }

    render(ctx=CTX) {
        ctx.clear();
        let id = ctx.getImageData(0, 0, CANVASWIDTH, CANVASHEIGHT);
        let h = this.height;
        let pixels = id.data;
        let grid = this.grid;
        let i = 3, x, y;

        if( PIXELFACTOR == 1 ){
            // Draw to the grid left to right, bottom to top
            // So bottom left is (0, 0), top right is (width, height)
            for( y=this.height-1; y>=0; y-- )
                for( x=0; x<this.width; x++, i+=4 )
                    if( grid[x][y] ) pixels[i] = 255;

        } else if( PIXELFACTOR == 2 ){
            for( y=this.height-2; y>=0; y-=2 )
                for( x=0; x<this.width; x+=2, i+=4 )
                    pixels[i] = 64 * (grid[x][y] + grid[x+1][y] + grid[x][y+1] + grid[x+1][y+1]) - 1;
        }
    
        ctx.putImageData(id, 0, 0);
    }
    
    oldStep(transform){
        let newGrid = new Grid();
        let nGrid = newGrid.grid;
        let grid = this.grid
        for( let x=0; x<this.width; x++)
            for( let y=0; y<this.height; y++ )
                if( grid[x][y] ){
                    let image = transform(x, y);
                    for( let i=0; i<image.length; i+=2 ){
                        let px = image[i], py = image[i+1];
                        if( 0 <= px && px < this.width && 0 <= py && py < this.height )
                            nGrid[px][py] = 1;
                    }
                }
        return newGrid;
    }

    step(transform){
        const newGrid = new Grid();
        transform.apply_to_grid(this, newGrid);
        return newGrid;
    }

    drawRectangle(x0, y0, width, height){
        // x0, y0, width and height all given as values on [0, 1[
        x0 = int(x0 * this.width);
        y0 = int(y0* this.height);
        width = Math.min(this.width, int(width*this.width) + x0 );
        height = Math.min(this.height, int(height*this.height) + y0 );
        for( let x=x0; x<width; x++ )
            this.grid[x].fill(1, y0, height)
    }
}


class Transform {
    // Abstract Class representing a transformation on a Grid

    apply_to_point(x, y){
        // Map the dot (x, y) into a list of dots represented as [x1, y1, x2, y2, ...] coordinates
        return [x, y];
    }

    apply_to_grid(grid, newGrid){
        // This method uses apply_to_point to determine the image of the input Grid, and draws it onto the output Grid
        // For Transform subclasses: As long as apply_to_point is correctly overriden this method should function as expected.
        // However, it is likely more efficient to still manually override apply_to_grid as well:
        // This default implementation makes up to millions of method calls to apply_to_point, and if the javascript engine
        // cannot inline it easily, or if there is some opportunity to avoid repeated calculations, the speed up factors may be significant.  
        const nGrid = newGrid.grid;
        const g = grid.grid, h = grid.height, w = grid.width;
        for( let x=0; x<WIDTH; x++ ){
            for( let y=0; y<HEIGHT; y++ ){
                if( g[x][y] ){
                    // BEWARE: This block may be executed millions of times in a single call
                    const image = this.apply_to_point(x, y)
                    for( let i=0; i<image.length; i+=2 ){
                        const px = image[i], py = image[i+1];
                        if( 0 <= px && px < w && 0 <= py && py < h )
                            nGrid[px][py] = 1;
                    }
                }
            }
        }
    }
}

class FunctionTransform extends Transform {
    // Wraps a function (x, y) => [x1, y1, ...] into a transform
    constructor( func ){
        super();
        this.apply_to_point = func;
    }
}

class TransformGroup extends Transform {
    // Class representing several Transforms applied alongside each other
    // e.g. TransformGroup(T1, T2).apply_to_point(x, y) == [...T1.apply_to_point(x, y), ...T2.apply_to_point(x, y)]
    constructor( ...transforms ){
        super();
        this.transforms = transforms;
        // multiplicity will be (undefined) unless every transform has a known multiplicity
        this.multiplicity = transforms.reduce( (s, t) => s + t.multiplicity, 0 )
    }

    apply_to_point(x, y){
        if( this.multiplicity ){
            // If everyone knows their multiplicity everyone should be returning Uint16Arrays
            const out = new Uint16Array(this.multiplicity * 2)
            let offset = 0;
            for( const t of this.transforms ){
                out.set( t.apply_to_point(x, y), offset )
                offset += t.multiplicity*2;
            }
            return out;
        } else {
            // Multiplicity unknown: Just spread it, whatever
            return this.transforms.reduce( (i, t) => [...i, ...t.apply_to_point(x, y)], [] );
        }
    }

    apply_to_grid(grid, newGrid){
        // I don't understand why but this is somehow the most efficient way to implement this
        for( let t of this.transforms ) t.apply_to_grid(grid, newGrid);
    }
}

class TransformChain extends Transform {
    // Class representing several Transforms applied one after the other (i.e. a composition of Transforms)
    constructor( ...transforms ){
        super();
        this.transforms = transforms;
        // multiplicity will be (undefined) unless every transform has a known multiplicity
        this.multiplicity = transforms.reduce( (s, t) => s * t.multiplicity, 1 )
    }

    apply_to_point(x, y){
        if( this.multiplicity ){
            // Known multiplicity: Make an array and carefully use it to repeatedly map our coordinates
            const out = new Uint16Array(this.multiplicity * 2)
            out[0] = x;
            out[1] = y;
            let size = 2;
            for( const t of this.transforms ){
                const m = t.multiplicity;
                for( let i=0; i<size; i+= 2 )
                    out.set( t.apply_to_point(out[i], out[i+1]), m*i )
                size *= t.multiplicity;
            }
            return out;

        } else {
            // Don't know multiplicity: Just use arrays whatever
            let out = [x, y];
            for( const t of this.transforms ){
                let image = [];
                for( let i=0; i<size; i+= 2 )
                    image = image.concat( t.apply_to_point(out[i], out[i+1]) )
                out = image;
            }
            return out;
        }
    }    

    apply_to_grid(grid, newGrid){
        for( let t of this.transforms.slice(0, -1) ){
            let imageGrid = new Grid();
            t.apply_to_grid(grid, imageGrid);
            grid = imageGrid;
        }
        this.transforms[this.transforms.length-1].apply_to_grid(grid, newGrid);
    }
}

class MatrixTransform extends Transform {
    // Class representing a transform created by a matrix:
    //  ( a  b ) (x)   (dx)
    //  ( c  d ) (y) + (dy)
    constructor(a, b, c, d, dxy){
        super();
        if( dxy.length % 2 ) throw Error('dxy must contain an even number of items');
        for( let i=0; i<dxy.length; i+=2 ){
            dxy[i] *= WIDTH;
            dxy[i+1] *= HEIGHT;
        }
        this.m = [a, b, c, d];
        this.dxy = dxy;
        this.multiplicity = dxy.length/2;
    }

    apply_to_point(x, y){
        const [a, b, c, d] = this.m;
        const out = new Uint16Array(2*this.multiplicity);
        let o = 0;
        const nx = a*x + b*y;
        const ny = c*x + d*y;
        const dxy = this.dxy;
        for( let i=0; i<dxy.length; i+=2 ){
            out[o++] = int( nx + dxy[i] );
            out[o++] = int( ny + dxy[i+1] );
        }
        return out;
    }

    apply_to_grid(grid, newGrid){
        const [a, b, c, d] = this.m;
        const dxy = this.dxy;
        const nGrid = newGrid.grid;
        const g = grid.grid, h = grid.height, w = grid.width;
        for( let x=0; x<WIDTH; x++ )
            for( let y=0; y<HEIGHT; y++ )
                if( g[x][y] ){
                    const nx = a*x + b*y;
                    const ny = c*x + d*y;
                    for( let i=0; i<dxy.length; i+=2 ){
                        const px = int( nx + dxy[i] ), py = int( ny + dxy[i+1] );
                        if( 0 <= px && px < w && 0 <= py && py < h )
                            nGrid[px][py] = 1;
                    }
                }
    }
}

class ScaleAndRotateTransform extends MatrixTransform {
    // Class representing the transformation that first independently scales x and y,
    // followed by a rotation r (in degrees) around the point (0.5, 0.5)
    constructor(fx, fy, r, dxy){
        r = mod(r, 360);
        let c, s;
        // Handle the right angles as special cases because even tiny rounding errors are extremely visible there
        if     ( r === 0   ) [c, s] = [ 1, 0]
        else if( r === 90  ) [c, s] = [ 0, 1]
        else if( r === 180 ) [c, s] = [-1, 0]
        else if( r === 270 ) [c, s] = [ 0,-1]
        else [c, s] = [Math.cos(r*Math.PI/180), Math.sin(r*Math.PI/180)]
        // Correct for the center of scaling AND rotation being (0.5, 0.5) instead of (0, 0)
        let dx = (1 - fx * c + fx * s) * 0.5;
        let dy = (1 - fy * s - fy * c) * 0.5;
        for( let i=0; i<dxy.length; i+=2 ){
            dxy[i] += dx; dxy[i+1] += dy;
        }
        // Matrix:
        //  ( fx*c  -fx*s )
        //  ( fy*s   fy*c )
        super( fx*c, -fx*s, fy*s, fy*c, dxy );
        this.fx = fx;
        this.fy = fy;
        this.r = r;
    }
}

const transforms2 = {
    sierpinski_triangle: new MatrixTransform(0.5, 0, 0, 0.5, [0, 0,  0.5, 0,  1/4, 0.5]),
    menger_sponge: new MatrixTransform(1/3, 0, 0, 1/3, 
        [0, 0,   1/3, 0,   2/3, 0,
         0, 1/3,           2/3, 1/3,
         0, 2/3, 1/3, 2/3, 2/3, 2/3]),
    space_filling_curve: new TransformGroup(
        new ScaleAndRotateTransform(0.5, 0.5,   0, [-0.25, +0.25,  +0.25, +0.25]),
        new ScaleAndRotateTransform(0.5, 0.5,  90, [+0.25, -0.25]),
        new ScaleAndRotateTransform(0.5, 0.5, -90, [-0.25, -0.25])
    ),
    fern: new TransformGroup(
        new ScaleAndRotateTransform(0.01, 0.5,   0, [0,     -0.25]),
        new ScaleAndRotateTransform(0.8, 0.8, -10, [0,    0.1 ]),
        new ScaleAndRotateTransform(0.4, 0.4, -35, [0.15,    -0.2 ]),
        new ScaleAndRotateTransform(-0.5, 0.5, -45, [-0.18, -0.2])
    ),
    shrub: new TransformGroup(
        new ScaleAndRotateTransform( 0.8, 0.8,  5, [0, 0.1] ),
        new ScaleAndRotateTransform( 0.4, 0.4, 30, [-0.25, -0.2] ),
        new ScaleAndRotateTransform( 0.4, 0.4, -30, [0.25, -0.18] ),
        new ScaleAndRotateTransform( 0.25, 0.25, 10, [0, -0.35] ),
    ),
    spiral: new TransformGroup(
        new ScaleAndRotateTransform( 0.96, 0.96, 10, [0, 0] ),
        new ScaleAndRotateTransform( 0.15, 0.15, 160, [-0.4, 0] )
    ),
    dragon: new ScaleAndRotateTransform(0.69, 0.69, 45, [0.1, -0.2, -0.1, +0.2] ),
    pointy: new TransformGroup(
        new ScaleAndRotateTransform(0.5, 0.5, 0, [0, -0.25, 0, +0.25]),
        new ScaleAndRotateTransform(0.4, 0.4, 45, [-0.2*Math.SQRT1_2, 0.2*Math.SQRT1_2]),
        new ScaleAndRotateTransform(0.4, 0.4, -45, [0.2*Math.SQRT1_2, 0.2*Math.SQRT1_2])
    ),
    pointier: new TransformGroup(
        new ScaleAndRotateTransform(0.5, 0.5, 0, [0, -0.25, 0, +0.25]),
        new ScaleAndRotateTransform(0.4, 0.4, 45, [-0.2*Math.SQRT1_2, 0]),
        new ScaleAndRotateTransform(0.4, 0.4, -45, [0.2*Math.SQRT1_2, 0])
    ),
    pointiest: new TransformGroup(
        new ScaleAndRotateTransform(0.5, 0.5, 0, [0, -0.25, 0, +0.25]),
        new ScaleAndRotateTransform(0.4, 0.4, 45, [-0.2*Math.SQRT1_2, -0.2*Math.SQRT1_2]),
        new ScaleAndRotateTransform(0.4, 0.4, -45, [0.2*Math.SQRT1_2, -0.2*Math.SQRT1_2])
    ),
}

var TRANSFORM2;
function fill_transformation_selector(){
    var fracSelect = byId('trans-select');
    let html = [];
    for( let t in transforms2 )
        html.push( `<label><input type=radio name=trans value="${t}"> ${t.replace(/_/g, ' ')}</label>` )
    fracSelect.innerHTML += html.join('');
    fracSelect.onchange = e => TRANSFORM2 = transforms2[e.target.value] 
}
fill_transformation_selector();
$('input[value=sierpinski_triangle][name=trans]').click();

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
    square.drawRectangle(1/4, 1/4, 1/2, 1/2)
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
        path.grid[int(y*dxdy)][y] = path.grid[int(WIDTH-1-y*dxdy)][y] = true;
    return path;
};
// Draw an R, a letter without any symmetries
const getR = makeGetter(function(){
    let R = new Grid();
    let r = '#******#'
          + '# #**# #'
          + '# #**. #'
          + '#......#'
    let i = 0;
    for(let y=0; y<4; y++)
        for(let x=0; x<8; x++, i++)
            if(r[i]==='#') R.drawRectangle(x/8, 3/4-y/4, 1/8+0.001, 1/4+0.001)
            else if( r[i]==='*') R.drawRectangle(x/8, 7/8-y/4, 1/8+0.001, 1/8+0.001)
            else if( r[i]==='.') R.drawRectangle(x/8, 3/4-y/4, 1/8+0.001, 1/8+0.001)
    return R;
});

const transforms = {
    sierpinski_square: (x, y) => [
        int(x/2), int(y/2),
        int(x/2 + WIDTH/2), int(y/2),
        int(x/2), int(y/2 + HEIGHT/2) 
    ],

    square_2x2: (x, y) => [
        int(x/2), int(y/2),
        int(x/2 + WIDTH/2), int(y/2),
        int(x/2), int(y/2 + HEIGHT/2),
        int(x/2 + WIDTH/2), int(y/2 + HEIGHT/2)
    ],

    square_3x3: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            x0, y0, x1, y0, x2, y0,
            x0, y1,	x1, y1, x2, y1,
            x0, y2, x1, y2, x2, y2,
        ]
    },

    make_path_fill_space: (x, y) => [
        int(x/2), int(y/2),
        int(x/2 + WIDTH/2), int(y/2),
        int((WIDTH-1)/2 - y/2), int(x/2 + HEIGHT/2),
        int(y/2 + WIDTH/2), int(x/2 + HEIGHT/2)
    ],

    sponge: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            x0, y0, x1, y0, x2, y0,
            x0, y1,         x2, y1,
            x0, y2, x1, y2, x2, y2,
        ]
    },

    sierpinski_triangle: (x, y) => [
        int(x/2 + WIDTH/4), int(y/2),
        int(x/2), int(y/2 + HEIGHT/2),
        int(x/2 + WIDTH/2), int(y/2 + HEIGHT/2 )
    ],

    triangle: (x, y) => [
        int(x/2 + WIDTH/4), int(y/2),
        int(x/2), int(y/2 + HEIGHT/2),
        int(x/2) + WIDTH/2, int(y/2 + HEIGHT/2),
        int(x/2 + WIDTH/4), int((HEIGHT - y)/2 + HEIGHT/2)
    ],

    X: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            x0, y0,         x2, y0,
                    x1, y1,
            x0, y2,         x2, y2,
        ]
    },

    film: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
            x0, y0, x1, y0, x2, y0,
                    x1, y1,
            x0, y2, x1, y2, x2, y2,
        ]
    },

    flower: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + WIDTH/3), x2 = int(x/3 + 2*WIDTH/3);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
                    x1, y0,
            x0, y1,         x2, y1,
                    x1, y2,
        ]
    },

    hexagon_flower: (x, y) => {
        let x0 = int(x/3 + WIDTH/6), x1 = int(x/3 + WIDTH/2);
        let y0 = int(y/3), y1 = int(y/3 + HEIGHT/3), y2 = int(y/3 + 2*HEIGHT/3);
        return [
                    x0, y0, x1, y0,
            int(x/3), y1,	    int(x/3+2*WIDTH/3), y1,
                    x0, y2, x1, y2,
        ]
    },
}

var fracSelect = byId('frac-select');
var TRANSFORM;
for( let t in transforms )
    fracSelect.innerHTML += `<label><input type="radio" name="frac" value="${t}"> ${t.replace(/_/g, ' ')}</label>`
fracSelect.onchange = e => TRANSFORM = transforms[e.target.value] 
$('input[value=sierpinski_triangle][name=frac]').click();

$('button[target=clear]').onclick = ()=>{ GRID = new Grid(); GRID.render() };
$('button[target=dot]').onclick = ()=>{ GRID = new Grid(); GRID.grid[int(WIDTH/2)][int(HEIGHT/2)] = true; GRID.render() };
$('button[target=square]').onclick = ()=>{ GRID = getSquare(); GRID.render() };
$('button[target=esquare]').onclick = ()=>{ GRID = getEmptySquare(); GRID.render() };
$('button[target=circle]').onclick = ()=>{ GRID = getCircle(); GRID.render() };
$('button[target=path]').onclick = ()=>{ GRID = getPath(); GRID.render() };
$('button[target=R]').onclick = ()=>{ GRID = getR(); GRID.render() };


function step_and_render(){
    console.time('OLDSTEP');
    GRID = GRID.oldStep(TRANSFORM)
    GRID.render();
    console.timeEnd('OLDSTEP');
}

function step_and_render2(){
    console.time('STEP');
    GRID = GRID.step(TRANSFORM2);
    GRID.render();
    console.timeEnd('STEP');
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
    GRID.render();
}

document.onkeypress = e => {
    if( e.key == 'Enter' && document.activeElement === document.body )
        step_and_render2();
}

let GRID = getSquare();
GRID.render();
        
function time(){
    console.time('TIMER');
    GRID = getSquare();
    for( let i=0; i<10; i++ )
        GRID = GRID.step();
    GRID.render();    
    console.timeEnd('TIMER');
}