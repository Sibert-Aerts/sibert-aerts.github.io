const {min, max, floor, sqrt} = Math


const _assetPath = location.href.replace(/new-area\/.*$/, 'new-area/image-creator/assets/')

class Asset {
    constructor(path) {
        this.path = _assetPath + path
    }

    /** @returns {Promise<HTMLImageElement>} */
    get() {
        if (this.img) return this.img
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = this.path
            img.onload = () => { this.img = img; resolve(img) }
            img.onerror = reject
        })
    }
}

/** Contains useful Images */
const ASSETS = {
    custom: { flame: new Asset('custom/flame.png') },
    ds1: {
        bossHealth: new Asset('ds1/boss health bar.png'),
        poisonIcons: new Asset('ds1/poison icons.png'),
        poisonBarFrame: new Asset('ds1/poison bar frame.png'),
        poisonBarFrameEnd: new Asset('ds1/poison bar frame end.png'),
        interactBox: new Asset('ds1/interact box.png'),
        interactBoxButton: new Asset('ds1/interact box button.png'),
        itemPickupBox: new Asset('ds1/item pickup.png'),
        itemPickupDish: new Asset('ds1/item pickup dish.png'),
    },
    ds2: {
        bossHealthFrame: new Asset('ds2/boss health frame.png'),
        bossHealthRed: new Asset('ds2/boss health red.png'),
        bossHealthYellow: new Asset('ds2/boss health yellow.png'),
        buttonBlue: new Asset('ds2/button blue.png'),
        buttonOrange: new Asset('ds2/button orange.png'),
        interactBox: new Asset('ds2/interact box yes no.png'),
    },
    bloodborne: {
        areaLines: new Asset('bloodborne/area lines.png'),
        areaLinesTransp: new Asset('bloodborne/area lines transp.png'),
        areaBlot: new Asset('bloodborne/area blot.png'),
        areaBlotTransp: new Asset('bloodborne/area blot transp.png'),

        bossHealthBase: new Asset('bloodborne/boss health base.png'),
        bossHealthRed: new Asset('bloodborne/boss health red.png'),
        bossHealthCap: new Asset('bloodborne/boss health cap transp.png'),
    },
    ds3: {
        bossHealthFrame: new Asset('ds3/boss health frame.png'),
        bossHealthRed: new Asset('ds3/boss health red.png'),
        bossHealthYellow: new Asset('ds3/boss health yellow.png'),
        itemPickupBox: new Asset('ds3/item pickup box.png'),
        itemPickupDish: new Asset('ds3/item pickup dish.png'),
    },
    sekiro: {
        areaNameBG: new Asset('sekiro/area name bg.png'),
        areaNameBGLarge: new Asset('sekiro/area name bg large.png'),

        bossHealthBase: new Asset('sekiro/boss health base.png'),
        bossHealthDamage: new Asset('sekiro/boss health damage.png'),
        bossHealthRed: new Asset('sekiro/boss health red.png'),
        bossHealthTip: new Asset('sekiro/boss health tip.png'),
        bossLife: new Asset('sekiro/boss life.png'),
        bossLostLife: new Asset('sekiro/boss lost life.png'),
        bossNameBG: new Asset('sekiro/boss name bg.png'),
    },
    eldenRing: {
        bossHealthBase: new Asset('eldenRing/boss health base.png'),
        bossHealthYellow: new Asset('eldenRing/boss health yellow.png'),
        bossHealthRed: new Asset('eldenRing/boss health red.png'),
        bossHealthFrame: new Asset('eldenRing/boss health frame.png'),
        bossHealthTip: new Asset('eldenRing/boss health tip.png'),

        poisonFrameCapLeft: new Asset('eldenRing/poison frame cap left.png'),
        poisonFrameLength: new Asset('eldenRing/poison frame length.png'),
        poisonBarFill: new Asset('eldenRing/poison bar fill.png'),
        poisonBarCap: new Asset('eldenRing/poison bar cap.png'),
        poisonIcons: new Asset('eldenRing/poison icons.png'),

        itemPickupBoxBlack: new Asset('eldenRing/item pickup box black.png'),
        itemPickupBoxPurple: new Asset('eldenRing/item pickup box purple.png'),
        itemPickupBoxGold: new Asset('eldenRing/item pickup box gold.png'),
        itemCategoryBadges: new Asset('eldenRing/item category badges.png'),
    }
}

// List of colour gradients as arrays of (short) hex codes, eyeballed by me
const GRADIENTS = {
    gay:    ['#f00', '#f80', '#fe0', '#0a0', '#26c', '#a0a'],
    trans:  ['#7bf', '#7bf', '#f9a', '#f9a', '#fff', '#fff', '#f9a', '#f9a', '#7bf', '#7bf'],
    bi:     ['#f08', '#f08', '#a6a', '#80f', '#80f'],
    les:    ['#f20', '#f64', '#fa8', '#fff', '#f8f', '#f4c', '#f08'],
    nb:     ['#ff2', '#fff', '#84d', '#333'],
    pan:    ['#f2c', '#f2c', '#ff2', '#ff2', '#2cf', '#2cf'],
    men:    ['#2a6', '#6ea', '#8fc', '#fff', '#88f', '#44c', '#22a'],
}

// The same colour gradients but formatted as [r,g,b] arrays
const GRADIENTS_RGB = {}
for (const key in GRADIENTS) {
    GRADIENTS_RGB[key] = []
    for (const hex of GRADIENTS[key]) {
        GRADIENTS_RGB[key].push( [parseInt(hex[1], 16)*17, parseInt(hex[2], 16)*17, parseInt(hex[3], 16)*17] )
    }
}

/**
 * Makes a horizontal gradient around x=y=0 from an array of colors.
 *  May specify opacity.
*/
function makeGradient(ctx, colors, width, x=0, opacity=1) {
    const gradient = ctx.createLinearGradient(x-width/2, 0, x+width/2, 0)
    for (let i=0; i<colors.length; i++) {
        const [r, g, b] = colors[i]
        gradient.addColorStop(i/(colors.length-1), `rgba(${r}, ${g}, ${b}, ${opacity}`)
    }
    return gradient
}

function makePresetGradient(ctx, key, width, x=0, opacity=1, mul=undefined) {
    let colors = GRADIENTS_RGB[key]
    if (mul) colors = colors.map(c => RGBMul(c, mul).map(byteClamp))
    return makeGradient(ctx, colors, width, x, opacity)
}


//========================================================================
//========================       DRAWABLES       =========================
//========================================================================

/**
 * @typedef {(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gen: MacroGenerator, sliders: any) => void} drawFun
 */

/** PARTIAL: Draws a horizontal shadow bar at y=0. */
function drawShadowBar(ctx, canvas, gen, sliders, s0) {
    const w = canvas.width, h = canvas.height
    const { shadowSize, shadowOpacity, shadowOffset, shadowSoftness } = sliders.shadow

    if (shadowSize <= 0) return

    const shadowHeight = shadowSize * .25*h * s0
    const shadowCenter = shadowOffset * s0 * h
    const top = shadowCenter - shadowHeight/2
    const bottom = shadowCenter + shadowHeight/2

    const softnessLow  = min(1, shadowSoftness)
    const softnessHigh = max(1, shadowSoftness) - 1

    const gradient = ctx.createLinearGradient(0, top, 0, bottom)
    gradient.addColorStop(0, '#0000')
    gradient.addColorStop(  .25*softnessLow, `rgba(0, 0, 0, ${shadowOpacity})`)
    gradient.addColorStop(1-.25*softnessLow, `rgba(0, 0, 0, ${shadowOpacity})`)
    gradient.addColorStop(1, '#0000')
    ctx.fillStyle = gradient

    if( softnessHigh > 0 )
        ctx.filter = `blur(${floor(shadowHeight*softnessHigh/4)}px)`

    ctx.fillRect(-shadowHeight/2, top, w+shadowHeight, shadowHeight)
    ctx.filter = 'none'
}

/** PARTIAL: Sets the appropriate ctx properties. */
function applyFontSliders(ctx, canvas, gen, sliders, s=1) {
    const { fontSize, textColor, fontFamily, fontFamilyFallback, vScale, charSpacing, fontWeight } = sliders.font

    let caption = sliders.caption

    // TODO: the chrome version doesn't scale with font size while the other one does!
    if( browserIs.chrome ) {
        //// If on Chrome: This feature works (but does cause the horizontal centering to misalign)
        canvas.style.letterSpacing = floor(charSpacing*s) + 'px'
        ctx.translate(charSpacing*s/2, 0)
        // TODO: this throws off the glow-blur centering

    } else if( charSpacing > 0 ) {
        //// Otherwise: simply inject little hair spaces in between each character
        const space = ' '.repeat(floor(charSpacing/5))
        caption = caption.split('').join(space)
    }

    ctx.font = `${fontWeight} ${fontSize*s}px ${fontFamily}, ${fontFamilyFallback}`
    ctx.fillStyle = `rgb(${textColor.join()})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.scale(1, vScale)

    return [caption, vScale]
}

/** Draw text containing line breaks as multiple lines. */
function drawMultilineText(ctx, text, {x=0, y=0, lineHeight=0, align='center', strokeFirst=false}={}) {
    const lines = text.split('\n')
    let y0 = y
    if (align=='center') {
        y0 -= (lines.length-1)/2 * lineHeight
    } else if (align === 'bottom') {
        y0 -= (lines.length-1) * lineHeight
    }
    if (strokeFirst) {
        for (let i=0; i<lines.length; i++) {
            ctx.strokeText(lines[i], x, y0 + lineHeight*i)
        }
    }
    drawMultilineTextRaw(ctx, lines, x, y0, lineHeight)
}

/** Draw multiple lines of text above one another, no bells and whistles. */
function drawMultilineTextRaw(ctx, lines, x, y, lineHeight) {
    for (let i=0; i<lines.length; i++) {
        ctx.fillText(lines[i], x, y + lineHeight*i)
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function storeAndRemoveAlpha(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const data = imageData.data
    const originalAlphas = new Uint8ClampedArray(data.length/4)
    for (let i=3, j=0; i<data.length; i+=4, j++) {
        originalAlphas[j] = data[i]
        data[i] = 255
    }
    ctx.putImageData(imageData, 0, 0)
    return originalAlphas
}

function restoreAlpha(ctx, originalAlphas) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const data = imageData.data
    for (let i=3, j=0; j<originalAlphas.length; i+=4, j++) {
        data[i] = originalAlphas[j]
    }
    ctx.putImageData(imageData, 0, 0)
}


// =============================================== NOUN VERBED/GENERAL ==============================================

/** @type {drawFun} Function which draws a Souls-style NOUN VERBED.  */
function drawNounVerbed(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const { textOpacity, blurTint, blurSize, blurOpacity } = sliders.zoomBlur
    const { textColor, fontSize } = sliders.font
    const gradient = sliders.gradient

    const x0 = xOffset*w + w/2
    const y0 = yOffset*h + h/2
    s *= s0

    //// SHADE
    // The shade only moves up or down
    ctx.translate(0, y0)
    drawShadowBar(ctx, canvas, gen, sliders, s0)
    ctx.translate(x0, 0)

    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    const lines = caption.split('\n')
    const linesY0 = -(lines.length-1)/2 * fontSize * s
    ctx.save()

    //// Emulate the zoom blur effect
    const zoomSteps = floor(20*blurSize * Math.pow(s, 1/4))
    // Zoom blur vertical distance
    const VOFFSET = 1
    const voff = VOFFSET*s/(blurSize-1)

    const gradientKey = gradient && gradient.gradient
    if (gradientKey) {
        var gradientWidth = gradient.gradientScale * 1920 * s
        ctx.fillStyle = makePresetGradient(ctx, gradientKey, gradientWidth, 0, 1, blurTint)
    } else {
        ctx.fillStyle = `rgb(${RGBMul(textColor, blurTint).map(byteClamp)})`
    }

    // Draw the zoom blur as a bunch of layers, back-to-front for proper effect
    for (let i=zoomSteps; i>=0; i--) {
        ctx.save()
        // `scaleFactor` ranges from 1 up to and including blurSize
        const scaleFactor = Math.pow(blurSize, i/zoomSteps)
        if (i) ctx.scale(scaleFactor, scaleFactor)
        // `fatProduct` ranges from 1 up to and including approx. 2
        const fatProduct = Math.pow(scaleFactor, 1/Math.log2(blurSize))

        ctx.filter = `blur(${floor(s*scaleFactor**4)}px)`
        ctx.globalAlpha = blurOpacity / fatProduct
        drawMultilineTextRaw(ctx, lines, 0, linesY0 + voff*(scaleFactor-1)/vScale, fontSize*s*0.9)
        ctx.restore()
    }

    ctx.restore()

    // Draw the regular text on top
    if (gradientKey) {
        ctx.fillStyle = makePresetGradient(ctx, gradient.gradient, gradientWidth, 0, textOpacity)
    } else {
        ctx.fillStyle = `rgba(${textColor}, ${textOpacity})`
    }
    drawMultilineTextRaw(ctx, lines, 0, linesY0, fontSize*s*0.9)
}

/** @type {drawFun} Function which draws a Demon's Souls-style NOUN VERBED.  */
function drawDeSNounVerbed(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const x0 = xOffset*w + w/2
    const y0 = yOffset*h + h/2
    s *= s0

    //// SHADE
    // The shade only moves up or down
    ctx.translate(0, y0)
    drawShadowBar(ctx, canvas, gen, sliders, s0)
    ctx.translate(x0, 0)

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
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    ctx.fillText(caption, 0, -5*s/vScale)
    ctx.restore()

    //// SUBCAPTION
    const { fontFamily, fontFamilyFallback, textColor } = sliders.font
    const { subCaption } = sliders.subCaption
    ctx.scale(1.1, 1)

    canvas.style.letterSpacing = `${s}px`
    ctx.font = `600 ${24*s}px ${fontFamily}, ${fontFamilyFallback}`
    ctx.fillStyle = `rgb(${textColor.join()})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    drawMultilineText(ctx, subCaption, {y: 86*s, lineHeight: 32*s, align: 'top'})
}

/** @type {drawFun} Function which draws Bloodborne's iconic glowy style text.  */
function drawGlowyText(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const { textOpacity, glowColor, glowSize, glowOpacity } = sliders.glowy
    let { textColor, fontSize } = sliders.font
    const gradient = sliders.gradient

    const x0 = xOffset * w + w/2
    const y0 = yOffset * h + h/2
    s *= s0

    //// RAINBOW: SETUP
    const gradientKey = gradient && gradient.gradient
    if (gradientKey) {
        var gradientWidth = gradient.gradientScale * 1920 * s
        var trueCanvas=canvas, trueCtx=ctx;
        [canvas, ctx] = gen.getTempCanvasAndContext()
        textColor = [255, 255, 255]
    }
    ctx.translate(x0, y0)

    //// TEXT
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    ctx.globalCompositeOperation = 'lighter' // blend mode: Add
    ctx.filter = `blur(${s/2}px)`

    /// First: Just draw the text, no glow
    const [r, g, b] = textColor
    ctx.fillStyle = `rgba(${0}, ${g}, ${0}, ${textOpacity})`
    drawMultilineText(ctx, caption, {lineHeight: fontSize*s, align: 'top'})
    ctx.fillStyle = `rgba(${r}, ${0}, ${b}, ${textOpacity})`
    drawMultilineText(ctx, caption, {lineHeight: fontSize*s, align: 'top', x: -s})

    /// Then: Draw the text black (invisible) multiple times to get more glow.
    ctx.fillStyle = `#000000`
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0

    // glowSize === 0 normally hides the glow even though it's a totally cromulent amount of glow to want
    const glowSizeEps = max(.0001, glowSize)

    for( let opacity=glowOpacity; opacity > 0; ) {
        // Extending the blur size for over-opacity gives a nicer, smoother effect
        ctx.shadowBlur = glowSizeEps * max(opacity, 1)
        ctx.shadowColor = `rgb(${glowColor.join()}, ${opacity})`
        drawMultilineText(ctx, caption, {lineHeight: fontSize*s, align: 'top'})
        opacity--
    }
    ctx.restore()

    //// RAINBOW: PAYOFF
    if (gradientKey) {
        // Turns out the combination of multiply-then-add attempted has unusual behaviour due to
        //  how transparency and blend modes (don't quite) work together, resulting in some ugly artifacts.
        // I solve it by first completely removing transparency from the temp layer,
        //  and putting it back after the multiply. (Inefficient since this is not hardware accelerated.)
        const originalAlphas = storeAndRemoveAlpha(ctx)
        // Apply rainbow mask
        ctx.fillStyle = makePresetGradient(ctx, gradientKey, gradientWidth)
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillRect(-x0, -y0, w, h)
        restoreAlpha(ctx, originalAlphas)

        // Paste onto true canvas
        trueCtx.globalCompositeOperation = 'lighter' // blend mode: Add
        trueCtx.drawImage(canvas, 0, 0)
    }
}

/** @type {drawFun} Function which draws an Elden Ring style NOUN VERBED.  */
function drawEldenNounVerbed(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const { textOpacity, blurTint, blurSize, blurOpacity } = sliders.zoomBlur
    const { textColor, fontSize } = sliders.font
    const gradient = sliders.gradient
    const gradientKey = gradient && gradient.gradient

    const x0 = xOffset * w + w/2
    const y0 = yOffset * h + h/2
    s *= s0

    //// SHADE
    // The shade only moves up or down
    ctx.translate(0, y0)
    drawShadowBar(ctx, canvas, gen, sliders, s0)
    ctx.translate(x0, 0)


    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)

    // Regular text
    if (gradientKey) {
        var gradientWidth = gradient.gradientScale * 1920 * s
        ctx.fillStyle = makePresetGradient(ctx, gradientKey, gradientWidth, 0, textOpacity)
    } else {
        ctx.fillStyle = `rgba(${textColor.join()}, ${textOpacity})`
    }
    drawMultilineText(ctx, caption, {lineHeight: fontSize*s})

    // Ghost effect goes on top
    ctx.globalCompositeOperation = 'lighter' // blend mode: Add
    ctx.shadowBlur = 1

    const scaleX = blurSize, scaleY = 1+(blurSize-1)/2
    ctx.scale(scaleX, scaleY)

    if (gradientKey) {
        var gradientWidth = gradient.gradientScale * 1920 * s
        ctx.fillStyle = makePresetGradient(ctx, gradientKey, gradientWidth, 0, blurOpacity, blurTint)
    } else {
        ctx.fillStyle = `rgba(${blurTint.join()}, ${blurOpacity})`
    }
    drawMultilineText(ctx, caption, {lineHeight: fontSize*s})
}

/** @type {drawFun} Function which draws a Sekiro style japanese-character-decorated caption. */
function drawSekiroText(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    //// TEXT
    const textColor = sliders.font.textColor
    const { symbolFont, symbol, symbolSize, symbolPos, symbolSpace } = sliders.sekiro
    const { textOpacity, glowColor, glowSize, glowOpacity, blendMode, secretFactor } = sliders.glowy

    // Trick to make the japanese font work (for lack of an explicit API)
    byId('adobe-font-trick').innerText = symbol

    // First: the characters
    ctx.font = `800 ${symbolSize}px ${symbolFont || 'serif'}`
    ctx.textBaseline = 'middle'
    ctx.filter = `blur(${sqrt(s*s0)/2}px)`

    const symbolsMultiline = Array.from(symbol).join('\n')

    /// First: Draw the characters black (invisible) multiple times to get more glow.
    ctx.globalCompositeOperation = blendMode
    ctx.fillStyle = (blendMode === 'lighter')? `#000000`: `rgb(${glowColor.join()})`

    for( let opacity=glowOpacity; opacity > 0; ) {
        // Extending the blur size for over-opacity gives a nicer, smoother effect
        ctx.shadowBlur = glowSize * max(opacity, 1)
        ctx.shadowColor = `rgba(${glowColor.join()}, ${opacity})`
        drawMultilineText(ctx, symbolsMultiline, {y: symbolPos, lineHeight: symbolSize+symbolSpace, align: 'bottom'})
        opacity--
    }
    /// Turn off the shadow and blend mode to draw the characters normal
    ctx.globalCompositeOperation = 'source-over' // blend mode: Normal
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgb(${textColor.join()})`
    drawMultilineText(ctx, symbolsMultiline, {y: symbolPos, lineHeight: symbolSize+symbolSpace, align: 'bottom'})

    /// Finally: Do the same with the caption
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    const lines = caption.split('\n')

    ctx.globalCompositeOperation = blendMode
    ctx.fillStyle = (blendMode === 'lighter')? `#000000`: `rgb(${glowColor.join()})`
    ctx.shadowBlur = glowSize / 5
    for( let opacity=glowOpacity*textOpacity*secretFactor; opacity > 0; ) {
        ctx.shadowColor = `rgba(${glowColor.join()}, ${opacity})`
        drawMultilineTextRaw(ctx, lines, 0, (0.196*h*s0) /vScale, sliders.font.fontSize*1.1)
        opacity--
    }

    ctx.globalCompositeOperation = 'source-over' // blend mode: Normal
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgb(${textColor.join()}, ${textOpacity})`
    drawMultilineTextRaw(ctx, lines, 0, (0.196*h*s0) /vScale, sliders.font.fontSize*1.1)
}


// ==================================================== AREA NAME ===================================================

/** @type {drawFun} Function which draws an Area Name (DS1/DS3 style). */
function drawAreaName(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    s *= s0

    // Shadow style
    ctx.shadowOffsetX = 2*s
    ctx.shadowOffsetY = 1*s
    ctx.shadowBlur = 8*s

    // UNDERLINE
    const { ulLength, ulWidth, ulPos, contrast } = sliders.area

    if( ulLength > 0 ) {
        // The gradient
        const colorTuple = sliders.font.textColor.join()
        const grad = ctx.createLinearGradient(-ulLength*w, 0, ulLength*w, 0)
        grad.addColorStop(0,   `rgba(${colorTuple}, 0)`)
        grad.addColorStop(0.1, `rgba(${colorTuple}, ${.75 * max(1, contrast)})`)
        grad.addColorStop(0.9, `rgba(${colorTuple}, ${.75 * max(1, contrast)})`)
        grad.addColorStop(1,   `rgba(${colorTuple}, 0)`)

        ctx.fillStyle = grad
        ctx.shadowColor = `rgba(0, 0, 0, ${contrast/2})`
        ctx.beginPath()
        ctx.ellipse(0, ulPos*s, ulLength*w, s*ulWidth/2, 0, 0, 2*Math.PI)
        ctx.fill()
    }

    // TEXT
    ctx.shadowColor = `rgba(0, 0, 0, ${contrast})`
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    ctx.textBaseline = 'alphabetic'

    // Apply contrast by just redrawing the same text so the shadow overlaps
    //      0.85 * 1.17 ~= 1
    for( let c = contrast; c >= 0; ) {
        ctx.shadowColor = `rgba(0, 0, 0, ${.85 * min(c, 1.17)})`
        drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize*s*0.8, align: 'bottom'})
        c -= 1.17
    }
}

/** @type {drawFun} Function which draws a DS2-style Area Name. */
function drawDS2AreaName(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const { ulLength, ulWidth, ulPos, contrast } = sliders.area
    const { lineWidth, lineColor } = sliders.outline
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    s *= s0

    // UNDERLINE
    if( ulLength > 0 ) {
        // The gradient
        const colorTuple = sliders.font.textColor.join()
        const grad = ctx.createLinearGradient(-ulLength*w, 0, ulLength*w, 0)
        grad.addColorStop(0,   `rgba(${colorTuple}, 0)`)
        grad.addColorStop(0.1, `rgba(${colorTuple}, ${.75 * max(1, contrast)})`)
        grad.addColorStop(0.9, `rgba(${colorTuple}, ${.75 * max(1, contrast)})`)
        grad.addColorStop(1,   `rgba(${colorTuple}, 0)`)

        ctx.fillStyle = `rgba(${lineColor}, ${contrast/3})`
        const eps = lineWidth*s/2
        const dy = ulPos*s
        ctx.beginPath()
        ctx.ellipse(0, dy, ulLength*w+eps, s*ulWidth/2+eps, 0, 0, 2*Math.PI)
        ctx.fill()

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(0, dy, ulLength*w, s*ulWidth/2, 0, 0, 2*Math.PI)
        ctx.fill()
    }

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    ctx.textBaseline = 'alphabetic'

    ctx.strokeStyle = `rgba(${lineColor}, ${contrast/3})`
    ctx.lineWidth = lineWidth * s
    ctx.miterLimit = 5
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize*s, align: 'bottom', strokeFirst: true})
}

/** @type {drawFun} Function which draws a Bloodborne-style Area Name. */
async function drawBloodborneAreaName(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    ctx.scale(s*s0, s*s0)
    // had to make the Origin align with the cross of the lines because it's cuter
    ctx.translate(-16, -14)

    const { blotOpacity, mode } = sliders.bbArea

    // Back-image (black blot + crossed white lines)
    ctx.save()
    if( mode === 'transparency' ) {
        const blotPromise = ASSETS.bloodborne.areaBlotTransp.get()
        const linesPromise = ASSETS.bloodborne.areaLinesTransp.get()
        ctx.globalAlpha = blotOpacity
        ctx.drawImage(await blotPromise, -535, -112)
        ctx.globalAlpha = 1
        ctx.drawImage(await linesPromise, -632, -105)
    } else {
        const blotPromise = ASSETS.bloodborne.areaBlot.get()
        const linesPromise = ASSETS.bloodborne.areaLines.get()
        const invert = () => {
            ctx.save()
            ctx.fillStyle = '#ffffff'
            ctx.globalCompositeOperation = 'difference'
            ctx.globalAlpha = 1
            const t = ctx.getTransform()
            ctx.resetTransform()
            ctx.fillRect(floor(-535*t.a+t.e), floor(-112*t.d+t.f), floor(655*t.a), floor(209*t.d))
            ctx.restore()
        }
        if (blotOpacity > 0) {
            invert()
            ctx.globalAlpha = blotOpacity
            ctx.globalCompositeOperation = 'lighter'
            ctx.drawImage(await blotPromise, -535, -112)
            invert()
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'lighter'
        ctx.drawImage(await linesPromise, -632, -105)
    }
    ctx.restore()

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'right'
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize, align: 'bottom'})
}

/** @type {drawFun} Function which draws an Area Name. */
async function drawSekiroAreaName(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    ctx.scale(s*s0, s*s0)

    // Pixcture
    ctx.save()
    const { frameWidth, frameHeight, opacity } = sliders.sekiroFrame

    // If needed, use a much larger resolution image for the backdrop
    const useLargeImage = s*s0*max(frameHeight, frameWidth) > 1.01
    let img = await (useLargeImage? ASSETS.sekiro.areaNameBGLarge.get(): ASSETS.sekiro.areaNameBG.get())
    const magicFactor = .5541
    if( useLargeImage ) ctx.scale( magicFactor, magicFactor )

    ctx.scale(frameWidth, frameHeight)
    ctx.globalAlpha = opacity
    const offsetFactor = useLargeImage? 1: magicFactor
    ctx.drawImage(img, -1254*offsetFactor, (-185 - 60/frameHeight)*offsetFactor)
    ctx.restore()

    // Shadow style
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = 8*s

    // TEXT
    ctx.shadowColor = `rgba(0, 0, 0, 1)`
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize})
}

/** @type {drawFun} Function which draws an Elden Ring-style Area Name. */
function drawEldenAreaName(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    s *= s0

    // FRAME
    const { opacity, frameWidth, frameHeight } = sliders.erFrame
    if( opacity > 0 ) {
        ctx.save()

        const rectWidth = frameWidth*h*s0
        const rectHeight = frameHeight*h*s0

        const left = -rectWidth/2, right =rectWidth/2
        const top = .01*s0*h - rectHeight
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
        ctx.filter = `blur(${sqrt(2*s)}px)`
        ctx.fillRect(left, lineY, rectWidth, 1*s)
        ctx.fillRect(left, lineY, rectWidth, 1*s)

        ctx.restore()
    }

    // TEXT

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    ctx.textBaseline = 'alphabetic'

    ctx.shadowOffsetX = 2*s
    ctx.shadowOffsetY = 1*s
    ctx.shadowBlur = 8*s
    ctx.shadowColor = `rgba(0, 0, 0, .7)`
    // Twice to get the slightly darker shadow
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize*s, align: 'bottom'})
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize*s, align: 'bottom'})

}


// ==================================================== YOU DIED ====================================================

/** @type {drawFun} Function which draws an YOU DIED. */
function drawYouDied(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const gradient = sliders.gradient
    const gradientKey = gradient && gradient.gradient
    const x0 = xOffset*w + w/2
    const y0 = yOffset*h + h/2
    s *= s0

    //// SHADE
    // The shade only moves up or down
    ctx.translate(0, y0)
    drawShadowBar(ctx, canvas, gen, sliders, s0)
    ctx.translate(x0, 0)

    //// TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    if (gradientKey) {
        var gradientWidth = gradient.gradientScale * 1920 * s
        ctx.fillStyle = makePresetGradient(ctx, gradientKey, gradientWidth)
    }
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize*s})
}


// ===================================================== SPECIAL ====================================================

/** @type {drawFun} Function which draws simple outlined text. */
function drawOutlined(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const gradient = sliders.gradient
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    s *= s0

    // TEXT
    const { lineWidth, lineColor } = sliders.outline
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
    if (gradient && gradient.gradient) {
        var gradientWidth = gradient.gradientScale * 1920 * s
        ctx.fillStyle = makePresetGradient(ctx, gradient.gradient, gradientWidth)
    }
    if( lineWidth > 0 ) {
        ctx.strokeStyle = `rgb(${lineColor})`
        ctx.lineWidth = lineWidth * s
        ctx.miterLimit = 5
    }
    drawMultilineText(ctx, caption, {lineHeight: sliders.font.fontSize*s, strokeFirst: lineWidth>0})
}

/** @type {drawFun} Function which draws SSBM styled text. */
async function drawMelee(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    const x0 = xOffset*w + w/2
    const y0 = yOffset*h + h/2
    const gradient = sliders.gradient
    const gradientKey = gradient && gradient.gradient
    ctx.translate(x0, y0)
    s *= s0

    const { textColor, fontSize } = sliders.font
    const { lineWidth, shadowOpacity } = sliders.melee
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders, s)
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
    const [temp, tctx] = gen.getTempCanvasAndContext()

    applyFontSliders(tctx, temp, gen, sliders, s)
    tctx.textBaseline = 'alphabetic'
    tctx.setTransform(ctx.getTransform())

    const fxScale = fontSize/120*s

    //// INNER GRADIENT TEXT
    const grad = tctx.createLinearGradient(0, -48*fxScale, 0, 0)
    grad.addColorStop(0, '#000000')
    grad.addColorStop(1, gradientKey? '#ffffff': `rgb(${textColor})`)
    tctx.fillStyle = grad
    tctx.fillText(caption, 0, 0)

    //// OPTIONAL GRADIENT COLOURING
    if (gradientKey) {
        tctx.globalCompositeOperation = 'multiply'
        var gradientWidth = gradient.gradientScale * 1920 * s
        tctx.fillStyle = makePresetGradient(ctx, gradientKey, gradientWidth)
        tctx.fillRect(-x0, -y0, w, h)
    }

    //// FLAME EFFECT
    tctx.save()
    tctx.globalCompositeOperation = 'lighter'
    tctx.translate(0, -fontSize*.5*s)
    tctx.transform(fxScale, 0, -.3*fxScale, .4*fxScale, 0, 0)
    for( let i=0; i<10; i++ )
        tctx.drawImage(await ASSETS.custom.flame.get(), -1000 + i*229, 0)
    tctx.restore()
    /// MASK THE FLAME EFFECT!
    tctx.globalCompositeOperation = 'destination-in'
    tctx.fillText(caption, 0, 0)

    ctx.resetTransform()
    ctx.drawImage(temp, 0, 0)
}

/** @type {drawFun} Function which draws SSBM styled text. */
async function drawImage(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    /** @type {HTMLImageElement} */
    const image = sliders.simpleImage.image.image
    // NOTE:
    if (image)
        ctx.drawImage(image, -image.width/2, -image.height/2)

}

/** @type {drawFun} Function which draws a Lethal Company loot indicator. */
function drawLethalCompanyLoot(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate(xOffset*w + w/2, yOffset*h + h/2)
    ctx.scale(s*s0, s*s0)

    // VALUES
    const { textColor, fontWeight, fontSize, fontFamily, fontFamilyFallback } = sliders.font
    const { subCaption, tint, hiddenTint, opacity, boxLength, circleRadius } = sliders.lethalCompany

    // CIRCLES
    function drawCircle(radius, strokeStyle) {
        ctx.strokeStyle = strokeStyle
        ctx.lineWidth = 4*circleRadius
        ctx.beginPath();
        ctx.arc(0, 0, radius*circleRadius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    drawCircle(78,  `rgba(${tint.join()}, ${opacity*2})`)
    drawCircle(88,  `rgba(${tint.join()}, ${opacity*2})`)
    drawCircle(136, `rgba(${tint.join()}, ${opacity*2})`)
    drawCircle(212, `rgba(${tint.join()}, ${opacity})`)
    drawCircle(232, `rgba(${tint.join()}, ${opacity})`)
    drawCircle(242, `rgba(${tint.join()}, ${opacity})`)

    // RECTANGLES
    ctx.fillStyle = `rgba(${RGBMul(tint, hiddenTint).join()}, ${opacity*2.5})`
    ctx.fillRect(70, -92, 490*boxLength, 80)
    if (subCaption)
        ctx.fillRect(70, 0, 358*boxLength, 49)

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = `rgb(${textColor.join()}, ${max(opacity*4, .8)})`
    ctx.fillText(caption, 70, -40/vScale)

    // SUBCAPTION
    if (subCaption) {
        ctx.font = `${fontWeight} ${fontSize*0.7}px ${fontFamily}, ${fontFamilyFallback}`
        ctx.fillText(subCaption, 70, 30/vScale)
    }
}


// ================================================ BOSS HEALTH BARS ================================================

/** @type {drawFun} Function which draws DS1 boss health bar + name. */
async function drawDS1Boss(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {health, recentDamage, damageNumber} = sliders.boss

    // Transparent grey background
    ctx.fillStyle = 'rgba(20, 20, 20, .5)'
    ctx.fillRect(-670, -6, 1335, 25)

    // Yellow health bar
    const yellowGrad = ctx.createLinearGradient(0, -6, 0, 25)
    yellowGrad.addColorStop(0, '#6b651e')
    yellowGrad.addColorStop(.6, '#37330b')
    yellowGrad.addColorStop(.9, '#4a4613')
    ctx.fillStyle = yellowGrad
    ctx.fillRect(-670, -6, 1335 * min(1, health+recentDamage), 25)

    // Red health bar
    const redGrad = ctx.createLinearGradient(0, -6, 0, 25)
    redGrad.addColorStop(0, '#604540')
    redGrad.addColorStop(.4, '#2e120e')
    redGrad.addColorStop(.9, '#2d0000')
    ctx.fillStyle = redGrad
    ctx.fillRect(-670, -6, 1335 * health, 25)

    // The main healthbar texture
    ctx.drawImage(await ASSETS.ds1.bossHealth.get(), -750, -70)

    // TEXT
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText(caption, -655, -30/vScale)

    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.fillText(damageNumber, 655, -35/vScale)
}

/** @type {drawFun} Function which draws DS2 boss health bar + name. */
async function drawDS2Boss(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {health, recentDamage, damageNumber} = sliders.boss

    // Start loading assets
    const framePromise = ASSETS.ds2.bossHealthFrame.get()
    const yellowPromise = ASSETS.ds2.bossHealthYellow.get()
    const redPromise = ASSETS.ds2.bossHealthRed.get()

    // The main healthbar texture
    ctx.drawImage(await framePromise, -346, -14)
    // Yellow health bar
    ctx.drawImage(await yellowPromise, -346+14, -14+9, 664 * min(1, health+recentDamage), 9)
    // Red health bar
    ctx.drawImage(await redPromise, -346+14, -14+9, 664 * health, 9)

    // TEXT
    ctx.strokeStyle = `rgba(0, 0, 0, .5)`
    ctx.lineWidth = 2
    ctx.miterLimit = 5

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.strokeText(caption, -345, -18/vScale)
    ctx.fillText(caption, -345, -18/vScale)

    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.strokeText(damageNumber, 345, -19/vScale)
    ctx.fillText(damageNumber, 345, -19/vScale)
}

/** @type {drawFun} Function which draws DS3 boss health bar + name. */
async function drawDS3Boss(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {health, recentDamage, damageNumber} = sliders.boss

    // Start loading assets
    const framePromise = ASSETS.ds3.bossHealthFrame.get()
    const yellowPromise = ASSETS.ds3.bossHealthYellow.get()
    const redPromise = ASSETS.ds3.bossHealthRed.get()

    // The main healthbar texture
    ctx.drawImage(await framePromise, -508, -25)

    // Yellow health bar
    let barWidth = 7 + 1002 * min(1, health+recentDamage)
    ctx.drawImage(await yellowPromise, 0, 0, barWidth, 50, -508, -25, barWidth, 50)

    // Red health bar
    barWidth = 7 + 1002 * health
    ctx.drawImage(await redPromise, 0, 0, barWidth, 50, -508, -25, barWidth, 50)

    // TEXT
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = 4*s
    ctx.shadowColor = '#000000'

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText(caption, -496, -17/vScale)

    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.fillText(damageNumber, 496, -18/vScale)
}

/** @type {drawFun} Function which draws Sekiro boss health bar + name. */
async function drawSekiroBoss(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = h/1080

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {health, recentDamage, livesLeft, livesSpent, frameOpacity} = sliders.sekiroBoss

    // Start loading assets
    const basePromise = ASSETS.sekiro.bossHealthBase.get()
    const damagePromise = ASSETS.sekiro.bossHealthDamage.get()
    const redPromise = ASSETS.sekiro.bossHealthRed.get()
    const tipPromise = ASSETS.sekiro.bossHealthTip.get()
    const lifePromise = ASSETS.sekiro.bossLife.get()
    const lostLifePromise = ASSETS.sekiro.bossLostLife.get()
    const nameBGPromise = ASSETS.sekiro.bossNameBG.get()

    ctx.save()
    ctx.scale(.5538, .5538)
    // The main healthbar texture
    ctx.drawImage(await basePromise, 0, 0)

    // Damage health bar
    let barWidth = 32 + 740 * min(1, health+recentDamage)
    ctx.drawImage(await damagePromise, 0, 0, barWidth, 71, 0, 0, barWidth, 71)

    // Red health bar
    barWidth = 32 + 740 * health
    ctx.drawImage(await redPromise, 0, 0, barWidth, 71, 0, 0, barWidth, 71)
    if( health > 0 ) ctx.drawImage(await tipPromise, barWidth - 10, 20)
    ctx.restore()

    // Lives
    ctx.save()
    ctx.scale(.45, .45)
    for( let i=0; i<livesLeft+livesSpent && i<100; i++ ) {
        const img = await (i<livesLeft? lifePromise: lostLifePromise)
        ctx.drawImage(img, 20 + 85*i, -80)
    }
    ctx.restore()

    // Text background
    ctx.save()
    ctx.scale(.4815, .4815)
    ctx.globalAlpha = frameOpacity
    ctx.drawImage(await nameBGPromise, 25, 75)
    ctx.restore()

    // TEXT
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 1
    ctx.shadowBlur = 4*s
    ctx.shadowColor = '#000000'

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText(caption, 26, 64/vScale)
}

/** @type {drawFun} Function which draws Bloodborne boss health bar + name. */
async function drawBloodborneBoss(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {health, recentDamage, damageNumber} = sliders.boss

    // Start loading assets
    const basePromise = ASSETS.bloodborne.bossHealthBase.get()
    const redPromise = ASSETS.bloodborne.bossHealthRed.get()
    const capPromise = ASSETS.bloodborne.bossHealthCap.get()

    // The main healthbar texture
    ctx.drawImage(await basePromise, -680, -40)

    // Red health bar
    let barWidth = 54 + 1253 * health
    ctx.drawImage(await redPromise, 0, 0, barWidth, 80, -680, -40, barWidth, 80)

    // Caps
    ctx.drawImage(await capPromise, -680+54-6, -16)
    ctx.drawImage(await capPromise, -680+barWidth-6, -16)

    // TEXT
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.shadowBlur = 4*s
    ctx.shadowColor = '#000000'

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText(caption, -640, -23/vScale)

    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.fillText(damageNumber, 630, -23/vScale)
}

/** @type {drawFun} Function which draws Elden Ring boss health bar + name. */
async function drawEldenRingBoss(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {health, recentDamage, damageNumber} = sliders.boss

    // Start loading assets
    const basePromise = ASSETS.eldenRing.bossHealthBase.get()
    const yellowPromise = ASSETS.eldenRing.bossHealthYellow.get()
    const redPromise = ASSETS.eldenRing.bossHealthRed.get()
    const tipPromise = ASSETS.eldenRing.bossHealthTip.get()
    const framePromise = ASSETS.eldenRing.bossHealthFrame.get()

    ctx.save()
    ctx.scale(.5, .5) // Elden Ring uses 4K textures

    // Backing shadow
    ctx.drawImage(await basePromise, -1049, -50)
    // Yellow health bar
    let barWidth = 50 + 1998 * min(1, health+recentDamage)
    ctx.drawImage(await yellowPromise, 0, 0, barWidth, 100, -1049, -50, barWidth, 100)
    // Red health bar
    barWidth = 50 + 1998 * health
    ctx.drawImage(await redPromise, 0, 0, barWidth, 100, -1049, -50, barWidth, 100)
    // The tip
    ctx.drawImage(await tipPromise, -1049+barWidth-53, -50)
    // The frame
    ctx.drawImage(await framePromise, -1049, -50)

    ctx.restore()

    // TEXT
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.shadowBlur = 4*s
    ctx.shadowColor = '#000000'

    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillText(caption, -500, -15/vScale)

    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.scale(.9, .9) // Numbers are just slightly slightly smaller
    ctx.fillText(damageNumber, 500/.9, -15/vScale/.9)
}


// ================================================ POISON BARS ================================================

/** @type {drawFun} Function which draws DS1 poison status bar. */
async function drawDS1Poison(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {poison, maxPoison, type, active} = sliders.ds1Poison

    // Start loading assets
    const framePromise = ASSETS.ds1.poisonBarFrame.get()
    const endPromise = ASSETS.ds1.poisonBarFrameEnd.get()
    const iconsPromise = ASSETS.ds1.poisonIcons.get()

    ctx.save()
    ctx.scale(.75, .75)

    // Calculate important things
    const frameLeft = 80, frameTop = 36, frameHeight = 30
    const frameWidth = maxPoison
    const barWidth = min(maxPoison, poison)

    // Solid grey background
    ctx.fillStyle = 'rgb(71, 71, 71)'
    ctx.fillRect(0, -frameHeight/2, frameWidth, frameHeight)

    // Bar (gradient)
    const colours = active==='active'? ['#70641f', '#3a3310', '#574e19']: ['#3c006b', '#20003a', '#32005a']
    const gradient = ctx.createLinearGradient(0, -frameHeight/2, 0, frameHeight/2)
    gradient.addColorStop(0, colours[0])
    gradient.addColorStop(.6, colours[1])
    gradient.addColorStop(.9, colours[2])
    ctx.fillStyle = gradient
    ctx.fillRect(0, -frameHeight/2, barWidth, frameHeight)

    // The frame
    ctx.drawImage(await framePromise, 0, 0, frameLeft + frameWidth, 100, -frameLeft, -frameTop-frameHeight/2, frameLeft + frameWidth, 100)
    ctx.drawImage(await endPromise, frameWidth-8, -frameTop-frameHeight/2)

    // The icon
    ctx.restore()
    ctx.save()
    ctx.scale(.5, .5)
    ctx.drawImage(await iconsPromise, 0, type*86, 86, 86, -110, -86/2, 86, 86)
    ctx.restore()
}

/** @type {drawFun} Function which draws ER poison status bar. */
async function drawERPoison(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {poison, maxPoison, type, active} = sliders.erPoison

    ctx.save()
    ctx.scale(.5, .5)

    // Calculate important things
    const fillLeft = 38, fillTop = 36, fillHeight = 28
    const frameWidth = maxPoison
    const barWidth = min(maxPoison, poison)

    // Transparent black backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, .5)'
    ctx.fillRect(0, -fillHeight/2, frameWidth, fillHeight)

    // Start loading assets
    const barPromise = ASSETS.eldenRing.poisonBarFill.get()
    const barCapPromise = ASSETS.eldenRing.poisonBarCap.get()
    const framePromise = ASSETS.eldenRing.poisonFrameLength.get()
    const endCapPromise = ASSETS.eldenRing.poisonFrameCapLeft.get()
    const iconsPromise = ASSETS.eldenRing.poisonIcons.get()

    // Bar
    ctx.drawImage(await barPromise, 0, type*100, fillLeft + barWidth, 100, -fillLeft, -50, fillLeft + barWidth, 100)
    ctx.drawImage(await barCapPromise, -21.5 + barWidth, -50)

    // The frame
    const cropWidth = frameWidth + 42
    ctx.drawImage(await framePromise, 1501-cropWidth, 0, cropWidth, 100, 0, -50, cropWidth, 100)
    ctx.drawImage(await endCapPromise, -fillLeft, -50)

    // The icon
    ctx.scale(.88, .88)
    ctx.drawImage(await iconsPromise, 0, type*106, 106, 106, -106, -106/2, 106, 106)
    ctx.restore()
}


// ================================================ INTERACTION BOXES ================================================

/** @type {drawFun} Function which draws a DS1 interact box. */
async function drawDS1InteractBox(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)
    ctx.scale(.75, .75)

    const {option1, option2, selected} = sliders.interactBox

    // Start loading assets
    const boxPromise = ASSETS.ds1.interactBox.get()
    const buttonPromise = ASSETS.ds1.interactBoxButton.get()

    // The Box
    const boxWidth = 1290, boxHeight = 260
    ctx.drawImage(await boxPromise, -boxWidth/2 - 4, -boxHeight/2)

    // Text
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.fillText(caption, 0, -21/vScale)
    ctx.restore()

    if (!option1 || !option2) {
        if (selected) {
            ctx.save()
            ctx.scale(1, .8)
            ctx.drawImage(await buttonPromise, -boxWidth/2, -boxHeight/2 + 10)
            ctx.restore()
        }
        applyFontSliders(ctx, canvas, gen, sliders)
        ctx.fillText(option1 || option2, 0, 44/vScale)
    } else {
        if (selected) {
            const xo = (selected=='first')? -280: 280
            ctx.drawImage(await buttonPromise, xo-boxWidth/2, -boxHeight/2)
        }
        applyFontSliders(ctx, canvas, gen, sliders)
        ctx.fillText(option1, -280, 42/vScale)
        ctx.fillText(option2,  280, 42/vScale)
    }
}

/** @type {drawFun} Function which draws a DS2 interact box. */
async function drawDS2InteractBox(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const {option1, option2, selected} = sliders.interactBox

    // Start loading assets
    const boxPromise = ASSETS.ds2.interactBox.get()
    const buttonBluePromise = ASSETS.ds2.buttonBlue.get()
    const buttonOrangePromise = ASSETS.ds2.buttonOrange.get()

    const boxWidth = 1000, boxHeight = 350
    const buttonWidth = 220, buttonHeight = 50
    // The Box
    ctx.drawImage(await boxPromise, -boxWidth/2, -boxHeight/2)

    // Text
    ctx.strokeStyle = `rgba(0, 0, 0, .75)`
    ctx.lineWidth = 3
    ctx.miterLimit = 5
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)

    // Multi-line block of text
    drawMultilineText(ctx, caption, {y: -30/vScale, lineHeight: sliders.font.fontSize * 1.25})

    ctx.restore()

    if (!option1 || !option2) {
        // BUTTON
        ctx.save()
        ctx.scale(1.5, 1.5)
        let btn = await (selected? buttonOrangePromise: buttonBluePromise)
        ctx.drawImage(btn, -buttonWidth/2, 50-buttonHeight/2)
        ctx.restore()

        // LABEL
        applyFontSliders(ctx, canvas, gen, sliders)
        ctx.strokeText(option1 || option2, 0, 76/vScale)
        ctx.fillText(option1 || option2, 0, 76/vScale)
    } else {
        // BUTTONS
        const BUTTONSPACE = 170
        ctx.save()
        ctx.scale(1.5, 1.5)
        let btn = await (selected=='first'? buttonOrangePromise: buttonBluePromise)
        ctx.drawImage(btn, -BUTTONSPACE/1.5-buttonWidth/2, 50-buttonHeight/2)
        btn = await (selected=='second'? buttonOrangePromise: buttonBluePromise)
        ctx.drawImage(btn, BUTTONSPACE/1.5-buttonWidth/2, 50-buttonHeight/2)
        ctx.restore()

        // LABELS
        applyFontSliders(ctx, canvas, gen, sliders)
        ctx.strokeText(option1, -BUTTONSPACE, 76/vScale)
        ctx.fillText(option1, -BUTTONSPACE, 76/vScale)
        ctx.strokeText(option2, BUTTONSPACE, 76/vScale)
        ctx.fillText(option2,  BUTTONSPACE, 76/vScale)
    }
}


// ================================================ ITEM PICKUP BOXES ================================================

/** @type {drawFun} Function which draws a DS1 item pickup box. */
async function drawDS1ItemPickupBox(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)
    ctx.scale(.75, .75)

    const { quantity, showDish } = sliders.itemPickupDS1DS3
    const { image: imageValues, imageSize, imageVertical } = sliders.itemPickupImage

    // Start loading assets
    const boxPromise = ASSETS.ds1.itemPickupBox.get()
    const dishPromise = ASSETS.ds1.itemPickupDish.get()

    // The Box
    const boxWidth = 1300, boxHeight = 250
    ctx.drawImage(await boxPromise, -boxWidth/2, -boxHeight/2)

    // Text
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    drawMultilineText(ctx, caption, {x: -335, y: -8/vScale, lineHeight: 60/vScale, align: 'top'})
    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.fillText(quantity, 445, -8/vScale)
    ctx.restore()

    // Dish
    if (showDish) {
        ctx.drawImage(await dishPromise, -500, 21)
    }

    // Item image
    const image = imageValues.image
    if (image) {
        const imageScale = rectInsideRect(imageSize, imageSize, image.width, image.height)
        const drawnWidth = image.width*imageScale, drawnHeight = image.height*imageScale
        const imageX = -drawnWidth/2 -430
        const imageY = -drawnHeight/2 + 42 - imageSize/3 + imageVertical // Slightly moves up as image gets bigger
        ctx.drawImage(image, imageX, imageY, drawnWidth, drawnHeight)
    }
}

/** @type {drawFun} Function which draws a DS1 item pickup box. */
async function drawDS3ItemPickupBox(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const { quantity, showDish } = sliders.itemPickupDS1DS3
    const { image: imageValues, imageSize, imageVertical } = sliders.itemPickupImage

    // Start loading assets
    const boxPromise = ASSETS.ds3.itemPickupBox.get()
    const dishPromise = ASSETS.ds3.itemPickupDish.get()

    // The Box
    const boxWidth = 1000, boxHeight = 150
    ctx.drawImage(await boxPromise, -boxWidth/2, -boxHeight/2)

    // Text
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textAlign = 'left'
    drawMultilineText(ctx, caption, {x: -202, y: 6/vScale, lineHeight: sliders.font.fontSize*1.1/vScale})
    ctx.textAlign = 'right'
    canvas.style.fontVariantNumeric = 'lining-nums'
    ctx.font = ctx.font // Force the number thing to apply
    ctx.fillText(quantity, 320, 6/vScale)
    ctx.restore()

    // Dish
    if (showDish) {
        ctx.save()
        const dishScale = .61
        ctx.scale(dishScale, dishScale)
        ctx.drawImage(await dishPromise, -300/dishScale, 24/dishScale)
        ctx.restore()
    }

    // Item image
    const image = imageValues.image
    if (image) {
        const imageScale = rectInsideRect(imageSize, imageSize, image.width, image.height)
        const drawnWidth = image.width*imageScale, drawnHeight = image.height*imageScale
        const imageX = -drawnWidth/2 - 268
        const imageY = -drawnHeight/2 + 30 - imageSize/3 + imageVertical // Slightly moves up as image gets bigger
        ctx.drawImage(image, imageX, imageY, drawnWidth, drawnHeight)
    }
}

/** @type {drawFun} Function which draws a DS1 item pickup box. */
async function drawERItemPickupBox(ctx, canvas, gen, sliders) {
    // CONSTANTS
    const w = canvas.width, h = canvas.height
    let s = w/1920

    // USER INPUT
    const { xOffset, yOffset, scale: s0 } = sliders.position
    ctx.translate((xOffset+.5) * w, (yOffset+.5) * h)
    ctx.scale(s*s0, s*s0)

    const { rarity, itemCategory } = sliders.itemPickupER
    const { image: imageValues, imageSize, imageVertical } = sliders.itemPickupImage

    // Start loading assets
    const boxPromise = ASSETS.eldenRing['itemPickupBox' + rarity].get()
    const itemCategoryBadgesPromise = ASSETS.eldenRing.itemCategoryBadges.get()

    // The Box
    const boxWidth = 1500, boxHeight = 600
    ctx.save()
    ctx.scale(0.5, 0.5)
    ctx.drawImage(await boxPromise, -boxWidth/2, -boxHeight/2)
    ctx.restore()

    // Item Category Badge
    ctx.save()
    ctx.scale(0.5, 0.5)
    ctx.drawImage(await itemCategoryBadgesPromise, itemCategory*150, 0, 150, 150, -605, -232, 150, 150)
    ctx.restore()

    // Text
    ctx.save()
    const [caption, vScale] = applyFontSliders(ctx, canvas, gen, sliders)
    ctx.textAlign = 'center'
    drawMultilineText(ctx, caption, {x: 0, y: -80/vScale, lineHeight: sliders.font.fontSize*1.1/vScale, align: 'top'})
    ctx.restore()

    // Item image
    const image = imageValues.image
    if (image) {
        const imageScale = rectInsideRect(imageSize, imageSize, image.width, image.height)
        const drawnWidth = image.width*imageScale, drawnHeight = image.height*imageScale
        const imageX = -drawnWidth/2
        const imageY = 30 + imageVertical - drawnHeight/2
        ctx.drawImage(image, imageX, imageY, drawnWidth, drawnHeight)
    }
}
