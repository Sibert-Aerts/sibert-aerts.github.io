/*
    Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/macro-generator.html)
*/

//// UTIL FUNCTIONS
const byId = id => document.getElementById(id)
const makeElem = (tag, clss, text) => { let e = document.createElement(tag); if(clss) e.className = clss; if(text) e.textContent = text; return e }
const getInput = name => document.getElementsByTagName('input').namedItem(name)


//// DOM HOOKS
/** @type HTMLCanvasElement */
const canvas = byId('canvas')
const ctx = canvas.getContext('2d')

const saveLink = document.createElement('a')

const dimView = {x: byId('canv-dim-x'), y: byId('canv-dim-y') }

//// USER CONTROLS
const macroTypeSelect = byId('macro-type')
macroTypeSelect.onchange = redrawImage

const captionInput = byId('image-caption')
captionInput.oninput = autoRedraw
captionInput.onkeyup = e => { if (e.keyCode == 13) redrawImage() }

const imageURL = byId('image-URL')
imageURL.onchange = handleImageURL
imageURL.onkeyup = e => { if (e.keyCode == 13) handleImageURL() }

const fileSelect = byId('image-upload')
fileSelect.onchange = handleFileSelect

document.addEventListener('paste', handlePaste)

const resolutionCheckbox = getInput('limit-resolution')
resolutionCheckbox.onchange = redrawImage

//// SLIDERS
////    MACRO SLIDERS
const x0Input = getInput('x-offset')
const y0Input = getInput('y-offset')
const scaleInput = getInput('scale')
const underlineInput = getInput('underline')
const contrastInput = getInput('contrast')
////    IMAGE SLIDERS
const imgSaturate = getInput('img-saturate')
const imgContrast = getInput('img-contrast')
const imgBrightness = getInput('img-brightness')

x0Input.onchange = y0Input.onchange = scaleInput.onchange = underlineInput.onchange = contrastInput.onchange
    = autoRedraw
if( imgSaturate )
    imgSaturate.onchange = imgContrast.onchange = imgBrightness.onchange = autoRedraw

for( const name of ['x-offset', 'y-offset', 'scale', 'underline', 'contrast', 'img-saturate', 'img-contrast', 'img-brightness'] ) {
    const button = document.getElementsByTagName('button').namedItem(name)
    if(button) button.onclick = () => { getInput(name).value = button.value; redrawImage() }
}

// STATE
var selectedImage
var selectedImageType

function handleBlank() {
    selectedImage = selectedImageType = undefined
    canvas.width = 1920; canvas.height = 1080
    redrawImage()
}

function resetDrawingState() {
    // Clear out the ctx drawing state
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = null
    ctx.shadowBlur = null
    ctx.shadowColor = null
    ctx.shadowOffsetX = null
    ctx.shadowOffsetY = null
    ctx.font = null
    ctx.textAlign = null
    ctx.filter = 'none'

    // On Chrome the canvas styling may affect drawing
    if( !!window.chrome ) {
        canvas.style.letterSpacing = null
    }
}

/** File Selector callback function. */
function handleFileSelect() {
    selectedImage = selectedImageType = null

    if( !fileSelect.files.length ) {
        if( imageURL.value )
            handleImageURL()
        else
            handleBlank()
        return
    }
    var reader = new FileReader()
    reader.onload = function(event) {
        selectedImage = new Image()
        selectedImage.onload = redrawImage
        selectedImage.src = event.target.result
    }
    reader.readAsDataURL(fileSelect.files[0])
    selectedImageType = fileSelect.files[0].type
}

/** Image URL callback function. */
function handleImageURL() {
    selectedImage = selectedImageType = null

    if( !imageURL.value ) {
        imageURL.classList.remove('bad-url')
        if( fileSelect.files.length )
            handleFileSelect()
        else
            handleBlank()
        return
    }
    selectedImage = new Image()
    selectedImage.crossOrigin = 'anonymous'
    selectedImage.onload = function() {
        redrawImage()
        imageURL.classList.remove('bad-url')
    }
    selectedImage.onerror = function(e) {
        console.error('Failed to load provided image URL:', imageURL.value, e)
        imageURL.classList.add('bad-url')
        handleBlank()
    }
    // Attempt to pull image type from URL
    selectedImageType = imageURL.value.match(/\.(\w+)$/)?.[1]
    selectedImage.src = imageURL.value
}

/** Callback that checks if the user is pasting an image onto the page. */
function handlePaste(e) {
    /** @type DataTransferItemList */
    const clipboardItems = e.clipboardData.items
    const items = Array.from(clipboardItems).filter(item => item.type.startsWith('image'))
    if ( !items.length ) return
    const file = items[0].getAsFile()
    
    var reader = new FileReader()
    reader.onload = function(event) {
        selectedImage = new Image()
        selectedImage.onload = redrawImage
        selectedImage.src = event.target.result
    }
    reader.readAsDataURL(file)
    selectedImageType = file.type
}

/** Check whether the current canvas is too big to allow auto-rerendering. */
function canvasTooBig() {
    return (selectedImage && canvas.width*canvas.height >= 2100000)
}

/** 
 * Call after minor input changes;
 * Calls redrawImage() only if the underlying canvas isn't too huge for this feature to be laggy.
 */
function autoRedraw() {
    if(!canvasTooBig()) redrawImage()
}

function resizeCanvas(width, height) {
    if( canvas.width !== width || canvas.height !== height ) {
        canvas.width = width; canvas.height = height
    }
}

/** 
 * Call after major changes;
 * Blanks the canvas, redraws the selected image if any, and draws the text on top.
 */
function redrawImage() {
    resetDrawingState()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if( selectedImage ) {
        if( resolutionCheckbox.checked ) {
            // Constrain image to be no larger than 1920x1080
            const scale = Math.min(1920/selectedImage.width, 1080/selectedImage.height, 1)
            resizeCanvas(selectedImage.width*scale, selectedImage.height*scale)
            ctx.scale(scale, scale)

        } else {
            resizeCanvas(selectedImage.width, selectedImage.height)
        }
        
        if( imgSaturate )
            ctx.filter = `saturate(${imgSaturate.value}%) contrast(${imgContrast.value}%) brightness(${imgBrightness.value}%)`
        
        ctx.drawImage(selectedImage, 0, 0)
        ctx.filter = 'none'
    }
    // UI changes
    byId('resolution-warning').hidden = !canvasTooBig()
    dimView.x.textContent = canvas.width
    dimView.y.textContent = canvas.height
    

    layerTypes[macroTypeSelect.value].draw()
}

/** Save the current contents of the canvas to the user's computer. */
function saveImage() {
    // Turn "image/xyz" to "xyz"
    let imageType = selectedImageType?.replace(/(.*)\//g, '')

    // Normalise to either "jpeg" or "png"
    if( imageType === 'jpg' ) imageType = 'jpeg'
    else if( imageType !== 'jpeg' ) imageType = 'png'

    // Set the file name and put the image data
    saveLink.setAttribute('download', captionInput.value.replaceAll(/[^a-zA-Z ]/g, '') + '.' + imageType)
    saveLink.setAttribute('href', canvas.toDataURL('image/' + imageType).replace('image/' + imageType, 'image/octet-stream'))

    saveLink.click()
}


window.addEventListener('load', function() {
    if( macroTypeSelect ) {
        for( const layerType of layerTypeList ) {
            const elem = makeElem('option', null, layerType.name)
            elem.value = layerType.key
            macroTypeSelect.appendChild(elem)
        }
    }
})

















///////////////////////////////////////////////////// NEO



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

    draw() {
        resetDrawingState()
    
        // Prefer all-caps caption
        if( captionInput.value === 'Enter Caption' )
            captionInput.value = 'ENTER CAPTION'
    
        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080
    
        // USER INPUT
        const x0 = (parseFloat(x0Input.value) + .4)/100 * w
        const y0 = (parseFloat(y0Input.value))/100 * h
        const s0 = 2**parseFloat(scaleInput.value)
        s *= s0
        const shadeScale = parseFloat(underlineInput.value)/32 * s0
        let contrast = parseFloat(contrastInput.value)
    
        // The shade only moves up or down
        ctx.translate(0, y0)
        // SHADE
        if( shadeScale > 0 ) {
            const shadeHeight = shadeScale * .25*h
            const SHADECENTER = .525*h
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
        caption = captionInput.value
    
        // This feature only works on chromia, otherwise just inject hair-spaces between letters
        if( !!window.chrome )
            canvas.style.letterSpacing = Math.floor(8*s) + 'px'
        else
            caption = caption.split('').join(' ')
    
        ctx.font = Math.floor(92*s) + 'px adobe-garamond-pro'
        ctx.textAlign = 'center'
        const MAGICOFFSET = 69*s
        ctx.translate(0, MAGICOFFSET)
        
        const VSCALE = 1.5
        ctx.scale(1, VSCALE)
            
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
    
        resetDrawingState()
        ctx.filter = 'none'
        ctx.translate(x0, y0 + MAGICOFFSET)
        ctx.scale(1, VSCALE)
        ctx.fillStyle = `rgba(255, 255, 107, 0.9)`
        ctx.fillText(caption, w/2, h/2/VSCALE )
    }
}

/** @type DrawableLayer */
const ds3Death = {
    key: 'ds3-death',
    name: 'DS3 - Death',

    draw() {
        resetDrawingState()

        // Prefer all-caps caption
        if( captionInput.value === 'Enter Caption' )
            captionInput.value = 'ENTER CAPTION'

        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080

        // USER INPUT
        const x0 = (parseFloat(x0Input.value) + .6)/100 * w
        const y0 = (parseFloat(y0Input.value) + 1.8)/100 * h
        const s0 = 2**parseFloat(scaleInput.value)
        s *= s0
        const shadeScale = parseFloat(underlineInput.value)/32 * s0
        let contrast = parseFloat(contrastInput.value)

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
        ctx.fillText(captionInput.value, w/2, (h/2 + 50*s)/1.3 )
    }
}

/** @type DrawableLayer */
const ds3Area = {
    key: 'ds3-area',
    name: 'DS3 - Area Name',

    draw() {
        resetDrawingState()
    
        // Prefer title-case caption
        if( captionInput.value === 'ENTER CAPTION' )
            captionInput.value = 'Enter Caption'
    
        // CONSTANTS
        const w = canvas.width, h = canvas.height
        let s = h/1080
    
        // USER INPUT
        const x0 = parseFloat(x0Input.value)/100 * w
        const y0 = parseFloat(y0Input.value)/100 * h
        const s0 = 2**parseFloat(scaleInput.value)
        ctx.translate(x0, y0)
        s *= s0
        const underline = parseFloat(underlineInput.value)/100
        let contrast = parseFloat(contrastInput.value)
    
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
            ctx.fillText(captionInput.value, w/2, h*(0.5 + (1-(s0-1)/3)*0.007 ))
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