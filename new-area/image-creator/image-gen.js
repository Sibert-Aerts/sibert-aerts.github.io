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
const setPhantom = (elem, val=true) => { if (val) elem.classList.add('phantom'); else elem.classList.remove('phantom') }

///// TINY COLOR UTILS

/** Must be used EXCLUSIVELY with strings of the form '#abcdef', such as input.color. */
const hexToRGB = (h) => Array.from( h.matchAll(/[^#]{2}/g) ).map( x => parseInt(x[0], 16) )
/** Must be used EXCLUSIVELY with integers [0, 255]. */
const RGBToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0') ).join('')
/** May be used with any numbers; floors and clamps them first. */
const laxRGBToHex = (r=0, g=0, b=0) => RGBToHex(...[r, g, b].map(byteClamp))

/** Multiply two lax RGB arrays into a lax RGB array. */
const RGBMul = (c, d) => [c[0]*d[0]/255, c[1]*d[1]/255, c[2]*d[2]/255]


const browserIs = {
    chrome: !!window.chrome,
    firefox: navigator.userAgent.toLowerCase().indexOf('firefox') > -1
}


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
    /** @type {boolean} */
    visible = false

    /** @type {Callback} */
    onchange = null

    /**
     * @param {string} name
     * @param {HTMLElement} parent 
     * @param {string[]} names 
     */
    constructor(element) {
        this.element = element
        if( !this.element ) return
        this.name = this.element.getAttribute('name')

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

            /// Assign and remember its default
            slider.value = slider.default = slider.trueDefault = slider.getAttribute('default')

            /// Hook up reset button
            /** @type {HTMLButtonElement} */
            const resetButton = div.getElementsByClassName('reset-button')[0]
            if (resetButton) {
                slider.resetButton = resetButton
                resetButton.disabled = true

                resetButton.onclick = () => {
                    slider.value = slider.default
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
        this.visible = false
    }
    show() {
        if( this.usable ) this.element.hidden = false
        this.visible = true
    }

    /** Get a specific slider's value. */
    get(key) {
        return this.byName[key].converter.parse(this.byName[key].value)
    }

    /**
     *  Get all slider values bundled as an object.
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
        for( const slider of this.sliders ) {            
            if( slider.resetButton ) {
                let val
                if( !(slider.name in values) ) val = slider.trueDefault
                else val = slider.converter.toString(values[slider.name])

                slider.default = val
                if( slider.resetButton.disabled )
                    slider.value = val
            }
        }

        for( const name in values )
            if( !(name in this.byName) )
                console.warn(`Bad slider name ${name} for sliders ${this.name}`)
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

        /** my(t, n) = my element `<t>` named `n` */
        const my = this.my = (tag, name) => element.getElementsByTagName(tag).namedItem(name)

        const autoRedraw = () => this.autoRedraw()

        //// CANVAS
        this.canvas = my('canvas', 'canvas')
        this.ctx = this.canvas.getContext('2d')

        //// VIEW ELEMS
        this.resView = { x: my('span', 'canv-res-x'), y: my('span', 'canv-res-y') }
        this.resWarning = my('*', 'resolution-warning')

        //// IMAGE HANDLER
        this.imageHandler = new ImageHandler(this, my('div', 'background-image'))
        this.bgColorSliders = new Sliders(my('div', 'background-color'))
        this.bgColorSliders.onchange = autoRedraw

        //// MACRO TYPE SELECTION
        this.createMacroTypeSelects()

        //// OTHER CONTROLS
        this.captionInput = my('input', 'image-caption')
        this.captionInput.oninput = autoRedraw
        this.captionInput.onkeyup = e => { if (e.code==='Enter') this.redrawMacro() }
        if( window.MACROGEN_DEFAULTS?.caption )
            this.captionInput.value = window.MACROGEN_DEFAULTS.caption

        this.resolutionCheckbox = my('input', 'limit-resolution')
        this.resolutionCheckbox.onchange = () => this.redrawMacro()

        //// SLIDERS
        this.macroSliders = element.getElementsByTagName('DIV').namedItem('macro-sliders')

        this.sliders = {}
        for( const elem of this.macroSliders.getElementsByClassName('sliders-container') ) {
            const sliders = new Sliders(elem)
            this.sliders[sliders.name] = sliders
            sliders.onchange = autoRedraw
        }
        
        this.imageSliders = new Sliders(my('div', 'image'))
        this.imageSliders.onchange = autoRedraw

        //// UHH THE LITTLE TAB RADIO BUTTONS ?
        const tabs = my('div', 'sliders-tabs')
        const tabbedDivs = {}

        if( tabs ) 
        for( const tab of tabs.children ) {
            const radio = tab.children[0]
            if( radio.value !== 'all' )
                tabbedDivs[radio.value] = my('div', radio.value)

            radio.onchange = function() {
                for( const otherTab of tabs.children )
                    otherTab.classList.remove('checked')
                tab.classList.add('checked')

                for( const t in tabbedDivs )
                    tabbedDivs[t].hidden = (radio.value !== 'all') && (radio.value !== t)
            }
        }


        this.onMacroTypeChange(null, false)
    }

    createMacroTypeSelects() {
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

        //// Hide/Show relevant selects (if any)
        const usingSpecial = (macroType === MacroType.special)
        setPhantom(this.gameSelect.parentNode, usingSpecial)
        
        //// Show relevant Preset selects
        for( const typeKey in MacroType ) for( const gameKey in Game )
            if( this.presetSelects[typeKey][gameKey] && (typeKey !== macroType || gameKey !== game ))
                this.presetSelects[typeKey][gameKey].hidden = true

        this.presetSelects[macroType][game].hidden = false
        const onlyOnePreset = this.presetSelects[macroType][game].length === 1
        setPhantom(this.presetHolder.parentNode, onlyOnePreset)

        //// Enable/disable Games
        for( const gameKey in Game )
            this.gameSelect.namedItem(gameKey).disabled = !this.presetSelects[macroType][gameKey]

        //// Update generic caption
        if( this.captionInput.value === 'CAPTION UNALTERED' && newType.preferCase === 'title case' )
            this.captionInput.value = 'Caption Unaltered'
        else if( this.captionInput.value === 'Caption Unaltered' && newType.preferCase === 'all caps' )
            this.captionInput.value = 'CAPTION UNALTERED'

        //// Redraw (if desired)
        if (redraw) this.redrawMacro()
    }

    /** @returns {[ keyof MacroType, keyof Game, string ]} */
    getLayerTypeKeys() {
        const macroType = this.macroTypeSelect.value
        let game = this.gameSelect.value
        if( !this.presetSelects[macroType][game] ) {
            for( const newGame in Game ) {
                if( this.presetSelects[macroType][newGame] ) {
                    game = this.gameSelect.value = newGame; break
                }
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
        ctx.fillStyle = '#000000'
        ctx.shadowBlur = 0
        ctx.shadowColor = 'rgba(0, 0, 0, 0)'
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.font = '10px sans-serif'
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

    drawFlatColor() {
        if( this.bgColorSliders.usable ) {
            const { bgColor, bgColorOpacity } = this.bgColorSliders.getValues()
            if( bgColorOpacity === 0 ) return
            this.ctx.fillStyle = `rgba(${bgColor.join()}, ${bgColorOpacity}`
            this.ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
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

        this.drawFlatColor()
        
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
        this.drawFlatColor()
    
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
    nounVerbed: 'nounVerbed', areaName: 'areaName', youDied: 'youDied', special: 'special'
}
const macroTypeName = {
    nounVerbed: 'Noun Verbed',
    areaName: 'Area Name',
    youDied: 'Death',
    special: 'Non-FromSoft',
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

    // TODO: the chrome version doesn't scale with font size while the other one does!
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


/** @type {drawFun} Function which draws a Souls-style NOUN VERBED.  */
function drawNounVerbed(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { textOpacity, blurTint, blurSize, blurOpacity } = gen.sliders.zoomBlur.getValues()
    const textColor = gen.sliders.font.get('textColor')

    const x0 = xOffset*w, y0 = yOffset*h
    s *= s0

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
    const zoomSteps = Math.floor(20*blurSize * Math.pow(s, 1/4))
    // zoomFactor**zoomSteps = blurSize
    const zoomFactor = Math.pow(blurSize, 1/zoomSteps)
    // Zoom blur vertical distance
    const VOFFSET = 1
    const voff = VOFFSET*s/(blurSize-1)
    const blurColor = RGBMul(textColor, blurTint).map(byteClamp)

    for( let i=0; i<=zoomSteps; i++ ) {
        if( i ) ctx.scale(zoomFactor, zoomFactor)
        // `product` ranges from 1 up to and including blurSize
        const product = Math.pow(blurSize, i/zoomSteps)
        // `fatProduct` ranges from 1 up to and including ±2
        const fatProduct = Math.pow(product, 1/Math.log2(blurSize))

        ctx.filter = `blur(${Math.floor(s*product**4)}px)`
        ctx.fillStyle = `rgba(${blurColor.join()}, ${blurOpacity / fatProduct})`
        ctx.fillText(caption, w/2/product, ((h/2-voff)/product+voff)/vScale)
    }
    
    ctx.restore()

    // Draw the regular text on top
    ctx.fillStyle = `rgba(${textColor.join()}, ${textOpacity})`
    ctx.fillText(caption, w/2, h/2/vScale )
}

/** @type {drawFun} Function which draws Bloodborne's iconic glowy style text.  */
function drawGlowyText(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { textOpacity, glowColor, glowSize, glowOpacity } = gen.sliders.glowy.getValues()

    const x0 = xOffset * w
    const y0 = yOffset * h
    s *= s0

    ctx.translate(x0, y0)

    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.globalCompositeOperation = 'lighter' // blend mode: Add
    ctx.filter = `blur(${s/2}px)`

    /// First: Just draw the text, no glow
    const [r, g, b] = gen.sliders.font.get('textColor')
    ctx.fillStyle = `rgba(${0}, ${g}, ${0}, ${textOpacity})`
    ctx.fillText(caption, w/2, h/2/vScale)
    ctx.fillStyle = `rgba(${r}, ${0}, ${b}, ${textOpacity})`
    ctx.fillText(caption, w/2-s, h/2/vScale)

    /// Then: Draw the text black (invisible) multiple times to get more glow.
    ctx.fillStyle = `#000000`
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0

    // glowSize === 0 normally hides the glow even though it's a totally cromulent amount of glow to want
    const glowSizeEps = Math.max(.0001, glowSize)

    for( let opacity=glowOpacity; opacity > 0; ) {
        // Extending the blur size for over-opacity gives a nicer, smoother effect
        ctx.shadowBlur = glowSizeEps * Math.max(opacity, 1)
        ctx.shadowColor = `rgb(${glowColor.join()}, ${opacity})`
        ctx.fillText(caption, w/2, h/2/vScale)
        opacity--
    }
}

/** @type {drawFun} Function which draws an Elden Ring style NOUN VERBED.  */
function drawEldenNounVerbed(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { textOpacity, blurTint, blurSize, blurOpacity } = gen.sliders.zoomBlur.getValues()
    const textColor = gen.sliders.font.get('textColor')

    const x0 = xOffset * w
    const y0 = yOffset * h
    s *= s0

    // The shade only moves up or down
    ctx.translate(0, y0)
    //// SHADE
    drawShadowBar(ctx, canvas, gen, s0)    
    // The text also moves left or right
    ctx.translate(x0, 0)

    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    
    // Regular text
    ctx.fillStyle = `rgba(${textColor.join()}, ${textOpacity})`
    ctx.fillText(caption, w/2, h/2/vScale )
    
    // Ghost effect goes on top
    ctx.globalCompositeOperation = 'lighter' // blend mode: Add
    ctx.shadowBlur = 1

    const scaleX = blurSize, scaleY = 1+(blurSize-1)/2
    ctx.scale(scaleX, scaleY)

    ctx.fillStyle = `rgba(${blurTint.join()}, ${blurOpacity})`
    ctx.fillText(caption, w/2/scaleX, h/2/scaleY/vScale)
}

/** @type {drawFun} Function which draws an Area Name. */
function drawAreaName(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    ctx.translate(xOffset * w, yOffset * h)
    s *= s0
    
    // Shadow style
    ctx.shadowOffsetX = 2*s
    ctx.shadowOffsetY = 1*s
    ctx.shadowBlur = 8*s

    // UNDERLINE
    const { ulLength, ulWidth, ulPos, contrast } = gen.sliders.area.getValues()

    if( ulLength > 0 ) {
        const left = (.5-ulLength)*w, right = (.5+ulLength)*w

        // The gradient
        const colorTuple = gen.sliders.font.get('textColor').join()
        const grad = ctx.createLinearGradient(left, 0, right, 0)
        grad.addColorStop(0,   `rgba(${colorTuple}, 0)`)
        grad.addColorStop(0.1, `rgba(${colorTuple}, ${.75 * Math.max(1, contrast)})`)
        grad.addColorStop(0.9, `rgba(${colorTuple}, ${.75 * Math.max(1, contrast)})`)
        grad.addColorStop(1,   `rgba(${colorTuple}, 0)`)

        ctx.fillStyle = grad
        ctx.shadowColor = `rgba(0, 0, 0, ${contrast/2})`
        ctx.beginPath()
        ctx.ellipse(w/2, h/2+ulPos*s, ulLength*w, s*ulWidth/2, 0, 0, 2*Math.PI)
        ctx.fill()
    }

    // TEXT
    ctx.shadowColor = `rgba(0, 0, 0, ${contrast})`
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.textBaseline = 'alphabetic'

    // Apply contrast by just redrawing the same text so the shadow overlaps
    //      0.85 * 1.17 ~= 1
    for( let c = contrast; c >= 0; ) {
        ctx.shadowColor = `rgba(0, 0, 0, ${.85 * Math.min(c, 1.17)})`
        ctx.fillText(caption, w/2, h/2/vScale)
        c -= 1.17
    }
}

/** @type {drawFun} Function which draws a DS2-style Area Name. */
function drawDS2AreaName(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const { ulLength, ulWidth, ulPos, contrast } = gen.sliders.area.getValues()
    const { lineWidth, lineColor } = gen.sliders.outline.getValues()
    ctx.translate(xOffset*w, yOffset*h)
    s *= s0
    
    // UNDERLINE
    if( ulLength > 0 ) {
        const left = (.5-ulLength)*w, right = (.5+ulLength)*w

        // The gradient
        const colorTuple = gen.sliders.font.get('textColor').join()
        const grad = ctx.createLinearGradient(left, 0, right, 0)
        grad.addColorStop(0,   `rgba(${colorTuple}, 0)`)
        grad.addColorStop(0.1, `rgba(${colorTuple}, ${.75 * Math.max(1, contrast)})`)
        grad.addColorStop(0.9, `rgba(${colorTuple}, ${.75 * Math.max(1, contrast)})`)
        grad.addColorStop(1,   `rgba(${colorTuple}, 0)`)

        ctx.fillStyle = `rgba(${lineColor}, ${contrast/3})`
        const eps = lineWidth*s/2
        const dy = ulPos*s
        ctx.beginPath()
        ctx.ellipse(w/2, h/2+dy, ulLength*w+eps, s*ulWidth/2+eps, 0, 0, 2*Math.PI)
        ctx.fill()

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(w/2, h/2+dy, ulLength*w, s*ulWidth/2, 0, 0, 2*Math.PI)
        ctx.fill()
    }

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.textBaseline = 'alphabetic'

    ctx.strokeStyle = `rgba(${lineColor}, ${contrast/3})`
    ctx.lineWidth = lineWidth * s
    ctx.miterLimit = 5
    ctx.strokeText(caption, w/2, h/2/vScale)
    ctx.fillText(caption, w/2, h/2/vScale)
}

/** @type {drawFun} Function which draws a Bloodborne-style Area Name. */
function drawBloodborneAreaName(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    ctx.translate(xOffset * w, yOffset * h)
    s *= s0

    // (MOCK BACK-IMAGE)
    const { opacity } = gen.sliders.backImage.getValues()

    if( opacity > 0 ) {
        ctx.save()

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity}`
        ctx.filter = `blur(${20*s}px)`
        const left = (.5-.25*s0)*w, rectWidth = .28*s0*w
        const top = (.5-.08*s0)*h, rectHeight = .12*s0*h
        ctx.fillRect(left, top, rectWidth, rectHeight)

        ctx.restore()
        ctx.save()

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity*.75}`
        ctx.lineWidth = 2*s
        ctx.filter = `blur(${Math.sqrt(2*s)}px)`
        ctx.beginPath()

        ctx.moveTo(.5*w + .01*s0*w, .5*h - .10*s0*h)
        ctx.lineTo(.5*w + .01*s0*w, .5*h + .06*s0*h)

        ctx.moveTo(.5*w - .30*s0*w, .5*h + .01*s0*h)
        ctx.lineTo(.5*w + .05*s0*w, .5*h + .01*s0*h)

        ctx.stroke()
        ctx.restore()
    }

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'right'
    ctx.fillText(caption, w/2, h/2/vScale)
}

/** @type {drawFun} Function which draws an Elden Ring-style Area Name. */
function drawEldenAreaName(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    ctx.translate(xOffset * w, yOffset * h)
    s *= s0

    // FRAME
    const { opacity, frameWidth, frameHeight } = gen.sliders.erFrame.getValues()
    if( opacity > 0 ) {
        ctx.save()

        const rectWidth = frameWidth*h*s0
        const rectHeight = frameHeight*h*s0

        const left = .5*w - rectWidth/2, right = .5*w + rectWidth/2
        const top = (.5 + .01*s0)*h - rectHeight
        const lineY = top + rectHeight + .002*h*s0

        // The main rectangle
        const grad = ctx.createLinearGradient(left, 0, right, 0)
        grad.addColorStop(0,   `rgba(30, 30, 28, 0)`)
        grad.addColorStop(0.2, `rgba(30, 30, 28, ${opacity})`)
        grad.addColorStop(0.8, `rgba(30, 30, 28, ${opacity})`)
        grad.addColorStop(1,   `rgba(30, 30, 28, 0)`)
        ctx.fillStyle = grad
        ctx.filter = `blur(${2*s}px)`
        ctx.fillRect(left, top, rectWidth, rectHeight)

        // The lighter underline
        const grad2 = ctx.createLinearGradient(left, 0, right, 0)
        grad2.addColorStop(0,   `rgba(194, 194, 168, 0)`)
        grad2.addColorStop(0.3, `rgba(194, 194, 168, ${opacity*2})`) // Gradient is asymmetrical on purpose, because the actual one is, for some reason.
        grad2.addColorStop(0.8, `rgba(194, 194, 168, ${opacity*2})`)
        grad2.addColorStop(1,   `rgba(194, 194, 168, 0)`)
        ctx.fillStyle = grad2
        ctx.filter = `blur(${Math.sqrt(2*s)}px)`
        ctx.fillRect(left, lineY, rectWidth, 1*s)
        ctx.fillRect(left, lineY, rectWidth, 1*s)

        ctx.restore()
    }

    // TEXT

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.textBaseline = 'alphabetic'

    ctx.shadowOffsetX = 2*s
    ctx.shadowOffsetY = 1*s
    ctx.shadowBlur = 8*s
    ctx.shadowColor = `rgba(0, 0, 0, .7)`
    // Twice to get the slightly darker shadow
    ctx.fillText(caption, w/2, h/2/vScale)
    ctx.fillText(caption, w/2, h/2/vScale)

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

/** @type {drawFun} Function which draws a Sekiro style japanese-character-decorated caption. */
function drawSekiroText(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    ctx.translate(xOffset * w, yOffset * h)
    s *= s0

    //// TEXT
    const textColor = gen.sliders.font.get('textColor')
    const { symbolFont, symbol, symbolSize, symbolPos, symbolSpace } = gen.sliders.sekiro.getValues()
    const { textOpacity, glowColor, glowSize, glowOpacity, blendMode, secretFactor } = gen.sliders.glowy.getValues()
    
    // Trick to make the japanese font work (for lack of an explicit API)
    byId('adobe-font-trick').innerText = symbol    

    // First: the characters
    ctx.font = `800 ${symbolSize*s}px ${symbolFont || 'serif'}`
    ctx.textBaseline = 'middle'
    ctx.filter = `blur(${Math.sqrt(s)/2}px)`

    function drawSymbols() {
        const baseY = (h/2 + symbolPos*s) - (symbol.length-1)*(symbolSize+symbolSpace)*s
        for(let i = 0; i < symbol.length; i++ ) {
            ctx.fillText(symbol[i], w/2, baseY + i*(symbolSize+symbolSpace)*s)
        }
    }
    
    /// First: Draw the characters black (invisible) multiple times to get more glow.
    ctx.globalCompositeOperation = blendMode
    ctx.fillStyle = (blendMode === 'lighter')? `#000000`: `rgb(${glowColor.join()})`

    for( let opacity=glowOpacity; opacity > 0; ) {
        // Extending the blur size for over-opacity gives a nicer, smoother effect
        ctx.shadowBlur = glowSize * Math.max(opacity, 1)
        ctx.shadowColor = `rgba(${glowColor.join()}, ${opacity})`
        drawSymbols()
        opacity--
    }
    /// Turn off the shadow and blend mode to draw the characters normal
    ctx.globalCompositeOperation = 'source-over' // blend mode: Normal
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgb(${textColor.join()})`
    drawSymbols()

    /// Finally: Do the same with the caption    
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)

    ctx.globalCompositeOperation = blendMode
    ctx.fillStyle = (blendMode === 'lighter')? `#000000`: `rgb(${glowColor.join()})`
    ctx.shadowBlur = glowSize / 5
    for( let opacity=glowOpacity*textOpacity*secretFactor; opacity > 0; ) {
        ctx.shadowColor = `rgba(${glowColor.join()}, ${opacity})`
        ctx.fillText(caption, w/2, (h/2 + 0.196*h*s0) /vScale)
        opacity--
    }

    ctx.globalCompositeOperation = 'source-over' // blend mode: Normal
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgb(${textColor.join()}, ${textOpacity})`
    ctx.fillText(caption, w/2, (h/2 + 0.196*h*s0) /vScale)

}

/** @type {drawFun} Function which draws simple outlined text. */
function drawOutlined(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    ctx.translate(xOffset*w, yOffset*h)
    s *= s0

    // TEXT
    const { lineWidth, lineColor } = gen.sliders.outline.getValues()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    if( lineWidth > 0 ) {
        ctx.strokeStyle = `rgb(${lineColor})`
        ctx.lineWidth = lineWidth * s
        ctx.miterLimit = 5
        ctx.strokeText(caption, w/2, h/2/vScale)
    }
    ctx.fillText(caption, w/2, h/2/vScale)
}

////////////////////// Actually define them //////////////////////

//////// NOUN VERBED

//// DARK SOULS 1

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
            fontWeight: 400, textColor: [255, 255, 107]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 178, 153],
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
            fontWeight: 400, textColor: [129, 187, 153]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [187, 201, 192],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.006, shadowSoftness: 1,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: 0.037, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 1,
            fontWeight: 400, textColor: [255, 228, 92]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [251, 149, 131],
            blurSize: 1.14, blurOpacity: 0.1,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.004, shadowSoftness: 1,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'RETRIEVAL',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: 0.037, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 6,
            fontWeight: 400, textColor: [161, 217, 226]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [154, 158, 167],
            blurSize: 1.16, blurOpacity: 0.1,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.004, shadowSoftness: 1,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'TARGET DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: 0.037, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 5,
            fontWeight: 400, textColor: [250, 201, 91]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [231, 133, 115],
            blurSize: 1.1, blurOpacity: 0.1,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.004, shadowSoftness: 1,
        }
    },
    draw: drawNounVerbed
})

//// DARK SOULS 2

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -0.003, yOffset: 0.217, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 1,
            fontWeight: 400, textColor: [255, 177, 68]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 198, 168],
            blurSize: 1.07, blurOpacity: 0.02,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'HUMANITY RESTORED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -0.009, yOffset: 0.217, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 1,
            fontWeight: 400, textColor: [169, 254, 236]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [102, 255, 166],
            blurSize: 1.07, blurOpacity: 0.05,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'RETRIEVAL',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -0.005, yOffset: 0.220, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 5,
            fontWeight: 400, textColor: [169, 240, 254],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [159, 213, 254],
            blurSize: 1.16, blurOpacity: 0.05,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'TARGET WAS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -0.004, yOffset: 0.225, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 5,
            fontWeight: 400, textColor: [255, 210, 87],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [254, 132, 118],
            blurSize: 1.12, blurOpacity: 0.05,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'INVADER BANISHED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -0.013, yOffset: 0.221, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 255, 98],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 176, 102],
            blurSize: 1.08, blurOpacity: 0.12,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        }
    },
    draw: drawNounVerbed
})

//// DARK SOULS 3

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
            vScale: 1.317, charSpacing: 1,
            fontWeight: 400, textColor: [255, 255, 100],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [240, 190, 254],
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
    game: Game.ds3,
    preset: 'LORD OF CINDER FALLEN',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.002, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 3,
            fontWeight: 400, textColor: [255, 75, 12],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [206, 202, 211],
            blurSize: 1.19, blurOpacity: 0.08,
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
    game: Game.ds3,
    preset: 'EMBER RESTORED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.001, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 3,
            fontWeight: 400, textColor: [251, 82, 19],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [206, 202, 211],
            blurSize: 1.16, blurOpacity: 0.08,
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
    game: Game.ds3,
    preset: 'BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 206, 86],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [227, 166, 146],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .72,
            shadowOffset: -.008, shadowSoftness: 1.24,
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'HOST OF EMBERS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.001, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 107, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 187, 92],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 184, 184],
            blurSize: 1.20, blurOpacity: 0.08,
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
    game: Game.ds3,
    preset: 'DARK SPIRIT DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 3,
            fontWeight: 400, textColor: [254, 252, 150],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [254, 227, 190],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        }
    },
    draw: drawNounVerbed
})

//// BLOODBORNE

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
        glowy: {
            textOpacity: .5, glowColor: [144, 208, 166],
            glowSize: 17, glowOpacity: 1.1,
        }
    },
    draw: drawGlowyText
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.bb,
    preset: 'NIGHTMARE SLAIN',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: -.003, yOffset: -.265, scale: 1
        },
        font: {
            fontSize: 115, fontFamily: 'Kozuka Mincho Pro, Yu Mincho, Georgia',
            vScale: 1.12, charSpacing: 2,
            fontWeight: 500, textColor: [255, 51, 0]
        },
        glowy: {
            textOpacity: .26, glowColor: [156, 45, 17],
            glowSize: 12, glowOpacity: 1,
        }
    },
    draw: drawGlowyText
})

//// SEKIRO

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'SHINOBI EXECUTION',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: .001, yOffset: -.097, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 12,
            fontWeight: 400, textColor: [255, 255, 255]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '忍殺', symbolSize: 154,
            symbolPos: 76, symbolSpace: 34,
        },
        glowy: {
            textOpacity: .8, glowColor: [255, 255, 255],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'IMMORTALITY SEVERED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: .001, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [255, 255, 255]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '不死斬り', symbolSize: 114,
            symbolPos: 96, symbolSpace: 21,
        },
        glowy: {
            textOpacity: .9, glowColor: [255, 255, 255],
            glowSize: 23, glowOpacity: 0.5,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'SCULPTOR\'S IDOL FOUND',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: .016, scale: 1
        },
        font: {
            fontSize: 35, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [253, 237, 182]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '鬼仏見出', symbolSize: 114,
            symbolPos: 70, symbolSpace: 28,
        },
        glowy: {
            textOpacity: .7, glowColor: [253, 237, 182],
            glowSize: 31, glowOpacity: 0.8,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'UNSEEN AID',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: .001, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [160, 200, 254]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '冥助あり', symbolSize: 114,
            symbolPos: 104, symbolSpace: 21,
        },
        glowy: {
            textOpacity: .9, glowColor: [160, 200, 254],
            glowSize: 23, glowOpacity: 0.5,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'DRAGONROT HEALED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: .001, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [222, 186, 184]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '竜咳快復', symbolSize: 114,
            symbolPos: 88, symbolSpace: 21,
        },
        glowy: {
            textOpacity: 1, glowColor: [222, 186, 184],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'GRACIOUS GIFT OF TEARS',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: .002, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [251, 220, 218]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '拝涙', symbolSize: 152,
            symbolPos: -18, symbolSpace: 34,
        },
        glowy: {
            textOpacity: .9, glowColor: [251, 220, 218],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

//// ELDEN RING

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'LOST GRACE DISCOVERED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro, adobe-garamond-pro',
            vScale: 1, charSpacing: 0,
            fontWeight: 300, textColor: [220, 135, 56]
        },
        zoomBlur: {
            textOpacity: 1, blurTint: [237, 140, 29],
            blurSize: 1.11, blurOpacity: 0.18,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        }
    },
    draw: drawEldenNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'ENEMY FELLED, et al.',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro, adobe-garamond-pro',
            vScale: 1, charSpacing: 0,
            fontWeight: 300, textColor: [220, 175, 45]
        },
        zoomBlur: {
            textOpacity: 1, blurTint: [255, 208, 66],
            blurSize: 1.11, blurOpacity: 0.18,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        }
    },
    draw: drawEldenNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'HOST VANQUISHED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro, adobe-garamond-pro',
            vScale: 1, charSpacing: 0,
            fontWeight: 300, textColor: [230, 140, 65]
        },
        zoomBlur: {
            textOpacity: 1, blurTint: [230, 140, 65],
            blurSize: 1.11, blurOpacity: 0.18,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        }
    },
    draw: drawEldenNounVerbed
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
            fontSize: 148, fontWeight: 400,
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
    game: Game.ds2,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.005, yOffset: .229, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [100, 16, 16],
            fontSize: 148, fontWeight: 400,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: 1.26, shadowOpacity: .9,
            shadowOffset: -.006, shadowSoftness: 1.16,
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
            fontSize: 150, fontWeight: 400,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: .66, shadowOpacity: .6,
            shadowOffset: -0.015, shadowSoftness: 1.24,
        }
    },

    draw: drawYouDied
})

layerTypes.push({
    type: MacroType.youDied,
    game: Game.bb,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: -.265, scale: 1
        },
        font: {
            fontSize: 139, fontFamily: 'Kozuka Mincho Pro, Yu Mincho, Georgia',
            vScale: 0.922, charSpacing: 6,
            fontWeight: 500, textColor: [255, 0, 0]
        },
        glowy: {
            textOpacity: .3, glowColor: [149, 24, 24],
            glowSize: 22, glowOpacity: 1.2,
        }
    },
    draw: drawGlowyText
})

layerTypes.push({
    type: MacroType.youDied,
    game: Game.se,
    preset: 'DEATH',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: -.065
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 23,
            fontWeight: 400, textColor: [183, 48, 44]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '死', symbolSize: 345,
            symbolPos: 0, symbolSpace: 0
        },
        glowy: {
            textOpacity: .5, glowColor: [168, 41, 41],
            glowSize: 30, glowOpacity: 1,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.youDied,
    game: Game.se,
    preset: 'DEATH (fake)',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: -.065
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 23,
            fontWeight: 400, textColor: [109, 104, 101]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '死', symbolSize: 345,
            symbolPos: 0, symbolSpace: 0
        },
        glowy: {
            textOpacity: .9, glowColor: [0, 0, 0],
            glowSize: 30, glowOpacity: 0.9,
            blendMode: 'source-over', secretFactor: 3
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    type: MacroType.youDied,
    game: Game.er,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [130, 16, 29],
            fontSize: 88, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        }
    },

    draw: drawYouDied
})

//////// Area Name

layerTypes.push({
    type: MacroType.areaName,
    game: Game.ds1,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: .001, yOffset: .006, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [227, 226, 224],
            fontSize: 100, fontWeight: 400,
            vScale: 1.041, charSpacing: -1,
        },
        area: {
            ulLength: .31, ulWidth: 4, ulPos: 4, contrast: 0
        }
    },
    draw: drawAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.ds2,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: -.007, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [200, 200, 200],
            fontSize: 89, fontWeight: 400,
            vScale: 1, charSpacing: 2,
        },
        outline: {
            lineWidth: 4, lineColor: [0, 0, 0]
        },
        area: {
            ulLength: .3, ulWidth: 4, ulPos: 19, contrast: 2
        }
    },
    draw: drawDS2AreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.ds3,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: 0.008, scale: 1 
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [248, 248, 248],
            fontSize: 96, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        area: {
            ulLength: .33, ulWidth: 6, ulPos: 5, contrast: 1
        }
    },
    draw: drawAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.bb,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0.389, yOffset: 0.373, scale: 1 
        },
        font: {
            fontFamily: 'Spectral', textColor: [202, 203, 202],
            fontSize: 42, fontWeight: 300,
            vScale: 1.058, charSpacing: 0,
        },
        backImage: {
            opacity: .8
        }
    },
    // TODO: this needs a back image ofc
    draw: drawBloodborneAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.se,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0.001, yOffset: -0.013, scale: 1 
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [202, 204, 203],
            fontSize: 85, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        area: {
            ulLength: 0, ulWidth: 4, ulPos: 10,  contrast: 1
        }
    },
    // TODO: this needs a back image ofc
    draw: drawAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.er,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0.023, scale: 1 
        },
        font: {
            fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [255, 255, 255],
            fontSize: 90, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        erFrame: {
            opacity: .4, frameWidth: .8, frameHeight: .1
        }
    },
    draw: drawEldenAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.er,
    preset: 'Sub-area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: -.002, yOffset: -.086, scale: 1 
        },
        font: {
            fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [255, 255, 255],
            fontSize: 51, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        erFrame: {
            opacity: .4, frameWidth: .55, frameHeight: .065
        }
    },
    draw: drawEldenAreaName
})

//////// Special

layerTypes.push({
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Snapchat',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0, scale: 1 
        },
        font: {
            fontFamily: 'Helvetica, Arial, sans-serif', textColor: [255, 255, 255],
            fontSize: 60, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        shadow: {
            shadowSize: .4, shadowOpacity: .5,
            shadowOffset: 0, shadowSoftness: 0,
        }
    },
    draw: drawYouDied
})

layerTypes.push({
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Image macro',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0, scale: 1 
        },
        font: {
            fontFamily: 'Impact, "Arial Black"', textColor: [255, 255, 255],
            fontSize: 140, fontWeight: 500,
            vScale: 1, charSpacing: 0,
        },
        outline: {
            lineWidth: 20, lineColor: [0, 0, 0]
        }
    },
    draw: drawOutlined
})



//// Automatically create indexes of all the different layer types by various properties.

/** 
 * Object containing all types of drawable layers, indexed by type, game (and preset)
 * @type { {[type in keyof MacroType] : {[type in keyof Game]: {[preset: string]: DrawableLayer }? }} } } 
 */
const layerTypesMap = {}

for( const type in MacroType ) for( const game in Game )
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
    for( const slidersName in macroGen.sliders )
        if( !macroGen.sliders[slidersName].element.hidden )
            obj[slidersName] = macroGen.sliders[slidersName].getValues()
    console.log(obj)
}