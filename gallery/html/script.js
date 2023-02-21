// SCRIPT.JS AUTHORED BY REZUAQ (SIBERT AERTS) 2019-2022
// COMMENTS ARE ALL-CAPS BECAUSE I DECIDED ON IT IN 2019 AND NOW I'M JUST KEEPING UP TO BE CONSISTENT

// IMPORT MATH
const {abs, min, max, floor, ceil} = Math

// TINY DOM FUNCTIONS
const byId = id => document.getElementById(id)
const makeElem = (tag, clss, text) => { let e = document.createElement(tag); if(clss) e.className = clss; if(text) e.textContent = text; return e }
const makeText = t => document.createTextNode(t)

// TINY DOM METHODS
Element.prototype.addClass =    function(c){ c.split(/\s+/).forEach(c => this.classList.add(c)) }
Element.prototype.removeClass = function(c){ c.split(/\s+/).forEach(c => this.classList.remove(c)) }
Element.prototype.removeChildren = function(){ while (this.lastChild) this.removeChild(this.lastChild) }
Element.prototype.attr = function(x){ return this.getAttribute(x) }
Element.prototype.attrs = function(x){ return x.split(/\s+/).map(x => this.getAttribute(x)) }
Element.prototype.setAttr = function(attr, val){ this.setAttribute(attr, val); return this }
Element.prototype.on = Window.prototype.on = Document.prototype.on 
    = function(types, fun, opt){ types.split(/\s+/).forEach(t => this.addEventListener(t, fun, opt)) }

// TINY UTIL FUNCTIONS
const randInt = max => floor(Math.random() * max)
const chooseIndex = l => randInt(l.length)
const choose = l => l[chooseIndex(l)]
const sleep = ms => new Promise(r => setTimeout(r, ms))

// BIGGER UTIL FUNCTIONS
function copyTextArea(id) {
    const text = byId(id);
    text.select(); text.select(0, 10000000);
    document.execCommand('copy');
}
function redirectEvent(target) {
    //// CREATES AN EVENT CALLBACK FUNCTION WHICH REDIRECTS A (SUPERFICIAL) COPY OF THE EVENT TO THE TARGETED ELEMENT
    return e => target.dispatchEvent(new e.constructor(e.type, e));
}

// TINY UTIL METHODS
Object.prototype.has = function(x){ return this.hasOwnProperty(x) }


// IMPORTANT DOM OBJECTS THE GALLERY HOOKS INTO (NOT EXHAUSTIVE)
const pic           = byId('picture')
const picLink       = byId('picture-link')
const picName       = byId('pic-name')
const picOverlay    = byId('picture-overlay')
const commentBox    = byId('comment')
const spinner       = byId('spinner')
const spindle       = byId('spindle')
const navContainer  = byId('nav-container')
const monthName     = byId('month-name')
const zoomWrap      = byId('zoom-wrap')
const zoomView      = byId('zoom-view')
const zoomPic       = byId('zoom-picture')
const zoomControl   = byId('zoom-control')

// GALLERY.HTML IMPORTS THESE TO DEFINE TAGS
const asClass = c => nav => nav.addClass(c)
const asEmoji = e => nav => nav.appendChild( makeElem('span', 'emoji', e) )
const asNothing = _=>_


// CLASS REPRESENTING A PICTURE WITH DESCRIPTION AND TAGS ETC.
class Page {
    constructor(month, name, pageElem, tags){
        // `tags` MAY BE GIVEN AS AN ARRAY OR A SET; CONVERT IT TO SET
        if ( tags instanceof Array ) tags = new Set(tags);
        // VERIFY IF ALL TAGS EXIST
        for ( const tag of tags ) if ( !TAGDICT.has(tag) ) {
            console.error(`IN ${month.dir}/${name} INVALID TAG "${tag}"`);
            tags.delete(tag);
        }
        this.pageElem = pageElem;
        this.tags = tags;

        // SLICE OFF THE FILE EXTENSION (ASSUME JPG IF NONE GIVEN)
        let i = name.lastIndexOf('.');
        if( i>=0 ) [name, this.ext] = [name.slice(0, i), name.slice(i+1)]
        else this.ext = 'jpg';
        this.name = name;
        this.src = month.dir + '/' + name + '.' + this.ext;
            
        // ADD SELF TO MONTH
        this.month = month;
        this.pageIndex = month.pages.length;
        month.pages.push(this);
        month.pagesDict[name] = month.pagesDict[name + '.' + this.ext] = this;
    }

    build() {
        //// BUILDS AND PARSES THE VARIOUS ATTRIBUTES OF A PAGE
        
        //// EXTRACT ANNOTATIONS FROM THE <PAGE> ELEMENT
        this.annotations = [];
        for( const child of this.pageElem.childNodes ){
            if( child.nodeType == Node.ELEMENT_NODE && child.nodeName === "ANNOT" ){
                this.annotations.push(child);
                this.pageElem.removeChild(child);
            }
        }

        // TAKE THE REMAINING CONTENTS OF <PAGE> AND TURN IT INTO A DESCRIPTION ELEMENT
        this.buildDescription();

        // MAKE THE NAV (THUMBNAIL) ELEMENT
        this.nav = makeElem('a', 'nav');
        this.month.navWrap.appendChild(this.nav);
        this.nav.href = '#' + this.month.monthIndex + ':' + this.pageIndex;

        // APPLY TAG EFFECTS TO NAV
        for( let tag of this.tags )
            TAGDICT[tag](this.nav);

        // ADD HOVER TOOLTIP TO NAV
        let tooltip = makeElem('div', 'tooltip', this.src);
        this.nav.appendChild(tooltip);

        //// ANNOTATIONS & ANCHORS
        this.buildAnnotations();
    }

    buildDescription() {
        // PARSES AND TURNS CERTAIN NON-HTML SHORTHANDS INTO HTML ELEMENTS
        // THIS HAPPENS BY MODIFYING THE .innerHTML STRING OF THE ENTIRE DESCRIPTION
        let html = this.pageElem.innerHTML;
        if ( !html.trim() )
            return this.desc = undefined;

        this.tags.add('DESC'); // TAG SIGNIFYING THE PAGE HAS NONEMPTY DESCRIPTION
        
        const parsePageLink = function (match, mName, pName){
            try {
                const month = this.month.gallery.monthsDict[mName];
                const page = month.pagesDict[pName];
                const m = month.monthIndex, p = page.pageIndex;
                return `<a href=#${m}:${p}>${page.src}</a>`;

            } catch (e) {
                console.error(`INVALID REFERENCE "${match}" IN DESCRIPTION OF ${this.src}`);
                return match;
            }
        }.bind(this)

        // INSTANCES OF "[month/image]" ARE TURNED INTO A WORKING LINKS TO THE RESPECTIVE IMAGE
        // INSTANCES OF "@@handle" ARE TURNED INTO WORKING LINKS TO SAID TWITTER PROFILE
        html = html.replace( /\[(.*?)\/(.*?)]/g , parsePageLink )
                   .replace( /@@(\w+)/g , '<a href=https://twitter.com/$1 target=_blank>@$1</a>' )

        this.desc = makeElem('div');
        this.desc.innerHTML = html;
    }

    buildAnnotations() {
        //// MAKES ANNOTATIONS WORK
        const annotations = this.annotations;
        const anchors = this.annotated = this.desc ? Array.from(this.desc.querySelectorAll('[annot]')) : [];

        const positionAnnotation = annot => {
            annot.style.left = annot.attr('x')*100 + '%';
            annot.style.top = annot.attr('y')*100 + '%';
            annot.style.width = annot.attr('w')*100 + '%';
            annot.style.height = annot.attr('h')*100 + '%';
        }

        //// BUILD CHILD ANNOTATIONS
        this.annotationWraps = [];
        for( const parent of annotations ){
            const children = Array.from(parent.children).filter(c => c.tagName === 'ANNOT');
            if( !children.length ) {
                this.annotationWraps.push(parent);
                continue;
            }
            const wrap = makeElem('div', 'annot-wrap');
            wrap.appendChild(parent);
            this.annotationWraps.push(wrap);
            for( const child of children ){
                wrap.appendChild(child);
                child.addClass('child');

                // POSITION THE CHILD
                const [x, y, W, H] = parent.attrs('x y w h').map(r => parseFloat(r));
                const w = child.attr('w') || W; 
                const h = child.attr('h') || H; 

                let pos = (child.attr('position') || 'auto').toLowerCase();
                if( pos === 'auto' ){
                    if( w < h ){
                        if( abs(x-.5) > abs(x+W-.5) ) pos = 'right'
                        else pos = 'left'
                    } else {
                        if( abs(y-.5) > abs(y+H-.5) ) pos = 'below'
                        else pos = 'above'
                    }
                    child.setAttr('position', pos);
                }
                if (pos == 'above')
                    child.setAttr('x', x).setAttr('y', y-h).setAttr('w', w).setAttr('h', h);
                else if (pos === 'below')
                    child.setAttr('x', x).setAttr('y', y+H).setAttr('w', w).setAttr('h', h);
                else if (pos === 'left')
                    child.setAttr('x', x-w).setAttr('y', y).setAttr('w', w).setAttr('h', h);
                else if (pos === 'right')
                    child.setAttr('x', x+W).setAttr('y', y).setAttr('w', w).setAttr('h', h);
                else if (pos === 'over')
                    child.setAttr('x', x).setAttr('y', y).setAttr('w', w).setAttr('h', h);
                positionAnnotation(child);                
            }
        }

        //// SET UP ALL ANNOTATION EVENTS
        const names = new Set([ ...annotations.map(a => a.attr('name')), ...anchors.map(a => a.attr('annot'))]);

        for( const name of names ){
            const annots = annotations.filter(a => a.attr('name') === name);
            const anchs = anchors.filter(a => a.attr('annot') === name);

            if( annots.length ){
                // MOUSE EVENTS ON AN ANCHOR HIGHLIGHT ALL LINKED ANNOTATIONS
                for( const anchor of anchs ){
                    anchor.on('mouseover', e => annots.forEach(a => a.addClass('hover')));
                    anchor.on('mouseout',  e => annots.forEach(a => a.removeClass('hover')));
                    anchor.on('click',     e => annots.forEach(a => { a.removeClass('clicked'); a.offsetWidth; a.addClass('clicked') }));
                }
            } else
                console.warn(`IN ${this.src}: ANCHOR IN DESCRIPTION REFERENCES NONEXISTANT ANNOTATION "${name}"`)

            // 2. HOVERING (OR IF CLICKABLE, CLICKING) ANY ANNOTATION HIGHLIGHTS ALL LINKED ANCHORS
            for( const annot of annots ){
                positionAnnotation(annot);
                // HOVERING OVER AN ANNOTATION HIGHLIGHTS ALL LINKED ANCHORS
                annot.on('mouseover', e => anchs.forEach(a => a.addClass('hover')));
                annot.on('mouseout',  e => anchs.forEach(a => a.removeClass('hover')));
                // IF CLICKABLE: CLICKING AN ANNOTATION MAY EITHER HIGHLIGHT LINKED ANCHORS
                // ELSE: PASS THE CLICK EVENT ON TO THE UNDERLYING IMAGE INSTEAD
                if( annot.classList.contains('clickable') )
                    annot.on('click', e => anchs.forEach(a => { a.removeClass('clicked'); a.offsetWidth; a.addClass('clicked') }));
                else 
                    annot.on('click mousemove', redirectEvent(picLink));
            }
        }
    }

    activate(e) {
        //// SET THIS IMAGE AS THE ACTIVE IMAGE (ASSUMES ITS MONTH IS ALREADY ACTIVE!)
        // IMAGE LOAD SPINNER
        this.month.gallery.trySpinning(this);

        if( this.month.gallery.zoomViewOpen ) this.month.gallery.closeZoomView();
        
        // SWAP OUT ANNOTATION OVERLAYS
        picOverlay.hidden = true;
        picOverlay.removeChildren();
        for( const annot of this.annotations ){
            annot.removeClass('hover');
            annot.removeClass('clicked');
        }
        this.annotationWraps.forEach(w => picOverlay.appendChild(w));

        // SWAP OUT IMAGE
        pic.src = this.src;
        picLink.href = this.src;
        picName.textContent = this.src;

        // SWAP OUT DESCRIPTION
        commentBox.removeChildren();
        commentBox.hidden = !this.tags.has('DESC');
        if( this.tags.has('DESC') ){
            this.annotated.forEach(a => a.removeClass('clicked'));
            commentBox.appendChild(this.desc);
        }

        // UPDATE WHICH THUMBNAIL IS HIGHLIGHTED
        this.month.page.nav.removeClass('selected');
        this.month.page = this;
        this.nav.addClass('selected');
        this.nav.blur();

        this.month.gallery.updateAnchor();
    }

}

// CLASS REPRESENTING A LIST OF PAGES
class Month {
    constructor(name, dir, gallery=GALLERY) {
        this.name = name;
        this.dir = dir;
        this.pages = [];
        this.pagesDict = {};
        this.activePage = 0;
        this.built = false;
        // ADD SELF TO GALLERY
        this.gallery = gallery;
        this.monthIndex = gallery.months.length;
        gallery.months.push(this);
        gallery.monthsDict[dir] = gallery.monthsDict[name] = this;
    }

    // PROPERTIES

    get page() {
        return this.pages[this.activePage];
    }
    set page(page) {
        this.activePage = page.pageIndex; 
    }

    get rowLength() {
        // ONLY WORKS WHEN BUILT AND ACTIVE
        // INSPECTS HOW FLEXBOX HAS LAID OUT THE NAVS IN OUR NAVIGATOR
        // (I.E. VARIABLE BASED ON: NUMBER OF NAVS, BROWSER ZOOM LEVEL, BROWSER WINDOW SIZE, NAV CONTAINER SIZE ETC.) 
        const navs = Array.from(this.navWrap.children);
        const baseOffset = navs[0].offsetTop;
        const breakIndex = navs.findIndex(nav => nav.offsetTop > baseOffset + 10);
        return breakIndex < 0 ? navs.length : breakIndex;
    }

    // METHODS

    add(name, desc='', tags=new Set()) {
        //// ADD A NEW IMAGE TO THIS MONTH
        new Page(this, name, desc, tags);
    }

    build() {
        // MAKE A LITTLE HTML ELEMENT WITH THUMBNAILS AND STUFF
        this.navWrap = makeElem('div');
        for( let page of this.pages )
            page.build();
        this.built = true;
    }

    activate(page=0) {
        //// SET THIS MONTH AS THE "ACTIVE" ONE
        if( this.gallery.activeMonth !== this.monthIndex ){
            // PUT UP THE TITLE
            monthName.innerText = this.name;
            this.gallery.month = this;
            
            if( !this.built ) this.build();

            // PUT THIS MONTH'S THUMBNAILS IN THE NAVIGATOR PANEL
            navContainer.removeChildren();
            navContainer.appendChild(this.navWrap);
        }

        // ACTIVATE AN IMAGE
        if( page === -1 )
            this.pages[this.pages.length-1].activate();
        else
            this.pages[page].activate();
    }

    next() {
        // GO TO THE NEXT IMAGE IN THIS MONTH'S GALLERY, OR RETURN TRUE IF WE ARE ALREADY AT THE LAST
        if ( this.activePage == this.pages.length-1 ) return true;
        this.pages[this.activePage + 1].activate();
    }

    prev() {
        // GO TO THE PREVIOUS IMAGE IN THIS MONTH'S GALLERY, OR RETURN TRUE IF WE ARE ALREADY AT THE FIRST
        if (this.activePage == 0) return true;
        this.pages[this.activePage - 1].activate();
    }

    up() {
        // NAVIGATE TO THE PAGE WHOSE NAV IS ABOVE THIS ONE'S
        //   IF WE'RE ALREADY ON THE TOP ROW, GO TO THE FIRST PAGE
        //   IF WE'RE ALREADY ON THE FIRST PAGE, RETURN TRUE
        if( this.activePage === 0 ) return true;
        const rowLength = this.rowLength;
        if( this.activePage - rowLength < 0 ) this.activate(0);
        else this.activate(this.activePage - rowLength);        
    }

    down() {
        // NAVIGATE TO THE PAGE WHOSE NAV IS BELOW THIS ONE'S
        //   IF WE'RE ALREADY ON THE BOTTOM ROW, GO TO THE LAST PAGE
        //   IF WE'RE ALREADY ON THE LAST PAGE, RETURN TRUE
        const n = this.pages.length;
        if( this.activePage === n-1 ) return true;
        const rowLength = this.rowLength;
        if( this.activePage + rowLength >= n ) this.activate(n-1);
        else this.activate(this.activePage + rowLength);        
    }

}

// CLASS REPRESENTING THE UNIQUE GALLERY
class Gallery {
    constructor() {
        this.loading = true;
        this.zoomViewOpen = false;
        this.activeMonth = -1;
        this.months = [];
        this.monthsDict = {};

        // LOAD MONTHS AND PAGES FROM THE DOM
        this.parseMonthsAndPages();

        // ANCHOR LOGIC
        this.setUpAnchorLogic();

        // SPINNER HIDING
        pic.on('load error', this.onPictureLoad.bind(this));
        window.on('resize', this.onResize.bind(this));

        // PAGE LOAD FADE-IN
        pic.on('load error', () => { pic.style = null; pic.style.opacity = 1 }, {once: true});
        window.onload =  () => { byId('load-blur').style.opacity = 0; setTimeout(() => byId('load-blur').hidden=true, 1000) };
        if( document.readyState === 'complete' ) window.onload();

        // MAKE HELP AND PAGE INFO MODALS WORK
        this.constructModals();

        // MAKE MONTH PICKER WORK
        this.constructMonthPicker();

        // MAKE ZOOM WORK
        this.constructZoomView();

        // CONTROLS
        this.setUpControls();

        // PRINT SOME STATS
        this.logStats();
    }

    // CONSTRUCTOR SUBMETHODS

    parseMonthsAndPages() {
        // PULL ALL THE <MONTH> and <PAGE> TAGS OUT OF THE HTML DOCUMENT AND TURN THEM INTO MONTH AND PAGE OBJECTS
        const imageList = document.getElementsByTagName('image-list')[0];
        document.body.removeChild(imageList);

        let mos = imageList.getElementsByTagName('month');
        for (const mo of mos) {
            let month = new Month(mo.attr('name'), mo.attr('path'), this);
            for (const page of mo.children) {
                const tags = page.attr('tags');
                month.add(page.attr('file'), page, tags ? tags.split(/\s+/) : undefined);
            }
        }
    }

    setUpAnchorLogic() {
        // MODEL: 
        //   ACTIVATING MONTH m PICTURE p CHANGES THE ANCHOR TO "#m:p" WITHOUT TRIGGERING PARSEANCHOR ("UPDATEANCHOR")
        //   CLICKING A LINK OF THE FORM "#m:p" (E.G. THUMBNAILS) CHANGES THE ANCHOR TO "#m:p", TRIGGERING PARSEANCHOR
        //   PARSEANCHOR ACTIVATES THE CORRECT MONTH/PAGE
        //   BUTTONS/KEYS DIRECTLY ACTIVATE MONTHS AND PAGES
        // I.E.:
        //   BUTTONS/KEYS → ACTIVATES PAGE → "UPDATEANCHOR"
        //                        ↑
        //    ANCHOR LINK →  PARSEANCHOR
        //
        // THIS WAY THE ANCHOR ALWAYS REFLECTS THE ACTIVE PAGE, AND ANY KIND OF ANCHOR LINK ALSO CORRECTLY ACTIVATES THE CORRECT PAGE
        // AT THE RELATIVELY MINOR COST OF "UPDATEANCHOR" NEEDING TO PULL A TRICK TO PREVENT TRIGGERING PARSEANCHOR AGAIN
        this.preventParseAnchor = false;
        window.onhashchange = this.parseAnchor.bind(this);
        this.parseAnchor();
    }

    constructModals() {
        // COULD BE SMARTER BUT THERE'S ONLY TWO MODALS YET
        const help = byId('help');
        const pageInfo = byId('page-info');

        this.closeModals = () => help.hidden = pageInfo.hidden = true;

        byId('open-help').onclick = this.openHelp = e => {
            this.closeModals();
            help.hidden = false;
            e.stopPropagation();         
            document.on('click', this.closeModals, {once: true});
        };
        byId('open-page-info').onclick = this.openPageInfo = e => { 
            this.loadPageInfo();
            this.closeModals();
            pageInfo.hidden = false;
            e.stopPropagation();
            document.on('click', this.closeModals, {once: true});
        };

        help.onclick = pageInfo.onclick = e => e.stopPropagation();
        byId('close-help').onclick = byId('close-page-info').onclick = this.closeModals;
                
        document.on('keydown', e => {
            const k = e.key;
            if( k == 'Escape' || k == 'Enter' || k.match(/Arrow/) )
                this.closeModals();
        });
    }

    constructMonthPicker() {
        const monthButton = byId('month-name');
        const monthNav = byId('month');
        const monthList = byId('month-list');
        const monthListClose = byId('month-list-close');
        const monthContainer = byId('month-list-container');

        var monthNavWidth, monthNavHeight

        for (const month of this.months) {
            const e = makeElem('button', 'big', month.name);
            e.onclick = () => { monthListClose.onclick(); month.activate(); };
            monthContainer.appendChild(e);
        }

        monthButton.onclick = function () {
            monthNavWidth = monthNav.scrollWidth - 20
            monthNavHeight = monthNav.scrollHeight - 20
            monthList.style.width = monthNavWidth + 'px'
            monthList.style.maxHeight = monthNavHeight + 'px'
            monthNav.hidden = true;
            monthList.hidden = false;
            monthList.addClass('collapsing')
            setTimeout(() => {
                monthList.style.maxHeight = '300px'
                monthList.style.width = null
            }, 30)
            monthList.ontransitionend = () => {
                monthList.removeClass('collapsing')
            }
        };

        monthListClose.onclick = function () {
            monthList.style.width = monthList.offsetWidth-20 +'px'
            monthList.style.maxHeight = monthList.offsetHeight-20 +'px'
            monthList.addClass('collapsing')
            setTimeout(() => {
                monthList.style.width = monthNavWidth + 'px'
                monthList.style.maxHeight = monthNavHeight + 'px'
            }, 30)
            monthList.ontransitionend = () => {
                monthList.hidden = true;
                monthList.removeClass('collapsing')
                monthList.style.maxHeight = monthList.style.width = null
                monthNav.hidden = false;
            }
        }
    }

    constructZoomView() {
        zoomView.tabIndex = -1;

        // CLICKING PICTURE OPENS ZOOM VIEW
        picLink.on('click', this.openZoomView.bind(this));
        // CLICKING OUTSIDE OF PICTURE CLOSES ZOOM VIEW
        zoomView.onclick = byId('zoom-close').onclick = this.closeZoomView.bind(this);
        zoomPic.onclick = e => e.stopPropagation();

        // DRAGGING IMAGE SCROLLS IT
        var DRAGSTATE = { dragging: false, x: 0, y: 0, l: 0, t: 0 };
        zoomPic.onmousedown = e => {
            if (e.button !== 0) return;
            DRAGSTATE = { dragging: true, x: e.clientX, y: e.clientY, l: zoomView.scrollLeft, t: zoomView.scrollTop };
            e.preventDefault();
        };
        document.on('mousemove', e => {
            if (DRAGSTATE.dragging) {
                zoomView.scrollLeft = (DRAGSTATE.x - e.clientX) + DRAGSTATE.l;
                zoomView.scrollTop = (DRAGSTATE.y - e.clientY) + DRAGSTATE.t;
            }
        });
        document.on('mouseup', e => {
                DRAGSTATE.dragging = false
        });

        // ZOOM BAR
        const updateZoomAroundPoint = function(x, y){
            // (x, y) ∈ [0, 1]² relative coordinates within the "visible window" (client) of zoomView
            // Our goal is that the exact point of the Image that's visible there is still there once the image is zoomed in or out
            // e.g. when the user double-clicks to zoom a part of the image it expands around where they clicked
            // e.g. when the user just scrolls the zoom bar it zooms around whatever is at the center of the screen (x, y) = (0.5, 0.5)
            
            const z = zoomControl.previousValue;
            const nz = zoomControl.value / 1000;
            const pw = zoomPic.clientWidth, ph = zoomPic.clientHeight;
            const vw = zoomView.clientWidth, vh = zoomView.clientHeight;

            zoomView.scrollLeft = 800 + (1-nz)/2*pw + nz/z*( zoomView.scrollLeft - 800 - (1-z)/2*pw + x*vw ) - x*vw;
            zoomView.scrollTop  = 500 + (1-nz)/2*ph + nz/z*( zoomView.scrollTop  - 500 - (1-z)/2*ph + y*vh ) - y*vh;
            
            zoomPic.style.transform = `scale(${nz})`;
            zoomControl.previousValue = nz;
        }
        zoomControl.previousValue = 0.5;
        zoomControl.oninput = () => updateZoomAroundPoint(0.5, 0.5);
        // NOTE: MANUALLY MODIFY THE ZOOM LEVEL BY SETTING zoomControl.value AND THEN CALLING EITHER .oninput() OR updateZoomAroundPoint(x, y) AS NEEDED

        // SCROLLING THE ZOOM BAR CHANGES ZOOM
        byId('zoom-control-box').on('wheel', function (e) {
            zoomControl.value = Math.round(zoomControl.value / 50 - Math.sign(e.deltaY)) * 50;
            zoomControl.oninput();
            e.preventDefault();
        }, { passive: false });

        // DOUBLE-CLICKING ZOOMS AROUND THE CLICKED PART
        zoomPic.on('dblclick', e => {
            zoomControl.value = +zoomControl.value + 200;
            const x = (e.clientX - zoomView.clientLeft)/zoomView.clientWidth;
            const y = (e.clientY - zoomView.clientTop)/zoomView.clientHeight;
            updateZoomAroundPoint(x, y);
        })

    }

    setUpControls() {
        // BIND HTML BUTTON AND KEYBOARD CONTROLS FOR CONTROLLING VARIOUS ASPECTS OF THE GALLERY
        const l = this.months.length;
        this.nextMonth = (e, i=0) => this.months[(this.activeMonth+1) % l].activate(i);
        this.prevMonth = (e, i=0) => this.months[((this.activeMonth-1) % l + l) % l].activate(i);

        this.nextPage = () => {
            if (this.month.next()) this.nextMonth();
        };
        this.prevPage = () => {
            if (this.month.prev()) this.prevMonth(0, -1);
        };
        this.upPage = () => {
            if (this.month.up()) this.prevMonth(0, -1);
        };
        this.downPage = () => {
            if (this.month.down()) this.nextMonth();
        };

        this.randomPage = () => {
            let i = randInt(this.months.reduce((s, m) => s + m.pages.length, 0));
            for (let m of this.months)
                if (m.pages.length <= i)
                    i -= m.pages.length;
                else
                    return m.activate(i);
        };

        // BIND THE HTML BUTTONS FOR BROWSING
        byId('month-next').onclick = this.nextMonth;
        byId('month-prev').onclick = this.prevMonth;
        byId('nav-next').onclick = this.nextPage;
        byId('nav-prev').onclick = this.prevPage;
        byId('nav-random').onclick = this.randomPage;

        // PASSWORD ENTRY
        this.codeArr = [];

        // BIND THE ARROW KEYS FOR BROWSING
        document.onkeydown = this.onKeyDown.bind(this);
    }

    logStats() {
        // WRITE SOME INTERESTING STATS TO CONSOLE.LOG FOR LACK OF A BETTER PLACE TO PUT THEM
        var total_months = this.months.length;
        var total_images = this.months.reduce((s, m) => s + m.pages.length, 0);
        console.log('TOTAL MONTHS: ' + total_months);
        console.log('TOTAL IMAGES: ' + total_images);
        let tagStats = {};
        for (let m of this.months)
            for (let p of m.pages)
                for (let tag of p.tags)
                    if (tagStats[tag])
                        tagStats[tag]++;
                    else
                        tagStats[tag] = 1;
        console.log('TAG OCCURENCES:');
        console.log(Object.entries(tagStats).sort((x, y) => y[1] - x[1]).map(x => x.join(': ')).join('\n'));
    }

    // PROPERTIES

    get month() {
        return this.months[this.activeMonth]
    }
    set month(month) {
        this.activeMonth = month.monthIndex;
    }
    get page() {
        return this.month.page
    }
    set page(page) {
        this.month.page = page;
    }

    // ACTUAL METHODS

    async trySpinning(picture) {
        this.loading = true;
        await sleep(50); // ONLY PUT UP THE SPINNER IF IT'S TAKING MORE THAN 50 MS TO PUT UP THE IMAGE
        if( !this.loading ) return;
        if( picture ) spindle.innerText = SPINDLEMAP( picture.tags )
        else spindle.innerText = '💀';
        spinner.removeClass('invisible');
    }
    
    async stopSpinning() {
        if( !this.loading ) return;
        this.loading = false;
        await sleep(500); // DON'T INSTANTLY HIDE THE SPINNER ELSE IT LOOKS WEIRD
        spinner.addClass('invisible');
    }

    onPictureLoad(e) {
        // CALLED WHEN THE PICTURE LOADS OR ERRORS OUT
        this.stopSpinning();
        this.onResize();
        picOverlay.hidden = false;        
    }

    onResize(e) {
        //// RESIZE THE PICTURE OVERLAY TO EXACTLY COVER THE PICTURE UNDERNEATH
        // SINCE THEY'RE SIBLING ELEMENTS YET PIC DECIDES THE SIZE OF THE ENTIRE THING THERE'S NO REAL WAY TO DO THIS IN CSS AFAIK 
        picOverlay.style.width = pic.clientWidth + 'px';
        picOverlay.style.height = pic.clientHeight + 'px';
    }
    
    parseAnchor() {
        // READ THE ANCHOR AND SWITCH TO THAT ONE IF IT EXISTS
        if( this.preventParseAnchor ) { this.preventParseAnchor = false; return; }
        try {
            let anchor = window.location.hash.substr(1);
            let [m, d] = anchor.split(':').map( x=>parseInt(x) );
            this.months[m].activate(d);
        } catch (e) {
            // IF THERE IS NO ANCHOR OR THE ANCHOR IS NOT VALID IN SOME FORM:
            // DEFAULT BEHAVIOUR - OPEN THE FIRST IMAGE OF THE FIRST MONTH
            this.months[0].activate();
        }
    }
    
    updateAnchor() {
        // SET THE ANCHOR WITHOUT TRIGGERING PARSEANCHOR
        let newHash = '#' + this.activeMonth + ':' + this.month.activePage;
        if( newHash !== window.location.hash ){
            this.preventParseAnchor = true;
            window.location.hash = newHash;
        }
    }
    
    openZoomView(e) {
        // OPEN THE ZOOM VIEW ON THE CURRENTLY ACTIVE PICTURE
        if (e) e.preventDefault();
        if (window['ANNOT_EDIT_STATE'] && window['ANNOT_EDIT_STATE'].active) return;
        this.closeModals();
        
        setTimeout(_ => zoomView.focus(), 0);
        zoomPic.src = pic.src;
        zoomPic.on('load', () => {
            zoomWrap.hidden = false;
            if( e ){
                // ZOOM AROUND WHERE THE USER CLICKED
                const ZOOM = 0.5; // IN CASE DEFAULT ZOOM LEVEL CHANGES
                const rect = picLink.getBoundingClientRect();
                const x = (e.clientX - rect.left)/rect.width;
                const y = (e.clientY - rect.top)/rect.height;
                zoomView.scrollLeft = 800 + (1-ZOOM)/2 * zoomPic.clientWidth  + x*ZOOM*zoomPic.clientWidth  - e.clientX;
                zoomView.scrollTop  = 500 + (1-ZOOM)/2 * zoomPic.clientHeight + y*ZOOM*zoomPic.clientHeight - e.clientY;
            } else {
                // FOCUS ON THE CENTRE OF THE IMAGE
                zoomView.scrollLeft = (zoomView.scrollWidth - zoomView.clientWidth) / 2;
                zoomView.scrollTop = (zoomView.scrollHeight - zoomView.clientHeight) / 2;
            }
        }, {once: true});
        zoomControl.value = 500; // zoomControl.value IS IN PERMILLE
        zoomControl.oninput();
        this.zoomViewOpen = true;
    }

    closeZoomView() {
        // CLOSE THE ZOOM VIEW
        this.zoomViewOpen = false;
        zoomWrap.hidden = true;
        zoomView.blur();
    }

    loadPageInfo() {
        const table = byId('page-info-table');
        const fillInfo = (name, fun) => table.querySelectorAll(`[name=${name}]`).forEach(fun);
        fillInfo('name', e => e.innerText = this.page.name );
        fillInfo('type', e => e.innerText = this.page.ext );
        fillInfo('link', e => e.innerText = e.href = pic.src );
        fillInfo('size', e => e.innerText = pic.naturalWidth + '×' + pic.naturalHeight );
        fillInfo('tags', e => e.innerText = Array.from(this.page.tags).filter(t => t !== 'DESC').join(', ') || '(none)' );
        fillInfo('annots', e => e.innerText = this.page.annotations.length || 'none');
    }

    onKeyDown(e) {
        // CALLED WHEN A BUTTON IS PRESSED -- CONTROLS MOST ASPECTS OF THE GALLERY WITHOUT NEEDING TO USE A MOUSE

        let k = e.key;
        if (!this.zoomViewOpen) {
            // GALLERY CONTROLS
            if (e.altKey) return;

            if (k === 'ArrowLeft') {
                if (e.ctrlKey) this.prevMonth();
                else this.prevPage();
            }
            else if (k === 'ArrowRight') {
                if (e.ctrlKey) this.nextMonth();
                else this.nextPage();
            }
            else if (k === 'ArrowUp') {
                this.upPage();

            } else if (k === 'ArrowDown') {
                this.downPage();

            } else if (k === 'Enter' && document.activeElement === document.body || document.activeElement === document.documentElement) {
                this.openZoomView();
            }

        } else {
            // ZOOM VIEW CONTROLS
            if (k === 'Escape' || k === 'Enter')
                this.closeZoomView();
            else if (k === '-') {
                zoomControl.value -= 50;
                zoomControl.oninput();
            } else if (k === '+' || k === '=') {
                zoomControl.value = +zoomControl.value + 50;
                zoomControl.oninput();
            }        
        }

        // PASSWORD ENTRY
        this.codeArr.push(k);
        if (this.codeArr.length > 8) this.codeArr.shift();

        let code = this.codeArr.join('');
        let hash = hashCode(code);
        if (hash === 71138048)
            eval(decrypt("∷∘∕∐≉⋑⊇⊥⊣⋴⊨⊤⊃⋋≌≭≃⋟∄⊰⋑⊽∘≿⋧⊤⊨⊮∐⋓⋸∫⋳⊁⊼⊉⋇⊟∉∱≀≦≛", code));
    }

}


// SET TO FALSE WHEN PUBLISHING
const DEV = false;

//------------------------ ANNOTATION EDITING ------------------------//
// THIS DIDN'T FEEL WORTH PROPERLY INTEGRATING INTO THE GALLERY CODE
// SO IT'S JUST BIT OF CODE HERE WITH 1 CONDITION INJECTED INTO Gallery.openZoomView
if( DEV ){
    Array.from(document.getElementsByClassName('dev')).forEach(e => e.hidden = false);
    window.ANNOT_EDIT_STATE = { active: false, clicks: 0, x: 0, y: 0};
    window.ANNOT_EDIT_BOX = makeElem('annot', 'dev');
    ANNOT_EDIT_BOX.on('click mousemove', redirectEvent(picLink));

    function makeAnnotation(){
        ANNOT_EDIT_STATE.active = true;
        ANNOT_EDIT_STATE.clicks = 0;
    }

    document.on('keydown', e => { if (e.key === 'a') makeAnnotation() });

    picLink.on('click', function(e) {
        const state = ANNOT_EDIT_STATE;
        if( !state.active ) return;

        const rect = picLink.getBoundingClientRect();
        const clickX = (e.clientX - rect.left)/rect.width;
        const clickY = (e.clientY - rect.top)/rect.height;

        if( state.clicks === 0 ){
            state.clicks = 1;
            state.x = clickX;
            state.y = clickY;
            picOverlay.appendChild(ANNOT_EDIT_BOX);

        } else if (state.clicks === 1 ){
            setTimeout( () => state.active = false, 10);
            picOverlay.removeChild(ANNOT_EDIT_BOX);
            const x = min(state.x, clickX);
            const y = min(state.y, clickY);
            const w = abs(state.x - clickX);
            const h = abs(state.y - clickY);
            
            const cls = byId('dev-check-invisible').checked ? ' class=invis' : '';
            const f = r => r.toFixed(4).replace(/0\./, '.');
            byId('dev-annotation-out').value = `\n<annot name=1${cls} x=${f(x)} y=${f(y)} w=${f(w)} h=${f(h)}></annot>`;
            byId('dev-annotation-out').scrollTop = 10000;
            copyTextArea('dev-annotation-out');
        }
    });
    picLink.on('mousemove', function(e) {
        // SHOW A LITTLE RECTANGLE AS YOU'RE EDITING
        const state = ANNOT_EDIT_STATE;
        if( !state.active || state.clicks !== 1 ) return;

        const rect = picLink.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left)/rect.width;
        const mouseY = (e.clientY - rect.top)/rect.height;    
        ANNOT_EDIT_BOX.style.left   = min(state.x,  mouseX)*100 + '%';
        ANNOT_EDIT_BOX.style.top    = min(state.y,  mouseY)*100 + '%';
        ANNOT_EDIT_BOX.style.width  = abs(state.x - mouseX)*100 + '%';
        ANNOT_EDIT_BOX.style.height = abs(state.y - mouseY)*100 + '%';
    });
}



//--------------------------- SECRET STUFF ---------------------------//

function hashCode (s) {
    let hash = 0;
    if( !s.length ) return hash;
    for( let i = 0; i < s.length; i++ ){
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
};

function encrypt (s, k) {
    let bytes = k.split('').map(c=>c.charCodeAt());
    let l = bytes.length;
    return s.split('').map( (c, i) => (bytes[i%l] ^ c.charCodeAt() ^ 3**(i%l) ^ 5**l) & 255 ).map( n => String.fromCharCode(0x2200+n) ).join('');
}

function decrypt (s, k) {
    let bytes = k.split('').map(c=>c.charCodeAt());
    let l = bytes.length;
    return s.split('').map( x => x.charCodeAt()-0x2200 ).map( (c, i) => (bytes[i%l] ^ c ^ 3**(i%l) ^ 5**l) & 255 ).map(c => String.fromCharCode(c)).join('');
}