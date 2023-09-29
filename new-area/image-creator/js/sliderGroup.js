/*
Script for the image macro generator on (https://sibert-aerts.github.io/new-area/) and (https://sibert-aerts.github.io/new-area/image-creator/)
*/
'use strict';


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
        toString([r, g, b]){ return RGBToHex(r, g, b) }
    },
    log: class {
        constructor(string) {
            this.base = parseFloat(string.slice(3))
            this.logb = Math.log(this.base)
        }
        parse(value) { return Math.pow(this.base, parseFloat(value)) }
        toString(value) { return Math.log(parseFloat(value))/this.logb }
    }
}


/** Maps <input> types to the default converter they should use as a Slider, if the element does not specify one. */
const DEFAULT_CONVERTERS = {
    text: 'string',
    range: 'float',
    color: 'rgb',
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
        if( !this.element ) return
        /** @type {string} */
        this.name = this.element.getAttribute('name')
        
        /** @type {boolean} */
        this.usable = false
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
        for( const div of this.element.children ) {
            if( div.tagName !== 'DIV' ) continue

            const slider = 
                div.getElementsByTagName('input')[0] || div.getElementsByTagName('textarea')[0] || div.getElementsByTagName('select')[0]
            if( !slider ) return

            /// Add to our collections
            this.sliders.push(slider)
            this.byName[slider.name] = slider
            slider.onchange = e => {
                if( slider.resetButton ) slider.resetButton.disabled = false
                this.onchange(e)
            }
            /// Assign its converter instance
            let as = slider.getAttribute('as') || DEFAULT_CONVERTERS[slider.type] || 'string'
            for( const conv in CONVERTERS )
                if( as.startsWith(conv) )
                    { slider.converter = new CONVERTERS[conv](as); break }

            /// Assign and remember its "true default" (=HTML-assigned default)
            const trueDefault = slider.getAttribute('default')
            slider.value = slider.default = slider.trueDefault = trueDefault
            if( trueDefault !== null )
                this.trueDefaults[slider.name] = slider.converter.parse(trueDefault)

            if( slider.type === 'checkbox' ) slider.checked = slider.value
            slider.reset = function() {
                if( this.type === 'checkbox' )
                    this.checked = this.default
                else
                    this.value = this.default
                if( this.resetButton )
                    this.resetButton.disabled = true
            }

            /// Hook up reset button
            /** @type {HTMLButtonElement} */
            const resetButton = div.getElementsByClassName('reset-button')[0]
            if (resetButton) {
                slider.resetButton = resetButton
                resetButton.disabled = true

                resetButton.onclick = () => {
                    slider.reset()
                    slider.onchange()
                    resetButton.disabled = true
                }
            }
        }
        // If we make it through the whole thing without an early return, we're usable!
        this.usable = true
    }

    hide() {
        if( this.usable ) this.element.hidden = true
        this.visible = false
    }
    show() {
        if( this.usable ) this.element.hidden = false
        this.visible = true
    }

    /** Get a specific slider's value. */
    get(key) {
        const slider = this.byName[key]
        if( slider.type === 'checkbox' )
            return slider.checked
        return slider.converter.parse(slider.value)
    }

    /**
     *  Get all slider values bundled as an object.
     *  @returns  {{ [name: string]: any }}
     */
    getValues() {
        const values = {}
        for( const slider of this.sliders ) {
            if( slider.type === 'checkbox' )
                values[slider.name] = slider.checked
            else
                values[slider.name] = slider.converter.parse(slider.value)
        }
        return values
    }

    /**
     *  @param  {{ [name: string]: any }} values
     */
    setValues(values) {
        for( const name in values ) {
            const slider = this.byName[name]
            if( slider.type === 'checkbox' )
                slider.checked = values[name]
            else
                slider.value = slider.converter.toString(values[name])
            if( slider.resetButton )
                slider.resetButton.disabled = false
        }
    }

    /**
     *  Get all values that aren't default.
     *  @returns  {{ [name: string]: any }}
     */
    getChangedValues() {
        const values = {}
        for( const slider of this.sliders ) {
            if( slider.resetButton?.disabled )
                continue
            if( slider.type === 'checkbox' )
                values[slider.name] = slider.checked
            else
                values[slider.name] = slider.converter.parse(slider.value)
        }
        return values
    }

    /**
     * Set values as given, otherwise default.
     *  @param  {{ [name: string]: any }} values
     */
    setChangedValues(values) {
        for( const slider of this.sliders ) {
            if( slider.name in values ) {
                if( slider.type === 'checkbox' )
                    slider.checked = values[slider.name]
                else
                    slider.value = slider.converter.toString(values[slider.name])
                if( slider.resetButton )
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
        for( const slider of this.sliders ) {            
            if( slider.resetButton ) {
                let val
                if( !(slider.name in values) )val = slider.trueDefault
                else val = slider.converter.toString(values[slider.name])

                slider.default = val
                if( slider.resetButton.disabled ) {
                    if( slider.type === 'checkbox' )
                        slider.checked = val
                    else
                        slider.value = val
                }
            }
        }

        for( const name in values )
            if( !(name in this.byName) )
                console.warn(`Bad slider name ${name} for sliders ${this.name}`)
    }
}   
