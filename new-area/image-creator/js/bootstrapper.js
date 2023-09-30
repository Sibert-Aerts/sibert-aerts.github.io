/**
 *  Script which does things that technically aren't the MacroGenerator's job.
 */

/** @type {MacroGenerator} The global MacroGenerator. */
var macroGen


// document>DOMContentLoaded: Triggers as soon as the DOM's abstract objects are loaded, but not necessarily images/assets.
document.addEventListener('DOMContentLoaded', function () {

    //// Load the URL ?search param info
    const searchParams = new URLSearchParams(this.location.search)

    // 'macro' param pre-selects a specific macro, either by ID or by "<macrotype>,<game>,<preset>"
    if (searchParams.get('macro')) {
        split = searchParams.get('macro').split(',')
        if (split.length === 1) {
            const macro = layerIdMap[split[0]]
            if (macro)
                window.MACROGEN_DEFAULTS = {
                    macroType: macro.type, game: macro.game, preset: macro.preset
                }
        } else if (layerTypesMap[split[0]][split[1]][split[2]]) {
            window.MACROGEN_DEFAULTS = {
                macroType: split[0], game: split[1], preset: split[2],
            }
        }
    }

    // 'caption' param prefills the caption input
    if (searchParams.get('caption')) {
        byId('image-caption').value = searchParams.get('caption')
    }

    // 'img' param prefills the background image URL input
    if (searchParams.get('img')) {
        document.querySelector('#background-image [name=image-URL]').value = searchParams.get('img')
    }

    // If no pre-selected macro type: Pick a random one
    if (!window.MACROGEN_DEFAULTS) {
        let randomDefault
        while (true) {
            randomDefault = layerTypes[Math.floor(Math.random() * layerTypes.length)]
            if (!randomDefault.preventAsRandomDefault) break
        }
        window.MACROGEN_DEFAULTS = {
            macroType: randomDefault.type,
            game: randomDefault.game,
            preset: randomDefault.preset,
        }
    }

    //// Construct the global MacroGenerator
    macroGen = new MacroGenerator(byId('main-content'))
})


// window>load: Triggers once essentially all assets have loaded, wait for this before actually drawing a macro for the first time.
window.addEventListener('load', function () {
    //// Draw a macro for the first time
    macroGen.redrawMacro()

    //// Hide/show Firefox warning
    if (browserIs.firefox)
        for (const e of byClass('firefox-warning'))
            e.hidden = false

    //// Make the info box tabs' tabbing work
    const tabs = byId('info-tabs')
    const tabbedDivs = {}

    if (tabs) {
        for (const tab of tabs.children) {
            const radio = tab.children[0]
            tabbedDivs[radio.value] = byId(radio.value)
            radio.onchange = function () {
                for (const otherTab of tabs.children)
                    otherTab.classList.remove('checked')
                tab.classList.add('checked')

                for (const t in tabbedDivs)
                    tabbedDivs[t].hidden = (radio.value !== t)
            }
        }
    }
})


// window>beforeunload: Warn the user they will lose any unsaved images.
window.addEventListener('beforeunload', function (e) {
    // TODO: Only do this in case the user has ever interacted with the editor?
    const message = 'Beware, edited macros and layers are lost when leaving the page.'
        + ' Make sure you have saved any images you wish to keep.';
    (e || window.event).returnValue = message
    return message
})