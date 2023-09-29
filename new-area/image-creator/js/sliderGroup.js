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
 * Class representing a user input value in the Macro Generator,
 *  the state it has, and the specific HTML element(s) that are used to control it.
 */
class Slider extends EventTarget {
    /**
     * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} inputElement
     * @param {HTMLButtonElement | undefined} resetButton
     */
    constructor(inputElement, resetButton) {
        super()
        if (inputElement) {
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
            inputElement.value = this.default = this.trueDefault = trueDefault
            if (inputElement.type === 'checkbox')
                inputElement.checked = inputElement.value
        }

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
        // Find input element
        const inputElement = (
            div.getElementsByTagName('input')[0]
            || div.getElementsByTagName('textarea')[0]
            || div.getElementsByTagName('select')[0]
        )
        if (!inputElement) return
        // Find reset button
        const resetButton = div.getElementsByClassName('reset-button')[0]
        return new Slider(inputElement, resetButton)
    }

    /** Reset the Slider to its default value, disabling the reset button. */
    reset() {
        if (this.inputElement) {
            if (this.inputElement.type === 'checkbox')
                this.inputElement.checked = this.default
            else
                this.inputElement.value = this.default
        }
        if (this.resetButton)
            this.resetButton.disabled = true
    }

    /** Get the Slider's current value. */
    get() {
        if (this.inputElement) {
            if (this.inputElement.type === 'checkbox')
                return this.inputElement.checked
            return this.converter.parse(this.inputElement.value)
        }
    }

    /** Set the Slider's current value. */
    set(value) {
        if (this.inputElement) {
            if (this.inputElement.type === 'checkbox')
                this.inputElement.checked = value
            else
                this.inputElement.value = this.converter.toString(value)
        }
    }

    /** Swap out the Slider's default value, also changing its current value if it is in an unchanged state. */
    setDefault(value) {
        if (this.inputElement) {
            let val
            if (value === undefined) val = this.trueDefault
            else val = this.converter.toString(value)

            this.default = val
            if (this.resetButton.disabled) {
                if (this.inputElement.type === 'checkbox')
                    this.inputElement.checked = val
                else
                    this.inputElement.value = val
            }
        }
    }
}


/**
 * Class representing a collection of interactive HTML inputs, "Sliders" for simplicity.
 *  An input can be a standard HTML <input> of various types, or a <select> or <textbox>, or others.
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
        this.usable = true // Note: Early return might leave this undefined
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
                this.trueDefaults[slider.name] = slider.converter.parse(slider.trueDefault)

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
