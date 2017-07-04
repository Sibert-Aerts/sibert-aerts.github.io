
// Initialise sound crap
var maxSounds = 10;
var soundArray = new Array(maxSounds);
var index = 0;
var muted = false;
for(var i = 0; i < maxSounds; i++)
    soundArray[i] = new Audio("https://puu.sh/k1OGY.mp3");

var itemGetSound = new Audio("https://my.mixtape.moe/gmtxtg.mp3");

var backgrounds = [
    "https://i.imgur.com/cURcsam.jpg",
    "https://i.imgur.com/uNuqPte.jpg",
    "https://i.imgur.com/d8thQaE.jpg",
    "https://i.imgur.com/ic9I2Uu.jpg",
    "https://i.imgur.com/hjPuO8N.jpg",
    "https://i.imgur.com/9gX5pBB.jpg",
    "https://i.imgur.com/qEk3cZa.jpg",
    "https://i.imgur.com/7qzGveQ.jpg",
    "https://i.imgur.com/ej8kxIW.jpg",
    "https://i.imgur.com/baIPonl.jpg",
    "https://i.imgur.com/kfTzoWv.jpg",
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var currentBackground = "";

async function randomBackground(fade=true) {
    if(fade){
        $("#background-layer").css("background-image", $("body").css("background-image"));
        $("#background-layer").removeClass("faded");
        await sleep(100);
        $("#background-layer").addClass("faded");
    }
    $("body").css("background-image", `url(${choose(backgrounds)})`);
}

// Set an elements hidden state.
function setHidden(selector, hidden){
    if (hidden)
        $(selector).addClass("hidden");
    else
        $(selector).removeClass("hidden")
}

$(document).ready(function () {
    randomBackground(false);

    $("#custom-text").keyup(e => { if (e.keyCode == 13) customGenerate() });
    
    $("input[target=custom]").on("click", function(){ setHidden("#custom-input", !this.checked) });
    $("input[target=streamer-features]").on("click", function(){ setHidden(".streamer-feature", !this.checked) });

});

// Custom
var Custom = {};

Custom.locations = [];
Custom.suffixes = [];
Custom.prefixes = [];

var pools = {Dark1: Dark1, Dark2: Dark2, Dark3: Dark3, Demons: Demons, Blood: Blood, Custom: Custom};

// (to be) Compiled pools
var Combined = {};
Combined.areas = Object.keys(pools).reduce((tot, key) => tot.concat(pools[key].areas), []);
var locations = [];
var prefixes  = [];
var suffixes  = [];

// Reset and play the given sound unless muted.
function playSound(a){
    if(muted) return;
    a.currentTime = 0;
    a.play();
}

// Play the currently selected new area sound, and cycle to the next one.
function playNewAreaSound(){
    playSound(soundArray[index]);
    index = (index+1)%maxSounds;
}

// Pauses all "new area" sounds.
function pauseAllSounds(){
    for(var i = 0; i < maxSounds; i++)
        soundArray[i].pause();
}

// Toggles whether sounds are allowed to play.
function mute(){
    pauseAllSounds();
    muted = !muted;
    document.getElementById("muteButton").innerHTML = muted? "unmute" : "mute";
}

// chroma key background flag
var chroma = false;

function chromaToggle(){
    chroma = !chroma;
    if(chroma)
        $("#main").addClass("chroma");
    else
        $("#main").removeClass("chroma");
    $("#chromaButton").text(chroma? "no chroma" : "chroma")
}

function chance( x, outof=1 ){
    return (Math.random()*outof <= x);
}

function choose(list){
    return list[Math.floor(Math.random() * list.length)];
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function arrayContains(a, obj) {
    var i = a.length;
    while (i--)
        if (a[i] === obj)
            return true;
    return false;
}

function refreshTooltips(){
    $('[data-toggle="tooltip"]').tooltip(); 
}

function compileCustom(){
    Custom.locations = $("#custom-places").val().split(";").slice(0,-1);
    Custom.prefixes = $("#custom-prefixes").val().split(";").slice(0,-1);
    Custom.suffixes = $("#custom-suffixes").val().split(";").slice(0,-1);
}

function compilePools(){
    // clear pools
    locations = [];
    prefixes  = [];
    suffixes  = [];

    compileCustom();

    for( key in pools ){
        if( $(`input[target=${key}]`).prop("checked") ){
            var pool = pools[key];
            if (pool.locations.length)
                locations.push(pool.locations);
            if (pool.prefixes.length)
                prefixes.push(pool.prefixes);
            if (pool.suffixes.length)
                suffixes.push(pool.suffixes);
        }
    }
}

function getPrefix(){
    var prefix = choose(choose(prefixes));
    // Add a space if the prefix doesn't end with the special | character
    if (prefix[prefix.length-1] == '|')
        return prefix.slice(0, prefix.length-1);
    return prefix + ' ';
}

function worldFunc(){
    $("#world-layer").css("background-image", $("body").css("background-image"));
    $("#world-layer").removeClass("faded");
    setTimeout(()=>$("#world-layer").addClass("faded"), 5000);
}

var easterEggs = {
    "The Wall"  : {audio: new Audio("https://my.mixtape.moe/alfgxc.mp3")},
    "The World" : {audio: new Audio("https://my.mixtape.moe/lgvonw.mp3"), func: worldFunc},
    "The Doors" : {audio: new Audio("https://my.mixtape.moe/kvpycq.mp3")},
};

function generateName(){
    name = "";
    
    compilePools();
    
    // if no checkboxes are checked, tell the user to do so
    if( !Object.keys(pools).reduce((total, key) => total || $(`input[target=${key}]`).prop("checked"), false) )
        return "Tick one of the Checkboxes";
    
    // double choose because the parts are hidden in lists within lists
    
    // 3 in 4 chance of adding an area prefix, 1 in 4 chance of adding an additional prefix
    if( chance(3,4) ){
        name += getPrefix();
        if(name[name.length-1] == ' ' && chance(1,4))
            name += getPrefix();
    }
    
    // if Dark Souls 2 is enabled, 1 in 40 chance of prepending "Shulva, "
    if($("input[target=Dark2]").prop("checked") && chance (1,40)) name = choose(shulva) + name;
    
    // 100% chance of adding a main "location" piece
    name += choose(choose(locations));
    
    // Fix the case so "BlightTown" turns into "Blighttown"
    name = name.toProperCase();
    
    // 1 in 15 chance to add an area suffix if the name is longer than 15 characters
    // 1 in 5 chance to add an area suffix if the name is shorter than 15 characters
    if( chance( 1, 15 ) || (chance(4,15) && name.length < 15) )
        name += " " + choose(choose(suffixes));
    
    // If it isn't already there: 
    // 1/6 chance to prefix "The" if longer than 10 characters
    // 5/6 chance to prefix "The" if shorter than 10 characters
    if( chance(1, 6) || (chance(4, 5) && name.length < 10))
        name = "The " + name;
    
    // If it generated an existing name: reward the user with a star and a sound, at a slight delay
    if( arrayContains(Combined.areas, name)){
        let theName = name;
        setTimeout(
            function(){
                $("#stars").prepend( $("<span>", {class: "area", "data-toggle": "tooltip", title: theName}).text("★"));
                refreshTooltips();
                playSound(itemGetSound);
            }, 800);
    }

    // Check for easter eggs.
    for(var egg in easterEggs){
        if( egg == name ){

            // 50% chance to just generate a new name, since easter eggs are fairly common
            if(chance(0.5))
                return generateName();

            pauseAllSounds();
            $("#stars").prepend( $("<span>", {class: "easter-egg", "data-toggle": "tooltip", title: name}).text("★"));
            refreshTooltips();
            playSound(easterEggs[egg].audio);
            if (easterEggs[egg].func)
                easterEggs[egg].func();
        }
    }

    return name;
}

var fadeOutID = 0;

// Sets a delay for a fade-out.
// The fade-out only applies if no other fade-out has been called since it was 'queued', and if the box is checked.
// So you're free to call this function whenever you feel like
function smartFadeOut(){
    // grab the desired fadeOutTime
    fadeOutTime = parseFloat($("#fade-out-time").val());
    // default to 5 seconds if fadeOutTime could not be parsed or is negative
    fadeOutTime = fadeOutTime > 0 ? fadeOutTime * 1000 : 5000;
    // Increment the ID to cancel out any previous fade-outs
    let thisId = ++fadeOutID;
    setTimeout(
        function(){
            if(thisId == fadeOutID && $("#fade-out-check").prop("checked"))
                $("#name-underline-wrapper").addClass("faded-out"); 
        }, fadeOutTime);
}

var count = 0;
var bgCooldown = 0;

function generate(){
    playNewAreaSound();
    $("#name-underline-wrapper").removeClass("faded-out");
    $("#name").text(generateName());
    smartFadeOut();

    count++;
    bgCooldown++;
    if(bgCooldown >= 30 || chance(0.04)){
        bgCooldown = 0;
        randomBackground();
    } 
}

function customGenerate(){
    playNewAreaSound();
    $("#name-underline-wrapper").removeClass("faded-out");
    $("#name").text($("#custom-text").val());
    smartFadeOut();
}
