// TINY FUNCTIONS
var byId = i => document.getElementById(i);
var makeElem = x => document.createElement(x);
var makeText = x => document.createTextNode(x);
var removeChildren = x => { while (x.lastChild) x.removeChild(x.lastChild) };
var has = (x, y) => x.hasOwnProperty(y);
var chooseIndex = l => Math.floor(Math.random() * l.length);
var choose = l => l[chooseIndex(l)];

// TINY GLOBALS
var pic = byId('picture');
var picName = byId('pic-name');
var descBox = byId('desc');
var spinner = byId('spinner');
var spindle = byId('spindle');
let navContainer = byId('nav-container');
var loading = true;

// IMPORTANT, DIRTY, DIRTY GLOBALS
var months;
var months_dict;
var m = 0;
var updateAnchor;
var ZOOMED = false;

// CLASS FOR STORING A MONTH WORTH OF PICTURES
class Month {
    constructor (name, dir){
        this.name = name;
        this.dir = dir;
        this.images = [];
        this.images_dict = {};
        this.current = null;
        this.built = false;
    }

    add (name, desc, status={}){
        for (let prop of ['SPOILER', 'COMIC', 'SPECIAL', 'DIGITAL', 'BLOOD', 'SQUID', 'GIRLS'])
            if (!has(status, prop)) status[prop] = false;
        status.DESC = (desc !== undefined && desc !== '');

        // READ THE FILE EXTENSION; ASSUME JPG IF NONE GIVEN
        let ext = 'jpg'
        let split = name.split('.');
        if (split.length > 1) {
            ext = split[split.length-1];
            name = split.slice(0, split.length-1).join('.');
        }
        let img = {name, desc, status, ext};
        this.images.push(img);
        this.images_dict[name] = img;
    }
    
    build (){
        // MAKE A LITTLE HTML ELEMENT WITH THUMBNAILS AND STUFF!!!!
        this.built = true;
        this.navWrap = makeElem('div');

        for (let i=0; i<this.images.length; i++){
            let img = this.images[i];
            let {name, desc} = img;

            // MAKE THE CLICK CALLBACK FUNCTION
            // CAPTURE ZONE
            let src = this.dir + '/' + name + '.' + img.ext;
            let self = this;
            // END CAPTURE ZONE
            let activate = function(e){
                // IMAGE LOAD SPINNER
                loading = true;
                setTimeout(()=>{
                    if(!loading) return;
                    if (img.status.GIRLS) spindle.innerText = '👧';
                    else if (img.status.SQUID) spindle.innerText = '🦑';
                    else spindle.innerText = '💀';
                    spinner.classList.remove('hidden')
                }, 20);
                // ACTUAL WORK
                pic.src = src;
                picName.textContent = src;
                removeChildren(descBox);
                descBox.appendChild(img.desc);
                // UPDATE WHICH THUMBNAIL IS HIGHLIGHTED
                if (self.current !== null) self.images[self.current].nav.classList.remove('selected');
                this.classList.add('selected');
                self.current = i;
                updateAnchor();
            }

            // MAKE THE THUMBNAIL HTML ELEMENT AND PUT IT SOMEWHERE
            let nav = makeElem('div');
            nav.className = 'nav';

            let addEmoji = e => { let s=makeElem('span'); s.className='emoji'; s.textContent=e; nav.appendChild(s); }

            if(img.status.SPECIAL) nav.classList.add('special');
            if(img.status.DIGITAL) nav.classList.add('digital');
            if(img.status.SPOILER) nav.classList.add('spoiler');
            if(img.status.DESC)    nav.classList.add('has-desc');
            if(img.status.SQUID)   addEmoji('🦑')
            if(img.status.GIRLS)   addEmoji('👧')
            if(img.status.COMIC)   addEmoji('💬')
            if(img.status.BLOOD)   addEmoji('💉')
            img.nav = nav;
            img.activate = activate.bind(nav);
            nav.addEventListener('mouseup', function(e){
                let b = e.button;
                if (b==0) activate.bind(this)()
                if (b==1) { window.open('#' + m + ':' + i); } // KIND OF HACKY: USE GLOBAL VARIABLE m BECAUSE WE KNOW WE'RE ON THE SAME PAGE
            });
            this.navWrap.appendChild(nav);

            // TOOLTIP

            let tooltip = makeElem('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = src;
            nav.appendChild(tooltip);

            // TURN THE DESCRIPTION INTO A HTML ELEMENT AND PARSE LINKS TO OTHER IMAGES IN THE GALLERY WHY DON'T YOU
            let container = makeElem('div');

            if( desc === undefined || desc === ''){
                let empty = makeElem('div');
                empty.className = 'empty';
                empty.textContent = 'NO COMMENT';
                container.appendChild(empty);

            } else {
                let re = /\[(.*?)\/(.*?)]/
                let split = desc.split(re);
                // SPLIT CONTAINS 1+3N ITEMS WITH N BEING THE NUMBER OF LINKS IN THE DESCRIPTION

                let html = [];

                for (let i=0; i<split.length; i++){
                    if (i%3 == 0) { // NON-LINK
                        html.push(split[i]);

                    } else { // LINK
                        let mName = split[i];
                        let iName = split[i+1];
                        try {
                            // WARNING: ACCESSING GLOBAL VARIABLE `MONTHS_DICT`
                            let month = months_dict[mName];
                            let img = month.images_dict[iName];

                            let _m = months.indexOf(month);
                            let d = month.images.indexOf(img);

                            // I SWEAR THIS USED TO BE NICE CODE WHERE I MADE DOM NODES AND STUFF
                            // BUT THAT BROKE HTML TAGS SURROUNDING THE LINKS SO I HAD TO DO THIS
                            let text = month.dir + '/' + img.name + '.' + img.ext;
                            let href = '#' + _m + ':' + d;
                            let link = `<a href="${href}"> ${text} </a>`;

                            html.push(link);

                        } catch (e) {
                            console.log('ERROR parsing [' + mName + '/' + iName + '] in image description: ' + this.dir + '/' + img.name);
                            html.push('[' + mName + '/' + iName + ']');
                        }
                        i++;
                    }
                }

                container.innerHTML = html.join('');
            }

            img.desc = container;
        }
    }

    activate (n){
        //// SET THIS MONTH AS THE "ACTIVE" ONE
        // PUT UP THE TITLE
        byId('month-name').innerHTML = this.name;
        
        if( !this.built ) this.build();
        
        // PUT THIS MONTH'S THUMBNAILS IN THE NAVIGATOR PANEL
        removeChildren(navContainer);
        navContainer.appendChild(this.navWrap);

        // ACTIVATE AN IMAGE
        if (this.images[n] !== undefined)
            this.images[n].activate();
        else if (n == -1)
            this.images[this.images.length-1].activate();
        else
            this.images[0].activate();
    }

    next (){
        // GO TO THE NEXT IMAGE IN THIS MONTH'S GALLERY, OR RETURN TRUE IF WE ARE ALREADY AT THE END
        if (this.current == this.images.length-1) return true;
        let i = this.current === null? 0 : this.current + 1;
        this.images[i].activate();
    }

    prev (){
        // GO TO THE PREVIOUS IMAGE IN THIS MONTH'S GALLERY, OR RETURN TRUE IF WE ARE ALREADY AT THE START
        if (this.current == 0) return true;
        let i = this.current === null? 0 : this.current - 1;
        this.images[i].activate();
    }
}

function randomImage(){
    // PICKS OUT A RANDOM PICTURE (STUPIDLY: EACH MONTH HAS AN EQUAL CHANCE OF APPEARING, BUT I DONT CARE!!!!)
    m = chooseIndex(months);
    let i = chooseIndex(months[m].images);
    months[m].activate(i);
}

function parseAnchor(){
    // READ THE ANCHOR AND SWITCH TO THAT ONE IF IT EXISTS
    anchorLock = true;
    try {
        let split = document.URL.split('#');
        let anchor = split.length === 1? undefined : split[split.length-1];
        [m, d] = anchor.split(':');
        m = parseInt(m);
        d = parseInt(d);
        months[m].activate(d);
    } catch (e) {
        m = 0;
        jan.activate();
    }
    anchorLock = false;
}

function start_gallery () {
    let hideSpinner = ()=>{ loading = false; setTimeout(()=>{spinner.classList.add('invisible')}, 500); };
    pic.onload = hideSpinner;
    pic.onerror = hideSpinner;

    // START FUCKING SPINNING
    loading = true;

    // MAKE HELP BOX WORK
    let help = byId('help');
    let helpBox = byId('help-box');
    help.addEventListener('click', ()=>helpBox.hidden=false);
    helpBox.addEventListener('click', ()=>helpBox.hidden=true);

    // MAKE ZOOM WORK
    let zoomView = byId('zoom-view');
    let zoomPic = byId('zoom-picture');
    zoomView.tabIndex = -1;
    var zoom =   ()=>{ zoomView.hidden=false; zoomView.focus(); zoomPic.src = pic.src; ZOOMED = true }
    var unzoom = ()=>{ zoomView.hidden=true; ZOOMED = false };
    pic.addEventListener('click', zoom );
    zoomView.addEventListener('click', unzoom)

    months_dict = {}; for (let month of months) months_dict[month.dir] = month;
    let l = months.length;

    // ANCHOR LOGIC!!!!
    var anchorLock = false;
    updateAnchor = () => { if (!anchorLock) window.location.hash = m + ':' + months[m].current };

    window.onhashchange = parseAnchor
    parseAnchor();
    
    let nextMonth = (i=0) =>{ m=(m+1)%l; months[m].activate(i) };
    let prevMonth = (i=0) =>{ m=((m-1)%l+l)%l; months[m].activate(i) };

    let nextImage = () => { let x=months[m].next(); if(x) nextMonth(); }
    let prevImage = () => { let x=months[m].prev(); if(x) prevMonth(-1); }

    // BIND THE ARROW BUTTONS FOR BROWSING
    let navPrev = byId('nav-prev');
    navPrev.addEventListener('click', prevImage);

    let navNext = byId('nav-next');
    navNext.addEventListener('click', nextImage);

    let navRand = byId('nav-random');
    navRand.addEventListener('click', randomImage);

    let monthPrev = byId('month-prev');
    monthPrev.addEventListener('click', prevMonth);

    let monthNext = byId('month-next');
    monthNext.addEventListener('click', nextMonth);

    // BIND THE ARROW KEYS FOR EZ BROWSING
    document.onkeydown = function (e){
        let k = e.keyCode;
        if (ZOOMED){
            if (k == 27 || k == 13) // ESC OR ENTER
                unzoom();
            return; // IGNORE ARROW KEY FUNCTIONS ON ZOOM
        }
        if      (k == 38) // UP
            nextMonth();
        else if (k == 40) // DOWN
            prevMonth();
        else if (k == 37) // LEFT
            prevImage();
        else if (k == 39) // RIGHT
            nextImage();
        else if (k == 13) // ENTER
            zoom();
    }

    // STATS
    var total_months = months.length;
    var total_images = months.reduce((s, m)=>s+m.images.length, 0)
    console.log('TOTAL MONTHS: ' + total_months);
    console.log('TOTAL IMAGES: ' + total_images);
}