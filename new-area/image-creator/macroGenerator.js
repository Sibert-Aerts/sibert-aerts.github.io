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

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
 function htmlToDOM(html) {
    const t = document.createElement('template')
    t.innerHTML = html
    return t.content.childNodes
}

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
        if( this.URLinput.value ) this.handleImageURL()

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
        this.image.crossOrigin = 'Anonymous'

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

            const slider = 
                div.getElementsByTagName('input')[0] || div.getElementsByTagName('textarea')[0]  || div.getElementsByTagName('select')[0]
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
            if( slider.type === 'checkbox' ) slider.checked = slider.value

            /// Hook up reset button
            /** @type {HTMLButtonElement} */
            const resetButton = div.getElementsByClassName('reset-button')[0]
            if (resetButton) {
                slider.resetButton = resetButton
                resetButton.disabled = true

                resetButton.onclick = () => {
                    if( slider.type === 'checkbox' )
                        slider.checked = slider.default
                    else
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
        const slider = this.byName[key]
        if( slider.type === 'checkbox' )
            return slider.checked
        return slider.converter.parse(slider.value)
    }

    /**
     *  Get all slider values bundled as an object.
     *  @returns  {{ [name: string]: any }}
     */
    getValues() {
        const values = {}
        for( const slider of this.sliders ) {
            if( slider.type === 'checkbox' )
                values[slider.name] = slider.checked
            else
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
            if( slider.type === 'checkbox' )
                slider.checked = values[name]
            else
                slider.value = slider.converter.toString(values[name])
            slider.resetButton.disabled = false
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
                if( slider.resetButton.disabled ) {
                    if( slider.type === 'checkbox' )
                        slider.checked = val
                    else
                        slider.value = val
                }
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
    saveLink = makeElem('a')
    /** @type {readonly HTMLCanvasElement}   */
    tempCanvas

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

    /** @type {[DrawableLayer, any][]} */
    layers = []
    currentLayer = 0

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

        //// TEMP CANVAS
        this.tempCanvas = makeElem('canvas')
        // Needed to make certain effects work on Chrome
        this.tempCanvas.style.width = this.tempCanvas.style.height = '0px'
        document.body.appendChild(this.tempCanvas)

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
        this.captionInput = my('*', 'image-caption')
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

        //// CANVAS OVERLAY POSITION GRABBY
        this.setupCanvasOverlay()

        //// LAYER CONTROL PANEL
        this.setUpLayers()


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

                for( const t in tabbedDivs ) {
                    var show
                    if( radio.value === 'all' )
                        show = ['global-sliders', 'macro-sliders'].includes(t)
                    else
                        show = (radio.value === t)
                    tabbedDivs[t].hidden = !show
                }
            }
        }

        this.onMacroTypeChange(null, false)
    }

    setupCanvasOverlay() {
        const canvasOverlay = this.my('div', 'canvas-overlay')

        this.updateCanvasOverlay = () => {}

        if( !canvasOverlay ) return

        this.updateCanvasOverlay = () => {
            canvasOverlay.style.left = this.canvas.offsetLeft + 'px'
            canvasOverlay.style.width = this.canvas.clientWidth + 'px'            
            updateGrabbies()
        }
        window.addEventListener('resize', this.updateCanvasOverlay)

        const posGrabby = this.posGrabby = canvasOverlay.children[0]
        const scaleGrabby = this.scaleGrabby = canvasOverlay.children[1]
        const GrabType = {
            none: 0, position: 1, scale: 2
        }
        let grabState = {type: 0, xOffset: 0, yOffset: 0, scale: 1}
        const grabMap = [null, posGrabby, scaleGrabby]

        const SCALEGRABDIST = 40
        const getScale = e => 
            Math.hypot(posGrabby.offsetLeft-e.offsetX, posGrabby.offsetTop-this.canvas.offsetTop-e.offsetY) / Math.hypot(SCALEGRABDIST, SCALEGRABDIST)


        /** Adjust the grabbies' position based on the Slider values. */
        const updateGrabbies = () => {
            const { xOffset, yOffset, scale } = this.sliders.position.getValues()
            const left = (xOffset+.5)*this.canvas.clientWidth
            const top =  (yOffset+.5)*this.canvas.clientHeight + this.canvas.offsetTop
            updatePosGrabby(left, top)
            updateScaleGrabby(left, top, scale)
        }
        const updatePosGrabby = (left, top) => {
            posGrabby.style.left = left + 'px'
            posGrabby.style.top = top + 'px'
        }
        const updateScaleGrabby = (left, top, scale) => {
            scaleGrabby.style.left = left + scale*SCALEGRABDIST + 'px'
            scaleGrabby.style.top = top - scale*SCALEGRABDIST + 'px'
        }

        //// Callbacks
        const startPosGrab = e => {
            grabState = { type: GrabType.position }
            posGrabby.classList.add('grabbed')
            canvasOverlay.classList.add('grabbed')
        }
        const startScaleGrab = e => {
            grabState = { type: GrabType.scale }
            scaleGrabby.classList.add('grabbed')
            canvasOverlay.classList.add('grabbed')
        }
        const moveGrab = e => {
            if( !grabState.type ) return

            if( grabState.type === GrabType.position )
            {
                updatePosGrabby(e.offsetX, e.offsetY + this.canvas.offsetTop)
                updateScaleGrabby(e.offsetX, e.offsetY + this.canvas.offsetTop, this.sliders.position.get('scale'))
            }
            else if ( grabState.type === GrabType.scale )
            {
                updateScaleGrabby(posGrabby.offsetLeft, posGrabby.offsetTop, getScale(e))
            }
        }
        const completeGrab = e => {
            if( !grabState.type ) return

            if( grabState.type === GrabType.position )
            {
                this.sliders.position.setValues({
                    xOffset: posGrabby.offsetLeft/this.canvas.clientWidth-.5,
                    yOffset: (posGrabby.offsetTop-this.canvas.offsetTop)/this.canvas.clientHeight-.5
                })
            }
            else if ( grabState.type === GrabType.scale )
            {
                this.sliders.position.setValues({ scale: getScale(e) })
            }
            this.sliders.position.onchange()

            // Clear grab state
            grabMap[grabState.type].classList.remove('grabbed')
            canvasOverlay.classList.remove('grabbed')
            grabState.type = 0
        }

        // Listener binding helpers
        const ifMobile = f => (e => { if(screen.width < 1000) f(e) })
        const ifNonMobile = f => (e => { if(screen.width >= 1000) f(e) })

        //// Bind those listeners
        posGrabby.addEventListener('pointerdown', ifNonMobile(startPosGrab))
        posGrabby.addEventListener('click', ifMobile(startPosGrab))

        scaleGrabby.addEventListener('pointerdown', ifNonMobile(startScaleGrab))
        scaleGrabby.addEventListener('click', ifMobile(startScaleGrab))

        document.addEventListener('pointerup', ifNonMobile(completeGrab))
        this.canvas.addEventListener('pointermove', moveGrab)
        this.canvas.addEventListener('click', e => { moveGrab(e); completeGrab(e)} )


        //// Hook up checkbox to enable/disable
        const showGrabby = this.my('input', 'showGrabby')
        showGrabby.onchange = e => { posGrabby.hidden = scaleGrabby.hidden = !showGrabby.checked }
        showGrabby.onchange()
    }

    createMacroTypeSelects() {
        const onchange = e => this.onMacroTypeChange(e)

        const {macroType: defaultType, game: defaultGame, preset: defaultPreset} = window.MACROGEN_DEFAULTS 

        //// Macro Type
        this.macroTypeSelect = this.my('select', 'macro-type')
        this.macroTypeSelect.onchange = onchange

        for( const key in MacroType )
            this.macroTypeSelect.appendChild(makeOption(key, macroTypeName[key]))

        if( defaultType ) this.macroTypeSelect.value = defaultType

        //// Game
        this.gameSelect = this.my('select', 'macro-type-game')
        this.gameSelect.onchange = onchange

        for( const key in Game )
            this.gameSelect.appendChild(makeOption(key, gameName[key]))

        if( defaultGame ) this.gameSelect.value = defaultGame

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

        if( defaultPreset ) this.presetSelects[defaultType][defaultGame].value = defaultPreset
    }

    /** Create layer controls */
    setUpLayers() {
        const layerControls = this.my('div', 'layers-controls')
        const layerContainer = this.my('div', 'layers-container')

        layerControls.namedItem('duplicate').addEventListener('click', function() {
            // const [layer, sliders] = this.layers[this.currentLayer]
            const layer = this.getLayerType()
            const sliders = this.getValues()
            this.layers.push([layer, {...sliders}])
            // this dudnt do nuthin
        })

        const currentType = this.getLayerType()
        const sliders = {caption: "Hehfhefhhefhe"}
        const box = this.makeLayerBox(currentType, sliders)
        layerContainer.append(...box)
    }

    /** Makes an HTML layer box element
     * @param {DrawableLayer} layer
     * 
    */
    makeLayerBox(layer, sliders) {
        return htmlToDOM(`
            <button class="soulsy-box">
                <b>${layer.id}</b> - <i>${sliders.caption}</i>
            </button>
        `)
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

        this.updateCanvasOverlay()

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
        // On Chrome the canvas styling may affect drawing
        this.canvas.style.letterSpacing = '0px'
        this.canvas.style.fontVariantNumeric = 'normal'

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
        ctx.globalAlpha = 1
    }

    /** 
     * Call after minor input changes;
     * Calls redrawMacro() only if the underlying canvas isn't too huge for this feature to be laggy.
     */
    autoRedraw() {
        if( !this.tooBig() ) this.redrawMacro()
        else this.delayedRedraw()
    }

    /** Triggers a delayed and debounced redraw. */
    delayedRedraw() {
        clearTimeout(this.delayedRedrawTimeout)
        this.delayedRedrawTimeout = setTimeout(_ => this.redrawMacro(), 1000)
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
        const canvas = this.canvas
        let scale = 1

        if( this.resolutionCheckbox.checked ) {
            // Constrain image to be no larger than 1920x1080
            scale = Math.min(1920/image.width, 1080/image.height, 1)
            this.resizeCanvas(image.width*scale, image.height*scale)
            ctx.scale(scale, scale)

        } else {
            this.resizeCanvas(image.width, image.height)
        }

        this.drawFlatColor()
        
        if( this.imageSliders.usable ) {
            const {imgSaturate, imgContrast, imgBrightness, imgChromatic} = this.imageSliders.getValues()
            const { bgColor, bgColorOpacity } = this.bgColorSliders.getValues()
            const bgColorStr = `rgba(${bgColor.join()}, ${bgColorOpacity}`

            let filter
            // The way these filters work is a little weird, I like it better when the order varies like this
            if( (imgContrast-100)*(imgBrightness-100) < 0 )
                filter = `saturate(${imgSaturate}%) brightness(${imgBrightness}%) contrast(${imgContrast}%)`
            else
                filter = `saturate(${imgSaturate}%) contrast(${imgContrast}%) brightness(${imgBrightness}%)`

            if( imgChromatic > 0 ) {
                this.tempCanvas.width = canvas.width
                this.tempCanvas.height = canvas.height
                const tempCtx = this.tempCanvas.getContext('2d')
                tempCtx.scale(scale, scale)

                // Draw image to tempCanvas
                tempCtx.globalCompositeOperation = 'source-over'
                tempCtx.fillStyle = bgColorStr
                tempCtx.fillRect(0, 0, canvas.width, canvas.height)
                tempCtx.filter = filter
                tempCtx.drawImage(image, 0, 0)
                // Multiply by orangeish
                tempCtx.globalCompositeOperation = 'multiply'
                tempCtx.fillStyle = '#ff8000'
                tempCtx.filter = 'none'
                tempCtx.fillRect(0, 0, image.width, image.height)
                
                // Draw to actual canvas
                ctx.resetTransform()
                ctx.drawImage(this.tempCanvas, 0, 0)

                // Draw image to tempCanvas
                tempCtx.globalCompositeOperation = 'source-over'
                tempCtx.fillStyle = bgColorStr
                tempCtx.fillRect(0, 0, canvas.width, canvas.height)
                tempCtx.filter = filter
                tempCtx.drawImage(image, 0, 0)
                // Multiply by blueish
                tempCtx.globalCompositeOperation = 'multiply'
                tempCtx.fillStyle = '#007fff'
                tempCtx.filter = 'none'
                tempCtx.fillRect(0, 0, image.width, image.height)

                // Add to actual canvas, slightly aberrated
                ctx.globalCompositeOperation = 'lighter'
                ctx.resetTransform()
                ctx.scale(1+imgChromatic, 1)
                ctx.drawImage(this.tempCanvas, -canvas.width*imgChromatic/2, 0)
                ctx.globalCompositeOperation = 'source-over'
            }
            else
            {
                ctx.filter = filter
                ctx.drawImage(image, 0, 0)
            }
            ctx.filter = 'none'


        } else {
            ctx.drawImage(image, 0, 0)
        }
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
        this.updateCanvasOverlay()

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

// Console function used when tweaking presets
window.EXPORT_SLIDERS = () => {
    const obj = {}
    for( const slidersName in macroGen.sliders )
        if( !macroGen.sliders[slidersName].element.hidden )
            obj[slidersName] = macroGen.sliders[slidersName].getValues()
    console.log(obj)
}