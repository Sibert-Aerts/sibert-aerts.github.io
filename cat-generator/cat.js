

///////////////////////////////////////////
//                 Joint                 //
///////////////////////////////////////////

Joint = function(x, y, a=0, parent=null){
    this.x = x;
    this.y = y;
    this.a = a;
    this.parent = parent;
    this.cachedTime = -1;
    this.cachedGet = null;
}

Joint.prototype.animation = function(t){
    return {x: 0, y: 0, a: 0};
}

Joint.prototype.get = function(t){
    if(this.cachedTime != t){
        this.cachedTime = t;
        this.cachedGet = this._get(t);
    }
    return this.cachedGet;
}

Joint.prototype._get = function(t){
    var anim = this.animation(t);
    var tx = this.x + anim.x;
    var ty = this.y + anim.y;
    var ta = this.a + anim.a;
    if(this.parent == null)
        return {x: tx, y: ty, a: ta};
    var p = this.parent.get(t);
    x = Math.cos(p.a) * tx - Math.sin(p.a) * ty;
    y = Math.sin(p.a) * tx + Math.cos(p.a) * ty;
    return {x: p.x + x, y: p.y + y, a: ta + p.a};
}


//////////////////////////////////////////
//              JointSpline             //
//////////////////////////////////////////

JointedSpline = function(joints){
    // `joints` is an array of either {x, y} objects (static joint)
    // or something that implements get(t) (dynamic joint = Joint)
    this.staticJoints = [];
    this.dynamicJoints = {};
    this.length = joints.length;
    for(var i=0; i < this.length; i++){
        if(joints[i] instanceof Joint){
            this.staticJoints.push(joints[i].get(0));
            this.dynamicJoints[i] = joints[i];
        } else
            this.staticJoints.push(joints[i]);
    }
}

JointedSpline.prototype.get = function(t){
    out = [];
    // room for some joint-bending here
    for(var i=0; i < this.length; i++){
        var dyn = this.dynamicJoints[i];
        if(dyn)
            out.push(dyn.get(t));
        else
            out.push(this.staticJoints[i]);
    }
    return out;
}


//////////////////////////////////////////
//                 Body                 //
//////////////////////////////////////////

Body = function(){
    this.joint = new Joint(35, 47);
    this.joint.animation = t => ({x: 0, y: Math.round(Math.cos(t/30)*2), a:0});
    this.length = randInt(26, 40);
    this.height = randInt(8, 20);
    var dx = this.length/2.7;
    var dy = this.height/2.7;
    this.tailJoint = new Joint(-dx, -dy, 0, this.joint);
    this.neckJoint = new Joint(dx, 0, 0, this.joint);
    this.backLegJoint = new Joint(-dx, dy - 5, 0, this.joint);
    this.frontLegJoint = new Joint(dx - 8, dy - 5, 0, this.joint);
}

Body.prototype.draw = async function(grid, t){
    j = this.joint.get(t);
    grid.drawEllipse(j.x, j.y, j.a, this.length/2, this.height/2, 'white');
}

//////////////////////////////////////////
//                 Head                 //
//////////////////////////////////////////

Head = function(size){
    this.joint = new Joint(randInt(45, 55), randInt(30, 40));
    this.size = randInt(1, 4) + randInt(2, 4) + randInt(1, 4);
}

Head.prototype.draw = async function(grid, t){
    j = this.joint.get(t);
    await grid.drawCircle(j.x, j.y, this.size, 'white');
}

//////////////////////////////////////////
//                 Face                 //
//////////////////////////////////////////

Face = function(head, joint=null){
    this.joint = joint || head.joint;
    var eyeCount = randInt(0, 2) + randInt(0, 2) + randInt(0, 2) + randInt(0, 2);
    if(chance(0.7)) eyeCount = 2;
    this.eyes = []
    var tryCount = 50;
    var yMin = Math.round(3-head.size);
    var xMax = Math.round(head.size/2);
    while(tryCount && eyeCount > this.eyes.length){
        tryCount--;
        if(eyeCount - this.eyes.length == 1 || chance(0.3)){
            var y = randInt(yMin, 0);
            var s = chance(0.4 + (eyeCount**0.6)/10) ? 1 : chance(0.6)? 1.25 : 1.6;
            if(this.eyes.filter(e=>Math.abs(e.joint.x)-e.size-s<1&&Math.abs(e.joint.y-y)-e.size-s<1).length) 
                continue;
            this.eyes.push(new Eye(new Joint(0, y, 0, this.joint), s));
        } else {
            var x = randInt(3, xMax);
            var y = randInt(yMin, 0);
            var s = chance(0.5 + (eyeCount**0.6)/10) ? 1 : 1.25;
            if(this.eyes.filter(e=>Math.abs(e.joint.x-x)-e.size-s<1&&Math.abs(e.joint.y-y)-e.size-s<1).length) 
                continue;
            this.eyes.push(new Eye(new Joint(x, y, 0, this.joint), s));
            this.eyes.push(new Eye(new Joint(-x, y, 0, this.joint), s));
        }
    }
    this.eyeGrid = null;
}

Face.prototype.draw = async function(grid, t){
    j = this.joint.get(t);
    if(this.eyeGrid == null)
        this.eyeGrid = new PixelGrid($('<canvas>'), grid.width, grid.height);

    // Eyes
    this.eyeGrid.reset();
    for(var i=0; i < this.eyes.length; i++)
        this.eyes[i].draw(this.eyeGrid, t);
    this.eyeGrid.alias();
    grid.drawGrid(this.eyeGrid);
    
    //   Mouth
    grid.drawLine(j.x, j.y+3, j.x-2, j.y+5, 1, 'black');
    grid.drawLine(j.x, j.y+3, j.x+2, j.y+5, 1, 'black');
}

//////////////////////////////////////////
//                 Eye                  //
//////////////////////////////////////////

Eye = function(joint, size){
    this.joint = joint;
    this.size = size;
}

Eye.prototype.draw = function(grid, t){
    var j = this.joint.get(t);
    var x = Math.round(j.x);
    var y = Math.round(j.y);
    if(t%150 > 4){
        grid.drawCircle(x, y, this.size, '#000');
        grid.drawRectangle(x-1, y-1, 1, 1, '#655');
        grid.drawRectangle(x, y, 1, 1, '#300');
    } else {
        grid.drawLine(x-2, y + 0.5, x+2, y+0.5, 1, 'black');
    }
}

//////////////////////////////////////////
//                 Ears                 //
//////////////////////////////////////////

// Function to make a Path2D equilateral upwards-oriented triangle
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

Ears = function(head){
    this.joint = head.joint;
    var w = randInt(5, head.size-3);
    var h = randInt(5, 10);
    this.leftEar  = makeEar( 3, 2 - head.size, w, h);
    this.rightEar = makeEar(-3, 2 - head.size, w, h);
}

Ears.prototype.draw = async function(grid, t){
    var j = this.joint.get(t)
    grid.ctx.translate(j.x, j.y);
    grid.drawPath(this.leftEar, 'white');
    grid.drawPath(this.rightEar, 'white');
    grid.ctx.resetTransform();
}


//////////////////////////////////////////
//                 Tail                 //
//////////////////////////////////////////

Tail = function(tailJoint, jointCount=10){
    this.width = randInt(1, 5);
    var length = randInt(20, 40);
    // this.width = 1;
    var joints = [tailJoint];
    var prevJoint = tailJoint;
    var phase = randFloat(0, 3);

    for(var i=0; i<jointCount; i++){
        let joint = new Joint(0, -length/jointCount, randFloat(-0.3, 0.3), prevJoint);
        let bendiness = (randInt(0, 40) * Math.sin(phase + i*6/jointCount) * (i+1)**0.5)/(jointCount**2);
        joint.animation = t=>({x:0,y:0, a: roundNearest(Math.cos(t/30), 0.2)*bendiness})
        joints.push(joint);
        prevJoint = joint;
    }
    this.tip = prevJoint;
    let bendiness = (randInt(20, 40) * Math.sin(phase))/(jointCount**2);
    tailJoint.animation = t=>({x:0,y:0, a: roundNearest(Math.cos(t/30), 0.2)*bendiness})
    this.spline = new JointedSpline(joints);
}

Tail.prototype.draw = async function(grid, t){
    spline = this.spline.get(t);
    grid.drawSpline(spline, this.width, 'white');
}


//////////////////////////////////////////
//                 Neck                 //
//////////////////////////////////////////

Neck = function(neckJoint, headJoint, width, jointCount=2){
    this.width = width;
    var hj = headJoint.get(0);
    var joints = [neckJoint];
    for(var i=0; i<jointCount; i++)
        joints.push({x: randInt(45, hj.x), y: randInt(50, hj.y)})
    joints.push(headJoint);
    this.spline = new JointedSpline(joints);
}

Neck.prototype.draw = async function(grid, t){
    spline = this.spline.get(t);
    grid.drawSpline(spline, this.width, 'white');
}


//////////////////////////////////////////
//                 Leg                  //
//////////////////////////////////////////

Leg = function(hip, length, jointCount, width, footXOffset=0){
    this.width = width;

    var h = hip.get(0);
    this.hip = hip;
    this.foot = new Joint(h.x + randInt(-10, 10) + footXOffset, h.y + length - width/2);

    var joints = [hip];
    for(var i=0; i<jointCount; i++)
        joints.push({x: h.x + randInt(-10, 10), y: randInt(h.y+10, h.y+length-10)})
    joints.push(this.foot);
    this.spline = new JointedSpline(joints);
}

Leg.prototype.draw = async function(grid, t, color, dx=0){
    spline = this.spline.get(t);
    grid.ctx.translate(dx, 0);
    grid.drawSpline(spline, this.width, color);
    grid.ctx.resetTransform();
}


//////////////////////////////////////////
//                 Cat                  //
//////////////////////////////////////////

Cat = function(grid){
    this.grid = grid;
    this.frame = 0;
    this.alive = true;
    
    this.front = new PixelGrid($('<canvas>'), this.grid.width, this.grid.height + 40);
    this.back = new PixelGrid($('<canvas>'), this.grid.width, this.grid.height + 40);

    // Body
    this.body = new Body();
    this.bl = this.body.length;
    this.bh = this.body.height;

    // Legs
    var legLength = randInt(10, 40);
    var backThick = randInt(1, 6);
    var frontThick = randInt(1, 6);
    this.backLeg  = new Leg(this.body.backLegJoint,  legLength, 2, backThick);
    this.frontLeg = new Leg(this.body.frontLegJoint, legLength, 1, frontThick, 4);

    this.yOffset = Math.round(80 - this.backLeg.foot.get(0).y - backThick/2 - 1);

    // Head
    this.head = new Head();
    this.hj = this.head.joint.get(0);

    // Neck
    this.neck = new Neck(this.body.neckJoint, this.head.joint, this.head.size*2-5, 0);

    // Face
    this.face = new Face(this.head);

    // Ears
    this.ears = new Ears(this.head);

    // Tail
    this.tail = new Tail(this.body.tailJoint);
    this.tt = this.tail.tip.get(0);
}

Cat.prototype.animate = function(){
    this.paused = false;
    this.frameID = window.requestAnimationFrame(this.frameLoop.bind(this));
}

Cat.prototype.stop = function(){
    this.paused = true;
    cancelAnimationFrame(this.frameID);
}

Cat.prototype.pause_unpause = function(){
    if (this.paused) this.animate();
    else this.stop();
}

Cat.prototype.drawFrame = async function(){
    this.front.reset();
    this.back.reset();
    var front = this.front;
    var back = this.back;
    var t = this.frame;
    // Body
    // if(DEBUG_ANIM_MODE == "default"){
    //     this.body.joint.y = 47 + roundNearest(Math.sin(t/20)*1, 1);
    // } else if(DEBUG_ANIM_MODE == "spin"){
    //     this.body.joint.a = roundNearest(Math.cos(t/50)*2, 0.2);
    //     this.body.joint.x = 35 + roundNearest(Math.cos(t/30)*10, 1);
    //     this.body.joint.y = 47 + roundNearest(Math.sin(t/30)*10, 1);
    // } else if(DEBUG_ANIM_MODE == "keke"){
    //     this.body.joint.y = 47 + roundNearest(Math.sin(t/8)*10, 1);
    //     this.body.height = roundNearest(this.bh * (Math.sin(t/8 + 3.14)*0.5 + 1), 1);
    //     this.body.length = this.bl + roundNearest(Math.sqrt(this.bl) * (Math.sin(t/8) + 1.2), 1);
    // }
    await this.body.draw(front, t);
    
    // Legs
    this.backLeg.draw(front, t, 'white');
    this.backLeg.draw(back, t, 'gray', 8);
    this.frontLeg.draw(front, t, 'white');
    this.frontLeg.draw(back, t, 'gray', 8);
    
    // neck
    await this.neck.draw(front, t);

    // head
    // if(DEBUG_ANIM_MODE == "default"){
    //     this.head.joint.y = this.hj.y + roundNearest(Math.sin(t/20-0.4)*3, 1);
    // } else if(DEBUG_ANIM_MODE == "spin"){
    //     this.head.joint.a = roundNearest(Math.cos(t/50)*2, 0.2);
    //     this.head.joint.x = this.hj.x + roundNearest(Math.cos(t/40)*16 + 12, 1);
    //     this.head.joint.y = this.hj.y + roundNearest(Math.sin(t/20)*16 + 12, 1);
    // } else if(DEBUG_ANIM_MODE == "keke"){
    //     this.head.joint.y = this.hj.y + roundNearest(Math.sin(t/8-0.2)*10, 1);
    // }
    await this.head.draw(front ,t);
    
    // Ears
    await this.ears.draw(front, t);
    
    // Face
    await this.face.draw(front, t);

    // Tail
    await this.tail.draw(front, t);
    
    var black = {r:0,g:0,b:0};
    
    if(DEBUG_ALIAS){
        front.alias(0, black);
        back.alias(0, black);
    }
    if(DEBUG_OUTLINE){
        await front.outline(black);
        await back.outline(black);
    }

    await this.grid.reset();
    this.grid.ctx.translate(10, this.yOffset);
    if(DEBUG_BACK)
        await this.grid.drawGrid(back);
    if(DEBUG_FRONT)
        await this.grid.drawGrid(front);
    this.grid.ctx.resetTransform();
}

Cat.prototype.frameLoop = function(){
    this.drawFrame();
    this.frame++;
    this.frameID = window.requestAnimationFrame(this.frameLoop.bind(this));
}