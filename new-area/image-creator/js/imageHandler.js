// Author: Sibert Aerts (Rezuaq)


// Magic local image URL fixer so relative images work both in File: and HTTP(S): locations
const _magicRootURL = location.href.replace(/new-area\/.*$/, '')


/** Handles incoming images. */
class ImageHandler {
    /**
     * @param {HTMLElement} element
     */
    constructor(element, globalPaste=false) {
        /** @type HTMLElement */
        this.element = element

        /** @type HTMLImageElement */
        this.image = null
        /** @type string */
        this.imageType = null

        const my = (tag, name) => element.getElementsByTagName(tag).namedItem(name)

        /// URL event bindings
        /** @type HTMLInputElement */
        this.URLinput = my('input', 'image-URL')
        this.URLinput.onchange = this.handleImageURL.bind(this)
        this.URLinput.onkeyup = e => { if (e.code === 'Enter') this.handleImageURL() }
        if (this.URLinput.value) this.handleImageURL()

        /// File select event bindings
        /** @type HTMLInputElement */
        this.fileSelect = my('input', 'image-upload')
        this.fileSelect.onchange = this.handleFileSelect.bind(this)

        /// Set up preset image select
        /** @type HTMLSelectElement */
        this.imageSelect = my('select', 'image-select')
        if (this.imageSelect) {
            // Bind onchange
            this.imageSelect.onchange = this.handleDropdownSelect.bind(this)
            this.imageSelect.imageRoot = this.imageSelect.getAttribute('root') || ''
            // Hook up randomization button
            const randomButton = my('button', 'image-select-random')
            if (randomButton) {
                randomButton.onclick = () => {
                    const options = this.imageSelect.options
                    const option = options[1 + Math.floor(Math.random() * (options.length - 1))]
                    option.selected = true
                    this.imageSelect.onchange()
                }
            }
        }

        /// Paste event bindings
        if (globalPaste)
            document.addEventListener('paste', this.handlePaste.bind(this))
    }

    clear() {
        this.image = undefined
        this.URLinput.value = ''
        this.fileSelect.value = ''
        if (this.imageSelect)
            this.imageSelect.value = ''
    }

    /** File Selector callback function. */
    handleFileSelect() {
        this.image = this.imageType = null

        if (!this.fileSelect.files.length) {
            if (this.URLinput.value)
                this.handleImageURL()
            else
                this._onerror()
            return
        }
        const reader = new FileReader()
        reader.onload = e => {
            this.image = new Image()
            this.image.onload = this._onload.bind(this)
            this.image.src = e.target.result
        }
        reader.readAsDataURL(this.fileSelect.files[0])
        this.imageType = this.fileSelect.files[0].type
    }

    _setImageFromURL(url, type=undefined) {
        this.image = new Image()
        this.image.onload = this._onload.bind(this)
        this.imageType = type || url.match(/\.(\w+)$/)?.[1]
        if (url.startsWith('/')) {
            // Special case: Image hosted on this website, requires a bit of magic to still work in File: mode
            url = _magicRootURL + this.imageSelect.imageRoot + url
            this.image.src = url
        } else {
            this.image.crossOrigin = 'Anonymous'
            this.image.src = url
        }
    }

    /** Image URL callback function. */
    handleImageURL() {
        this.image = this.imageType = null
        this.URLinput.classList.remove('bad-url')

        if (!this.URLinput.value) {
            if (this.fileSelect.files.length)
                this.handleFileSelect()
            else
                this._onerror()
            return
        }
        this.image = new Image()
        this.image.crossOrigin = 'Anonymous'

        this.image.onload = this._onload.bind(this)
        this.image.onerror = e => {
            console.error('Failed to load provided image URL:', this.URLinput.value, e)
            this.URLinput.classList.add('bad-url')
            this._onerror()
        }
        // Attempt to pull image type from URL
        this.imageType = this.URLinput.value.match(/\.(\w+)$/)?.[1]
        this.image.src = this.URLinput.value
    }

    handleDropdownSelect() {
        const screenshot = this.imageSelect.value
        if (screenshot) {
            this._setImageFromURL(screenshot, 'jpg')
        } else {
            this._onerror()
        }
    }

    /** Callback that checks if the user is pasting an image onto the page. */
    handlePaste(e) {
        /** @type DataTransferItemList */
        const clipboardItems = e.clipboardData.items
        const items = Array.from(clipboardItems).filter(item => item.type.startsWith('image'))
        if (!items.length) return
        const file = items[0].getAsFile()

        var reader = new FileReader()
        reader.onload = e => {
            this.image = new Image()
            this.image.onload = this._onload.bind(this)
            this.image.src = e.target.result
        }
        reader.readAsDataURL(file)
        this.imageType = file.type
    }

    _onload() {
        if (this.onload) this.onload()
    }

    _onerror() {
        this.image = this.imageType = undefined
        if (this.onerror) this.onerror()
    }
}