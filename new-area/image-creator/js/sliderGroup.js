/*
Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/image-creator/)
*/
'use strict'


/** 
 * @typedef {Object} Converter<T>
 * @prop { (string) => T }  parse 
 * @prop { (T) => string | number }  toString 
*/


/** @type {{ [name: string]: { new(string) => Converter } }}  */
const CONVERTERS = {
    string: class {
        parse(x) { return x }
        toString(x) { return x }
    },
    int: class {
        parse(x) { return parseInt(x) }
        toString(x) { return x.toString() }
    },
    float: class {
        parse(x) { return parseFloat(x) }
        toString(x) { return x.toString() }
    },
    rgb: class {
        parse(x) { return hexToRGB(x) }
        toString([r, g, b]) { return RGBToHex(r, g, b) }
    },
    log: class {
        constructor(string) {
            this.base = parseFloat(string.slice(3))
            this.logb = Math.log(this.base)
        }
        parse(value) { return Math.pow(this.base, parseFloat(value)) }
        toString(value) { return Math.log(parseFloat(value)) / this.logb }
    }
}


/** Maps <input> types to the default converter they should use as a Slider, if the element does not specify one. */
const DEFAULT_CONVERTERS = {
    text: 'string',
    range: 'float',
    color: 'rgb',
}


/**
 * Class representing a HTML user input value in the Macro Generator,
 *  the state it has, and the specific HTML element(s) that are used to control it.
 */
class Slider extends EventTarget {
    /**
     * @param {HTMLButtonElement | undefined} resetButton
     */
    constructor(resetButton) {
        super()
        /// Hook up reset button
        if (resetButton) {
            this.resetButton = resetButton
            resetButton.disabled = true
            resetButton.onclick = () => {
                this.reset()
                this.dispatchEvent(new Event('change'))
                this.resetButton.disabled = true
            }
        }
    }

    /**
     * @param {HTMLElement} div 
     * @returns {Slider | undefined}
     */
    static fromDiv(div) {
        // Find reset button
        const resetButton = div.getElementsByClassName('reset-button')[0]

        // Case 1: Image input widget
        if (div.classList.contains('image-slider'))
            return new ImageHandlerSlider(div, resetButton)

        // Case 2: Simple input element
        const simpleInputElement = (
            div.getElementsByTagName('input')[0]
            || div.getElementsByTagName('textarea')[0]
            || div.getElementsByTagName('select')[0]
        )
        if (simpleInputElement)
            return new SimpleSlider(simpleInputElement, resetButton)
    }

    /** Reset the Slider to its default value, also disabling the reset button. Does not trigger change. */
    reset() {
        if (this.resetButton)
            this.resetButton.disabled = true
    }

    /** Get the Slider's current value. */
    get() {
        throw new Error('Not implemented')
    }

    /** Set the Slider's current value. Does not trigger change. */
    set(value) {
        throw new Error('Not implemented')
    }

    /** Swap out the Slider's default value, also changing its current value if it is in an unchanged state. Does not trigger change. */
    setDefault(value) {
        throw new Error('Not implemented')
    }
}


/**
 * Represents an HTML <input>, <textarea> or <select> element.
 */
class SimpleSlider extends Slider {
    /**
     * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} inputElement
     * @param {HTMLButtonElement | undefined} resetButton
     */
    constructor(inputElement, resetButton) {
        super(resetButton)
        this.inputElement = inputElement
        // Echo the inputElement's change events
        this.inputElement.addEventListener('change', e => this.dispatchEvent(new Event('change')))
        /** @type {string} */
        this.name = this.inputElement.name

        /// Create our converter instance
        let as = inputElement.getAttribute('as') || DEFAULT_CONVERTERS[inputElement.type] || 'string'
        for (const conv in CONVERTERS)
            if (as.startsWith(conv)) { this.converter = new CONVERTERS[conv](as); break }

        /// Assign and remember our "true default" (=HTML-assigned default)
        const trueDefault = inputElement.getAttribute('default')
        this.default = this.trueDefault = trueDefault
        if (trueDefault !== null)
            this.parsedTrueDefault = this.converter.parse(trueDefault)
        if (inputElement.type === 'checkbox')
            inputElement.checked = trueDefault
        else
            inputElement.value = trueDefault
    }

    reset() {
        super.reset()
        if (this.inputElement.type === 'checkbox')
            this.inputElement.checked = this.default
        else
            this.inputElement.value = this.default
    }
    get() {
        if (this.inputElement.type === 'checkbox')
            return this.inputElement.checked
        return this.converter.parse(this.inputElement.value)
    }
    set(value) {
        if (this.inputElement.type === 'checkbox')
            this.inputElement.checked = value
        else
            this.inputElement.value = this.converter.toString(value)
    }
    setDefault(value) {
        let strValue
        if (value === undefined) strValue = this.trueDefault
        else strValue = this.converter.toString(value)

        this.default = strValue
        if (this.resetButton.disabled) {
            if (this.inputElement.type === 'checkbox')
                this.inputElement.checked = strValue
            else
                this.inputElement.value = strValue
        }
    }
}


/**
 * Slider wrapping an ImageHandler.
 */
class ImageHandlerSlider extends Slider {
    /**
     * @param {HTMLElement} element
     */
    constructor(element, resetButton) {
        super(resetButton)
        this.imageHandler = new ImageHandler(element)
        this.imageHandler.onload = this.imageHandler.onerror = () => {
            this.dispatchEvent(new Event('change'))
            if (this.isDefault) this.isDefault--
        }
        this.name = element.getAttribute('name')
        this.default = {}
        this.trueDefault = true
        this.parsedTrueDefault = {
            image: undefined,
            url: "",
            files: null,
        }
        this.isDefault = 2
    }

    reset() {
        super.reset()
        this.imageHandler.clear()
        if (this.default.select) {
            this.imageHandler.imageSelect.value = this.default.select
            this.imageHandler.imageSelect.dispatchEvent(new Event('change'))
            // NOTE: There's something ugly going on here where this change event 'dirties' this Slider's defaultiness.
            //  I have half-solved it now by making isDefault last for TWO imageHandler.onload triggers, but it's not perfect at all.
        }
        this.isDefault = 2
    }
    get() {
        return {
            image: this.imageHandler.image,
            url: this.imageHandler.URLinput.value,
            files: this.imageHandler.fileSelect.files,
        }
    }
    set(value) {
        this.imageHandler.image = value.image
        this.imageHandler.URLinput.value = value.url
        this.imageHandler.fileSelect.files = value.files
    }
    setDefault(value) {
        this.default = {}
        if (!value) return
        if ('select' in value) {
            this.default.select = value.select
        }
        if (this.isDefault) {
            this.reset()
        }
    }
}


/**
 * Class representing a collection of Sliders.
 *  This class finds them, groups them, tracks their name and manages their state.
 *  This class provides methods for getting/setting/resetting all grouped inputs at once.
 */
class SliderGroup {
    /**
     * @param {string} name
     * @param {HTMLElement} parent 
     * @param {string[]} names 
     */
    constructor(element) {
        /** @type {HTMLElement} */
        this.element = element
        if (!this.element) return
        /** @type {string} */
        this.name = this.element.getAttribute('name')

        /** @type {boolean} */
        this.usable = true // Note: An early return leaves this falsey
        /** @type {boolean} */
        this.visible = false
        /** @type {Callback} */
        this.onchange = null

        /** @type {HTMLInputElement[]} */
        this.sliders = []
        /** @type {{[name: string]: HTMLInputElement}} */
        this.byName = {}
        /** @type {{[name: string]: any}} */
        this.trueDefaults = {}

        /// Find each slider
        for (const div of this.element.children) {
            if (div.tagName !== 'DIV') continue
            const slider = Slider.fromDiv(div)
            if (!slider) continue

            /// Add to our collections
            this.sliders.push(slider)
            this.byName[slider.name] = slider
            slider.addEventListener('change', e => {
                if (slider.resetButton) slider.resetButton.disabled = false
                this.onchange(e)
            })
            // Track trueDefaults
            if (slider.trueDefault !== null)
                this.trueDefaults[slider.name] = slider.parsedTrueDefault

        }
    }

    hide() {
        if (this.usable) this.element.hidden = true
        this.visible = false
    }
    show() {
        if (this.usable) this.element.hidden = false
        this.visible = true
    }

    /** Get a specific slider's value. */
    get(key) {
        return this.byName[key].get()
    }

    /**
     *  Get all slider values bundled as an object.
     *  @returns  {{ [name: string]: any }}
     */
    getValues() {
        const values = {}
        for (const slider of this.sliders)
            values[slider.name] = slider.get()
        return values
    }

    /**
     *  Change the values for the given Sliders.
     *  @param  {{ [name: string]: any }} values
     */
    setValues(values) {
        for (const name in values) {
            const slider = this.byName[name]
            slider.set(values[name])
            if (slider.resetButton)
                slider.resetButton.disabled = false
        }
    }

    /**
     *  Get all values that aren't default.
     *  @returns  {{ [name: string]: any }}
     */
    getChangedValues() {
        const values = {}
        for (const slider of this.sliders) {
            if (slider.resetButton?.disabled) continue
            values[slider.name] = slider.get()
        }
        return values
    }

    /**
     * Set values as given, otherwise default.
     *  @param  {{ [name: string]: any }} values
     */
    setChangedValues(values) {
        for (const slider of this.sliders) {
            if (slider.name in values) {
                slider.set(values[slider.name])
                if (slider.resetButton)
                    slider.resetButton.disabled = false
            } else {
                slider.reset()
            }
        }
    }

    /**
     *  @param  {{ [name: string]: any }} values
     */
    setDefaults(values) {
        for (const slider of this.sliders) {
            if (slider.resetButton) {
                slider.setDefault(values[slider.name])
            }
        }

        for (const name in values)
            if (!(name in this.byName))
                console.warn(`Bad slider name ${name} for sliders ${this.name}`)
    }
}   
