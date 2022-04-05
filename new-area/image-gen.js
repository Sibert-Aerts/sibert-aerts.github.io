/*
    Script for the image macro generator on (https://sibert-aerts.github.io/new-area/)
*/

const byId = id => document.getElementById(id)
const getInput = name => document.getElementsByTagName('input').namedItem(name)

// INTERNALS
/** @type HTMLCanvasElement */
const canvas = byId('canvas')
const ctx = canvas.getContext('2d')

const saveLink = document.createElement('a')

// USER CONTROLS
const captionInput = byId('image-caption')
captionInput.oninput = autoRedraw
captionInput.onkeyup = e => { if (e.keyCode == 13) redrawImage() }

const fileSelect = byId('image-upload')
fileSelect.onchange = handleFileSelect

const x0Input = getInput('x-offset')
const y0Input = getInput('y-offset')
const scaleInput = getInput('scale')
const underlineInput = getInput('underline')
x0Input.onchange = y0Input.onchange = scaleInput.onchange = underlineInput.onchange
    = autoRedraw

for( const name of ['x-offset', 'y-offset', 'scale', 'underline'] ) {
    const button = document.getElementsByTagName('button').namedItem(name)
    button.onclick = () => { getInput(name).value = button.value; redrawImage() }
}

// STATE
var selectedImage
var selectedImageType

/** File Selector callback function. */
function handleFileSelect(e) {
    selectedImage = selectedImageType = null

    if( !e.target.files.length ) {
        canvas.width = 1920; canvas.height = 1080
        redrawImage()
        return
    }
    var reader = new FileReader()
    reader.onload = function(event) {
        selectedImage = new Image()
        selectedImage.onload = redrawImage
        selectedImage.src = event.target.result
    }
    reader.readAsDataURL(e.target.files[0])
    selectedImageType = e.target.files[0].type
}

/** 
 * Call after minor input changes;
 * Calls redrawImage() only if the underlying canvas isn't too huge for this to be laggy.
 */
function autoRedraw() {
    if (!selectedImage || selectedImage.width*selectedImage.height < 2100000 )
        redrawImage()
}

/** 
 * Call after major changes;
 * Blanks the canvas, redraws the selected image if any, and draws the text on top.
 */
function redrawImage() {
    // Why is .resetTransform not standard??
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if( selectedImage ) {
        canvas.width = selectedImage.width
        canvas.height = selectedImage.height
        ctx.drawImage(selectedImage, 0, 0)
    }
    drawText()
}

/** Called by redrawImage() */
function drawText() {
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

    // UNDERLINE
    if( underline > 0 ) {
        const left = (.5-underline)*w, right = (.5+underline)*w
        const length = 2*underline*w

        const shadowGrad = ctx.createLinearGradient(left, 0, right, 0)
        shadowGrad.addColorStop(0,   '#0000')
        shadowGrad.addColorStop(0.1, '#0004')
        shadowGrad.addColorStop(0.9, '#0004')
        shadowGrad.addColorStop(1,   '#0000')
        ctx.fillStyle = shadowGrad
        ctx.fillRect(left, .51*h+5*s, length, 3*s)

        const grad = ctx.createLinearGradient(left, 0, right, 0)
        grad.addColorStop(0,   '#fff0')
        grad.addColorStop(0.1, '#fffb')
        grad.addColorStop(0.9, '#fffb')
        grad.addColorStop(1,   '#fff0')
        ctx.fillStyle = grad
        ctx.fillRect(left, .51*h, length, 5*s)
    }

    // TEXT
    ctx.shadowOffsetX = 2*s
    ctx.shadowOffsetY = 1*s
    ctx.shadowBlur = 8*s
    ctx.shadowColor = '#000d'

    ctx.font = Math.floor(96*s) + 'px adobe-garamond-pro'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'

    ctx.fillText(captionInput.value, w/2, h*0.507)

    // UPDATE DOWNLOAD BUTTON
    let imageType = selectedImageType?.replace(/(.*)\//g, '')
    if( imageType !== 'jpeg' ) imageType = 'png'
    saveLink.setAttribute('download', captionInput.value.replaceAll(/[^a-zA-Z ]/g, '') + '.' + imageType)
    saveLink.setAttribute('href', canvas.toDataURL('image/' + imageType).replace('image/' + imageType, 'image/octet-stream'))
}