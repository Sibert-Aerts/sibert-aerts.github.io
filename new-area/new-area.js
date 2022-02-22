/*
    Script for the Dark Souls New Area Generator (https://sibert-aerts.github.io/new-area/)
    Made by Sibert Aerts (Rezuaq), originally made ca. 2016, updated sporadically since then.
*/

/** 
 * Class for handling multiple copies of an Audio object so you can get the effect of overlapping sounds.
*/
class MultiAudio {
    constructor(audioUrl, maxSounds=10) {
        this.soundArray = new Array(maxSounds)
        for (let i=0; i<maxSounds; i++)
            this.soundArray[i] = new Audio(audioUrl)
        this.index = 0
    }
    /** Play the next sound in line. */
    play() {
        playSound(this.soundArray[this.index]);
        this.index = (this.index + 1) % this.soundArray.length;
    }
    /** Pauses all sounds */
    pause() {
        for (let i in this.soundArray)
            this.soundArray[i].pause()
    }
}

/** Reset and play the given sound unless muted. */
function playSound(a) {
    if(muted) return
    a.currentTime = 0
    a.play()
}

/** Toggles whether sounds are allowed to play, actively mutes any newAreaSounds. */
function toggleMute(){
    newAreaSound.pause();
    muted = !muted;
    $("#muteButton").html(muted? "🔈&#xFE0F;" : "🔊&#xFE0F;");
}


var muted = false
var newAreaSound = new MultiAudio("sound/area-transition.mp3", 50)
var itemGetSound = new Audio("sound/ITEMGET.mp3")

// List of backgrounds that's cycled through randomly
var backgrounds = [
    {url: "https://i.imgur.com/ic9I2Uu.jpg", name: 'Two Bridges of Lothric'},
    {url: "https://i.imgur.com/uNuqPte.jpg", name: 'Great Bridge from Above'},
    {url: "https://i.imgur.com/d8thQaE.jpg", name: 'Anor Londo in the Fog'},
    {url: "https://i.imgur.com/qEk3cZa.jpg", name: 'Undead Settlement Hidden Bonfire'},
    {url: "https://i.imgur.com/9gX5pBB.jpg", name: 'Undead Settlement Bridge'},
    {url: "https://i.imgur.com/hjPuO8N.jpg", name: 'Sundowning Cathedral Ghoul'},
    {url: "https://i.imgur.com/cURcsam.jpg", name: 'Giant at Time\'s End'},
    {url: "https://i.imgur.com/baIPonl.jpg", name: 'Blue Skies of Archdragon Peak'},
    {url: "https://i.imgur.com/7qzGveQ.jpg", name: 'Grand Archives Steps'},
    {url: "https://i.imgur.com/ej8kxIW.jpg", name: 'Ruins of Lothric Beyond Time'},
    {url: "https://i.imgur.com/kfTzoWv.jpg", name: 'Darkeater\'s Abode'},
]

/** Changes the background to the given background object's image, optionally fading. */
async function setBackground(bg, fade=true) {
    $('.background-item').removeClass('selected')
    bg.elem.classList.add('selected')
    if(fade) {
        $("#background-layer").css("background-image", $("body").css("background-image"))
        $("#background-layer").removeClass("faded")
        await sleep(100)
        $("#background-layer").addClass("faded")
    }
    $("body").css("background-image", `url(${bg.url})`)
}

async function randomiseBackground(fade=true) {
    await setBackground(choose(backgrounds), fade)
}

// Incredibly dumb: updating the area name actually just sets the anchor, this triggers window.onhashchange, calling parseAnchor
// which then reads & decodes the anchor from the URI, and updates the webpage.
var setAreaName = (text) => { location.hash = text };

function parseAnchor() {
    if( !location.hash ) return
    $("#name-underline-wrapper").removeClass("faded-out")
    $("#name").text(decodeURIComponent(location.hash.slice(1)))
    smartFadeOut()
}

function addBackgroundItem(bg){
    const e = bg.elem = document.createElement('div')
    e.classList.add('background-item')
    e.innerText = bg.name
    e.onclick = () => setBackground(bg)
    $('#background-list').append(e)
}

// Called when the page is loaded.
$(document).ready(function () {

    // Bind the enter-key event to the custom-text input field
    $("#custom-text").keyup(e => { if (e.keyCode == 13) customGenerate() })

    // Load the user's saved Custom area parts
    try {
        loadCustom()
    } catch (e) {
        console.warn('Failed to load saved custom data:', e)
    }

    // DO ANCHOR THINGS
    window.onhashchange = parseAnchor
    parseAnchor()
    
    // Bind the checkboxes to hide/unhide parts of the page when clicked.
    $("input[target=custom]").on("click", function(){ setHidden("#custom-input", !this.checked) })
    $("input[target=streamer-features]").on("click", function(){ setHidden(".streamer-feature", !this.checked) })
    $("input[target=background-select]").on("click", function(){ setHidden("#background-select", !this.checked) })

    // Fill up the 'background selection' element:
    for( let bg of backgrounds ){
        addBackgroundItem(bg)
    }

    // Not in the random bg circulation
    addBackgroundItem({url: 'https://i.imgur.com/qabmNjV.png', name: 'The Abyss'})
    
    // Put up a random background without fade-in
    randomiseBackground(false)

    refreshTooltips()
})

// Chroma key background button
var chroma = false
function toggleChroma(){
    chroma ^= true
    if(chroma) $("#main").addClass("chroma")
    else $("#main").removeClass("chroma")
    $("#chromaButton").text(chroma? "no chroma" : "chroma")
}

// Shaded background button
var shaded = false
function toggleShade(){
    shaded ^= true;
    if(shaded) $('#main').addClass('transp')
    else $("#main").removeClass('transp')
    $("#transpButton").html(shaded? '👓&#xFE0F;' : '🕶️&#xFE0F;')
}

/*      Utility functions     */

// Has a p out of (outof) chance of returning true.
var chance = (p, outof=1) => Math.random() * outof <= p;

// Get a random element from the given list.
var choose = list => list[Math.floor(Math.random() * list.length)];

weightedIndex = function(weights) {
    let x = Math.random() * weights.reduce((s, w) => s+w)
    let i = 0
    for(; x > weights[i]; i++)
        x-= weights[i]
    return i
}

weightedChoice = function(arr) {
    let x = Math.random() * arr.reduce((s, [_, w]) => s+w, 0)
    let i=0
    for(; x > arr[i][1]; i++ )
        x-= arr[i][1]
    return arr[i][0]
}

// Refresh bootstrap tooltips.
var refreshTooltips = () => $('[data-toggle="tooltip"]').tooltip();

// Await this to sleep a given number of milliseconds.
var sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Set an element's hidden state.
var setHidden = (selector, hidden) => hidden? $(selector).addClass("hidden"): $(selector).removeClass("hidden");

// Convert a string to proper case.
function stringToProperCase(s) {
    return s.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

/*      Pools and stuff     */

// Custom pool
const Custom = {}

/** The pool of all pools (from areas.js) */
const allPools = {Dark1, Dark2, Dark3, Demons, Blood, Sekiro, Custom}
/** The pool of all full area names. */
const allAreas = Object.keys(allPools).reduce((tot, key) => tot.concat(allPools[key].areas ?? []), [])

// Selected pools
var selected = []


function compileCustom(){    
    for( let prop of AREA_PROPS)
        Custom[prop] = document.getElementsByName(prop)[0].value.split(';').filter(x => x)
}
function saveCustom() {
    for( let prop of AREA_PROPS)
        window.localStorage.setItem(prop, document.getElementsByName(prop)[0].value)
}
function loadCustom() {
    for( let prop of AREA_PROPS)
        document.getElementsByName(prop)[0].value = window.localStorage.getItem(prop)
}

function isChecked(key){
    return $(`input[target=${key}]`).prop('checked')
}

function selectPools(){
    // clear selected
    selected = []

    if( isChecked('Custom') )
        compileCustom()

    // Add all pools whose box is checked to the list of selected pools
    for( let key in allPools )
        if( isChecked(key) )
            selected.push(allPools[key])

    return selected
}


/*      Easter eggs     */

function worldFunc(){
    $("#world-layer").css("background-image", $("body").css("background-image"))
    $("#world-layer").removeClass("faded")
    setTimeout(()=>$("#world-layer").addClass("faded"), 5000)
}

// List of easter egg words, the audio they should play, and optionally the function they should call.
var easterEggs = {
    "The Wall"  : {audio: new Audio("sound/the_wall.mp3")},
    "The World" : {audio: new Audio("sound/the_world.mp3"), func: worldFunc},
    "The Doors" : {audio: new Audio("sound/the_doors.mp3")},
}

/** 
 * The main function that motivates it all.  
 *  Generates a name (returned as a string), and performs easter-egg side effects based on the name it generates.
 */
function generateName() {
    let pools = selectPools()
    if( !pools.length ) return 'Tick one of the Checkboxes'

    // Add some generic bits too
    pools.push(Generic)

    // Unify pools
    let pool = {}
    for( let prop of AREA_PROPS)
        pool[prop] = pools.reduce( (x, p) => x.concat(p[prop]), [])
    

    // Little methods

    const leftPossessive = () => {
        if( !pool.possessives.length ) return choose(pool.properNames) + "'s "
        else if( !pool.properNames.length ) return choose(pool.possessives) + " "
        else return chance(1/2)? choose(pool.properNames) + "'s ": choose(pool.possessives) + " "
    }    

    const appendix = () =>
        (!pool.appendices.length)? 'of ' + choose(pool.properNames):
        chance(5, 6)? choose(pool.appendices): 'of ' + choose(pool.properNames)

    
    // Generation state
    let name

    if( chance(4/5) ) {
        //// 80% chance for a "generic"-type area name

        let firstType = weightedIndex([
            70, // blank
            pool.positionals.length? 4: 0, // a positional qualifier (if possible) 
            (pool.possessives.length+pool.properNames.length) ? 20: 0,  // a possessive (if possible)
            (pool.positionals.length*(pool.possessives.length+pool.properNames.length))? 1: 0 // both (if possible)
        ])
        let first
        if (firstType === 0)
            first = ''
        else if (firstType === 1)
            first = choose(pool.positionals) + ' '
        else if (firstType === 2)
            first = leftPossessive()
        else if (firstType === 3)
            first = choose(pool.positionals) + ' ' + leftPossessive()


        let secondType = weightedIndex([
            50, // blank
            50, // adjective
            pool.prefixes.length? 1: 0,  // prefix (if possible)
            pool.prefixes.length? .5: 0, // adjective and prefix (if possible)
        ])
        let second
        if (secondType === 0)
            second = ''
        else if (secondType === 1)
            second = choose(pool.adjectives) + ' '
        else if (secondType === 2)
            second = choose(pool.prefixes)
        else if (secondType === 3)
        second = choose(pool.adjectives) + ' ' + choose(pool.prefixes)
        

        let thirdType = weightedIndex([
            80, // blank
            14, // an appendix
            5,  // a location specifier
            1,  // both
        ])
        let third
        if (thirdType === 0)
            third = ''
        else if (thirdType === 1)
            third = ' ' + appendix()
        else if (thirdType === 2)
            third = ' ' + choose(pool.secondaryLocations)
        else if (thirdType === 3)
            third = ' ' + choose(pool.secondaryLocations) + ' ' + appendix()

        let main = choose(pool.primaryLocations)
        if( secondType > 1 ) main = main.toLowerCase()

        name = first + second + main + third

        sum = firstType + secondType + thirdType

        the = chance(1/2) && (sum < 2)
        if( isChecked('Sekiro') ) the &&= chance(0.5)
        if( sum === 0 && chance(9/10) ) the = true
        if( name.startsWith('The ') ) the = false

        if( the ) name = 'The ' + name



    } else if ( chance(18/20) ) {
        //// 18% chance of getting a Proper Location-type area name
        
        let format = weightedIndex([
            10, // "Location"
            35, // "<adj> Location"
            35, // "Location <subPlace>"
            10, // "Location <subPlace> <subPlace>"
            10, // "<adj> Location <subPlace>"
        ])

        const location = choose(pool.properLocations)
        if( format === 0 )
            name = location
        else if (format === 1)
            name = choose(chance(4, 5)? pool.adjectives: pool.positionals) + ' ' + location
        else if (format === 2)
            name = location + ' ' + choose(pool.secondaryLocations)
        else if (format === 3)
            name = location + ' ' + choose(pool.secondaryLocations) + ' ' + choose(pool.secondaryLocations)
        else if (format === 4)
            name = choose(chance(4, 5)? pool.adjectives: pool.positionals) + ' ' + location + ' ' + choose(pool.secondaryLocations)

    } else {
        //// 2% chance of a formal Proper Location-type name

        // Construct a qualified place description
        let format = weightedIndex([
            30,                             // "adj place"
            pool.appendices.length? 30: 0,  // "place appendix"
            pool.appendices.length? 20: 0,  // "adj place appendix"
        ])

        let place = choose(pool.primaryLocations)
        if( format === 0 )
            place = choose(pool.adjectives) + ' ' + place
        else if( format === 1 )
            place = place + ' ' + choose(pool.appendices)
        else if( format === 2 )
            place = choose(pool.adjectives) + ' ' + place + ' ' + choose(pool.appendices)

        const location = choose(pool.properLocations)
        if( chance(1/3) )
            name = location + ', ' + place
        else if ( chance(1/2) )
            name = place + ', ' + location
        else
            name = place + ' ' + location

    }

    // If it generated an existing name: reward the user with a star and a sound (at a slight delay)
    if (allAreas.includes(name)) {
        setTimeout(
            function(){
                $("#stars").prepend( $("<span>", {class: "area", "data-toggle": "tooltip", title: name}).text("★"))
                refreshTooltips()
                playSound(itemGetSound)
        }, 800)
    }

    // Easter eggs as a result of generating specific names...
    if( name in easterEggs ) {
        // 50% chance of just generating a new name instead, since otherwise Easter Eggs happen too frequently
        if( count < 30 || chance(1/2) ) return generateName()

        $("#stars").prepend( $("<span>", {class: "easter-egg", "data-toggle": "tooltip", title: name}).text("★"))
        refreshTooltips()
        
        if( !isChecked('disable-anims')) {
            newAreaSound.pause()
            playSound(easterEggs[name].audio)
            if (easterEggs[name].func) easterEggs[name].func()
        }
    }

    return name
}

var fadeOutID = 0;

// Sets a delay for a fade-out.
// The fade-out only applies if no other fade-out has been called since it was 'queued', and if the box is checked.
// So you're free to call this function whenever you feel like
function smartFadeOut(){
    // grab the desired fadeOutTime
    fadeOutTime = parseFloat($("#fade-out-time").val())
    // default to 5 seconds if fadeOutTime could not be parsed or is negative
    fadeOutTime = fadeOutTime > 0 ? fadeOutTime * 1000 : 5000
    // Increment the ID to cancel out any previous fade-outs
    let thisId = ++fadeOutID
    setTimeout(
        () => { if (thisId == fadeOutID && $("#fade-out-check").prop("checked"))
            $("#name-underline-wrapper").addClass("faded-out") },
        fadeOutTime)
}

var count = 0
var bgCooldown = 0

// Called by the main "Travel Somewhere Else" button.
function generate() {
    newAreaSound.play()
    $("#name-underline-wrapper").removeClass("faded-out")
    setAreaName(generateName())

    count++
    bgCooldown++

    // Don't swap bg if disable-anims is on
    // Never swap bg within 10 clicks of last swap
    // Always swap bg after 30 clicks
    // 4% chance per click of swapping bg between 10 and 30 clicks
    // Don't swap if manual selection is enabled
    if( !isChecked('disable-anims') && bgCooldown > 10 && (bgCooldown >= 30 || chance(0.04)) && $("input[target=shuffle-bg]").prop('checked') ){
        bgCooldown = 0
        randomiseBackground()
    }
}

// Called by the streamer "Override" button.
function customGenerate() {
    newAreaSound.play()
    $("#name-underline-wrapper").removeClass("faded-out")
    setAreaName($("#custom-text").val())
}


function tweetIntent() {
    window.open(`https://twitter.com/intent/tweet?text=I%20just%20visited%20${location.hash.slice(1)}%0Ahttps://sibert-aerts.github.io/new-area/`)
}