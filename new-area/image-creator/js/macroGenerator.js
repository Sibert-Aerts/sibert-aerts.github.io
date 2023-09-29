/*
Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/image-creator/)
*/
'use strict';


/**
 *  The class that puts it all to work.
 */
class MacroGenerator {
    /**
     * @param {HTMLElement | Document} element
     */
    constructor(element=document) {
        /** @type {readonly HTMLElement | Document} */
        this.element = element
        
        // Fill in some fields
        /** @type {readonly HTMLAnchorElement}   */
        this.saveLink = makeElem('a')
        /** @type {[DrawableLayer, any][]} */
        this.layers = []
        /** @type {number} */
        this.activeLayer = 0

        /** my(t, n) = my element `<t>` named `n` */
        /** @returns {HTMLElement} */
        const my = this.my = (tag, name) => element.getElementsByTagName(tag).namedItem(name)

        const redraw = () => this.redrawMacro()
        const autoRedraw = () => this.autoRedraw()

        //// CANVAS
        /** @type {readonly HTMLCanvasElement} */
        this.canvas = my('canvas', 'canvas')
        /** @type {readonly CanvasRenderingContext2D}  */
        this.ctx = this.canvas.getContext('2d')

        //// TEMP CANVAS
        /** @type {readonly HTMLCanvasElement}   */
        this.tempCanvas = makeElem('canvas')
        // Needed to make certain effects work on Chrome
        this.tempCanvas.style.width = this.tempCanvas.style.height = '0px'
        document.body.appendChild(this.tempCanvas)

        //// VIEW ELEMS
        this.resView = { x: my('span', 'canv-res-x'), y: my('span', 'canv-res-y') }
        this.resWarning = my('*', 'resolution-warning')

        //// IMAGE HANDLER
        /** @type {ImageHandler} */
        this.imageHandler = new ImageHandler(my('div', 'background-image'), true)
        this.imageHandler.onload = () => {            
            this.imageSliders.show()
            this.redrawMacro()
        }
        this.imageHandler.onerror = () => this.onNoMoreBackgroundImage()
        this.bgColorSliders = new SliderGroup(my('div', 'background-color'))
        this.bgColorSliders.onchange = autoRedraw

        //// MACRO TYPE SELECTION
        this.createMacroTypeSelects()

        //// OTHER CONTROLS
        this.captionInput = my('*', 'image-caption')
        this.captionInput.oninput = () => {
            this.updateActiveLayerButton()
            this.autoRedraw()
        }
        this.captionInput.onchange = () => {
            this.updateActiveLayerButton()
            this.redrawMacro()
        }
        this.captionInput.onkeyup = e => {
            if (e.code==='Enter') this.redrawMacro()
        }
        if( window.MACROGEN_DEFAULTS?.caption )
            this.captionInput.value = window.MACROGEN_DEFAULTS.caption

        this.adjustCaseCheckbox = my('input', 'adjustCase')
        this.adjustCaseCheckbox.onchange = redraw
        this.resolutionCheckbox = my('input', 'limit-resolution')
        this.resolutionCheckbox.onchange = redraw
        this.maxResXInput = my('input', 'max-res-x')
        if (this.maxResXInput) this.maxResXInput.onchange = redraw
        this.maxResYInput = my('input', 'max-res-y')
        if (this.maxResYInput) this.maxResYInput.onchange = redraw
        const maxResResetButton = my('button', 'max-res-reset')
        if (maxResResetButton) maxResResetButton.onclick = () => {
            this.maxResXInput.value = 1920
            this.maxResYInput.value = 1080
            this.redrawMacro()
        }

        const randomMacroButton = my('button', 'random-macro') 
        if (randomMacroButton) randomMacroButton.onclick = this.selectRandomLayerType.bind(this)

        //// SLIDERS
        this.macroSliders = element.getElementsByTagName('DIV').namedItem('macro-sliders')

        /** @type {{ [name: string]: SliderGroup }} */
        this.sliders = {}
        for( const elem of this.macroSliders.getElementsByClassName('sliders-container') ) {
            const sliders = new SliderGroup(elem)
            this.sliders[sliders.name] = sliders
            sliders.onchange = autoRedraw
        }
        
        this.imageSliders = new SliderGroup(my('div', 'image'))
        this.imageSliders.onchange = autoRedraw

        //// CANVAS OVERLAY POSITION GRABBY
        this.setupCanvasOverlay()

        // This needs to be here idk
        this.onMacroTypeChange(null, false)

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
    }

    getCaption() {
        const caption = this.captionInput.value
        if (!this.adjustCaseCheckbox.checked)
            return caption
        const layer = this.getLayerType()
        if (layer.preferCase === 'all caps')
            return caption.toUpperCase()
        if (layer.preferCase === 'title case')
            return titleCase(caption)
        return caption
    }

    setupCanvasOverlay() {
        const canvasOverlay = this.my('div', 'canvas-overlay')

        this.updateCanvasOverlay = () => {}

        if( !canvasOverlay ) return

        this.updateCanvasOverlay = () => {
            canvasOverlay.style.left = this.canvas.offsetLeft + 'px'
            canvasOverlay.style.width = this.canvas.clientWidth + 'px'
            canvasOverlay.style.top = this.canvas.offsetTop + 'px'
            canvasOverlay.style.height = this.canvas.clientHeight + 'px'
            updateGrabbies()
        }
        window.addEventListener('resize', this.updateCanvasOverlay)

        const grabbies = canvasOverlay.getElementsByClassName('grabby')
        const posGrabby = this.posGrabby = grabbies.namedItem('position')
        const scaleGrabby = this.scaleGrabby = grabbies.namedItem('scale')
        const layeringUpGrabby = this.layeringUpGrabby = grabbies.namedItem('layering-up')
        const layeringDownGrabby = this.layeringDownGrabby = grabbies.namedItem('layering-down')
        const GrabType = {
            none: 0, position: 1, scale: 2
        }
        let grabState = {type: 0, xOffset: 0, yOffset: 0, scale: 1}
        const grabMap = [null, posGrabby, scaleGrabby]

        const SCALEGRABDIST = 40
        const getScale = e => 
            Math.hypot(posGrabby.offsetLeft-e.offsetX, posGrabby.offsetTop-e.offsetY) / Math.hypot(SCALEGRABDIST, SCALEGRABDIST)

        /** Adjust the grabbies' position based on the Slider values. */
        const updateGrabbies = () => {
            const { xOffset, yOffset, scale } = this.sliders.position.getValues()
            const left = (xOffset+.5)*this.canvas.clientWidth
            const top =  (yOffset+.5)*this.canvas.clientHeight
            updatePosGrabby(left, top)
            updateScaleGrabby(left, top, scale)
            updateLayeringGrabbies(left, top)
        }
        const updatePosGrabby = (left, top) => {
            posGrabby.style.left = left + 'px'
            posGrabby.style.top = top + 'px'
        }
        const updateScaleGrabby = (left, top, scale) => {
            scaleGrabby.style.left = left + scale*SCALEGRABDIST + 'px'
            scaleGrabby.style.top = top - scale*SCALEGRABDIST + 'px'
        }
        const updateLayeringGrabbies = (left, top) => {
            layeringUpGrabby.style.left = left + 50 + 'px'
            layeringUpGrabby.style.top  = top  - 10 + 'px'
            layeringDownGrabby.style.left = left + 50 + 'px'
            layeringDownGrabby.style.top  = top  + 10 + 'px'
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
                updatePosGrabby(e.offsetX, e.offsetY)
                updateScaleGrabby(e.offsetX, e.offsetY, this.sliders.position.get('scale'))
                updateLayeringGrabbies(e.offsetX, e.offsetY)
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
                    yOffset: posGrabby.offsetTop/this.canvas.clientHeight-.5
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

        // Hackish, just bind these clicks to the layer control buttons
        const layerControls = this.my('div', 'layers-controls')
        const moveUpButton = layerControls.children.namedItem('moveUp')
        const moveDownButton = layerControls.children.namedItem('moveDown')
        layeringUpGrabby.addEventListener('click', () => moveUpButton.click())
        layeringDownGrabby.addEventListener('click', () => moveDownButton.click())

        document.addEventListener('pointerup', ifNonMobile(completeGrab))
        this.canvas.addEventListener('pointermove', moveGrab)
        this.canvas.addEventListener('click', e => { moveGrab(e); completeGrab(e)} )


        //// Hook up checkbox to enable/disable
        const showGrabby = this.my('input', 'showGrabby')
        showGrabby.onchange = e => { posGrabby.hidden = scaleGrabby.hidden = layeringDownGrabby.hidden = layeringUpGrabby.hidden = !showGrabby.checked }
        showGrabby.onchange()
    }

    createMacroTypeSelects() {
        const onchange = e => this.onMacroTypeChange(e)

        const {macroType: defaultType, game: defaultGame, preset: defaultPreset} = window.MACROGEN_DEFAULTS 

        //// Macro Type
        /** @type {HTMLSelectElement} */
        this.macroTypeSelect = this.my('select', 'macro-type')
        this.macroTypeSelect.onchange = onchange

        for( const key in MacroType )
            this.macroTypeSelect.appendChild(makeOption(key, macroTypeName[key]))

        if( defaultType ) this.macroTypeSelect.value = defaultType

        //// Game
        /** @type {HTMLSelectElement} */
        this.gameSelect = this.my('select', 'macro-type-game')
        this.gameSelect.onchange = onchange

        for( const key in Game )
            this.gameSelect.appendChild(makeOption(key, gameName[key]))

        if( defaultGame ) this.gameSelect.value = defaultGame

        //// Preset (depends on combination of type+game)
        /** @type { {[type in keyof MacroType]: {[game in keyof Game]: HTMLSelectElement}} } */
        this.presetSelects = {}
        /** @type {HTMLElement} */
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
    
    /* ======================= MULTI-LAYERS ======================= */

    /** Create layer controls */
    setUpLayers() {
        const layerControls = this.my('div', 'layers-controls')
        const layerContainer = this.my('div', 'layers-container')

        const layer = this.getLayerType()
        const sliders = this.getChangedSliderValues()
        this.addLayer({layer, sliders})
        
        if( !layerControls ) return

        const getButton = name => layerControls.children.namedItem(name)
        const duplicateButton = getButton('duplicate')
        const deleteButton = getButton('delete')
        const moveUpButton = getButton('moveUp')
        const moveDownButton = getButton('moveDown')
        const hideButton = getButton('hide')

        this.layerButtons = {duplicateButton, deleteButton, moveUpButton, moveDownButton, hideButton}

        duplicateButton.addEventListener('click', () => {
            const layer = this.getLayerType()
            const sliders = this.getChangedSliderValues()
            const hidden = this.layers[this.activeLayer].hidden
            this.addLayer({layer, sliders, hidden})
            this.redrawMacro()
            deleteButton.disabled = false
        })
        deleteButton.addEventListener('click', () => {
            if( this.layers.length <= 1 ) return

            const oldData = this.layers[this.activeLayer]
            layerContainer.removeChild(oldData.button)
            
            this.layers.splice(this.activeLayer, 1)
            if( this.activeLayer === this.layers.length )
                this.activeLayer--
            this.layers[this.activeLayer].activate()
            this.redrawMacro()
            
            if( this.layers.length <= 1 )
                deleteButton.disabled = true
        })
        moveUpButton.addEventListener('click', () => {
            if( this.activeLayer === 0 ) return
            const i = this.activeLayer
            
            const data = this.layers[i]
            const otherData = this.layers[i-1];
            [this.layers[i], this.layers[i-1]] = [otherData, data]
            layerContainer.insertBefore(data.button, otherData.button)            

            this.activeLayer--
            this.redrawMacro()
            this.updateLayerControlButtons()
        })
        moveDownButton.addEventListener('click', () => {
            if( this.activeLayer === this.layers.length-1 ) return
            const i = this.activeLayer
            
            const data = this.layers[i]
            const otherData = this.layers[i+1];
            [this.layers[i], this.layers[i+1]] = [otherData, data]
            layerContainer.insertBefore(otherData.button, data.button)            

            this.activeLayer++
            this.redrawMacro()
            this.updateLayerControlButtons()
        })
        hideButton.addEventListener('click', () => {
            this.layers[this.activeLayer].hidden ^= true
            this.layers[this.activeLayer].updateButton()
            this.redrawMacro()
            this.updateLayerControlButtons()
        })
    }

    updateLayerControlButtons() {
        if( !this.layerButtons ) return
        const i = this.activeLayer
        const data = this.layers[i]
        
        this.layerButtons.moveUpButton.disabled = (i === 0)
        this.layerButtons.moveDownButton.disabled = (i === this.layers.length-1)
        const hideIcon = this.layerButtons.hideButton.children[0]
        hideIcon.className = data.hidden? "icon icon-eye-closed": "icon icon-eye-open"
    }

    addLayer(data) {
        const oldData = this.layers[this.activeLayer]
        // Insert before current
        this.layers.splice(this.activeLayer, 0, data)
        this.activeLayer++

        // Create button
        const layerContainer = this.my('div', 'layers-container')
        const button = this.makeLayerButton(data)
        if( oldData )
            layerContainer.insertBefore(button, oldData.button)
        else
            layerContainer.append(button)

        data.activate = () => {
            // Pull in switched-to layer state
            const index = this.layers.indexOf(data)
            this.activeLayer = index
            this.setChangedSliderValues(data.sliders)
            this.setLayerType(data.layer)
            data.updateButton()

            this.updateLayerControlButtons()
        }

        const onClick = e => {
            // Save switched-from layer state
            const oldData = this.layers[this.activeLayer]
            if( oldData ) {
                oldData.layer = this.getLayerType()
                oldData.sliders = this.getChangedSliderValues()
            }
            // Pull in switched-to layer state
            data.activate()
            oldData?.updateButton()
        }
        button.addEventListener('click', onClick)
        // Dumb workaround for the caption possibly being changed instantly here
        const caption = this.captionInput.value
        onClick()
        this.captionInput.value = caption
    }

    /** Makes an HTML layer box element
     * @param {DrawableLayer} layer
    */
    makeLayerButton(data) {
        const button = makeElem('button', 'soulsy-box layer-box')
        const idElem = makeElem('b')
        const typeElem = makeElem('b')
        const gameElem = makeElem('b')
        const presetElem = makeElem('b')
        const captionElem = makeElem('span')
        button.append(typeElem, ' / ', gameElem, ' / ', presetElem, makeElem('br'), '“', captionElem, '”')

        const updateButton = () => {
            idElem.textContent = data.layer.id
            typeElem.textContent = macroTypeName[data.layer.type]
            gameElem.textContent = gameName[data.layer.game]
            presetElem.textContent = data.layer.preset
            captionElem.textContent = data.sliders.caption

            if( this.layers[this.activeLayer] === data )
                button.classList.add('active-layer')
            else
                button.classList.remove('active-layer')

            if( data.hidden )
                button.classList.add('hidden-layer')
            else
                button.classList.remove('hidden-layer')
        }

        data.button = button
        data.updateButton = updateButton
        updateButton()

        return button
    }

    updateActiveLayerButton() {
        const data = this.layers[this.activeLayer]
        if( !data ) return
        data.layer = this.getLayerType()
        data.sliders.caption = this.getCaption()
        data.updateButton()
    }

    /* ======================= SLIDER SAVING/LOADING ======================= */

    getChangedSliderValues() {
        const vals = {}
        vals.caption = this.getCaption()
        vals.adjustCase = this.adjustCaseCheckbox.checked
        for( const slider in this.sliders ) {
            vals[slider] = this.sliders[slider].getChangedValues()
        }
        return vals
    }
    
    setChangedSliderValues(vals) {
        this.captionInput.value = vals.caption 
        this.adjustCaseCheckbox.checked = vals.adjustCase
        for( const slider in this.sliders ) {
            this.sliders[slider].setChangedValues(vals[slider])
        }
    }   

    /* ======================= LAYER (TYPE) SWITCHING ======================= */

    /** Callback from the macro type select */
    onMacroTypeChange(e, redraw=true) {
        const oldType = this.previousLayerType
        const newType = this.getLayerType()
        /** @type {DrawableLayer} */
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

        this.updateCanvasOverlay()
        this.updateActiveLayerButton()

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

    /** @param {DrawableLayer} layer */
    setLayerType(layer, redraw=false) {
        this.macroTypeSelect.value = layer.type
        this.gameSelect.value = layer.game
        this.presetSelects[layer.type][layer.game].value = layer.preset

        this.onMacroTypeChange(null, redraw)
    }

    selectRandomLayerType() {
        const layer = layerTypes[Math.floor(Math.random()*layerTypes.length)]
        this.setLayerType(layer, true)
    }

    /* ======================= DRAWING ======================= */

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
    onNoMoreBackgroundImage() {
        this.imageSliders.hide()
        this.redrawMacro()
    }

    /** 
     * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
    */
    getTempCanvasAndContext() {        
        const temp = this.tempCanvas
        temp.width = this.canvas.width
        temp.height = this.canvas.height
        return [temp, temp.getContext('2d')]
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
    drawBackgroundImage() {
        const maxResX = parseInt(this.maxResXInput?.value) || 1920
        const maxResY = parseInt(this.maxResYInput?.value) || 1080

        if( !this.imageHandler.image ) {
            this.resizeCanvas(maxResX, maxResY)
            return
        }

        const image = this.imageHandler.image
        const ctx = this.ctx
        const canvas = this.canvas
        let scale = 1

        if( this.resolutionCheckbox.checked ) {
            // Constrain image to be no larger than desired
            scale = Math.min(maxResX/image.width, maxResY/image.height, 1)
            this.resizeCanvas(image.width*scale, image.height*scale)
            ctx.scale(scale, scale)

        } else {
            this.resizeCanvas(image.width, image.height)
        }

        this.drawFlatColor()
        
        if( !this.imageSliders.usable ) {
            ctx.drawImage(image, 0, 0)
            return
        }

        const { imgSaturate, imgContrast, imgBrightness, imgChromatic } = this.imageSliders.getValues()
        const { bgColor, bgColorOpacity } = this.bgColorSliders.getValues()
        const bgColorStr = `rgba(${bgColor.join()}, ${bgColorOpacity}`

        let filter
        // The way these filters work is a little weird, I like it better when the order varies like this
        if( (imgContrast-100)*(imgBrightness-100) < 0 )
            filter = `saturate(${imgSaturate}%) brightness(${imgBrightness}%) contrast(${imgContrast}%)`
        else
            filter = `saturate(${imgSaturate}%) contrast(${imgContrast}%) brightness(${imgBrightness}%)`

        if( imgChromatic > 0 ) {
            const [tempCanvas, tempCtx] = this.getTempCanvasAndContext()
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
            ctx.drawImage(tempCanvas, 0, 0)

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
            ctx.drawImage(tempCanvas, -canvas.width*imgChromatic/2, 0)
            ctx.globalCompositeOperation = 'source-over'
        }
        else
        {
            ctx.filter = filter
            ctx.drawImage(image, 0, 0)
        }
        ctx.filter = 'none'

    }

    /** 
     * Call after major changes;
     * Blanks the canvas, redraws the selected image if any, and draws the text on top.
     */
    async redrawMacro() {
        const ctx = this.ctx
        this.resetDrawingState()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.drawFlatColor()
    
        // May alter the resolution
        this.drawBackgroundImage()
        this.updateCanvasOverlay()

        // UI changes
        this.resWarning.hidden = !this.tooBig()
        this.resView.x.textContent = canvas.width
        this.resView.y.textContent = canvas.height
    
        for (let i=this.layers.length-1; i >= 0; i--) {
            const layerData = this.layers[i]
            if (layerData.hidden) continue
            this.resetDrawingState()
            const layer = layerData.layer
            const isActive = (i === this.activeLayer)

            const sliders = {}
            if (isActive) {
                sliders.caption = this.getCaption()
                for (const slider in layer.sliders) {
                    sliders[slider] = this.sliders[slider].getValues()
                }
            } else {
                sliders.caption = layerData.sliders.caption
                for (const slider in layer.sliders) {
                    sliders[slider] = { ...this.sliders[slider].trueDefaults, ...layer.sliders[slider], ...layerData.sliders[slider] }
                }
            }
            
            await layerData.layer.draw(ctx, this.canvas, this, sliders)
        }
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