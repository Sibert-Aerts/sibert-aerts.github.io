/*
    Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/macro-generator.html)
*/
'use strict';

///// TINY UTILS
const byteClamp = x => (isNaN(x))? 0 : (x > 255)? 255 : (x<0)? 0 : Math.floor(x)

///// TINY DOM UTILS
const byId = id => document.getElementById(id)
const makeElem = (tag, clss, text) => { const e = document.createElement(tag); if(clss) e.className = clss; if(text) e.textContent = text; return e }
const makeOption = (value, text) => { const o = document.createElement('option'); o.textContent = text; o.value = value; o.setAttribute('name', value); return o }


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

/** 
 * @typedef {Object} Converter<T>
 * @prop { (string) => T }  parse 
 * @prop { (T) => string | number }  toString 
*/

/** @type {{ [name: string]: { new(string) => Converter } }}  */
const CONVERTERS = {
    string: class {
        parse = x => x
        toString = x => x
    },
    float: class {
        parse = parseFloat
        toString = x => x.toString()
    },
    rgb: class {
        parse = hexToRGB
        toString([r, g, b]){ return RGBToHex(r, g, b) }
    },
    log: class {
        constructor(string) {
            this.base = parseFloat(string.slice(3))
            this.logb = Math.log(this.base)
        }   
        parse(value) { return Math.pow(this.base, parseFloat(value)) }
        toString(value) { return Math.log(parseFloat(value))/this.logb }
    }
}

const DEFAULT_CONVERTERS = {
    text: 'string',
    range: 'float',
    color: 'rgb'
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
    constructor(name, parent) {
        this.name = name
        if( !parent ) return

        this.element = parent.getElementsByClassName('sliders-container').namedItem(name)
        if( !this.element ) return

        /// Find each slider
        for( const div of this.element.children ) {
            if( div.tagName !== 'DIV' ) continue

            const slider = div.getElementsByTagName('input')[0]
            if( !slider ) return

            /// Add to our collections
            this.sliders.push(slider)
            this.byName[slider.name] = slider
            slider.onchange = e => {
                if( slider.resetButton ) slider.resetButton.disabled = false
                this.onchange(e)
            }
            /// Assign its converter instance
            let as = slider.getAttribute('as') || DEFAULT_CONVERTERS[slider.type] || 'string'
            for( const conv in CONVERTERS )
                if( as.startsWith(conv) )
                    { slider.converter = new CONVERTERS[conv](as); break }

            /// Assign its default
            slider.value = slider.getAttribute('default')

            /// Hook up reset button
            /** @type {HTMLButtonElement} */
            const resetButton = div.getElementsByClassName('reset-button')[0]
            if (resetButton) {
                slider.resetButton = resetButton
                resetButton.value = slider.value
                resetButton.disabled = true

                resetButton.onclick = () => {
                    slider.value = resetButton.value
                    slider.onchange()
                    resetButton.disabled = true
                }
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
     *  @returns  {{ [name: string]: any }}
     */
    getValues() {
        const values = {}
        for( const slider of this.sliders ) {
            values[slider.name] = slider.converter.parse(slider.value)
        }
        return values
    }

    /**
     *  @param  {{ [name: string]: any }} values
     */
    setValues(values) {
        for( const name in values ) {
            const slider = this.byName[name]
            slider.value = slider.converter.toString(values[name])
        }
    }

    /**
     *  @param  {{ [name: string]: any }} values
     */
    setDefaults(values) {
        for( const name in values ) {
            const slider = this.byName[name]
            if( slider.resetButton ) {
                const val = slider.converter.toString(values[name])
                slider.resetButton.value = val
                if( slider.resetButton.disabled )
                    slider.value = val
            }
        }
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
    /** @type {ImageHandler} */
    imageHandler

    /** @type {HTMLSelectElement} */
    macroTypeSelect
    /** @type {HTMLSelectElement} */
    gameSelect
    /** @type { {[type in keyof MacroType]: {[game in keyof Game]: HTMLSelectElement}} } */
    presetSelects
    /** @type {HTMLElement} */
    presetHolder

    /** @type {DrawableLayer} */
    previousLayerType

    /**
     * @param {HTMLElement | Document} element
     */
    constructor(element=document) {
        this.element = element

        /** my(t, n) = "my element `<t>` named `n`" */
        const my = this.my = (tag, name) => element.getElementsByTagName(tag).namedItem(name)

        //// CANVAS
        this.canvas = my('canvas', 'canvas')
        this.ctx = this.canvas.getContext('2d')

        //// VIEW ELEMS
        this.resView = { x: my('span', 'canv-res-x'), y: my('span', 'canv-res-y') }
        this.resWarning = my('*', 'resolution-warning')

        //// IMAGE HANDLER
        this.imageHandler = new ImageHandler(this, my('div', 'global-sliders'))

        //// MACRO TYPE SELECTION
        this.createSelects()

        //// OTHER CONTROLS
        this.captionInput = my('input', 'image-caption')
        this.captionInput.oninput = () => this.autoRedraw()
        this.captionInput.onkeyup = e => { if (e.code==='Enter') this.redrawMacro() }
        if( window.MACROGEN_DEFAULTS?.caption )
            this.captionInput.value = window.MACROGEN_DEFAULTS.caption

        this.resolutionCheckbox = my('input', 'limit-resolution')
        this.resolutionCheckbox.onchange = () => this.redrawMacro()

        //// SLIDERS
        this.macroSliders = element.getElementsByTagName('DIV').namedItem('macro-sliders')
        
        this.sliders = {}
        for( const slidersName of ['position', 'font', 'zoomBlur', 'slaughter', 'area', 'shadow'] ) {
            const sliders = new Sliders(slidersName, this.macroSliders)
            this.sliders[slidersName] = sliders
            sliders.onchange = () => this.autoRedraw()
        }
        
        this.imageSliders = new Sliders('image', element)
        this.imageSliders.onchange = () => this.autoRedraw()


        this.onMacroTypeChange(null, false)
    }

    createSelects() {
        const onchange = e => this.onMacroTypeChange(e)

        //// Macro Type
        this.macroTypeSelect = this.my('select', 'macro-type')
        this.macroTypeSelect.onchange = onchange

        for( const key in MacroType )
            this.macroTypeSelect.appendChild(makeOption(key, macroTypeName[key]))

        this.macroTypeSelect.value = window.MACROGEN_DEFAULTS.macroType

        //// Game
        this.gameSelect = this.my('select', 'macro-type-game')
        this.gameSelect.onchange = onchange

        for( const key in Game )
            this.gameSelect.appendChild(makeOption(key, gameName[key]))

        this.gameSelect.value = window.MACROGEN_DEFAULTS.game

        //// Preset (depends on combination of type+game)
        this.presetSelects = {}
        this.presetHolder = this.my('div', 'macro-type-preset-holder')

        for( const type in MacroType ) {
            this.presetSelects[type] = {}

            for( const game in Game ) {
                if( !layerTypesMap[type][game] ) continue

                const select = makeElem('select')
                for( const preset in layerTypesMap[type][game] )
                    select.appendChild(makeOption(preset, preset))

                this.presetHolder.appendChild(select)
                this.presetSelects[type][game] = select
                select.onchange = onchange
            }
        }
    }

    /** Callback from the macro type select */
    onMacroTypeChange(e, redraw=true) {
        const oldType = this.previousLayerType
        const newType = this.getLayerType()
        this.previousLayerType = newType

        const [macroType, game] = this.getLayerTypeKeys()

        //// Hide/Show necessary sliders
        for( let n in oldType?.sliders )
            this.sliders[n].hide()

        for( let n in newType.sliders ) {
            this.sliders[n].setDefaults(newType.sliders[n])
            this.sliders[n].show()
        }

        //// Hide/Show relevant Preset selects (if any)
        const usingNounVerbed = (macroType === MacroType.nounVerbed)

        this.presetHolder.parentNode.hidden = !usingNounVerbed
        if( usingNounVerbed ) {
            for( const typeKey in MacroType ) for( const gameKey in Game ) {
                if( this.presetSelects[typeKey][gameKey] ) {
                    this.presetSelects[typeKey][gameKey].hidden = (typeKey !== macroType || gameKey !== game)
                }
            }
        }
        //// Enable/disable Game options
        for( const gameKey in Game )
            this.gameSelect.namedItem(gameKey).disabled = !this.presetSelects[macroType][gameKey]

        //// Update generic caption
        if( this.captionInput.value === 'ENTER CAPTION' && newType.preferCase === 'title case' )
            this.captionInput.value = 'Enter Caption'
        else if( this.captionInput.value === 'Enter Caption' && newType.preferCase === 'all caps' )
            this.captionInput.value = 'ENTER CAPTION'

        //// Redraw (if desired)
        if (redraw) this.redrawMacro()
    }

    /** @returns {[ keyof MacroType, keyof Game, string ]} */
    getLayerTypeKeys() {
        const macroType = this.macroTypeSelect.value
        let game = this.gameSelect.value
        if( !this.presetSelects[macroType][game] ) {
            for( const newGame in Game )
                if( this.presetSelects[macroType][newGame] ) {
                    game = this.gameSelect.value = newGame; break
                }
        }
        const preset = this.presetSelects[macroType][game].value

        return [macroType, game, preset]
    }

    /** @returns {DrawableLayer} */
    getLayerType() {
        const [macroType, game, preset] = this.getLayerTypeKeys()
        return layerTypesMap[macroType][game]?.[preset]
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
        ctx.globalCompositeOperation = 'source-over'
    
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
        const layerType = this.getLayerType()
        layerType.draw(ctx, this.canvas, this)
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


// Artisanal enum-type things

const MacroType = {
    nounVerbed: 'nounVerbed', areaName: 'areaName', youDied: 'youDied',
}
const macroTypeName = {
    nounVerbed: 'NOUN VERBED',
    areaName: 'Area Name',
    youDied: 'YOU DIED'
}

const Game = {
    des: 'des', ds1: 'ds1', ds2: 'ds2', ds3: 'ds3', bb: 'bb', se: 'se', er: 'er',
}
const gameName = {
    des: "Demon's Souls",
    ds1: 'Dark Souls',
    ds2: 'Dark Souls II',
    ds3: 'Dark Souls III',
    bb:  'Bloodborne',
    se:  'Sekiro',
    er:  'Elden Ring',
}

/** 
 * @typedef {(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gen: MacroGenerator) => void} drawFun
 */

/** 
 * @typedef {Object} DrawableLayer
 * 
 * @prop {keyof MacroType} type
 * @prop {keyof Game} game
 * @prop {string} preset
 * 
 * @prop {'all caps' | 'title case'} preferCase
 * @prop {object} sliders
 * 
 * @prop {drawFun} draw()
 */

/** @type {DrawableLayer[]} */
const layerTypes = []


/** PARTIAL: Draws a horizontal shadow bar at y=50%. */
function drawShadowBar(ctx, canvas, gen, s0) {
    const w = canvas.width, h = canvas.height
    const { shadowSize, shadowOpacity, shadowOffset, shadowSoftness } = gen.sliders.shadow.getValues()

    if( shadowSize === 0 ) return

    const shadowHeight = shadowSize * .25*h * s0
    const targetCenter = .5 + shadowOffset
    const SCALECENTER = .5
    // Voodoo to account for the manual scaling factor
    const shadowCenter = (targetCenter*s0 - SCALECENTER*(s0-1)) * h
    const top = shadowCenter-shadowHeight/2, bottom = shadowCenter+shadowHeight/2

    const softnessLow  = Math.min(1, shadowSoftness)
    const softnessHigh = Math.max(1, shadowSoftness) - 1

    const gradient = ctx.createLinearGradient(0, top, 0, bottom)
    gradient.addColorStop(0, '#0000')
    gradient.addColorStop(  .25*softnessLow, `rgba(0, 0, 0, ${shadowOpacity})`)
    gradient.addColorStop(1-.25*softnessLow, `rgba(0, 0, 0, ${shadowOpacity})`)
    gradient.addColorStop(1, '#0000')
    ctx.fillStyle = gradient

    if( softnessHigh > 0 )
        ctx.filter = `blur(${Math.floor(shadowHeight*softnessHigh/4)}px)`

    ctx.fillRect(-shadowHeight/2, top, w+shadowHeight, shadowHeight)    
    ctx.filter = 'none'
}

/** PARTIAL: Sets the appropriate ctx properties. */
function applyFontSliders(ctx, canvas, gen, s) {
    const { fontSize, textColor, fontFamily, vScale, charSpacing, fontWeight } = gen.sliders.font.getValues()

    let caption = gen.captionInput.value

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

    ctx.font = `${fontWeight} ${fontSize*s}px ${fontFamily}`
    ctx.fillStyle = `rgb(${textColor.join()})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    ctx.scale(1, vScale)

    return [caption, vScale]
}


/** @type {drawFun} Function which draws a NOUN VERBED.  */
function drawNounVerbed(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { color, blurTint, blurSize, blurOpacity } = gen.sliders.zoomBlur.getValues()

    const x0 = xOffset * w
    const y0 = yOffset * h
    s *= s0

    // Center to which things align and also scale
    const VERTICALCENTER = .5

    // The shade only moves up or down
    ctx.translate(0, y0)

    //// SHADE
    drawShadowBar(ctx, canvas, gen, s0)
    
    // The text also moves left or right
    ctx.translate(x0, 0)

    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
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

        ctx.filter = `blur(${Math.floor(s*product**4)}px)`
        ctx.fillStyle = `rgba(${blurColor.join()}, ${blurOpacity / fatProduct})`
        ctx.fillText(caption, w/2/product, ((h*VERTICALCENTER-voff)/product+voff)/vScale)
    }
    
    ctx.restore()
    ctx.fillStyle = `rgba(${color.join()}, 0.9)`
    ctx.fillText(caption, w/2, h*VERTICALCENTER/vScale )
}


/** @type {drawFun} Function which draws Bloodborne's PREY SLAUGHTERED.  */
function drawPreySlaughtered(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { textOpacity, glowColor, glowSize, glowOpacity } = gen.sliders.slaughter.getValues()

    const x0 = xOffset * w
    const y0 = yOffset * h
    s *= s0

    ctx.translate(x0, y0)

    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.globalCompositeOperation = 'lighter' // blend mode: Add
    ctx.filter = `blur(${s/2}px)`

    /// First: Just draw the text, no glow
    const [r, g, b] = gen.sliders.font.getValues().textColor
    ctx.fillStyle = `rgba(${0}, ${g}, ${0}, ${textOpacity})`
    ctx.fillText(caption, w/2, h/2/vScale)
    ctx.fillStyle = `rgba(${r}, ${0}, ${b}, ${textOpacity})`
    ctx.fillText(caption, w/2-s, h/2/vScale)

    /// Then: Draw the text black (invisible) multiple times to get more glow.
    ctx.fillStyle = `#000`
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0

    for( let opacity=glowOpacity; opacity > 0; ) {
        // Extending the blur size for over-opacity gives a nicer, smoother effect
        ctx.shadowBlur = glowSize * Math.max(Math.sqrt(opacity), 1)
        ctx.shadowColor = `rgb(${glowColor.join()}, ${opacity})`
        ctx.fillText(caption, w/2, h/2/vScale)
        opacity--
    }
}

/** @type {drawFun} Function which draws an Area Name. */
function drawAreaName(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { underline, contrast } = gen.sliders.area.getValues()

    const x0 = xOffset * w
    const y0 = yOffset * h
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

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.textBaseline = 'alphabetic'

    // Apply contrast by just redrawing the same text so the shadow overlaps
    //      0.85 * 1.17 ~= 1
    for( let c = contrast; c >= 0; ) {
        ctx.shadowColor = `rgba(0, 0, 0, ${.85 * Math.min(c, 1.17)})`
        // The y-coordinate here is just magic numbers nonsense I found...
        ctx.fillText(caption, w/2, h*(0.5 + (1-(s0-1)/3)*0.007 )/vScale)
        c -= 1.17
    }
}

/** @type {drawFun} Function which draws an YOU DIED. */
function drawYouDied(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()    
    const x0 = xOffset*w, y0 = yOffset*h
    s *= s0

    // The shade only moves up or down
    ctx.translate(0, y0)
    // SHADE
    drawShadowBar(ctx, canvas, gen, s0)
    // The text also moves left or right
    ctx.translate(x0, 0)

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)    
    ctx.fillText(caption, w/2, h/2/vScale)
}


////////////////////// Actually define them //////////////////////

//////// NOUN VERBED

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'VICTORY ACHIEVED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: .002, yOffset: 0.032, scale: 1 
        },
        font: {
            fontSize: 92, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 8,
            fontWeight: 100,
        },
        zoomBlur: {
            color: [255, 255, 107], blurTint: [255, 178, 153],
            blurSize: 1.1, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.002, shadowSoftness: 1,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'HUMANITY RESTORED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -0.001, yOffset: 0.038, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 0,
            fontWeight: 100,
        },
        zoomBlur: {
            color: [129, 187, 153], blurTint: [187, 201, 192],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.002, shadowSoftness: 1,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'HEIR OF FIRE DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.317, charSpacing: 1.5,
            fontWeight: 100,
        },
        zoomBlur: {
            color: [255, 255, 100], blurTint: [240, 190, 254],
            blurSize: 1.18, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.bb,
    preset: 'PREY SLAUGHTERED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: -.258, scale: 1
        },
        font: {
            fontSize: 139, fontFamily: 'Kozuka Mincho Pro, Yu Mincho, Georgia',
            vScale: 0.922, charSpacing: 6,
            fontWeight: 500, textColor: [144, 208, 166]
        },
        slaughter: {
            textOpacity: .6, glowColor: [144, 208, 166],
            glowSize: 30, glowOpacity: 1.1,
        }
    },
    draw: drawPreySlaughtered
})

//////// YOU DIED

layerTypes.push({
    type: MacroType.youDied,
    game: Game.ds1,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .003, yOffset: .036, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [100, 10, 10],
            fontSize: 148, fontWeight: 100,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .6,
            shadowOffset: -0.015, shadowSoftness: 1,
        }
    },
    draw: drawYouDied
})

layerTypes.push({
    type: MacroType.youDied,
    game: Game.ds3,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .004, yOffset: .018, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [100, 10, 10],
            fontSize: 150, fontWeight: 100,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: .66, shadowOpacity: .6,
            shadowOffset: -0.015, shadowSoftness: 1.24,
        }
    },

    draw: drawYouDied
})

//////// New Area

layerTypes.push({
    type: MacroType.areaName,
    game: Game.ds3,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: 0.003, scale: 1 
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [255, 255, 255],
            fontSize: 96, fontWeight: 100,
            vScale: 1, charSpacing: 0,
        },
        area: {
            underline: .32, contrast: 1
        }
    },
    draw: drawAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.ds1,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: .001, yOffset: -.004, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [255, 255, 255],
            fontSize: 98, fontWeight: 100,
            vScale: 1, charSpacing: 0,
        },
        area: {
            underline: .3, contrast: 0
        }
    },
    draw: drawAreaName
})


//// Automatically create indexes of all the different layer types by various properties.

/** 
 * Object containing all types of drawable layers, indexed by type, game (and preset)
 * @type { {[type in keyof MacroType] : {[type in keyof Game]: {[preset: string]: DrawableLayer }? }} } } 
 */
const layerTypesMap = {}

for( const type in MacroType )
    for( const game in Game )
        layerTypesMap[type] = {[game]: null}

for( const layer of layerTypes ) {
    layerTypesMap[layer.type][layer.game] ??= {}
    layerTypesMap[layer.type][layer.game][layer.preset] = layer
}




window.MACROGEN_DEFAULTS = {
    macroType: MacroType.nounVerbed,
    game: Game.ds1,
}

window.EXPORT_SLIDERS = () => {
    const obj = {}
    for( const slidersName of ['position', 'font', 'zoomBlur', 'slaughter', 'area', 'shadow'] )
        if( !macroGen.sliders[slidersName].element.hidden )
            obj[slidersName] = macroGen.sliders[slidersName].getValues()
    console.log(obj)
}