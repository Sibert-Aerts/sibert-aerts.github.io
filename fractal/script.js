
const int = Math.floor;
const chance = (x, y=1) => Math.random() * y < x;
const randInt = a => int( Math.random()*a );
const byId = i => document.getElementById(i);
const $ = s => document.querySelector(s);

const canvas = document.querySelector('#screen');
const width  = +canvas.width;
const height = +canvas.height;
const ctx = canvas.getContext('2d');

function newGrid(){
    let grid = new Array(width);
    for(i=0;i<width;i++) grid[i] = new Array(height).fill(false);
    return grid;
}
            
function clear(){
    ctx.clearRect(0, 0, width, height);
}
        
function renderGrid( grid ){
    clear();
    let id = ctx.getImageData(0, 0, width, height);
    let pixels = id.data;
    let i = 0; // i = (y*height + x)*4
    for(let y=0; y<width; y++){
        for(let x=0; x<height; x++){
            if( grid[x][y] ) pixels[i+3]=255;
            i += 4;
        }
    }
    ctx.putImageData(id, 0, 0)
}

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
    let square = newGrid();
    for(let i=int(width/4); i<int(3*width/4); i++)
        for(let j=int(height/4); j<int(3*height/4); j++)
            square[i][j] = true;
    return square;
});
// Draw an empty square
const getEmptySquare = makeGetter(function(){
    let empty = newGrid();
    for(let x=0; x<width; x++)
        empty[x][0] = empty[x][height-1] = true;
    for(let y=0; y<height; y++)
        empty[0][y] = empty[width-1][y] = true;
    return empty;
});
// Draw a circle
const getCircle = makeGetter(function(){
    let circle = newGrid();
    let rsq = Math.pow((height/4), 2);
    for( let y=0; y<height; y++ ){
        let D = rsq - Math.pow(y-height/2, 2);
        if( D < 0 ) continue;
        let sqD = Math.sqrt( D );
        for( let x=int(width/2-sqD); x<=int(width/2+sqD); x++ )
            circle[x][y] = true;
    }
    return circle;
});

const transforms = {
    sierpinski_square: (x, y) => [
        [ int(x/2), int(y/2) ],
        [ int(x/2 + width/2), int(y/2) ],
        [ int(x/2), int(y/2 + height/2) ] 
    ],

    square: (x, y) => [
        [ int(x/2), int(y/2) ],
        [ int(x/2 + width/2), int(y/2) ],
        [ int(x/2), int(y/2 + height/2) ],
        [ int(x/2 + width/2), int(y/2 + height/2) ]
    ],

    square_3x3: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + width/3), x2 = int(x/3 + 2*width/3);
        let y0 = int(y/3), y1 = int(y/3 + height/3), y2 = int(y/3 + 2*height/3);
        return [
            [ x0, y0 ], [ x1, y0 ], [ x2, y0 ],
            [ x0, y1 ],	[ x1, y1 ], [ x2, y1 ],
            [ x0, y2 ], [ x1, y2 ], [ x2, y2 ],
        ]
    },

    sponge: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + width/3), x2 = int(x/3 + 2*width/3);
        let y0 = int(y/3), y1 = int(y/3 + height/3), y2 = int(y/3 + 2*height/3);
        return [
            [ x0, y0 ], [ x1, y0 ], [ x2, y0 ],
            [ x0, y1 ],				[ x2, y1 ],
            [ x0, y2 ], [ x1, y2 ], [ x2, y2 ],
        ]
    },

    sierpinski_triangle: (x, y) => [
        [ int(x/2 + width/4), int(y/2) ],
        [ int(x/2), int(y/2 + height/2) ],
        [ int(x/2 + width/2), int(y/2 + height/2) ]
    ],

    triangle: (x, y) => [
        [ int(x/2 + width/4), int(y/2) ],
        [ int(x/2), int(y/2 + height/2) ],
        [ int(x/2) + width/2, int(y/2 + height/2) ],
        [ int(x/2 + width/4), int((height - y)/2 + height/2) ]
    ],

    flower: (x, y) => {
        let x0 = int(x/3), x1 = int(x/3 + width/3), x2 = int(x/3 + 2*width/3);
        let y0 = int(y/3), y1 = int(y/3 + height/3), y2 = int(y/3 + 2*height/3);
        return [
                        [ x1, y0 ],
            [ x0, y1 ],				[ x2, y1 ],
                        [ x1, y2 ],
        ]
    },

    hexagon_flower: (x, y) => {
        let x0 = int(x/3 + width/6), x1 = int(x/3 + width/2);
        let y0 = int(y/3), y1 = int(y/3 + height/3), y2 = int(y/3 + 2*height/3);
        return [
                    [ x0, y0 ], [ x1, y0 ],
            [ int(x/3), y1 ],	    [ int(x/3+2*width/3), y1 ],
                    [ x0, y2 ], [ x1, y2 ],
        ]
    },
}

var fracSelect = byId('frac-select');
var TRANSFORM;
for( let t in transforms )
    fracSelect.innerHTML += `<label><input type="radio" name="frac" value="${t}"> ${t.replace('_', ' ')}</label>`
fracSelect.onchange = e => TRANSFORM = transforms[e.target.value] 
$('input[value=sierpinski_triangle]').click();

$('button[target=clear]').onclick = ()=>{ grid = newGrid(); renderGrid(grid) };
$('button[target=dot]').onclick = ()=>{ grid = newGrid(); grid[int(width/2)][int(height/2)] = true; renderGrid(grid) };
$('button[target=square]').onclick = ()=>{ grid = getSquare(); renderGrid(grid) };
$('button[target=esquare]').onclick = ()=>{ grid = getEmptySquare(); renderGrid(grid) };
$('button[target=circle]').onclick = ()=>{ grid = getCircle(); renderGrid(grid) };

function step( grid ){
    let nuGrid = newGrid();
    for(let x=0; x<width; x++)
        for(let y=0; y<height; y++)
            if( grid[x][y] )
                for( let [px, py] of TRANSFORM(x, y) )
                    if( 0 <= px && px < width && 0 <= py && py < height )
                        nuGrid[px][py] = 1;
    return nuGrid;
}

function step_and_render(){
    grid = step(grid);
    renderGrid(grid);
}

const random_sierpinski =  [
    (x, y) => [ int(x/2 + width/4), int(y/2) ],
    (x, y) => [ int(x/2), int(y/2 + height/2) ],
    (x, y) => [ int(x/2 + width/2), int(y/2 + height/2) ]
]

function random_render(){
    grid = newGrid();
    let nsteps = parseInt(byId('rand-steps').value);
    let [x, y] = [randInt(width), randInt(height)];
    for( let i=0; i<nsteps; i++ ){
        [x, y] = random_sierpinski[randInt(3)](x, y);
        grid[x][y] = true;
    }
    renderGrid(grid);
}

document.onkeypress = e => {
    if( e.key == 'Enter' )
        step_and_render();
}

let grid = getSquare();
renderGrid(grid);
        
