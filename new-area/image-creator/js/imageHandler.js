// Author: Sibert Aerts (Rezuaq)

/** Handles incoming images. */
class ImageHandler {
    /**
     * @param {MacroGenerator} macroGen 
     * @param {HTMLElement} parent
     */
    constructor(macroGen, parent) {
        /** @type MacroGenerator */
        this.macroGen = macroGen
        /** @type HTMLElement */
        this.parent = parent

        /** @type HTMLImageElement */
        this.image = null
        /** @type string */
        this.imageType = null

        const my = (tag, name) => parent.getElementsByTagName(tag).namedItem(name)

        /// URL event bindings
        /** @type HTMLInputElement */
        this.URLinput = my('input', 'image-URL')
        this.URLinput.onchange = this.handleImageURL.bind(this)
        this.URLinput.onkeyup = e => { if (e.code==='Enter') this.handleImageURL() }
        if( this.URLinput.value ) this.handleImageURL()

        /// File select event bindings
        /** @type HTMLInputElement */
        this.fileSelect = my('input', 'image-upload')
        this.fileSelect.onchange = this.handleFileSelect.bind(this)

        /// Set up generic screenshot select
        /** @type HTMLSelectElement */
        this.screenshotSelect = my('select', 'generic-screenshot')
        if (this.screenshotSelect) {
            // Bind onchange
            this.screenshotSelect.onchange = () => {
                const screenshot = this.screenshotSelect.value
                if (screenshot) {
                    this._setImageFromURL(screenshot, 'jpg')
                } else {
                    this.onerror()
                }
            }
            const randomButton = my('button', 'random-screenshot')
            randomButton.onclick = () => {
                const options = this.screenshotSelect.options
                const option = options[Math.floor(Math.random()*options.length)]
                option.selected = true
                this.screenshotSelect.onchange()
            }
        }

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

    _setImageFromURL(url, type=undefined) {
        this.image = new Image()
        this.image.crossOrigin = 'Anonymous'
        this.image.onload = this.onload.bind(this)
        this.imageType = type || url.match(/\.(\w+)$/)?.[1]
        this.image.src = url
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
        this.macroGen.onNoMoreBackgroundImage()
    }
}