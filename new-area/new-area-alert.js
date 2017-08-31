/*
    Modified (skinned down) version of the Dark Souls New Area Generator script
    intended for use with twitch alert boxes.
*/


/*      Sound Stuff     */

var newAreaSound = new Audio("https://puu.sh/k1OGY.mp3");

// Custom pool
var Custom = {};
Custom.locations = [];
Custom.suffixes = [];
Custom.prefixes = [];

// All the pools together
var allPools = {Dark1: Dark1, Dark2: Dark2, Dark3: Dark3, Demons: Demons, Blood: Blood, Custom: Custom};
var allAreas = Object.keys(allPools).reduce((tot, key) => tot.concat(allPools[key].areas), []);

// Selected pools
var selected = [];
hardcodedSelected = {
    Dark1: true, Dark2: true, Dark3: true, Demons: false, Blood: false, Custom: true
}


/*      Utility functions     */

// Has a p out of (outof) chance of returning true.
var chance = (p, outof=1) => Math.random() * outof <= p;

// Get a random element from the given list.
var choose = list => list[Math.floor(Math.random() * list.length)];

// Await this to sleep a given number of milliseconds.
var sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Set an element's hidden state.
var setHidden = (selector, hidden) => hidden? $(selector).addClass("hidden"): $(selector).removeClass("hidden");

// Convert a string to proper case.
function stringToProperCase(s) {
    return s.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

// Returns true if the array contains an instance of obj.
function arrayContains (a, obj) {
    var i = a.length;
    while (i--)
        if (a[i] === obj)
            return true;
    return false;
}


/*      Pools and stuff     */

function compileCustom(){
    // Custom.locations = $("#custom-places").val().split(";").slice(0,-1);
    // Custom.prefixes = $("#custom-prefixes").val().split(";").slice(0,-1);
    // Custom.suffixes = $("#custom-suffixes").val().split(";").slice(0,-1);
}

function selectPools(){
    // clear selected
    selected = [];
    compileCustom();

    console.log(hardcodedSelected)
    // Add all pools whose box is checked to the list of selected pools
    for( key in allPools )
        if( hardcodedSelected[key] )
            selected.push(allPools[key]);
}

// Get a random prefix from the list of selected pools
function randomPrefix(){
    var prefix = choose(choose(selected).prefixes);
    // Add a space if the prefix doesn't end with the special | character
    if (prefix[prefix.length-1] == '|')
        return prefix.slice(0, prefix.length-1);
    return prefix + ' ';
}

var randomLocation = () => choose(choose(selected).locations);
var randomSuffix = () => ' ' + choose(choose(selected).suffixes);

/*      Easter eggs     */

// List of easter egg words, the audio they should play, and optionally the function they should call.
var easterEggs = {
    "The Wall"  : {audio: new Audio("https://my.mixtape.moe/alfgxc.mp3")},
    "The World" : {audio: new Audio("https://my.mixtape.moe/lgvonw.mp3")},
    "The Doors" : {audio: new Audio("https://my.mixtape.moe/kvpycq.mp3")},
};

// Generate a random area name, and perform any easter eggs if needed.
function generateName(){
    name = "";
    allowThe = true;
    var hasPrefix = false;
    var hasSuffix = false;
    
    selectPools();
    
    // double choose because the parts are hidden in lists within lists
    
    // 3 in 4 chance of adding an area prefix, 1 in 4 chance of adding an additional prefix
    if( chance(3,4) ){
        hasPrefix = true;
        name += randomPrefix();
        if(name[name.length-1] == ' ' && chance(1,4))
            name += randomPrefix();
    }

    // if Dark Souls 2 is enabled, 1 in 40 chance of prepending "Shulva, "
    if(hardcodedSelected['Dark2'] && chance (1, 30) && hasPrefix){ 
        name = choose(shulva) + name;
        allowThe = false;
    }

    // 100% chance of adding a main "location" piece
    name += randomLocation();

    // Fix the case so "BlightTown" turns into "Blighttown"
    name = stringToProperCase(name);

    // 1 in 15 chance to add an area suffix if the name is longer than 15 characters
    // 1 in 5 chance to add an area suffix if the name is shorter than 15 characters
    if( chance( 1, 15 ) || (chance(4,15) && !hasPrefix) ){
        hasSuffix = true;
        name += randomSuffix();
    }

    // 0% chance to prefix "The" if "Shulva, " is present
    // 1/6 chance if the name is longer than 10 characters
    // 5/6 chance if the name is shorter than 10 characters
    // 100% chance if no prefix or suffix is present yet.
    if( allowThe && (chance(1, 6) || (chance(4, 5) && name.length < 10) || (!hasPrefix && !hasSuffix)))
        name = "The " + name;

    // If it generated an existing name: reward the user with a star and a sound, at a slight delay
    if( arrayContains(allAreas, name)){
        let theName = name;
        setTimeout( function(){ playSound(itemGetSound); }, 800);
    }

    // Check for easter eggs.
    for(var egg in easterEggs){
        if( egg == name ){
            // 50% chance to just generate a new name, since easter eggs are a bit too common otherwise
            if(chance(0.5))
                return generateName();
            newAreaSound.pause();
            playSound(easterEggs[egg].audio);
        }
    }

    return name;
}

// Called by the main "Travel somewhere else" button.
async function generate(){
    await sleep(200);
    newAreaSound.play();
    $("#name-underline-wrapper").removeClass("faded-out");
    $("#name").text(generateName());
}