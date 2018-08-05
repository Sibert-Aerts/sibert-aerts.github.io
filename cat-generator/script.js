///////////////////////////////////////////
//                 Ready                 //
///////////////////////////////////////////

DEBUG_ALIAS = true;
DEBUG_OUTLINE = true;
DEBUG_SPLINES = false;
DEBUG_ANIM_MODE = "default";
DEBUG_FRONT = true;
DEBUG_BACK = true;

$(document).ready(function(){
    catGen = new CatManager($('#cat-container'), 100, 80);
    $('#reset-button').click(_=>catGen.newCat());
    $('#prev-button').click(_=>catGen.selectCat(catGen.cats.length-2));
    $('#pause-button').click(_=>catGen.currentCat.pause_unpause());
    // debug buttons


    $('#alias-button').click(_=>DEBUG_ALIAS^=true);
    $('#outline-button').click(_=>DEBUG_OUTLINE^=true);
    $('#front-button').click(_=>DEBUG_FRONT^=true);
    $('#back-button').click(_=>DEBUG_BACK^=true);
    $('#spline-button').click(_=>DEBUG_SPLINES^=true);
    
    const redraw_cat = ()=>catGen.currentCat.drawFrame();
    
    $('#alias-button').click(redraw_cat);
    $('#outline-button').click(redraw_cat);
    $('#front-button').click(redraw_cat);
    $('#back-button').click(redraw_cat);
    $('#spline-button').click(redraw_cat);
    // $('button#anim-default').click(_=>DEBUG_ANIM_MODE='default');
    // $('button#anim-spin').click(_=>DEBUG_ANIM_MODE='spin');
    // $('button#anim-keke').click(_=>DEBUG_ANIM_MODE='keke');
});


//////////////////////////////////////////
//              CatManager              //
//////////////////////////////////////////

CatManager = function($cont, width=1, height=1){
    this.grid = new PixelGrid($cont, width, height);
    this.cats = [];
    this.currentCat = -1;
    this.newCat();
}

CatManager.prototype.selectCat = function(i){
    if(this.currentCat != -1) this.currentCat.stop();
    this.currentCat = this.cats[i];
    this.grid.reset();
    this.currentCat.animate(this.grid);
}

CatManager.prototype.newCat = async function(){
    var newCat = new Cat(this.grid);
    this.cats.push(newCat);
    this.selectCat(this.cats.length-1);
}