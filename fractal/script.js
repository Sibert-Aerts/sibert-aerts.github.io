'use strict';

// Useful aliases
const int = Math.floor;
const byId = i => document.getElementById(i);
const $ = s => document.querySelector(s);
const makeElem = (x, c, t) => { let e = document.createElement(x); if(c) e.className = c; if(t) e.textContent = t; return e };

// Useful functions
const chance = (x, y=1) => Math.random()*y < x;
const randInt = a => int( Math.random()*a );
const mod = (x, m) => ((x%m)+m%m);
const {abs, max, min, sin, cos, tan, cot, atan2, sqrt } = Math;
function choose_weighted( items ){
    const sum = items.reduce( (s, i)=>s+i.weight, 0);
    let pick = Math.random()*sum;
    for(let i=0; i<items.length; i++)
        if( pick < items[i].weight ) return items[i]
        else pick -= items[i].weight;
}

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
/*                                         GRID                                         */
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

    gridCoords(x, y){
        // maps [0, 1[² to [0, width[ × [0, height[
        return [int(x*this.width), int(y*this.height)]
    }

    gridRadius(r){
        return min(r*this.width, r*this.height)
    }

    drawRectangle(x0, y0, width, height, color=1){
        // x0, y0, width and height all given as values on [0, 1[
        [x0, y0] = this.gridCoords(x0, y0);
        width = min(this.width, int(width*this.width) + x0 );
        height = min(this.height, int(height*this.height) + y0 );
        for( let x=x0; x<width; x++ )
            this.grid[x].fill(color, y0, height)
    }

    drawCircle(cx, cy, r, color=1){
        // cx, cy and r all given as values in [0, 1[
        // with r being relative to whichever is shortest, width or height
        [cx, cy] = this.gridCoords(cx, cy);
        r = this.gridRadius(r);
        const rsq = r*r;
        const x0 = max(0, int(cx-r));
        const x1 = min(this.width, int(cx+r)+1);
        for( let x=x0; x<x1; x++ ){
            const D = rsq - (x-cx)*(x-cx);
            if( D < 0 ) continue;
            const sqD = sqrt( D );
            this.grid[x].fill(color, max(0, int(cy-sqD)), int(cy+sqD))
        }
    }

    drawStroke(Ax, Ay, Bx, By, w, color=1){
        w = this.gridRadius(w)/2;
        [Ax, Ay] = this.gridCoords(Ax, Ay);
        [Bx, By] = this.gridCoords(Bx, By);
        if ( Ax === Bx && Ay === By ) return;
        // Swap A and B so Ax <= Bx
        if (Ax > Bx) [Ax, Ay, Bx, By] = [Bx, By, Ax, Ay];

        const theta = atan2(By-Ay, Bx-Ax);
        const tanth = (By-Ay)/(Bx-Ax);
        const tanphi = (Bx-Ax)/(By-Ay);

        try{
        if( Ay === By ){ // Horizontal line
            const Aly = int(Ay + w);
            const Ary = max(0, int(Ay - w));
            for(let x=max(0, Ax); x<=min(this.width-1, Bx); x++)
                this.grid[x].fill(color, Ary, Aly);
        }
        else if( Ax === Bx ){ // Vertical line
            if (Ay > By) [Ay, By] = [By, Ay];
            const Alx = max(0, int(Ax - w));
            const Arx = min(this.width-1, int(Ax + w));
            for(let x=Alx; x<=Arx; x++)
                this.grid[x].fill(color, Ay, By);
        }
        else if( Ay < By ){ // Line bottom left to top right
            const Alx = int(Ax - w*sin(theta));
            const Arx = int(Ax + w*sin(theta));
            const Brx = min(this.width-1, int(Bx + w*sin(theta)));
            const Aly = Ay + w*cos(theta);
            const Ary = Ay - w*cos(theta);
            for( let x=max(0, Alx); x<=Brx; x++ ){
                const y0 = int(max( Ay - (x-Ax)*tanphi, Ary + (x-Arx)*tanth, 0 ));
                const yf = int(min( By - (x-Bx)*tanphi, Aly + (x-Alx)*tanth ));
                if (yf > 0) this.grid[x].fill(color, y0, yf);
            }
        }
        else if ( By < Ay ){ // Line top left to bottom right
            const Alx = int(Ax - w*sin(theta));
            const Arx = int(Ax + w*sin(theta));
            const Blx = min(this.width-1, int(Bx - w*sin(theta)));
            const Aly = Ay + w*cos(theta);
            const Ary = Ay - w*cos(theta);
            for( let x=max(0, Arx); x<=Blx; x++ ){
                const y0 = int(max( By - (x-Bx)*tanphi, Ary + (x-Arx)*tanth, 0 ));
                const yf = int(min( Ay - (x-Ax)*tanphi, Aly + (x-Alx)*tanth ));
                if (yf > 0) this.grid[x].fill(color, y0, yf);
            }
        }
        }catch(e){console.error(e); console.error(Ax, Ay, Bx, By)}
    }

    drawRoundedStroke(Ax, Ay, Bx, By, w, color=1){
        this.drawCircle(Ax, Ay, w/2, color);
        this.drawCircle(Bx, By, w/2, color);
        this.drawStroke(Ax, Ay, Bx, By, w, color);
    }
}


/****************************************************************************************/
/*                                      TRANSFORM                                       */
/****************************************************************************************/

class Transform {
    // Abstract Class representing a transformation on a Grid

    // multiplicity is the number of points a single point maps to
    multiplicity = 1;
    // weight is the surface area of the image of the unit square [0, 1]²
    weight = 1;

    apply_to_point(x, y){
        // Map the dot (x, y) into a list of dots represented as [x1, y1, x2, y2, ...] coordinates
        return [x, y];
    }

    apply_random(x, y){
        // Map the dot (x, y) to a single, random [xi, yi] pair from apply_to_point
        // This default implementation calls apply_to_point (likely calculating [xi, yi]'s that we will throw away)
        // and chooses a pair uniformly (only correct if the different composite images have the same surface transforming properties)
        const image = this.apply_to_point(x, y);
        const i = randInt(image.length/2)*2;
        return [image[i], image[i+1]];
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
        // multiplicity is sum of multiplicities
        this.multiplicity = transforms.reduce( (s, t) => s + t.multiplicity, 0 )
        // weight is sum of weights
        this.weight = transforms.reduce( (s, t) => s + t.weight, 0 )
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

    apply_random(x, y){
        const t = choose_weighted(this.transforms);
        return t.apply_random(x, y);
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
        // multiplicity is product of multiplicities
        this.multiplicity = transforms.reduce( (s, t) => s * t.multiplicity, 1 )
        // weight is product of weights 
        this.weight = transforms.reduce( (s, t) => s * t.weight, 1 )
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
        // Weight = abs(determinant)
        this.weight = abs(a * d - b * c) * this.multiplicity;
        // Matrices with negligible determinant still have a nonzero image due to pixels
        this.weight = max(1/1000, this.weight);
    }

    apply_to_point(x, y){
        const [a, b, c, d] = this.m;
        const out = new Uint16Array(2*this.multiplicity);
        let o = 0;
        const nx = a*x + b*y;
        const ny = c*x + d*y;
        const dxy = this.dxy;
        for( let i=0; i<dxy.length; i+=2 ){
            out[o++] = nx + dxy[i];
            out[o++] = ny + dxy[i+1];
        }
        return out;
    }

    apply_random(x, y){
        const [a, b, c, d] = this.m;
        const i = randInt(this.multiplicity)*2;
        return [ int(a*x + b*y + this.dxy[i]), int(c*x + d*y + this.dxy[i+1]) ];
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


/****************************************************************************************/
/*                                    PUT IT TO WORK                                    */
/****************************************************************************************/

const transforms = {
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

// Transform selector
var TRANSFORM;
function fill_transformation_selector(){
    var fracSelect = byId('trans-select');
    let html = [];
    for( let t in transforms )
        html.push( `<label><input type=radio name=trans value="${t}"> ${t.replace(/_/g, ' ')}</label>` )
    fracSelect.innerHTML += html.join('');
    fracSelect.onchange = e => TRANSFORM = transforms[e.target.value] 
}
fill_transformation_selector();
$('input[value=sierpinski_triangle][name=trans]').click();


// Drawing buttons
const drawing_buttons = {
    square: g => g.drawRectangle(1/4, 1/4, 1/2, 1/2),
    circle: g => g.drawCircle(0.5, 0.5, 0.25),
    speck: g => g.drawCircle(0.5, 0.5, 0.001),
    box_outline: g => {
        g.drawStroke(0, 0, 1, 0, 0.01);
        g.drawStroke(1, 0, 1, 1, 0.01);
        g.drawStroke(1, 1, 0, 1, 0.01);
        g.drawStroke(0, 1, 0, 0, 0.01);
    },
    path: g => {
        g.drawStroke(0, 0, 0.5, 1, 0.01);
        g.drawStroke(1, 0, 0.5, 1, 0.01);
    },
    R: g => {
        const w = 0.005;
        g.drawRoundedStroke(0.21, 0.14, 0.21, 0.79, w); // spine
        g.drawRoundedStroke(0.21, 0.79, 0.52, 0.79, w); // -
        g.drawRoundedStroke(0.52, 0.79, 0.73, 0.68, w); //  \
        g.drawRoundedStroke(0.73, 0.68, 0.73, 0.52, w); //   |
        g.drawRoundedStroke(0.73, 0.52, 0.52, 0.43, w); //  /
        g.drawRoundedStroke(0.52, 0.43, 0.21, 0.43, w); // -
        g.drawRoundedStroke(0.52, 0.43, 0.71, 0.14, w); //  \
    }
}

const buttonHolder = byId('drawing-buttons');
let clear = makeElem('button', 'clear', 'clear');
clear.onclick = () => { GRID = new Grid(); GRID.render() }
buttonHolder.appendChild(clear);
for( let t in drawing_buttons ){
    let butt = makeElem('button', '', t.replace('_', ' '));
    butt.onclick = () => { drawing_buttons[t](GRID); GRID.render() }
    buttonHolder.appendChild(butt);
}



// Drawing onto the grid directly
var DRAWSTATE = {
    drawing: false,
    size: 0.05,
    color: 1,
    x: 0, y: 0
}
byId('brushmode').onchange = e => DRAWSTATE.color = +e.target.value;
byId('brushsize').onchange = e => DRAWSTATE.size = e.target.value/1000;

CANVAS.onmousedown = function(e){
    if( e.button !== 0 ) return;
    DRAWSTATE.drawing = true;
    const x = e.offsetX, y = e.offsetY;
    const w = this.offsetWidth, h = this.offsetHeight;
    DRAWSTATE.x = x; DRAWSTATE.y = y;
    GRID.drawCircle(x/w, 1-y/h, DRAWSTATE.size, DRAWSTATE.color);
    GRID.render()
}
CANVAS.onmousemove = function(e){
    if( e.button !== 0 || !DRAWSTATE.drawing ) return;
    const x = e.offsetX, y = e.offsetY;
    const w = this.offsetWidth, h = this.offsetHeight;
    const dx = x - DRAWSTATE.x, dy = y - DRAWSTATE.y;
    DRAWSTATE.x = x; DRAWSTATE.y = y;
    if( sqrt(dx*dx+dy*dy) > GRID.gridRadius(DRAWSTATE.size)/4 )
        GRID.drawStroke((x-dx)/w, 1-(y-dy)/h, x/w, 1-y/h, DRAWSTATE.size*2, DRAWSTATE.color);
    GRID.drawCircle(x/w, 1-y/h, DRAWSTATE.size, DRAWSTATE.color);
    GRID.render()
}
document.addEventListener('mouseup', e => DRAWSTATE.drawing = false)


// Bind the main buttons to work
function step_and_render(){
    console.time('STEP');

    GRID = GRID.step(TRANSFORM);
    GRID.render();

    console.timeEnd('STEP');
}

function random_render(){
    console.time('RANDOM');

    GRID = new Grid();
    let nsteps = parseInt(byId('rand-steps').value);
    let [x, y] = [randInt(WIDTH), randInt(HEIGHT)];
    for( let i=0; i<nsteps; i++ ){
        [x, y] = TRANSFORM.apply_random(x, y);
        if( x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT )
            [x, y] = [randInt(WIDTH), randInt(HEIGHT)];
        GRID.grid[x][y] = 1;
    }
    GRID.render();

    console.timeEnd('RANDOM');
}

document.onkeypress = e => {
    if( e.key == 'Enter' && document.activeElement === document.body )
        step_and_render();
}

var GRID = new Grid();
drawing_buttons.circle(GRID);
GRID.render();