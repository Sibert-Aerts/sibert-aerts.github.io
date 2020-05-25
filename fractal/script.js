'use strict';

// Useful aliases
const int = Math.floor;
const byId = document.getElementById.bind(document);
const $ = document.querySelectorAll.bind(document);
const makeElem = (name, className, text) => { const e = document.createElement(name); if(className) e.className = className; if(text) e.textContent = text; return e };
const sessionGet = window.sessionStorage.getItem.bind(window.sessionStorage);
const sessionSet = window.sessionStorage.setItem.bind(window.sessionStorage);
const localGet = window.localStorage.getItem.bind(window.localStorage);
const localSet = window.localStorage.setItem.bind(window.localStorage);

// Useful functions
const chance = (x, y=1) => Math.random()*y < x;
const randInt = a => int( Math.random()*a );
const mod = (x, m) => ((x%m)+m%m);
const { abs, max, min, sin, cos, tan, cot, atan2, sqrt, log, PI } = Math;
function choose_weighted( items ){
    const sum = items.reduce( (s, i)=>s+i.weight, 0);
    let pick = Math.random()*sum;
    for(let i=0; i<items.length; i++)
        if( pick < items[i].weight ) return items[i]
        else pick -= items[i].weight;
}
const floatFormat = (x, n) => x.toFixed(n).replace(/\.?0+$/, '' ).replace(/^-0$/, '0')

// Useful methods
CanvasRenderingContext2D.prototype.clear = function(){ this.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT) }
HTMLElement.prototype.makeChild = function(name, className, text){ const e = makeElem(name, className, text); this.appendChild(e); return e };

// Useful globals
const CANVAS = byId('screen');
const CANVASWIDTH = +CANVAS.width;
const CANVASHEIGHT = +CANVAS.height;
const PIXELFACTOR = 2;
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

    copy() {
        let copy = new Grid(this.width, this.height, this.pixelFactor);
        for( let x=0; x<this.width; x++ )
            copy.grid[x].set(this.grid[x]);
        return copy;
    }

    overlay(other) {
        if( this.width !== other.width || this.height !== other.height || this.pixelFactor !== other.pixelFactor )
            throw 'Overlaying non-matching grids!'
        const tg = this.grid, og = other.grid;
        for( let x=0; x<this.width; x++ )
            for( let y=0; y<this.height; y++ )
                tg[x][y] += og[x][y]
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

    drawArc(cx, cy, r, w, start=0, angle=PI*2, color=1){
        angle = min(angle, PI*2);
        const iter = int(72 * angle/PI*2);
        const dphi = angle/iter;
        let prevx = cos(start-dphi)*r+cx, prevy = sin(start-dphi)*r+cy;
        for( let i=0; i<iter; i++ ){
            let x = cos(start+i*dphi)*r+cx, y = sin(start+i*dphi)*r+cy;
            this.drawRoundedStroke(prevx, prevy, x, y, w, color);
            prevx = x; prevy = y;
        }
    }
}


/****************************************************************************************/
/*                                      TRANSFORM                                       */
/****************************************************************************************/

class Transform {
    // Abstract Class representing a transformation on a Grid

    // multiplicity is the number of points a single point maps to, i.e. number of sub-transforms
    multiplicity = 1;
    // weight is the surface area of the image of the unit square [0, 1]² (not accounting for overlap)
    weight = 1;
    // convergence ratio is L ∈ ℝ so that for each sub-transform T: ∀p, q ∈ [0, 1]²: d(T(p), T(q)) ≤ L  d(p, q)
    // This needs to be < 1 else the fractal will not converge
    convergence_ratio = 1;

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

    get_formula(){
        // Get a formulaic representation of the transform as an HTML string
        return '';
    }

    get_stats(){
        // Get some interesting information about the transform as an HTML string
        const con = this.convergence_ratio;
        const steps = Math.ceil(-log(WIDTH)/log(con));
        return `<b>Point factor:</b> 1 point maps to ${this.multiplicity}` + 
            `<br><b>Surface factor:</b> 1 to ${floatFormat(this.weight, 3)} <span style=opacity:0.6>(assuming no overlap)</span>` +
            `<br><b>Convergence factor:</b> ${floatFormat(con, 3)}` + 
            `<br><b>Approx. # of steps to converge:</b> ${( steps >= 0 && steps < 1e10 ) ? steps : 'Never'}`
    }

    add_boxes(rectangles){
        // Add one or more shapes visualising the transform's effect on the unit square
        return;
    }
}

class FunctionTransform extends Transform {
    // Wraps a function (x, y) => [x1, y1, ...] into a transform (unused)
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
        // convergence_ratio is the max of convergence_ratios
        this.convergence_ratio = max(...transforms.map( t => t.convergence_ratio ))
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

    get_formula(){
        return this.transforms.map( x => x.get_formula() ).join('<div class=big>AND</div>')
    }

    add_boxes(rectangles){
        for(let t of this.transforms)
            t.add_boxes(rectangles)
    }

    serialize(){
        return {type: 'group', transforms: this.transforms.map(t => t.serialize())};
    }
}

class TransformChain extends Transform {
    // Class representing several Transforms applied one after the other (i.e. a composition of Transforms)
    // WARNING: Untested and unused
    constructor( ...transforms ){
        super();
        this.transforms = transforms;
        // multiplicity is product of multiplicities
        this.multiplicity = transforms.reduce( (s, t) => s * t.multiplicity, 1 )
        // weight is product of weights 
        this.weight = transforms.reduce( (p, t) => p * t.weight, 1 )
        // convergence ratio is product of convergence ratios
        this.convergence_ratio = transforms.reduce( (p, t) => p * t.convergence_ratio, 1 )
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
        this.odxy = dxy.slice();
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
        // Convergence ratio is the 2-norm, AKA largest norm of the square of an eigenvalue of AᵀA
        const apd = a*a + b*b + c*c + d*d;
        const D = apd*apd - 4*(a*d-b*c)*(a*d-b*c);
        if( D >= 0 )
            this.convergence_ratio = sqrt( max( abs(-apd + sqrt(D))/2, abs(-apd - sqrt(D))/2 ) );
        else
            this.convergence_ratio = sqrt(abs(sqrt(apd*apd-D)/2));
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

    get_formula(){
        const [a, b, c, d] = this.m.map( x => floatFormat(x, 3) );
        const matrix = `<table class=matrix><tr><td>${a}</td><td>${b}</td></tr><tr><td>${c}</td><td>${d}</td></tr></table>`;
        const xy = `<table class=matrix><tr><td class=x-var>x</td></tr><tr><td class=y-var>y</td></tr></table>`;
        let dxy = [];
        for( let i=0; i<this.dxy.length; i+= 2)
            dxy.push( `<table class=matrix><tr><td>${floatFormat(this.odxy[i], 3)}</td></tr><tr><td>${floatFormat(this.odxy[i+1], 3)}</td></tr></table>` )
        return matrix + ' × ' + xy + ' + ' + dxy.join(' and ');
    }

    add_boxes(rectangles){
        let [a, b, c, d] = this.m;
        for( let i=0; i<this.multiplicity; i++ ){
            const box = rectangles.makeChild('div', 'rectangle', 'R');
            const tx = this.odxy[2*i] * rectangles.offsetWidth;
            // ty negative because Y points down in CSS
            const ty = -this.odxy[2*i+1] * rectangles.offsetHeight;
            // No that is not a typo, CSS expects the matrix indices in a different order than we have them
            // additionally, b and c are negative due to the inverted Y axis in CSS
            box.style.transform = `matrix(${a}, ${-c}, ${-b}, ${d}, ${tx}, ${ty})`;
        }
    }

    make_form(customTransform){
        const form = makeElem('form', 'custom-matrix');
        const [a, b, c, d] = this.m;
        form.innerHTML = `
            <table class=matrix>
                <tr><td><input type=text size=1 target=a value=${floatFormat(a, 4)}></td><td><input type=text size=1 target=b value=${floatFormat(b, 4)}></td></tr>
                <tr><td><input type=text size=1 target=c value=${floatFormat(c, 4)}></td><td><input type=text size=1 target=d value=${floatFormat(d, 4)}></td></tr>
            </table>
            ×
            <table class=matrix>
                <tr></td><td class=x-var>x</td></tr>
                <tr></td><td class=y-var>y</td></tr>
            </table>
            +
        `;

        function append_dxy(tx, ty){
            const wrap = dxysWrapper.makeChild('div', 'dxy');
            const dxy = wrap.makeChild('table', 'matrix');
            dxy.innerHTML = `
                <tr></td><td><input type=text size=1 value=${floatFormat(tx, 4)}></td></tr>
                <tr></td><td><input type=text size=1 value=${floatFormat(ty, 4)}></td></tr>
            `;

            // button to delete the dxy
            const del_dxy = wrap.makeChild('button', 'del-dxy tiny red', '×');
            del_dxy.type = 'button';
            del_dxy.onclick = () => { dxysWrapper.removeChild(wrap); customTransform.update(); };
            del_dxy.makeChild('div', 'tooltip', 'Remove this offset').style.left = '-60px';
            return dxy;
        }

        // Load up dxy's
        const dxysWrapper = form.makeChild('span', 'dxy-wrapper');
        for( let i=0; i<this.dxy.length; i+=2 )
            append_dxy(this.odxy[i], this.odxy[i+1]);

        // Button to add more dxy's
        const add_dxy = form.makeChild('button', 'add-dxy tiny important', '+');
        add_dxy.type = 'button'
        add_dxy.onclick = () => { append_dxy(0, 0); customTransform.update() }
        add_dxy.makeChild('div', 'tooltip', 'Add offset').style.left = '-40px';

        // Hook up the parser
        form.parse_transform = function(){
            const [a, b, c, d, ...dxy] = [...this.elements].filter(e => e.nodeName === 'INPUT').map(e => parseFloat(e.value));
            return new MatrixTransform(a, b, c, d, dxy);
        }
        return form;
    }

    serialize(){
        const [a, b, c, d] = this.m;
        return {type: 'matrix', a, b, c, d, dxy: this.odxy};
    }
}

class ScalarTransform extends MatrixTransform {
    // Special case matrix transform
    constructor(s, dxy){
        super(s, 0, 0, s, dxy);
        this.s = s;
    }
    get_formula(){
        const matrix = floatFormat(this.s, 3);
        const xy = `<table class=matrix><tr><td class=x-var>x</td></tr><tr><td class=y-var>y</td></tr></table>`;
        const dxy = [];
        for( let i=0; i<this.dxy.length; i+= 2)
            dxy.push( `<table class=matrix><tr><td>${floatFormat(this.odxy[i], 3)}</td></tr><tr><td>${floatFormat(this.odxy[i+1], 3)}</td></tr></table>` )
        return matrix + ' × ' + xy + ' + ' + dxy.join(' and ');
    }
}

class ScaleThenRotateTransform extends MatrixTransform {
    // Class representing the transformation of scaling the x and y coordinates by individual factors,
    // then rotating `r` degrees counter-clockwise, all assuming (0.5, 0.5) as the center of transformation.
    constructor(fx, fy, r, txy){
        r = mod(r, 360);
        let c, s;
        // Handle the right angles as special cases because even tiny rounding errors are extremely visible there
        if     ( r === 0   ) [c, s] = [ 1, 0]
        else if( r === 90  ) [c, s] = [ 0, 1]
        else if( r === 180 ) [c, s] = [-1, 0]
        else if( r === 270 ) [c, s] = [ 0,-1]
        else [c, s] = [Math.cos(r*PI/180), Math.sin(r*PI/180)]
        // Correct for the center of scaling AND rotation being (0.5, 0.5) instead of (0, 0)
        const dxy = txy.slice();
        const dx = (1 - fx * c + fy * s) * 0.5;
        const dy = (1 - fx * s - fy * c) * 0.5;
        for( let i=0; i<dxy.length; i+=2 ){
            dxy[i] += dx; dxy[i+1] += dy;
        }
        // Matrix:
        //  ( fx*c  -fx*s )
        //  ( fy*s   fy*c )
        super( fx*c, -fy*s, fx*s, fy*c, dxy );
        this.fx = fx;
        this.fy = fy;
        this.r = r;
        this.txy = txy;
    }
    
    get_formula(){
        let matrix = `
            <table class=matrix>
                <tr><td>${floatFormat(this.fx, 3)} × <span class=x-var>x</span></td></tr>
                <tr><td>${floatFormat(this.fy, 3)} × <span class=y-var>y</span></td></tr>
            </table>
        `;
        
        matrix += ` × rotate ${floatFormat(this.r, 3)}° `

        let txy = [];
        
        for( let i=0; i<this.txy.length; i+= 2)
            txy.push( `<table class=matrix><tr><td>${floatFormat(this.txy[i], 3)}</td></tr><tr><td>${floatFormat(this.txy[i+1], 3)}</td></tr></table>` )

        return matrix + ' + ' + txy.join(' and ');
    }

    add_boxes(rectangles){
        for( let i=0; i<this.multiplicity; i++ ){
            const box = makeElem('div', 'rectangle STR', 'R');
            const tx = this.txy[2*i] * rectangles.offsetWidth;
            // ty negative because Y points down in CSS
            const ty = -this.txy[2*i+1] * rectangles.offsetHeight;
            box.style.transformOrigin = 'center';
            // r is negative because CSS turns clockwise like an idiot
            box.style.transform = `translate(${tx}px, ${ty}px) rotate(${-this.r}deg) scale(${this.fx}, ${this.fy})`;
            rectangles.appendChild(box);
        }
    }

    make_form(customTransform){
        const form = makeElem('form', 'custom-STR');
        form.innerHTML = `
            <table class=matrix>
                <tr><td><input type=text size=1 value=${floatFormat(this.fx, 4)}> × <span class=x-var>x</span></td></tr>
                <tr><td><input type=text size=1 value=${floatFormat(this.fy, 4)}> × <span class=y-var>y</span></td></tr>
            </table>
            ×
            rotate <input type=text size=1 value=${floatFormat(this.r, 4)}> ° 
            +
        `;
    

        function append_txy(tx, ty){
            const wrap = txysWrapper.makeChild('div', 'dxy');
            const dxy = wrap.makeChild('table', 'matrix');
            dxy.innerHTML = `
                <tr></td><td><input type=text size=1 value=${floatFormat(tx, 4)}></td></tr>
                <tr></td><td><input type=text size=1 value=${floatFormat(ty, 4)}></td></tr>
            `;

            // button to delete the dxy
            const del_txy = wrap.makeChild('button', 'del-dxy tiny red', '×');
            del_txy.type = 'button';
            del_txy.onclick = () => { txysWrapper.removeChild(wrap); customTransform.update(); };
            del_txy.makeChild('div', 'tooltip', 'Remove this offset').style.left = '-60px';
            return dxy;
        }

        // Load up txy's
        const txysWrapper = form.makeChild('span', 'dxy-wrapper');
        for( let i=0; i<this.txy.length; i+=2 )
            append_txy(this.txy[i], this.txy[i+1]);

        // Button to add more dxy's
        const add_txy = form.makeChild('button', 'add-dxy tiny important', '+');
        add_txy.type = 'button'
        add_txy.onclick = () => { append_txy(0, 0); customTransform.update() }
        add_txy.makeChild('div', 'tooltip', 'Add offset').style.left = '-40px';

        // Hook up the parser
        form.parse_transform = function(){
            const [fx, fy, r, ...txy] = [...this.elements].filter(e => e.nodeName === 'INPUT').map(e => parseFloat(e.value));
            return new ScaleThenRotateTransform(fx, fy, r, txy);
        }
        return form;
    }

    serialize(){
        return {type: 'STR', fx: this.fx, fy: this.fy, r: this.r, txy: this.txy};
    }
}


// META OBJECT FOR MANAGING CUSTOM TRANSFORMS

const CUSTOMTRANSFORMS = new Map();
CUSTOMTRANSFORMS.active = null;
CUSTOMTRANSFORMS.highest_id = 0;
CUSTOMTRANSFORMS.save = function(){
    localSet('customTransforms', JSON.stringify(Array.from(this.keys())));
}
// The active transform is stored in session, but custom transform's id's are reset on refresh
// so just for the ability to know which custom transform was active, we have to map old id's to new id's as we load them in.
const PREVIOUS_SESSION_ID_MAP = new Map();

class CustomTransform {
    // Class representing a custom transform editable through HTML.
    // Currently only represents MatrixTransforms and TransformGroups of MatrixTransforms, but that's all we really need...

    constructor(name, transform, id){
        // Creates a new CustomTransform and registers it in CUSTOMTRANSFORMS
        this.name = name;
        this.id = (CUSTOMTRANSFORMS.highest_id++).toString();
        this.identifier = 'CUSTOM_TRANSFORM_' + this.id;
        this.transform = transform;
        
        // Register as custom transform
        CUSTOMTRANSFORMS.set(this.id, this);
        CUSTOMTRANSFORMS.save();

        // Add to transform dropdown menu
        this.option = makeElem('option', 'custom', name);
        this.option.value = this.identifier;
        transSelect.appendChild(this.option);
    }

    set_name(name){
        this.name = name;
        this.option.innerText = name;
        this.save();
    }

    delete(){
        // Remove the CustomTransform completely
        CUSTOMTRANSFORMS.delete(this.id);
        CUSTOMTRANSFORMS.save();        
        localStorage.removeItem(this.identifier);

        // Remove it from the dropdown and select the previous transform
        let sibling = this.option.previousSibling;
        while( sibling.disabled || sibling.value === 'NEW_CUSTOM' ) sibling = sibling.previousSibling;
        sibling.selected = true;
        transSelect.removeChild(this.option);
        transSelect.onchange();
    }
    
    static load_all(){
        // Load all CustomTransforms from local storage and register them in CUSTOMTRANSFORMS
        const ids = JSON.parse( localGet('customTransforms') ) || [];
        for( let id of ids ){
            try {
                const obj = JSON.parse(localGet('CUSTOM_TRANSFORM_' + id));
                let custom = new CustomTransform(obj.name, CustomTransform.deserialize(obj.transform));
                PREVIOUS_SESSION_ID_MAP.set('CUSTOM_TRANSFORM_' + id, custom.identifier);
            } catch(e) {
                console.error(`ERROR trying to parse CUSTOM_TRANSFORM_${id}:`, e)
            }
        }
    }

    activate(){
        // Called when the CustomTransform is selected from the dropdown menu.

        $('[for=native]').forEach(e => e.hidden = true);
        $('[for=textify]').forEach(e => e.hidden = true);
        $('[for=custom]').forEach(e => e.hidden = false);
        byId('custom-name').value = this.name;
        customForms.innerHTML = '';

        if( this.transform instanceof TransformGroup )
            for( let t of this.transform.transforms )
                this.add_form(t);
        else
            this.add_form(this.transform);

        CUSTOMTRANSFORMS.active = this;
        this.update();
    }

    add_form(transform){
        const wrap = customForms.makeChild('div');
        const form = transform.make_form(this);
        wrap.appendChild(form);
        form.onchange = this.update.bind(this);
    
        const duplicate = wrap.makeChild('button', 'small yellow', '↷');
        duplicate.type = 'button';
        duplicate.style.marginLeft = '10px'; duplicate.style.lineHeight = '1.1em';
        duplicate.onclick = () => this.add_form( form.parse_transform() );
        duplicate.makeChild('div', 'tooltip', 'Duplicate entire component');
    
        const remove = wrap.makeChild('button', 'small red', '×');
        remove.type = 'button';
        remove.onclick = () => { customForms.removeChild(wrap); this.update.bind(this)(); };
        remove.makeChild('div', 'tooltip', 'Remove entire component');
    
        this.update();
    }

    save(){
        localSet(this.identifier, JSON.stringify( {name: this.name, transform: TRANSFORM.serialize()} ) )
    }

    update(){
        //// Called whenever this CustomTransform is selected and the form is edited in some way.

        // Read the HTML forms to reconstruct the entire Transform object.
        const transforms = [...customForms.children].map( m => m.children[0].parse_transform() );
        this.transform = TRANSFORM = new TransformGroup(...transforms);

        // Update the information boxes
        transInfo.innerHTML = TRANSFORM.get_stats();
        rectangles.innerHTML = '';
        TRANSFORM.add_boxes(rectangles);

        // Save it to local storage
        this.save();
    }

    static deserialize(obj){
        if( obj.type === 'group' )
            return new TransformGroup( ...obj.transforms.map( t => CustomTransform.deserialize(t) ) );
        if( obj.type === 'matrix' )
            return new MatrixTransform( obj.a, obj.b, obj.c, obj.d, obj.dxy )
        if( obj.type === 'STR' )
            return new ScaleThenRotateTransform( obj.fx, obj.fy, obj.r, obj.txy )
        throw `ERROR: INVALID TRANSFORM TYPE "${obj.type}"!`;
    }
    
}

/****************************************************************************************/
/*                                    PUT IT TO WORK                                    */
/****************************************************************************************/

var GRID = new Grid();

const SEPARATOR = new Object();
const NEW_CUSTOM = new Object();
const TRANSFORMS = {
    TRIANGULAR: SEPARATOR,
    sierpinski_triangle: new ScalarTransform(0.5, [0, 0,  0.5, 0,  1/4, 0.5]),
    'sierpinski_triangle?': new ScalarTransform(0.5, [0, 0,  0.5, 0,  1/4, 0.5, 1/4, 1/6]),
    triangle: new TransformGroup(
        new ScalarTransform(0.5, [0, 0,  0.5, 0,  1/4, 0.5]),
        new ScaleThenRotateTransform(0.5, -0.5, 0, [0, -0.25] )
    ),
    SQUARE: SEPARATOR,
    sierpinski_carpet: new ScalarTransform(1/3,
        [0, 0,   1/3, 0,   2/3, 0,
         0, 1/3,           2/3, 1/3,
         0, 2/3, 1/3, 2/3, 2/3, 2/3]),
    squares_within_squares: new TransformGroup(
        new ScalarTransform(1/3, [0, 0, 2/3, 0, 0, 2/3, 2/3, 2/3]),
        new ScaleThenRotateTransform(Math.SQRT1_2, Math.SQRT1_2, 45, [0, 0])
    ),
    space_filling_curve: new TransformGroup(
        new ScaleThenRotateTransform(0.5, 0.5,   0, [-0.25, +0.25,  +0.25, +0.25]),
        new ScaleThenRotateTransform(-0.5, 0.5,  90, [+0.25, -0.25]),
        new ScaleThenRotateTransform(-0.5, 0.5, -90, [-0.25, -0.25])
    ),
    symmetric_space_filling_curve: new TransformGroup(
        new MatrixTransform(-0.5, 0, 0, 0.5, [0.5, 0.5]),
        new MatrixTransform( 0.5, 0, 0, 0.5, [0.5, 0.5]),
        new ScaleThenRotateTransform(-0.5, 0.5,  90, [+0.25, -0.25]),
        new ScaleThenRotateTransform(0.5, 0.5, -90, [-0.25, -0.25])
    ),
    space_filling_diagonal: new TransformGroup(
        new ScalarTransform(1/3, [0, 0, 0, 2/3, 2/3, 0, 2/3, 2/3]),
        new ScaleThenRotateTransform(1/3, 1/3,  90, [-1/3, 0, 1/3, 0]),
        new ScaleThenRotateTransform(1/3, 1/3,  -90, [0, 1/3, 0, -1/3]),
        new ScaleThenRotateTransform(1/3, 1/3,  180, [0, 0])
    ),
    HEXAGONAL: SEPARATOR,
    hollow_snowflake: new ScalarTransform( 1/3, 
        [1/6, 0.0455, 1/2, 0.0455, 1/6, 0.866*2/3+0.0455, 1/2, 0.866*2/3+0.0455, 0, 0.866*1/3+0.0455, 2/3, 0.866*1/3+0.0455]
    ),
    snowflake: new TransformGroup(
        new ScalarTransform( 1/3, [1/6, 0.0455, 1/2, 0.0455, 1/6, 0.866*2/3+0.0455, 1/2, 0.866*2/3+0.0455, 0, 0.866*1/3+0.0455, 2/3, 0.866*1/3+0.0455]),
        new ScaleThenRotateTransform( 2/3*0.866, 2/3*0.866, 30, [0, 0])
    ),
    spiral_triangle: new TransformGroup(
        new ScalarTransform( 1/3, [1/2, 0.0455, 1/2, 0.866*2/3+0.0455, 0, 0.866*1/3+0.0455]),
        new ScaleThenRotateTransform( 2/3*0.866, 2/3*0.866, 30, [0, 0])
    ),
    OTHER: SEPARATOR,
    fern: new TransformGroup(
        new ScaleThenRotateTransform(0.01, 0.5,  0, [0,    -0.25]),
        new ScaleThenRotateTransform(0.8, 0.8, -10, [0,      0.1]),
        new ScaleThenRotateTransform(0.4, 0.4, -35, [0.15,  -0.2]),
        new ScaleThenRotateTransform(-0.5, 0.5, 45, [-0.18, -0.2])
    ),
    shrub: new TransformGroup(
        new ScaleThenRotateTransform( 0.8, 0.8,  5, [0, 0.1] ),
        new ScaleThenRotateTransform( 0.4, 0.4, 30, [-0.25, -0.2] ),
        new ScaleThenRotateTransform( 0.4, 0.4, -30, [0.25, -0.18] ),
        new ScaleThenRotateTransform( 0.25, 0.25, 10, [0, -0.35] ),
    ),
    spiral: new TransformGroup(
        new ScaleThenRotateTransform( 0.96, 0.96, 10, [0, 0] ),
        new ScaleThenRotateTransform( 0.15, 0.15, 160, [-0.4, 0] )
    ),
    dragon: new MatrixTransform(0.5, -0.5, 0.5, 0.5, [0.3, 0, 0.7, 0] ),
    POINTIES: SEPARATOR,
    pointy: new TransformGroup(
        new ScalarTransform(0.5, [0.25, 0, 0.25, 0.5]),
        new ScaleThenRotateTransform(0.4, 0.4, 45, [-0.2*Math.SQRT1_2, 0.2*Math.SQRT1_2]),
        new ScaleThenRotateTransform(0.4, 0.4, -45, [0.2*Math.SQRT1_2, 0.2*Math.SQRT1_2])
    ),
    pointier: new TransformGroup(
        new ScalarTransform(0.5, [0.25, 0, 0.25, 0.5]),
        new ScaleThenRotateTransform(0.4, 0.4, 45, [-0.2*Math.SQRT1_2, 0]),
        new ScaleThenRotateTransform(0.4, 0.4, -45, [0.2*Math.SQRT1_2, 0])
    ),
    pointiest: new TransformGroup(
        new ScalarTransform(0.5, [0.25, 0, 0.25, 0.5]),
        new ScaleThenRotateTransform(0.4, 0.4, 45, [-0.2*Math.SQRT1_2, -0.2*Math.SQRT1_2]),
        new ScaleThenRotateTransform(0.4, 0.4, -45, [0.2*Math.SQRT1_2, -0.2*Math.SQRT1_2])
    ),
    CUSTOM: SEPARATOR
}

//// Transform selection and management
var TRANSFORM;
const transSelect = byId('transform-select');
const customForms = byId('custom-transforms');
const customTransformBox = byId('custom-transform-box');
const transFormula = byId('transform-formula');
const transInfo = byId('transform-info');
const rectangles = byId('rectangles');
{
    // Add selection items
    let html = [];
    for( let t in TRANSFORMS )
        if( TRANSFORMS[t] === SEPARATOR ) html.push( `<option disabled>${t.replace(/_/g, ' ')}</option>` )
        else html.push( `<option value="${t}">${t.replace(/_/g, ' ')}</option>`)
    html.push( `<option value=NEW_CUSTOM class=new-custom> + NEW CUSTOM TRANSFORM</option>` )
    transSelect.innerHTML = html.join('');

    // Hook up transform selection
    transSelect.onchange = function(){
        sessionSet('selectedTransform', this.value);

        if( this.value === 'NEW_CUSTOM' ){
            const newCustom = new CustomTransform('CUSTOM TRANSFORM ' + CUSTOMTRANSFORMS.highest_id, new MatrixTransform(1, 0, 0, 1, [0, 0]));
            this.value = newCustom.identifier;
            this.onchange();
            return;
        }
        if( this.value.startsWith('CUSTOM_TRANSFORM_') ){
            CUSTOMTRANSFORMS.get( this.value.slice(17) ).activate();
            return;
        }
        
        // Activate the native (non-custom) transform
        $('[for=native]').forEach(e => e.hidden = false);
        $('[for=textify]').forEach(e => e.hidden = true);
        $('[for=custom]').forEach(e => e.hidden = true);
        CUSTOMTRANSFORMS.active = null;        
        TRANSFORM = TRANSFORMS[this.value];
        // SHOW INFORMATIONS
        transFormula.innerHTML = TRANSFORM.get_formula();
        transInfo.innerHTML = TRANSFORM.get_stats();
        rectangles.innerHTML = '';
        TRANSFORM.add_boxes(rectangles);
    }

    byId('custom-name').onchange = function(){
        CUSTOMTRANSFORMS.active.set_name(this.value);
    }
    
    // Deserialize stored custom transforms
    CustomTransform.load_all();
    // Activate the transform that was active the previous session
    // (i.e. keep the same transform active even when refreshing the page)
    let selected = sessionGet('selectedTransform');
    if( PREVIOUS_SESSION_ID_MAP.has(selected) )
        selected = PREVIOUS_SESSION_ID_MAP.get(selected);
    else if ( !TRANSFORMS.hasOwnProperty(selected) )
        selected = 'sierpinski_triangle';
    transSelect.value = selected;
    transSelect.onchange()
}

function edit_current(){
    const name = transSelect.options[transSelect.selectedIndex].innerText + ' EDIT';
    const edit = new CustomTransform(name, TRANSFORM);
    transSelect.value = edit.identifier;
    transSelect.onchange()
}

const textify_target = byId('textify-target');
function textify_current(){
    $('[for=native]').forEach(e => e.hidden = true);
    $('[for=textify]').forEach(e => e.hidden = false);
    $('[for=custom]').forEach(e => e.hidden = true);
    textify_target.value = JSON.stringify({name: CUSTOMTRANSFORMS.active.name, transform: TRANSFORM.serialize()});
}
function untextify_current(){
    let obj = JSON.parse(textify_target.value);
    let ct = CUSTOMTRANSFORMS.active;
    ct.set_name(obj.name);
    ct.transform = CustomTransform.deserialize(obj.transform);
    ct.save();
    ct.activate();
}
function textify_cancel(){
    $('[for=textify]').forEach(e => e.hidden = true);
    $('[for=custom]').forEach(e => e.hidden = false);
}

function delete_current(){
    CUSTOMTRANSFORMS.active.delete();
}

function add_custom_STR(){
    CUSTOMTRANSFORMS.active.add_form(new ScaleThenRotateTransform(1, 1, 0, [0, 0]));
}

function add_custom_matrix(){
    CUSTOMTRANSFORMS.active.add_form(new MatrixTransform(1, 0, 0, 1, [0, 0]));
}


//// Drawing buttons

const drawing_buttons = {
    fill: g => g.drawRectangle(0, 0, 1, 1),
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
        const w = 0.01;
        g.drawRoundedStroke(0.21, 0.14, 0.21, 0.79, w); // spine
        g.drawRoundedStroke(0.21, 0.79, 0.52, 0.79, w); // -
        g.drawRoundedStroke(0.52, 0.79, 0.73, 0.68, w); //  \
        g.drawRoundedStroke(0.73, 0.68, 0.73, 0.52, w); //   |
        g.drawRoundedStroke(0.73, 0.52, 0.52, 0.43, w); //  /
        g.drawRoundedStroke(0.52, 0.43, 0.21, 0.43, w); // -
        g.drawRoundedStroke(0.52, 0.43, 0.71, 0.14, w); //  \
    },
    '😉': g => {
        g.drawArc(0.5, 0.5, 0.4, 0.02, 0, PI*2); // head
        g.drawArc(0.5, 0.5, 0.3, 0.02, PI, PI);  // smile
        g.drawArc(0.65, 0.6, 0.1, 0.02, 0, PI);  // wink
        g.drawCircle(0.35, 0.64, 0.06); // left eye
        g.drawCircle(0.2, 0.5, 0.025); // left cheek
        g.drawCircle(0.8, 0.5, 0.025); // right cheek
    }
}

{
    const buttonHolder = byId('drawing-buttons');
    // Clear button
    let clear = makeElem('button', 'important', 'clear');
    clear.onclick = () => { GRID = new Grid(); GRID.render() }
    buttonHolder.appendChild(clear);
    // Drawing buttons
    for( let t in drawing_buttons ){
        let butt = makeElem('button', '', t.replace('_', ' '));
        butt.onclick = () => { drawing_buttons[t](GRID); GRID.render() }
        buttonHolder.appendChild(butt);
    }
    // SAVE/LOAD drawing buttons
    let save = makeElem('button', 'important', 'save');
    let load = makeElem('button', 'important', 'load');
    let SAVEDGRID;
    save.onclick = () => SAVEDGRID = GRID.copy();
    load.onclick = () => { if( SAVEDGRID ) { GRID.overlay(SAVEDGRID); GRID.render(); } }
    buttonHolder.appendChild(save);
    buttonHolder.appendChild(load);
}



// Drawing onto the grid directly
var DRAWSTATE = {
    drawing: false,
    size: 0.05,
    pixelSize: 90,
    color: 1,
    x: 0, y: 0
}
const brushCircle = byId('brush-circle');
byId('brushmode').onchange = e => DRAWSTATE.color = +e.target.value;
byId('brushsize').onchange = e => {
    DRAWSTATE.size = byId('brushsize').value/1000;
    DRAWSTATE.pixelSize = GRID.gridRadius(DRAWSTATE.size);
    brushCircle.style.width = brushCircle.style.height = DRAWSTATE.pixelSize+1 + 'px';
}
byId('brushsize').onchange();

CANVAS.onmousedown = function(e){
    if( e.button !== 0 ) return;
    DRAWSTATE.drawing = true;
    brushCircle.classList.add('drawing');
    const x = e.offsetX, y = e.offsetY;
    const w = this.offsetWidth, h = this.offsetHeight;
    DRAWSTATE.x = x; DRAWSTATE.y = y;
    GRID.drawCircle(x/w, 1-y/h, DRAWSTATE.size, DRAWSTATE.color);
    GRID.render()
}
CANVAS.onmousemove = function(e){
    const x = e.offsetX, y = e.offsetY;
    // Move the cursor
    brushCircle.style.left = int(x - DRAWSTATE.pixelSize/2) + 'px';
    brushCircle.style.top = int(y - DRAWSTATE.pixelSize/2) + 'px';
    if( e.button !== 0 || !DRAWSTATE.drawing ) return;

    // Draw the line connecting this spot to the previous spot if needed
    const w = this.offsetWidth, h = this.offsetHeight;
    const dx = x - DRAWSTATE.x, dy = y - DRAWSTATE.y;
    DRAWSTATE.x = x; DRAWSTATE.y = y;
    if( sqrt(dx*dx+dy*dy) > GRID.gridRadius(DRAWSTATE.size)/4 )
        GRID.drawStroke((x-dx)/w, 1-(y-dy)/h, x/w, 1-y/h, DRAWSTATE.size*2, DRAWSTATE.color);
    GRID.drawCircle(x/w, 1-y/h, DRAWSTATE.size, DRAWSTATE.color);
    GRID.render()
}
document.addEventListener('mouseup', e => { DRAWSTATE.drawing = false; brushCircle.classList.remove('drawing'); })


// Bind the main buttons to work
function step_and_render(){
    console.time('STEP');

    GRID = GRID.step(TRANSFORM);
    GRID.render();

    console.timeEnd('STEP');
}

byId('rand-steps').value = sessionGet('randSteps') || 100000;

function random_render(){
    console.time('RANDOM');

    let steps = parseInt(byId('rand-steps').value);
    if( Number.isNaN(steps) || steps < 1 ) throw 'ERROR: Please specify a valid number of steps.'
    sessionSet('randSteps', steps);
    const grid = GRID.grid;

    while( steps ) {        
        let [x, y] = [randInt(WIDTH), randInt(HEIGHT)];
        
        if( !byId('draw-uncertain').checked ){
            // Before drawing anything, try to reach the attractor first by reducing the possible error to less than one dot.
            const con = TRANSFORM.convergence_ratio;
            const uncertainSteps = Math.ceil((log(Math.SQRT2)-log(WIDTH))/log(con));
            if( uncertainSteps < 0 || uncertainSteps >= steps ){
                console.log('No certain steps.'); break;
            }

            for( let i=0; i<min(steps, uncertainSteps); i++ )
                [x, y] = TRANSFORM.apply_random(x, y);

            steps -= uncertainSteps;
        }

        for( let i=0; i<steps; i++ ){
            [x, y] = TRANSFORM.apply_random(x, y);
            if( x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT ){
                // If we accidentally leave the unit square, start over again (but subtract the steps we already did...)
                steps -= i; continue;
            }
            grid[x][y] = 1;
        }

        break;
    }

    GRID.render();
    console.timeEnd('RANDOM');
}

document.onkeypress = e => {
    if( e.key == 'Enter' && document.activeElement === document.body )
        step_and_render();
}

// Start the basic grid.

drawing_buttons.circle(GRID);
GRID.render();