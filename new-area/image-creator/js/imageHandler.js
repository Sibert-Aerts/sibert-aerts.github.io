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

        /// URL event bindings
        /** @type HTMLInputElement */
        this.URLinput = parent.getElementsByTagName('input').namedItem('image-URL')
        this.URLinput.onchange = this.handleImageURL.bind(this)
        this.URLinput.onkeyup = e => { if (e.code==='Enter') this.handleImageURL() }
        if( this.URLinput.value ) this.handleImageURL()

        /// File select event bindings
        /** @type HTMLInputElement */
        this.fileSelect = parent.getElementsByTagName('input').namedItem('image-upload')
        this.fileSelect.onchange = this.handleFileSelect.bind(this)

        /// Set up generic screenshot select
        /** @type HTMLSelectElement */
        this.screenshotSelect = parent.getElementsByTagName('select').namedItem('generic-screenshot')
        if (this.screenshotSelect) {
            // Fill up select element
            for (const game in ImageHandler.genericScreenshots) {
                const screenshots = ImageHandler.genericScreenshots[game]
                const optGroup = makeElem('optgroup')
                optGroup.label = game
                this.screenshotSelect.appendChild(optGroup)
                for (const screenshot of screenshots) {
                    const option = makeOption('', screenshot.name)
                    option.screenshot = screenshot
                    optGroup.appendChild(option)
                }
            }
            // Bind onchange
            this.screenshotSelect.onchange = (e) => {
                const screenshot = e.target.options[e.target.selectedIndex].screenshot
                if (screenshot) {
                    this._setImageFromURL(screenshot.url, 'jpg')
                } else {
                    this.onerror()
                }
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
        this.macroGen.clear()
    }
}


ImageHandler.genericScreenshots = {
    'Dark Souls': [
        {url: 'https://i.imgur.com/QMoXgZI.jpg', name: 'Undead Asylum / Oscar'},
        {url: 'https://i.imgur.com/3kzlCXb.jpg', name: 'Undead Asylum / Exit'},
        {url: 'https://i.imgur.com/1Rozzjq.jpg', name: 'Firelink Shrine'},
        {url: 'https://i.imgur.com/JaipfBR.jpg', name: 'Firelink Shrine / Giantdad'},
        {url: 'https://i.imgur.com/lyAIfjh.jpg', name: 'Lower Undead Burg'},
        {url: 'https://i.imgur.com/QkCzoDg.jpg', name: 'Demon Ruins'},
        {url: 'https://i.imgur.com/Da7QbbB.jpg', name: 'Anor Londo'},
        {url: 'https://i.imgur.com/78DFyIh.jpg', name: 'Anor Londo Entrance'},
        {url: 'https://i.imgur.com/12Fsxvk.jpg', name: 'Painted World / Bonewheel Basement'},
        {url: 'https://i.imgur.com/xMYEf5g.jpg', name: 'Painted World'},
        {url: 'https://i.imgur.com/7Uz8znN.jpg', name: 'Darkroot Garden / Sif'},
        {url: 'https://i.imgur.com/7uQ7VmQ.jpg', name: 'Ash Lake / Eternal Dragon'},
        {url: 'https://i.imgur.com/6PO3LFj.jpg', name: 'Kiln of the First Flame'},
    ],
    'Dark Souls 2': [        
        {url: 'https://i.imgur.com/TAL6yXo.jpg', name: 'Things Betwixt'},
        {url: 'https://i.imgur.com/HrXEHe4.jpg', name: 'Majula / Emerald Herald'},
        {url: 'https://i.imgur.com/rvWaKta.jpg', name: 'Majula / View'},
        {url: 'https://i.imgur.com/ii5c6fW.jpg', name: 'Heide\'s Tower of Flame'},
        {url: 'https://i.imgur.com/W9u8WgN.jpg', name: 'Harvest Valley'},
        {url: 'https://i.imgur.com/3YoSyEz.jpg', name: 'Iron Keep'},
        {url: 'https://i.imgur.com/bLuGyYa.jpg', name: 'The Gutter'},
        {url: 'https://i.imgur.com/ISE2cLV.jpg', name: 'The Lost Bastille'},
        {url: 'https://i.imgur.com/ZaYh8bD.jpg', name: 'Shaded Woods'},
        {url: 'https://i.imgur.com/tijEJa0.jpg', name: 'Drangleic Castle'},
        {url: 'https://i.imgur.com/jg9GpDs.jpg', name: 'Shrine of Amana'},
        {url: 'https://i.imgur.com/cHgV7YF.jpg', name: 'Aldia\'s Keep'},
        {url: 'https://i.imgur.com/VRl2KlX.jpg', name: 'Dragon Aerie'},
        {url: 'https://i.imgur.com/5uF0RmB.jpg', name: 'Throne of Want'},
        {url: 'https://i.imgur.com/BjheI2c.jpg', name: 'Shulva, Sanctum City'},
        {url: 'https://i.imgur.com/bjKO9nM.jpg', name: 'Brume Tower'},
        {url: 'https://i.imgur.com/qnvcVew.jpg', name: 'Frozen Eleum Loyce'},
        {url: 'https://i.imgur.com/GsRhyXD.jpg', name: 'Gender Swap Coffin'},
    ],
}