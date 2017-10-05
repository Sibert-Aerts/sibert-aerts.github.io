///////////////////////////////////////////
//                 Ready                 //
///////////////////////////////////////////

$(document).ready(function(){
    catGen = new CatGenerator($('#cat-container'), 100, 80);
    $('#reset-button').click(catGen.reset.bind(catGen));
    $('#kill-button').click(catGen.kill.bind(catGen));
});


/////////////////////////////////////////
//              PixelGrid              //
/////////////////////////////////////////

// Width and height are the number of tiles
PixelGrid = function($canvas, width=1, height=1){
    this.canvas = $canvas.get()[0];
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.width = width;
    this.height = height;
}

PixelGrid.prototype.reset = function(){
    this.ctx.clearRect(0, 0, this.width, this.height);
}

PixelGrid.prototype.outline = async function(outlinecolor){
    var imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    var outlineData = this.ctx.createImageData(imageData);

    var w = this.width * 4;

    var isTransparent = (x, y) => imageData.data[y*w + x*4 + 3] == 0

    var setColor = (x, y, c) =>
        {outlineData.data[y*w + x*4 + 3] = 255; outlineData.data[y*w + x*4] = c.r; outlineData.data[y*w + x*4 + 1] = c.g; outlineData.data[y*w + x*4 + 2] = c.b}

    var getNeighbours = (x, y) => {
        out = [];
        for(var dx = -1; dx <= 1; dx += 2)
            if(bounded(x+dx, 0, this.width-1))
                out.push({x: x+dx, y: y});
        for(var dy = -1; dy <= 1; dy += 2)
            if(bounded(y+dy, 0, this.height-1))
                out.push({x: x, y: y+dy});
        return out;
    }

    for(var x=0; x < this.width; x++)
        for(var y=0; y < this.height; y++)
            if(!isTransparent(x, y))
                getNeighbours(x, y).forEach(o=>{if(isTransparent(o.x, o.y)) setColor(o.x, o.y, outlinecolor)});

    var outline = await createImageBitmap(outlineData);
    this.ctx.drawImage(outline, 0, 0);
}

PixelGrid.prototype.alias = async function(p=0){
    var imageData = this.ctx.getImageData(0, 0, this.width, this.height);

    var w = this.width * 4;
    var isTransparent = (x, y) => imageData.data[y*w + x*4 + 3] <= p;

    for(var x=0; x < this.width; x++)
        for(var y=0; y < this.height; y++)
            if(!isTransparent(x, y))
                imageData.data[y*w + x*4 + 3] = 255;
            else
                imageData.data[y*w + x*4 + 3] = 0;

    this.ctx.putImageData(imageData, 0, 0);
}

PixelGrid.prototype.drawRectangle = function(x, y, w, h, color){
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
}

PixelGrid.prototype.drawCircle = async function(x, y, d, color){
    var temp = new PixelGrid($('<canvas>'), this.width, this.height);
    temp.ctx.fillStyle = color;
    temp.ctx.beginPath();
    temp.ctx.arc(x, y, d, 0, Math.PI * 2, true);
    temp.ctx.closePath();
    temp.ctx.fill();
    temp.alias();
    var img = await createImageBitmap(temp.ctx.getImageData(0, 0, this.width, this.height));
    this.ctx.drawImage(img, 0, 0);
}

PixelGrid.prototype.drawLine = function(x1, y1, x2, y2, width, color){
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
}

PixelGrid.prototype.drawSpline = function(coords, width, color){
    if(coords.length%2){console.log('ATTEMPTED DRAWSPLINE WITH ODD COORDS!!!!!!');return}
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    
    this.ctx.beginPath();
    this.ctx.moveTo(coords[0], coords[1]);
    for(var i = 2; i < coords.length-2; i+=2){
        this.ctx.quadraticCurveTo(coords[i], coords[i+1], (coords[i] + coords[i+2])/2, (coords[i+1] + coords[i+3])/2)
    }
    var i = coords.length-2;
    this.ctx.quadraticCurveTo(coords[i], coords[i+1], coords[i], coords[i+1])
    this.ctx.stroke();
}

PixelGrid.prototype.drawPath = function(path, color){
    this.ctx.fillStyle = color;
    this.ctx.fill(path);
}

PixelGrid.prototype.drawGrid = async function(grid, x=0, y=0){
    var img = await createImageBitmap(grid.ctx.getImageData(0, 0, grid.width, grid.height));
    this.ctx.drawImage(img, x, y);
}

//////////////////////////////////////////
//                 Cat                  //
//////////////////////////////////////////

Cat = function(grid){
    this.grid = grid;
    this.frame = 0;
    this.alive = true;

    // Legs
    this.legLength = randInt(15,25);
    this.backThick = randInt(2, 4);
    this.frontThick = randInt(2, 4);

    this.backLeftLeg = [30,50];
    for(var i=0;i<2;i++){
        this.backLeftLeg.push(randInt(20, 40));
        this.backLeftLeg.push(randInt(60, 40 + this.legLength))
    }
    this.backLeftLeg.push(randInt(20, 40));
    this.backLeftLeg.push(50 + this.legLength - this.backThick);

    this.backRightLeg = this.backLeftLeg.slice();
    for(var i=0;i<this.backRightLeg.length;i+=2) this.backRightLeg[i]-=8;

    this.frontLeftLeg = [50,50];
    for(var i=0;i<1;i++){
        this.frontLeftLeg.push(randInt(42, 52));
        this.frontLeftLeg.push(randInt(60, 40 + this.legLength))
    }
    this.frontLeftLeg.push(randInt(46, 60));
    this.frontLeftLeg.push(50 + this.legLength - this.frontThick);
    
    this.frontRightLeg = this.frontLeftLeg.slice();
    for(var i=0;i<this.frontRightLeg.length;i+=2) this.frontRightLeg[i]-=8;

    // Head
    this.headSize = randInt(6, 10);
    this.headX = randInt(45, 55);
    this.headY = randInt(30, 40);

    // Neck
    this.neck = [42, 45];
    for(var i=0;i<1;i++){
        this.neck.push(randInt(45, this.headX)); this.neck.push(randInt(50, this.headY))
    }
    this.neck.push(this.headX); this.neck.push(this.headY);

    // Ears
    var makeEar = (x, y, w, h) => {
        var ear = new Path2D();
        var dx = Math.ceil(w/2);
        var i = w/2==dx?0:1;
        ear.moveTo(x-dx, y);
        ear.lineTo(x, y-h);
        ear.lineTo(x, y);
        ear.closePath()
        ear.moveTo(x-i, y-h);
        ear.lineTo(x+dx-i, y);
        ear.lineTo(x-i, y);
        return ear;
    }
    var w = randInt(6, this.headSize-3);
    var h = randInt(5, 12);
    this.rightEar = makeEar(this.headX - 3, this.headY + 2 - this.headSize, w, h);
    this.leftEar = makeEar(this.headX + 3, this.headY + 2 - this.headSize, w, h);

    // Tail
    this.tail = [22,42];
    for(var i=0;i<2;i++){
        this.tail.push(randInt(10,30)); this.tail.push(randInt(20,40))
    }
    
    this.tail2 = [22,42];
    for(var i=0;i<2;i++){
        this.tail2.push(randInt(10,30)); this.tail2.push(randInt(20,40))
    }
}

Cat.prototype.animate = async function(){
    // I don't think $('<canvas>') is what should be used here?
    var front = new PixelGrid($('<canvas>'), this.grid.width, this.grid.height);
    var back = new PixelGrid($('<canvas>'), this.grid.width, this.grid.height);
    var i = this.frame;

    // Legs
    back.drawSpline(this.backLeftLeg, this.backThick, 'gray');
    front.drawSpline(this.backRightLeg, this.backThick, 'white');
    back.drawSpline(this.frontLeftLeg, this.frontThick, 'gray');
    front.drawSpline(this.frontRightLeg, this.frontThick, 'white');

    // Body
    front.drawRectangle(20, 40, 30, 15, 'white');
    
    // neck
    front.drawSpline(this.neck, this.headSize*2-5, 'white');

    // head
    await front.drawCircle(this.headX, this.headY, this.headSize, 'white');
    
    // Face
    //   Eyes
    if(i%150 > 4){
        await front.drawCircle(this.headX - 3, this.headY, 1, 'black');
        await front.drawCircle(this.headX + 3, this.headY, 1, 'black');
    } else {
        front.drawLine(this.headX - 5, this.headY + 0.5, this.headX - 1, this.headY + 0.5, 1, 'black');
        front.drawLine(this.headX + 1, this.headY + 0.5, this.headX + 5, this.headY + 0.5, 1, 'black');
    }
    //   Mouth
    front.drawLine(this.headX, this.headY + 3, this.headX - 2, this.headY + 5, 1, 'black');
    front.drawLine(this.headX, this.headY + 3, this.headX + 2, this.headY + 5, 1, 'black');

    // ears
    front.drawPath(this.leftEar, 'white');
    front.drawPath(this.rightEar, 'white');

    // Tail
    var p = roundNearest(Math.sin(i/10)*0.5+0.5, 0.2);
    front.drawSpline(arrInterp(this.tail, this.tail2, p), 3, 'white');
    
    front.alias();
    back.alias();
    var black = {r:0,g:0,b:0};
    await front.outline(black);
    await back.outline(black);

    await this.grid.reset();
    await this.grid.drawGrid(back);
    await this.grid.drawGrid(front);

    this.frame++;
    if(this.alive)
        window.requestAnimationFrame(this.animate.bind(this));
}

//////////////////////////////////////////
//             CatGenerator             //
//////////////////////////////////////////

CatGenerator = function($cont, width=1, height=1){
    this.grid = new PixelGrid($cont, width, height);
    this.initialize();
}

CatGenerator.prototype.kill = function(){
    this.cat.alive = false;
}

CatGenerator.prototype.reset = function(){
    this.grid.reset();
    this.cat.alive = false;
    this.initialize();
}

CatGenerator.prototype.initialize = async function(){
    this.cat = new Cat(this.grid);
    window.requestAnimationFrame(this.cat.animate.bind(this.cat));
    return;
}