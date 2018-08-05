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

PixelGrid.prototype.alias = async function(p=0, forceColor){
    var imageData = this.ctx.getImageData(0, 0, this.width, this.height);

    var w = this.width * 4;
    var isTransparent = (x, y) => imageData.data[y*w + x*4 + 3] <= p;

    if(forceColor == null){
        for(var x=0; x < this.width; x++)
            for(var y=0; y < this.height; y++)
                if(!isTransparent(x, y))
                    imageData.data[y*w + x*4 + 3] = 255;
                else
                    imageData.data[y*w + x*4 + 3] = 0;
    } else {
        for(var x=0; x < this.width; x++)
            for(var y=0; y < this.height; y++){
                var offset = y*w + x*4;
                if(!isTransparent(x, y)){
                    var t = (imageData.data[offset + 3] / 255 <= 0.2)? 0.6 : 1;
                    imageData.data[offset] = imageData.data[offset] * t + forceColor.r*(1-t);
                    imageData.data[offset + 1] = imageData.data[offset + 1] * t + forceColor.g*(1-t);
                    imageData.data[offset + 2] = imageData.data[offset + 2] * t + forceColor.b*(1-t);
                    imageData.data[offset + 3] = 255;
                }
                else
                    imageData.data[offset + 3] = 0;
            }
    }

    this.ctx.putImageData(imageData, 0, 0);
}

PixelGrid.prototype.drawRectangle = function(x, y, w, h, color){
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
}

PixelGrid.prototype.drawCircle = function(x, y, d, color){
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, d, 0, Math.PI * 2, true);
    this.ctx.closePath();
    this.ctx.fill();
}

PixelGrid.prototype.drawEllipse = function(x, y, a, w, h, color){
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, w, h, a, 0, Math.PI * 2, true);
    this.ctx.closePath();
    this.ctx.fill();
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
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.moveTo(coords[0].x, coords[0].y);
    for(var i = 1; i < coords.length-1; i+=1){
        this.ctx.quadraticCurveTo(coords[i].x, coords[i].y, (coords[i].x + coords[i+1].x)/2, (coords[i].y + coords[i+1].y)/2)
    }
    var i = coords.length-1;
    this.ctx.lineTo(coords[i].x, coords[i].y)
    this.ctx.stroke();
    this.ctx.restore();
    
    if(DEBUG_SPLINES){
        this.ctx.beginPath();
        this.ctx.moveTo(coords[0].x, coords[0].y);
        for(var i = 1; i < coords.length; i+=1)
            this.ctx.lineTo(coords[i].x, coords[i].y)
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
    }
}

PixelGrid.prototype.drawPath = function(path, color){
    this.ctx.fillStyle = color;
    this.ctx.fill(path);
}

PixelGrid.prototype.drawGrid = async function(grid, x=0, y=0){
    var img = await createImageBitmap(grid.ctx.getImageData(0, 0, grid.width, grid.height));
    this.ctx.drawImage(img, x, y);
}
