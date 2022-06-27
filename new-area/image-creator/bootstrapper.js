/**
 *  Script which does things that technically aren't the MacroGenerator's job.
 */

/** @type {MacroGenerator} The global MacroGenerator. */
var macroGen


// document>DOMContentLoaded: Triggers as soon as the DOM's abstract objects are loaded, but not necessarily images/assets.
document.addEventListener('DOMContentLoaded', function() {

    //// Load the URL ?search param info
    const search = new URLSearchParams(this.location.search)

    if( search.get('macro') ) {
        split = search.get('macro').split(',')
        if( layerTypesMap[split[0]][split[1]][split[2]] )
            window.MACROGEN_DEFAULTS = {
                macroType: split[0], game: split[1], preset: split[2],
            }
    }
    
    if( search.get('caption') ) {
        document.getElementById('image-caption').value = search.get('caption')
    }
    
    if( search.get('img') ) {
        document.getElementsByName('image-URL')[0].value = search.get('img')
    }

    //// Construct the global MacroGenerator
    macroGen = new MacroGenerator(document.getElementById('main-content'))   
})


// window>load: Triggers once essentially all assets have loaded, wait for this before actually drawing a macro for the first time.
window.addEventListener('load', function() {
    //// Draw a macro for the first time
    macroGen.redrawMacro()

    //// Hide/show Firefox warning
    if( browserIs.firefox )
        for( const e of document.getElementsByClassName('firefox-warning'))
            e.hidden = false

    //// Make the info box tabs' tabbing work
    const tabs = document.getElementById('info-tabs')
    const tabbedDivs = {}

    if( tabs ) 
    for( const tab of tabs.children ) {
        const radio = tab.children[0]
        tabbedDivs[radio.value] = document.getElementById(radio.value)
        radio.onchange = function() {
            for( const otherTab of tabs.children )
                otherTab.classList.remove('checked')
            tab.classList.add('checked')

            for( const t in tabbedDivs )
                tabbedDivs[t].hidden = (radio.value !== t)
        }
    }
})
