// Author: Sibert Aerts (Rezuaq)

///// TINY GENERAL FUNCTIONS

const byteClamp = x => (isNaN(x))? 0 : (x > 255)? 255 : (x<0)? 0 : Math.floor(x)

/** Uniformly rescale (givenW, givenH) such that it fits inside (boundW, boundH). */
function rectInsideRect(boundW, boundH, givenW, givenH) {
    return Math.min(boundW/givenW, boundH/givenH)
}

function titleCase(string) {
    if (!string) return string
    let first = true
    return string.replace(/\S+/g, function(s) {
        if (!first && s.match(titleCase.TITLE_EXEMPT)) return s
        first = false
        return s[0].toUpperCase() + s.slice(1)
    })
}

titleCase.TITLE_EXEMPT = /^(of|and|the|a|an|in|on|or|my)$/

///// TINY DOM FUNCTIONS

const byId = id => document.getElementById(id)
const byClass = clss => document.getElementsByClassName(clss)
const makeElem = (tag, clss, text) => { const e = document.createElement(tag); if(clss) e.className = clss; if(text) e.textContent = text; return e }
const makeOption = (value, text) => { const o = document.createElement('option'); o.textContent = text; o.value = value; o.setAttribute('name', value); return o }
const setPhantom = (elem, val=true) => { if (val) elem.classList.add('phantom'); else elem.classList.remove('phantom') }

///// TINY COLOR FUNCTIONS

/** Must be used EXCLUSIVELY with strings of the form '#abcdef', such as input.color. */
const hexToRGB = (h) => Array.from( h.matchAll(/[^#]{2}/g) ).map( x => parseInt(x[0], 16) )
/** Must be used EXCLUSIVELY with integers [0, 255]. */
const RGBToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0') ).join('')
/** May be used with any numbers; floors and clamps them first. */
const laxRGBToHex = (r=0, g=0, b=0) => RGBToHex(...[r, g, b].map(byteClamp))

/** Multiply two lax RGB arrays into a lax RGB array. */
const RGBMul = (c, d) => [c[0]*d[0]/255, c[1]*d[1]/255, c[2]*d[2]/255]


///// USEFUL BROWSER INFO

const browserIs = {
    chrome: !!window.chrome,
    firefox: navigator.userAgent.toLowerCase().indexOf('firefox') > -1
}