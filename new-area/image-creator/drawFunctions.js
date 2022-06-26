

//========================================================================
//========================       DRAWABLES       =========================
//========================================================================

/** 
 * @typedef {(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gen: MacroGenerator) => void} drawFun
 */

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

    ctx.font = `${fontWeight} ${fontSize*s}px ${fontFamily}`
    ctx.fillStyle = `rgb(${textColor.join()})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    ctx.scale(1, vScale)

    return [caption, vScale]
}

/** @param {CanvasRenderingContext2D} ctx */
function putNoise(ctx, x, y, w, h) {
	const iData = ctx.createImageData(w, h)
    const data = iData.data
    const len = data.length
	for(let i=0; i<len; i += 4) {
		data[i  ] = Math.random() * 255
		data[i+1] = Math.random() * 255
		data[i+2] = Math.random() * 255
        data[i+3] = 255
    }
    ctx.putImageData(iData, x, y)
}

/** Contains useful Images */
const ASSETS = {
    flame: './assets/flame.png'
}

for( const name in ASSETS ) {
    const src = ASSETS[name]
    ASSETS[name] = new Image()
    ASSETS[name].src = src
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

/** @type {drawFun} Function which draws a Demon's Souls-style NOUN VERBED.  */
function drawDeSNounVerbed(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    const x0 = xOffset*w, y0 = yOffset*h
    s *= s0

    // The shade only moves up or down
    ctx.translate(0, y0)
    //// SHADE
    drawShadowBar(ctx, canvas, gen, s0)    
    // The text also moves left or right
    ctx.translate(x0, 0)

    // buhh
    ctx.translate(w/2, h/2)

    //// DECOR LINE THINGIES
    const lineWidth = 1.53*h*s0
    const left = -lineWidth/2

    ctx.fillStyle = '#000000'
    ctx.fillRect(left, -80*s, lineWidth, 5*s)
    ctx.fillRect(left, 50*s, lineWidth, 5*s)
    ctx.fillStyle = '#303030'
    ctx.fillRect(left, -80*s, lineWidth, 3*s)
    ctx.fillRect(left, 50*s, lineWidth, 3*s)
    ctx.fillStyle = '#606060'
    ctx.fillRect(left, -80*s, lineWidth, 2*s)
    ctx.fillRect(left, 50*s, lineWidth, 2*s)

    //// CAPTION
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.fillText(caption, 0, 0)    
    
    //// SUBCAPTION
    const fontFamily = gen.sliders.font.get('fontFamily')
    const { subCaption } = gen.sliders.subCaption.getValues()

    ctx.resetTransform()
    ctx.translate(x0 + w/2, y0 + h/2)
    ctx.scale(1.1, 1)

    canvas.style.letterSpacing = `${s}px`
    ctx.globalAlpha = .9
    ctx.font = `400 ${23*s}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    const lines = subCaption.split('\n')
    for(let i=0; i<lines.length; i++) {
        ctx.fillText(lines[i], 0, 86*s + i*32*s)
    }
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

/** @type {drawFun} Function which draws SSBM styled text. */
function drawMelee(ctx, canvas, gen) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = gen.sliders.position.getValues()
    ctx.translate((xOffset+.5)*w, (yOffset+.5)*h)
    s *= s0

    const { textColor, fontSize } = gen.sliders.font.getValues()
    const { lineWidth, shadowOpacity } = gen.sliders.melee.getValues()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, s)
    ctx.textBaseline = 'alphabetic'

    //// THE TWO OUTLINES
    if( lineWidth > 0 ) {
        ctx.miterLimit = 3
        
        ctx.shadowBlur = 0
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
        ctx.shadowOffsetX = ctx.shadowOffsetY = 15*s

        ctx.strokeStyle = `#000000`
        ctx.lineWidth = 3.2 * lineWidth * s
        ctx.strokeText(caption, 0, 0)
        
        ctx.shadowOffsetX = ctx.shadowOffsetY = 0

        ctx.strokeStyle = `#ffffff`
        ctx.lineWidth = lineWidth * s
        ctx.strokeText(caption, 0, 0)
    }
    
    //// CREATE A TEMP CANVAS TO ACHIEVE OUR COOL EFFECTS (PAIN IN THE ASS)
    const temp = gen.tempCanvas
    temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext('2d')

    applyFontSliders(tctx, temp, gen, s)
    tctx.textBaseline = 'alphabetic'
    tctx.setTransform(ctx.getTransform())

    const fxScale = fontSize/120*s

    //// INNER GRADIENT TEXT
    const grad = tctx.createLinearGradient(0, -48*fxScale, 0, 0)
    grad.addColorStop(0, '#000000')
    grad.addColorStop(1, RGBToHex(...textColor))
    tctx.fillStyle = grad
    tctx.fillText(caption, 0, 0)

    //// FLAME EFFECT
    tctx.save()
    tctx.globalCompositeOperation = 'lighter'
    tctx.translate(0, -fontSize*.5*s)
    tctx.transform(fxScale, 0, -.3*fxScale, .4*fxScale, 0, 0)
    for( let i=0; i<10; i++ )
        tctx.drawImage(ASSETS.flame, -1000 + i*229, 0)
    tctx.restore()
    /// MASK THE FLAME EFFECT!
    tctx.globalCompositeOperation = 'destination-in'
    tctx.fillText(caption, 0, 0)

    ctx.resetTransform()
    ctx.drawImage(temp, 0, 0)
}