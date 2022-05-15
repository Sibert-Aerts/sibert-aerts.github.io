/*
    Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/macro-generator.html)
*/

///// TINY DOM UTIL FUNCTIONS
const byId = id => document.getElementById(id)
const getInput = name => document.getElementsByTagName('input').namedItem(name)
const makeElem = (tag, clss, text) => { let e = document.createElement(tag); if(clss) e.className = clss; if(text) e.textContent = text; return e }


/** Handles incoming images. */
class ImageHandler {
    /** @type ImageGenerator */
    owner
    /** @type HTMLImageElement */
    image = null
    /** @type string */
    imageType = null
    
    URLinput = byId('image-URL')
    fileSelect = byId('image-upload')

    constructor(owner) {
        this.owner = owner
        // URL event bindings
        this.URLinput.onchange = this.handleImageURL.bind(this)
        this.URLinput.onkeyup = e => { if (e.code==='Enter') this.handleImageURL() }
        // File select event bindings
        this.fileSelect.onchange = this.handleFileSelect.bind(this)
        // Paste event bindings
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
            this.image.src = event.target.result
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
        this.owner.redrawImage()
    }
    onerror() {
        this.image = this.imageType = undefined
        this.owner.clear()
    }
}


class Sliders {

    /** @type {HTMLInputElement[]} */
    sliders = []
    /** @type {{ [name: string]: HTMLInputElement }} */
    byName = {}
    /** @type {boolean} */
    usable = true

    /** @type {Callback} */
    onchange = null

    /**
     * @param {HTMLElement} parent 
     * @param {string[]} names 
     */
    constructor(parent, names) {
        if( !parent ) {
            this.usable = false
            return
        }
        /// Find each slider 
        for( const name of names ) {
            const slider = parent.getElementsByTagName('input').namedItem(name)

            if( !slider ) {
                this.usable = false
                break
            }
            /// Add to our collections
            this.sliders.push(slider)
            this.byName[name] = slider
            slider.onchange = e => this.onchange(e)

            /// Hook up reset button
            const button = parent.getElementsByTagName('button').namedItem(name)
            if (button) button.onclick = () => { slider.value = button.value; slider.onchange() }
        }
    }

    /**
     *  @returns  {{ [name: string]: number }}
     */
    getValues() {
        const values = {}
        for( const slider of this.sliders )
            values[slider.name] = parseFloat(slider.value)
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
class ImageGenerator {
    /** @type readonly HTMLCanvasElement */
    canvas
    /** @type readonly CanvasRenderingContext2D  */
    ctx

    /** @type readonly HTMLAnchorElement   */
    saveLink = document.createElement('a')
    /** The two dimension view elements */
    dimView

    /** @type ImageHandler */
    imageHandler = new ImageHandler(this)

    constructor(parent=document) {
        // oops, getElementById only works for `document` since IDs are supposed to be unique
        const child = id => parent.getElementById(id)
        const childInput = name => parent.getElementsByTagName('input').namedItem(name)

        //// CANVAS
        this.canvas = child('canvas')
        this.ctx = this.canvas.getContext('2d')

        //// VIEW ELEMS
        this.dimView = { x: child('canv-dim-x'), y: child('canv-dim-y') }

        //// USER CONTROLS
        this.macroTypeSelect = child('macro-type')
        if( this.macroTypeSelect ) {
            this.macroTypeSelect.onchange = () => this.redrawImage()
            for( const layerType of layerTypeList ) {
                const elem = makeElem('option', null, layerType.name)
                elem.value = layerType.key
                this.macroTypeSelect.appendChild(elem)
            }
        }

        this.captionInput = childInput('image-caption')
        this.captionInput.oninput = () => this.autoRedraw()
        this.captionInput.onkeyup = e => { if (e.code==='Enter') this.redrawImage() }

        this.resolutionCheckbox = childInput('limit-resolution')
        this.resolutionCheckbox.onchange = () => this.redrawImage()

        //// SLIDERS
        this.macroSliders = new Sliders(parent, ['xOffset', 'yOffset', 'scale', 'underline', 'contrast'])
        this.macroSliders.onchange = () => this.autoRedraw()
        
        this.imageSliders = new Sliders(parent, ['imgSaturate', 'imgContrast', 'imgBrightness'])
        this.imageSliders.onchange = () => this.autoRedraw()
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
    
    /** Called when there is no image to draw. */
    clear() {
        this.canvas.width = 1920; this.canvas.height = 1080
        this.redrawImage()
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
     * Calls redrawImage() only if the underlying canvas isn't too huge for this feature to be laggy.
     */
    autoRedraw() {
        if(!this.tooBig()) this.redrawImage()
    }

    /** 
     * Call after major changes;
     * Blanks the canvas, redraws the selected image if any, and draws the text on top.
     */
    redrawImage() {
        const ctx = this.ctx
        this.resetDrawingState()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    
        if( this.imageHandler.image ) {
            const image = this.imageHandler.image

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
        // UI changes
        byId('resolution-warning').hidden = !this.tooBig()
        this.dimView.x.textContent = canvas.width
        this.dimView.y.textContent = canvas.height        
    
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
        this.saveLink.setAttribute('download', this.captionInput.value.replaceAll(/[^a-zA-Z ]/g, '') + '.' + imageType)
        this.saveLink.setAttribute('href', canvas.toDataURL('image/' + imageType).replace('image/' + imageType, 'image/octet-stream'))

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
 * @prop {() => void} draw()
 */


/** @type DrawableLayer */
const ds1Victory = {
    key: 'ds1-victory',
    name: 'DS1 - Victory',

    draw(ctx, canvas, gen) {
        // Prefer all-caps caption
        if( gen.captionInput.value === 'Enter Caption' )
            gen.captionInput.value = 'ENTER CAPTION'
    
        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080
    
        // USER INPUT
        const { xOffset, yOffset, scale, underline, contrast } = gen.macroSliders.getValues()

        const x0 = (xOffset + .4)/100 * w
        const y0 = (yOffset)/100 * h
        const s0 = 2**scale
        s *= s0
        const shadeScale = underline/32 * s0
    
        // The shade only moves up or down
        ctx.translate(0, y0)
        // SHADE
        if( shadeScale > 0 ) {
            const shadeHeight = shadeScale * .25*h
            const SHADECENTER = .53*h
            const top = SHADECENTER-shadeHeight/2, bottom = SHADECENTER+shadeHeight/2
    
            const shadowGrad = ctx.createLinearGradient(0, top, 0, bottom)
            shadowGrad.addColorStop(0,   '#0000')
            shadowGrad.addColorStop(0.25, `rgba(0, 0, 0, ${.7 * contrast**0.4})`)
            shadowGrad.addColorStop(0.75, `rgba(0, 0, 0, ${.7 * contrast**0.4})`)
            shadowGrad.addColorStop(1,   '#0000')
            ctx.fillStyle = shadowGrad
            ctx.fillRect(0, top, w, shadeHeight)
        }
        
        // The text also moves left or right
        ctx.translate(x0, 0)
    
        // TEXT
        caption = gen.captionInput.value
    
        // This feature only works on chromia, otherwise just inject hair-spaces between letters
        if( !!window.chrome )
            canvas.style.letterSpacing = Math.floor(8*s) + 'px'
        else
            caption = caption.split('').join(' ')
    
        ctx.font = Math.floor(92*s) + 'px adobe-garamond-pro'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const MAGICOFFSET = .032*h
        ctx.translate(0, MAGICOFFSET)
        
        const VSCALE = 1.5
        ctx.scale(1, VSCALE)
        ctx.save()

        // Emulate the zoom blur effect
        const zoomSteps = Math.floor(20 * Math.pow(s, 1/4))
        const ZOOMSIZE = 1.10
        // zoomFactor**zoomSteps = ZOOMSIZE
        const zoomFactor = Math.pow(ZOOMSIZE, 1/zoomSteps)
        // Zoom blur center offset
        const VOFFSET = MAGICOFFSET

        for( let i=0; i<=zoomSteps; i++ ) {
            if( i ) ctx.scale(zoomFactor, zoomFactor)
            // `product` ranges from 1 up to and including ZOOMSIZE
            const product = Math.pow(ZOOMSIZE, i/zoomSteps)
            // `fatProduct` ranges from 1 up to and including ±2
            const fatProduct = product ** 7
    
            ctx.filter = `blur(${Math.floor(s*fatProduct)}px`
            ctx.fillStyle = `rgba(255, 180, 60, ${0.1 / fatProduct})`
            ctx.fillText(caption, w/2/product, ((h/2-VOFFSET)/product+VOFFSET)/VSCALE)
        }
        
        ctx.restore()
        ctx.fillStyle = `rgba(255, 255, 107, 0.9)`
        ctx.fillText(caption, w/2, h/2/VSCALE )
    }
}

/** @type DrawableLayer */
const ds3Death = {
    key: 'ds3-death',
    name: 'DS3 - Death',

    draw(ctx, canvas, gen) {
        // Prefer all-caps caption
        if( gen.captionInput.value === 'Enter Caption' )
            gen.captionInput.value = 'ENTER CAPTION'

        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080

        // USER INPUT
        const { xOffset, yOffset, scale, underline, contrast } = gen.macroSliders.getValues()
        
        const x0 = (xOffset + .6)/100 * w
        const y0 = (yOffset + 1.8)/100 * h
        const s0 = 2**scale
        s *= s0
        const shadeScale = underline/32 * s0

        // The shade only moves up or down
        ctx.translate(0, y0)
        // SHADE
        if( shadeScale > 0 ) {
            const shadeHeight = shadeScale * .2*h
            const top = .5*h-shadeHeight/2, bottom = .5*h+shadeHeight/2

            const shadowGrad = ctx.createLinearGradient(0, top, 0, bottom)
            shadowGrad.addColorStop(0,   '#0000')
            shadowGrad.addColorStop(0.25, `rgba(0, 0, 0, ${.5 * contrast**0.7})`)
            shadowGrad.addColorStop(0.75, `rgba(0, 0, 0, ${.5 * contrast**0.7})`)
            shadowGrad.addColorStop(1,   '#0000')
            ctx.fillStyle = shadowGrad
            ctx.fillRect(0, top, w, shadeHeight)
        }
        
        // The text also moves left or right
        ctx.translate(x0, 0)

        // TEXT
        ctx.font = Math.floor(148*s) + 'px adobe-garamond-pro'
        ctx.fillStyle = `rgb(${120*contrast}, ${10*contrast}, ${20*contrast})`
        ctx.textAlign = 'center'
        
        ctx.shadowBlur = 4*s
        ctx.shadowColor = `rgba(255, 20, 20, .2)`

        ctx.scale(1, 1.3)
        ctx.fillText(gen.captionInput.value, w/2, (h/2 + 50*s)/1.3 )
    }
}

/** @type DrawableLayer */
const ds3Area = {
    key: 'ds3-area',
    name: 'DS3 - Area Name',

    draw(ctx, canvas, gen) {
        // Prefer title-case caption
        if( gen.captionInput.value === 'ENTER CAPTION' )
            gen.captionInput.value = 'Enter Caption'
    
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
    draw() {}
}

const layerTypeList = [ds1Victory, ds3Area, ds3Death, emptyLayer]

/** 
 * Object containing all types of drawable layers, indexed by key.
 * @type {{[key: string] : DrawableLayer}} 
 */
const layerTypes = {}
layerTypeList.map( macro => layerTypes[macro.key] = macro)