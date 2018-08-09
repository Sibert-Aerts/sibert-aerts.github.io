/////////////////////////////////////////
//              PixelGrid              //
/////////////////////////////////////////

class PixelGrid {
    // Width and height are the number of tiles
    constructor($canvas, width=1, height=1) {
        this.canvas = $canvas.get()[0];
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
    }

    reset(){
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    async outline(outlinecolor){
        let imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        let outlineData = this.ctx.createImageData(imageData);

        let w = this.width * 4;

        let isTransparent = (x, y) => imageData.data[y*w + x*4 + 3] == 0

        let setColor = (x, y, c) =>
            {outlineData.data[y*w + x*4 + 3] = 255; outlineData.data[y*w + x*4] = c.r; outlineData.data[y*w + x*4 + 1] = c.g; outlineData.data[y*w + x*4 + 2] = c.b}

        let getNeighbours = (x, y) => {
            let out = [];
            for(let dx = -1; dx <= 1; dx += 2)
                if(bounded(x+dx, 0, this.width-1))
                    out.push({x: x+dx, y: y});
            for(let dy = -1; dy <= 1; dy += 2)
                if(bounded(y+dy, 0, this.height-1))
                    out.push({x: x, y: y+dy});
            return out;
        }

        for(let x=0; x < this.width; x++)
            for(let y=0; y < this.height; y++)
                if(!isTransparent(x, y))
                    getNeighbours(x, y).forEach(o=>{if(isTransparent(o.x, o.y)) setColor(o.x, o.y, outlinecolor)});

        let outline = await createImageBitmap(outlineData);
        this.ctx.drawImage(outline, 0, 0);
    }

    async alias(p=0, forceColor){
        let imageData = this.ctx.getImageData(0, 0, this.width, this.height);

        let w = this.width * 4;
        let isTransparent = (x, y) => imageData.data[y*w + x*4 + 3] <= p;

        if (forceColor == null) {
            for(let x=0; x < this.width; x++)
                for(let y=0; y < this.height; y++)
                    if(!isTransparent(x, y))
                        imageData.data[y*w + x*4 + 3] = 255;
                    else
                        imageData.data[y*w + x*4 + 3] = 0;
        } else {
            for(let x=0; x < this.width; x++) {
                for(let y=0; y < this.height; y++) {
                    let offset = y*w + x*4;
                    if(!isTransparent(x, y)){
                        let t = (imageData.data[offset + 3] / 255 <= 0.2)? 0.6 : 1;
                        imageData.data[offset] = imageData.data[offset] * t + forceColor.r*(1-t);
                        imageData.data[offset + 1] = imageData.data[offset + 1] * t + forceColor.g*(1-t);
                        imageData.data[offset + 2] = imageData.data[offset + 2] * t + forceColor.b*(1-t);
                        imageData.data[offset + 3] = 255;
                    }
                    else
                        imageData.data[offset + 3] = 0;
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    drawRectangle(x, y, w, h, color){
        let ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    drawCircle(x, y, d, color){
        let ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, d, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    drawEllipse(x, y, a, w, h, color){
        let ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, a, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    drawLine(x1, y1, x2, y2, width, color){
        let ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    drawSpline(coords, width, color){
        let ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        
        ctx.save();
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(coords[0].x, coords[0].y);
        for(let i = 1; i < coords.length-1; i+=1){
            ctx.quadraticCurveTo(coords[i].x, coords[i].y, (coords[i].x + coords[i+1].x)/2, (coords[i].y + coords[i+1].y)/2)
        }
        let i = coords.length-1;
        ctx.lineTo(coords[i].x, coords[i].y)
        ctx.stroke();
        ctx.restore();
        
        if(DEBUG_SPLINES){
            ctx.beginPath();
            ctx.moveTo(coords[0].x, coords[0].y);
            for(let i = 1; i < coords.length; i+=1)
                ctx.lineTo(coords[i].x, coords[i].y)
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    drawPath(path, color){
        let ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.fill(path);
    }

    async drawGrid(grid, x=0, y=0){
        let img = await createImageBitmap(grid.ctx.getImageData(0, 0, grid.width, grid.height));
        this.ctx.drawImage(img, x, y);
    }
}