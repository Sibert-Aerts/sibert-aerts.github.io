/*
    Script for the image macro generator on (https://sibert-aerts.github.io/new-area/)
*/

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const text = document.getElementById('image-caption')
text.oninput = redrawImage

const button = document.getElementById('image-upload')
button.onchange = handleFileSelect

const saveLink = document.createElement('a')

var selectedImage = null

function handleFileSelect(e) {
    if( !e.target.files.length ) {
        selectedImage = null; canvas.width = 1920; canvas.height = 1080
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
}

function redrawImage() {
    if( selectedImage ) {
        canvas.width = selectedImage.width
        canvas.height = selectedImage.height
        ctx.drawImage(selectedImage, 0, 0)
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    drawText()
}

function drawText() {
    const w = canvas.width, h = canvas.height
    const s = h/1080

    // UNDERLINE
    const shadowGrad = ctx.createLinearGradient(.18*w, 0, .82*w, 0)
    shadowGrad.addColorStop(0, '#0000')
    shadowGrad.addColorStop(0.1, '#0004')
    shadowGrad.addColorStop(0.9, '#0004')
    shadowGrad.addColorStop(1, '#0000')
    ctx.fillStyle = shadowGrad
    ctx.fillRect(.18*w, .51*h+5*s, .64*w, 3*s)

    const grad = ctx.createLinearGradient(.18*w, 0, .82*w, 0)
    grad.addColorStop(0, '#fff0')
    grad.addColorStop(0.1, '#fffb')
    grad.addColorStop(0.9, '#fffb')
    grad.addColorStop(1, '#fff0')
    ctx.fillStyle = grad
    ctx.fillRect(.18*w, .51*h, .64*w, 5*s)


    // TEXT
    ctx.shadowOffsetX = 2*s
    ctx.shadowOffsetY = 1*s
    ctx.shadowBlur = 8*s
    ctx.shadowColor = '#000d'

    ctx.font = Math.floor(96*s) + 'px adobe-garamond-pro'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'

    ctx.fillText(text.value, w/2, h*0.507)

    // UPDATE DOWNLOAD BUTTON
    saveLink.setAttribute('download', text.value.replaceAll(/[^a-zA-Z ]/g, '') + '.png')
    saveLink.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
}