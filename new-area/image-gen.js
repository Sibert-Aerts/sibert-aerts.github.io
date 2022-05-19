/*
    Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/macro-generator.html)
*/

///// TINY UTILS
const byteClamp = x => (isNaN(x))? 0 : (x > 255)? 255 : (x<0)? 0 : Math.floor(x)

///// TINY DOM UTILS
const byId = id => document.getElementById(id)
const makeElem = (tag, clss, text) => { let e = document.createElement(tag); if(clss) e.className = clss; if(text) e.textContent = text; return e }


///// TINY COLOR UTILS

/** Must be used EXCLUSIVELY with strings of the form '#abcdef', such as input.color. */
const hexToRGB = (h) => Array.from( h.matchAll(/[^#]{2}/g) ).map( x => parseInt(x[0], 16) )
/** Must be used EXCLUSIVELY with integers [0, 255]. */
const RGBToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0') ).join('')
/** May be used with any numbers; floors and clamps them first. */
const laxRGBToHex = (r=0, g=0, b=0) => RGBToHex(...[r, g, b].map(byteClamp))

/** Multiply two lax RGB arrays into a lax RGB array. */
const RGBMul = (c, d) => [c[0]*d[0]/255, c[1]*d[1]/255, c[2]*d[2]/255]



/** Handles incoming images. */
class ImageHandler {
    /** @type MacroGenerator */
    macroGen

    /** @type HTMLElement */
    parent
    /** @type HTMLInputElement */
    URLinput
    /** @type HTMLInputElement */
    fileSelect

    /** @type HTMLImageElement */
    image = null
    /** @type string */
    imageType = null    

    /**
     * @param {MacroGenerator} macroGen 
     * @param {HTMLElement} parent
     */
    constructor(macroGen, parent) {
        this.macroGen = macroGen
        this.parent = parent

        /// URL event bindings
        this.URLinput = parent.getElementsByTagName('input').namedItem('image-URL')
        this.URLinput.onchange = this.handleImageURL.bind(this)
        this.URLinput.onkeyup = e => { if (e.code==='Enter') this.handleImageURL() }

        /// File select event bindings
        this.fileSelect = parent.getElementsByTagName('input').namedItem('image-upload')
        this.fileSelect.onchange = this.handleFileSelect.bind(this)

        /// Paste event bindings
        // Currently binds to document because there's no other ImageHandler to need to contest with
        document.addEventListener('paste', this.handlePaste.bind(this))
    }

    /** File Selector callback function. */
    handleFileSelect() {
        this.image = this.imageType = null

        if( !this.fileSelect.files.length ) {
            if( this.URLinput.value )
                this.handleImageURL()
            else
                this.onerror()
            return
        }
        const reader = new FileReader()
        reader.onload = e => {
            this.image = new Image()
            this.image.onload = this.onload.bind(this)
            this.image.src = e.target.result
        }
        reader.readAsDataURL(this.fileSelect.files[0])
        this.imageType = this.fileSelect.files[0].type
    }

    /** Image URL callback function. */
    handleImageURL() {
        this.image = this.imageType = null
        this.URLinput.classList.remove('bad-url')

        if( !this.URLinput.value ) {
            if( this.fileSelect.files.length )
                this.handleFileSelect()
            else
                this.onerror()
            return
        }
        this.image = new Image()
        this.image.crossOrigin = 'anonymous'

        this.image.onload = this.onload.bind(this)
        this.image.onerror = e => {
            console.error('Failed to load provided image URL:', this.URLinput.value, e)
            this.URLinput.classList.add('bad-url')
            this.onerror()
        }
        // Attempt to pull image type from URL
        this.imageType = this.URLinput.value.match(/\.(\w+)$/)?.[1]
        this.image.src = this.URLinput.value
    }

    /** Callback that checks if the user is pasting an image onto the page. */
    handlePaste(e) {
        /** @type DataTransferItemList */
        const clipboardItems = e.clipboardData.items
        const items = Array.from(clipboardItems).filter(item => item.type.startsWith('image'))
        if ( !items.length ) return
        const file = items[0].getAsFile()
        
        var reader = new FileReader()
        reader.onload = e => {
            this.image = new Image()
            this.image.onload = this.onload.bind(this)
            this.image.src = e.target.result
        }
        reader.readAsDataURL(file)
        this.imageType = file.type
    }

    onload() {
        this.macroGen.imageSliders.show()
        this.macroGen.redrawMacro()
    }
    onerror() {
        this.image = this.imageType = undefined
        this.macroGen.clear()
    }
}


class Sliders {
    /** @type {string} */
    name
    /** @type {HTMLElement} */
    element

    /** @type {HTMLInputElement[]} */
    sliders = []
    /** @type {{[name: string]: HTMLInputElement}} */
    byName = {}
    /** @type {boolean} */
    usable = false

    /** @type {Callback} */
    onchange = null

    /**
     * @param {string} name
     * @param {HTMLElement} parent 
     * @param {string[]} names 
     */
    constructor(name, parent, names) {
        if( !parent ) return

        this.element = parent.getElementsByClassName('sliders-container').namedItem(name)
        if( !this.element ) return

        /// Find each slider
        // TODO: No more list of names, it should be able to find these itself
        for( const name of names ) {
            const slider = this.element.getElementsByTagName('input').namedItem(name)

            if( !slider ) return

            /// Add to our collections
            this.sliders.push(slider)
            this.byName[name] = slider
            slider.onchange = e => this.onchange(e)

            /// Hook up reset button
            const button = this.element.getElementsByTagName('button').namedItem(name)
            if (button) {
                button.value = slider.value
                button.onclick = () => { slider.value = button.value; slider.onchange() }
            }
        }
        // If we make it through the whole thing without an early return, we're usable!
        this.usable = true
    }

    hide() {
        if( this.usable ) this.element.hidden = true
    }
    show() {
        if( this.usable ) this.element.hidden = false
    }

    /**
     *  @returns  {{ [name: string]: number }}
     */
    getValues() {
        const values = {}
        for( const slider of this.sliders ) {
            if( slider.type === 'range' )
                values[slider.name] = parseFloat(slider.value)
            else if( slider.type === 'color' && slider.getAttribute('as') === 'rgb' )
                values[slider.name] = hexToRGB(slider.value)
            else
                values[slider.name] = slider.value
        }
        return values
    }

    /**
     *  @param  {{ [name: string]: number }} values
     */
    setValues(values) {
        for( const name of values )
            this.byName[name].value = values[name]
    }
}   

/**
 *  The class that puts it all to work.
 */
class MacroGenerator {
    /** @type {readonly HTMLElement | Document} */
    element
    /** @type {readonly HTMLCanvasElement} */
    canvas
    /** @type {readonly CanvasRenderingContext2D}  */
    ctx

    /** @type {readonly HTMLAnchorElement}   */
    saveLink = document.createElement('a')

    /** @type {{ [name: string]: Sliders }} */
    sliders
    /** @type ImageHandler */
    imageHandler

    /**
     * @param {HTMLElement | Document} element
     */
    constructor(element=document) {
        this.element = element

        /** my(t, n) = "my element `<t>` named `n`" */
        const my = (tag, name) => element.getElementsByTagName(tag).namedItem(name)

        //// CANVAS
        this.canvas = my('canvas', 'canvas')
        this.ctx = this.canvas.getContext('2d')

        //// VIEW ELEMS
        this.resView = { x: my('span', 'canv-res-x'), y: my('span', 'canv-res-y') }
        this.resWarning = my('*', 'resolution-warning')

        //// IMAGE HANDLER
        this.imageHandler = new ImageHandler(this, my('div', 'global-sliders'))

        //// USER CONTROLS
        this.macroTypeSelect = my('select', 'macro-type')
        if( this.macroTypeSelect ) {
            this.macroTypeSelect.onchange = e => this.onMacroTypeChange(e)
            for( const layerType of layerTypeList ) {
                const elem = makeElem('option', null, layerType.name)
                elem.value = layerType.key
                this.macroTypeSelect.appendChild(elem)
            }
        }

        this.captionInput = my('input', 'image-caption')
        this.captionInput.oninput = () => this.autoRedraw()
        this.captionInput.onkeyup = e => { if (e.code==='Enter') this.redrawMacro() }

        this.resolutionCheckbox = my('input', 'limit-resolution')
        this.resolutionCheckbox.onchange = () => this.redrawMacro()

        //// SLIDERS
        this.macroSliders = new Sliders('area-name', element, ['xOffset', 'yOffset', 'scale', 'underline', 'contrast'])
        this.macroSliders.onchange = () => this.autoRedraw()
        
        this.victorySliders = new Sliders('victory', element, 
            ['xOffset', 'yOffset', 'scale', 'vScale', 'charSpacing', 'color', 'blurTint', 'blurSize', 'blurOpacity', 'shadowSize', 'shadowOpacity'])
        this.victorySliders.onchange = () => this.autoRedraw()
        
        this.imageSliders = new Sliders('image', element, ['imgSaturate', 'imgContrast', 'imgBrightness'])
        this.imageSliders.onchange = () => this.autoRedraw()

        this.sliders = {'area-name': this.macroSliders, 'image': this.imageSliders, 'victory': this.victorySliders }
        this.onMacroTypeChange(null, false)

        //// IN CASE OF TESTING ENVIRONMENT
        if( window['TESTING'] ){
            this.macroTypeSelect.value = TESTING.type
            this.captionInput.value = TESTING.caption
        }

    }

    /** Callback from the macro type select */
    onMacroTypeChange(e, redraw=true) {
        const oldType = this.macroTypeSelect.oldValue
        const newType = this.macroTypeSelect.value
        this.macroTypeSelect.oldValue = newType
        
        //// Hide/Show necessary sliders
        if( oldType ) layerTypes[oldType].sliders.forEach(n => this.sliders[n].hide())
        layerTypes[newType].sliders.forEach(n => this.sliders[n].show())

        //// Update generic caption
        if( this.captionInput.value === 'ENTER CAPTION' && layerTypes[newType].preferCase === 'title case' )
            this.captionInput.value = 'Enter Caption'
        else if( this.captionInput.value === 'Enter Caption' && layerTypes[newType].preferCase === 'all caps' )
            this.captionInput.value = 'ENTER CAPTION'

        //// Redraw (if desired)
        if (redraw) this.redrawMacro()
    }

    /** Check whether the current canvas is too big to allow auto-rerendering. */
    tooBig() {
        // Value chosen so that 1080 * 1920 is approximately the threshold
        return (this.canvas.width*this.canvas.height >= 2100000)
    }
    
    /** Resize the canvas only if necessary. */
    resizeCanvas(width, height) {
        if( this.canvas.width !== width || this.canvas.height !== height ) {
            this.canvas.width = width; this.canvas.height = height
        }
    }
    
    /** Called when there is no longer an image to draw. */
    clear() {
        this.canvas.width = 1920; this.canvas.height = 1080
        this.imageSliders.hide()
        this.redrawMacro()
    }

    /** Wipes all `ctx` and `canvas` properties that may affect how things are drawn to the canvas. */
    resetDrawingState() {
        // Clear out the ctx drawing state
        const ctx = this.ctx
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = null
        ctx.shadowBlur = null
        ctx.shadowColor = null
        ctx.shadowOffsetX = null
        ctx.shadowOffsetY = null
        ctx.font = 'none'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.filter = 'none'
    
        // On Chrome the canvas styling may affect drawing
        if( !!window.chrome ) {
            this.canvas.style.letterSpacing = null
        }
    }

    /** 
     * Call after minor input changes;
     * Calls redrawMacro() only if the underlying canvas isn't too huge for this feature to be laggy.
     */
    autoRedraw() {
        if( !this.tooBig() ) this.redrawMacro()
    }

    /** Redraw the underlying image, if any. */
    drawImage() {
        if( !this.imageHandler.image ) return
        const image = this.imageHandler.image
        const ctx = this.ctx

        if( this.resolutionCheckbox.checked ) {
            // Constrain image to be no larger than 1920x1080
            const scale = Math.min(1920/image.width, 1080/image.height, 1)
            this.resizeCanvas(image.width*scale, image.height*scale)
            ctx.scale(scale, scale)

        } else {
            this.resizeCanvas(image.width, image.height)
        }
        
        if( this.imageSliders.usable ) {
            const {imgSaturate, imgContrast, imgBrightness} = this.imageSliders.getValues()
            ctx.filter = `saturate(${imgSaturate}%) contrast(${imgContrast}%) brightness(${imgBrightness}%)`
        }
        
        ctx.drawImage(image, 0, 0)
        ctx.filter = 'none'
    }

    /** 
     * Call after major changes;
     * Blanks the canvas, redraws the selected image if any, and draws the text on top.
     */
    redrawMacro() {
        const ctx = this.ctx
        this.resetDrawingState()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    
        // May alter the resolution
        this.drawImage()

        // UI changes
        this.resWarning.hidden = !this.tooBig()
        this.resView.x.textContent = canvas.width
        this.resView.y.textContent = canvas.height        
    
        this.resetDrawingState()
        layerTypes[this.macroTypeSelect.value].draw(ctx, this.canvas, this)
    }

    /** Save the current contents of the canvas to the user's computer. */
    saveImage() {
        // Turn "image/xyz" to "xyz"
        let imageType = this.imageHandler.imageType?.replace(/(.*)\//g, '')

        // Normalise to either "jpeg" or "png"
        if( imageType === 'jpg' ) imageType = 'jpeg'
        else if( imageType !== 'jpeg' ) imageType = 'png'

        // Set the file name and put the image data
        const fileName = this.captionInput.value.replaceAll(/[^a-zA-Z0-9 ]/g, '') || 'macro'
        this.saveLink.setAttribute('download', fileName + '.' + imageType)
        this.saveLink.setAttribute('href', canvas.toDataURL('image/' + imageType))        
        this.saveLink.click()
    }
}


//========================================================================
//========================================================================
//========================       DRAWABLES       =========================
//========================================================================
//========================================================================


/** 
 * @typedef {Object} DrawableLayer
 * @prop {string} key
 * @prop {string} name
 * @prop {string} preferCase
 * @prop {string[]} sliders
 * 
 * @prop {(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gen: MacroGenerator) => void} draw()
 */


/** @type DrawableLayer */
const ds1Victory = {
    key: 'ds1-victory',
    name: 'DS1 - Victory',
    preferCase: 'all caps',
    sliders: ['victory'],

    draw(ctx, canvas, gen) {
        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080
    
        // USER INPUT
        const { xOffset, yOffset, scale, vScale, charSpacing, color, blurTint, blurSize, blurOpacity, shadowSize, shadowOpacity } = gen.victorySliders.getValues()

        const x0 = (xOffset +.2)/100 * w
        const y0 = (yOffset)/100 * h
        const s0 = 2**scale
        s *= s0

        // Center to which things align and also scale
        VERTICALCENTER = .532
    
        // The shade only moves up or down
        ctx.translate(0, y0)
        // SHADE
        if( shadowSize > 0 ) {
            const shadeHeight = shadowSize * .25*h * s0
            // Offset from the top of the frame when s0=1
            const shadeCentering = .53
            // Voodoo
            const shadeCenter = ( shadeCentering*s0 - VERTICALCENTER*(s0-1) ) * h
            // Duh
            const top = shadeCenter-shadeHeight/2, bottom = shadeCenter+shadeHeight/2
    
            const shadowGrad = ctx.createLinearGradient(0, top, 0, bottom)
            shadowGrad.addColorStop(0,   '#0000')
            shadowGrad.addColorStop(0.25, `rgba(0, 0, 0, ${.7 * shadowOpacity**0.4})`)
            shadowGrad.addColorStop(0.75, `rgba(0, 0, 0, ${.7 * shadowOpacity**0.4})`)
            shadowGrad.addColorStop(1,   '#0000')
            ctx.fillStyle = shadowGrad
            ctx.fillRect(0, top, w, shadeHeight)
        }
        
        // The text also moves left or right
        ctx.translate(x0, 0)
    
        // TEXT
        caption = gen.captionInput.value
    
        if( charSpacing ) {
            if( !!window.chrome && true ) {
                //// If on Chrome: This feature works (but does cause the horizontal centering to misalign)
                canvas.style.letterSpacing = Math.floor(charSpacing*s) + 'px'
                ctx.translate(charSpacing*s/2, 0)
                // TODO: this throws off the glow-blur centering

            } else if( charSpacing > 0 ) {
                //// Otherwise: simply inject little hair spaces in between each character
                const space = ' '.repeat(Math.floor(charSpacing/5))
                caption = caption.split('').join(space)
            }
        }
    
        ctx.font = (92*s) + 'px adobe-garamond-pro'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        const VSCALE = vScale
        ctx.scale(1, VSCALE)
        ctx.save()

        //// Emulate the zoom blur effect
        const ZOOMSIZE = blurSize
        const zoomSteps = Math.floor(20*ZOOMSIZE * Math.pow(s, 1/4))
        // zoomFactor**zoomSteps = ZOOMSIZE
        const zoomFactor = Math.pow(ZOOMSIZE, 1/zoomSteps)
        // Zoom blur vertical distance
        const VOFFSET = 1
        const voff = VOFFSET*s/(ZOOMSIZE-1)
        const blurColor = RGBMul(color, blurTint).map(byteClamp)

        for( let i=0; i<=zoomSteps; i++ ) {
            if( i ) ctx.scale(zoomFactor, zoomFactor)
            // `product` ranges from 1 up to and including ZOOMSIZE
            const product = Math.pow(ZOOMSIZE, i/zoomSteps)
            // `fatProduct` ranges from 1 up to and including ±2
            const fatProduct = Math.pow(product, 1/Math.log2(ZOOMSIZE))
    
            ctx.filter = `blur(${Math.floor(s*product**4)}px`
            ctx.fillStyle = `rgba(${blurColor.join()}, ${blurOpacity / fatProduct})`
            ctx.fillText(caption, w/2/product, ((h*VERTICALCENTER-voff)/product+voff)/VSCALE)
        }
        
        ctx.restore()
        ctx.fillStyle = `rgba(${color.join()}, 0.9)`
        ctx.fillText(caption, w/2, h*VERTICALCENTER/VSCALE )
    }
}

/** @type DrawableLayer */
const ds3Death = {
    key: 'ds3-death',
    name: 'DS3 - Death',
    preferCase: 'all caps',
    sliders: ['area-name'],

    draw(ctx, canvas, gen) {
        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080

        // USER INPUT
        const { xOffset, yOffset, scale, underline, contrast } = gen.macroSliders.getValues()
        
        const x0 = (xOffset + .4)/100 * w
        const y0 = (yOffset + 1.8)/100 * h
        const s0 = 2**scale
        s *= s0
        const shadeScale = underline/32

        // The shade only moves up or down
        ctx.translate(0, y0)
        // SHADE
        if( shadeScale > 0 ) {
            const shadeHeight = shadeScale*.17* h*s0
            // Offset from the top of the frame when s0=1
            const shadeCentering = .485
            const scaleCenter = .5
            // Voodoo
            const shadeCenter = ( shadeCentering*s0 - scaleCenter*(s0-1) ) * h
            // Duh
            const top = shadeCenter-shadeHeight/2, bottom = shadeCenter+shadeHeight/2

            const shadowGrad = ctx.createLinearGradient(0, top, 0, bottom)
            shadowGrad.addColorStop(0,   '#0000')
            shadowGrad.addColorStop(0.25, `rgba(0, 0, 0, ${.6 * contrast**0.5})`)
            shadowGrad.addColorStop(0.75, `rgba(0, 0, 0, ${.6 * contrast**0.5})`)
            shadowGrad.addColorStop(1,   '#0000')
            ctx.fillStyle = shadowGrad
            ctx.fillRect(0, top, w, shadeHeight)
        }
        
        // The text also moves left or right
        ctx.translate(x0, 0)

        // TEXT
        ctx.font = Math.floor(150*s) + 'px adobe-garamond-pro'
        ctx.fillStyle = `rgb(${100*contrast}, ${10*contrast}, ${10*contrast})`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // ctx.shadowBlur = 4*s
        // ctx.shadowColor = `rgba(255, 20, 20, .2)`

        ctx.scale(1, 1.3)
        ctx.fillText(gen.captionInput.value, w/2, h/2/1.3 )
    }
}

/** @type DrawableLayer */
const ds3Area = {
    key: 'ds3-area',
    name: 'DS3 - Area Name',
    preferCase: 'title case',
    sliders: ['area-name'],

    draw(ctx, canvas, gen) {
        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080
    
        // USER INPUT
        let { xOffset, yOffset, scale, underline, contrast } = gen.macroSliders.getValues()

        const x0 = xOffset/100 * w
        const y0 = yOffset/100 * h
        const s0 = 2**scale
        underline = underline/100
        ctx.translate(x0, y0)
        s *= s0
    
        // UNDERLINE
        if( underline > 0 ) {
            const left = (.5-underline)*w, right = (.5+underline)*w
            const length = 2*underline*w
    
            const shadowGrad = ctx.createLinearGradient(left, 0, right, 0)
            shadowGrad.addColorStop(0,   '#0000')
            shadowGrad.addColorStop(0.1, `rgba(0, 0, 0, ${.25 * contrast})`)
            shadowGrad.addColorStop(0.9, `rgba(0, 0, 0, ${.25 * contrast})`)
            shadowGrad.addColorStop(1,   '#0000')
            ctx.fillStyle = shadowGrad
            ctx.fillRect(left, .51*h+5*s, length, 3*s)
    
            const grad = ctx.createLinearGradient(left, 0, right, 0)
            grad.addColorStop(0,   '#fff0')
            grad.addColorStop(0.1, `rgba(255, 255, 255, ${.75 * Math.max(1, contrast)})`)
            grad.addColorStop(0.9, `rgba(255, 255, 255, ${.75 * Math.max(1, contrast)})`)
            grad.addColorStop(1,   '#fff0')
            ctx.fillStyle = grad
            ctx.fillRect(left, .51*h, length, 5*s)
        }
    
        // TEXT
        ctx.shadowOffsetX = 2*s
        ctx.shadowOffsetY = 1*s
        ctx.shadowBlur = 8*s
    
        ctx.font = Math.floor(96*s) + 'px adobe-garamond-pro'
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
    
        // Apply contrast by just redrawing the same text so the shadow overlaps
        //      0.85 * 1.17 ~= 1
        while( contrast >= 0 ) {
            ctx.shadowColor = `rgba(0, 0, 0, ${.85 * Math.min(contrast, 1.17)})`
            ctx.fillText(gen.captionInput.value, w/2, h*(0.5 + (1-(s0-1)/3)*0.007 ))
            contrast -= 1.17
        }
    }
}

const emptyLayer = {
    key: 'none',
    name: 'Nothing',
    sliders: [],

    draw() {}
}

/** Keep this up-to-date manually. */
const layerTypeList = [ds1Victory, ds3Area, ds3Death, emptyLayer]

/** 
 * Object containing all types of drawable layers, indexed by key.
 * @type {{[key: string] : DrawableLayer}} 
 */
const layerTypes = {}
layerTypeList.map( macro => layerTypes[macro.key] = macro)


//// TESTING ENVIRONMENT

// window['TESTING'] = {
//     type: 'ds1-victory',
//     caption: 'VICTORY ACHIEVED'
// }
