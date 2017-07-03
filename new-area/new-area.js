
// Initialise sound crap
var maxSounds = 10;
var soundArray = new Array(maxSounds);
var index = 0;
var muted = false;
for(var i = 0; i < maxSounds; i++)
    soundArray[i] = new Audio("https://puu.sh/k1OGY.mp3");

$(document).ready(function () {
    $('#custom-text').keyup(function (e) {
        if (e.keyCode == 13) {
            customGenerate();
            $(this).val("");
        }
    });
});

// Greenscreen
var green = false;


// Area parts:

// Dark Souls 1

    // I'm not sure where I originally got these
var areas1 = ["The Abyss", "Anor Londo", "Ash Lake", "Battle of Stoicism", "Undead Parish",
    "Blighttown", "Chasm of the Abyss", "Crystal Cave", "Darkroot Basin", "Darkroot Garden",
    "Demon Ruins", "The Depths", "Firelink Altar", "Firelink Shrine", "Kiln of the First Flame",
    "Lost Izalith", "New Londo Ruins", "Northern Undead Asylum", "Oolacile Sanctuary",
    "Oolacile Township", "Oolacile Township Dungeon", "Painted World of Ariamis", "Quelaag's Domain",
    "Royal Wood", "Sanctuary Garden", "Sen's Fortress", "The Catacombs", "The Duke's Archives", "The Great Hollow",
    "Tomb of the Giants", "Undead Burg", "Valley of Drakes"];
    
    // pieces, minced from the above list by hand
    
    // capitalisation doesn't matter, since prefixes could happen (e.g. Blightcave)
var locations1 = ["abyss", "londo", "lake", "town", "chasm", "cave", "basin", "garden", "ruins", "depths", "altar", "shrine",
    "kiln", "ruins", "asylum", "sanctuary", "township", "dungeon", "world", "domain", "wood", "fortress", "catacombs", "archives",
    "tomb", "burg", "valley", "parish"];
    
    // caps doesn't mater here since it's removed and re-applied
    // the trailing space however DOES matter
    // both of these are because of the special case where a prefix is glued to the word-spacing
    // e.g. "Blightburg" vs. "Undead Burg"
var prefixes1  = ["anor", "ash", "blight|", "crystal", "darkroot", "demon", "firelink", "lost", "new londo", "new",
    "northern", "undead", "oolacile", "painted", "quelaag's", "royal", "sanctuary", "sen's", "the duke's", "great"];
    
    // no leading spaces required here, capitalisation IS required though
var suffixes1  = ["ruins", "of the Abyss", "of the First Flame", "Dungeon", "of Ariamis", "of the Giants", "of Drakes"];


// Dark Souls 2

    // Area names professionally scrubbed from the wiki
var areas2 = [ "Things Betwixt", "Majula", "Forest of Fallen Giants", "Heide's Tower of Flame", "Cathedral of Blue", "No-man's Wharf", 
    "The Lost Bastille", "Belfry Luna", "Sinner's Rise", "Huntsman's Copse", "Undead Purgatory", "Harvest Valley", "Earthen Peak", 
    "Iron Keep", "Belfry Sol", "Shaded Woods", "Doors of Pharros", "Brightstone Cove Tseldora", "Lord's Private Chamber", "The Pit", 
    "Grave of Saints", "The Gutter", "Black Gulch", "Shrine of Winter", "Drangleic Castle", "King's Passage", "Shrine of Amana", 
    "Undead Crypt", "Throne of Want", "Aldia's Keep", "Dragon Aerie", "Dragon Shrine", "Dark Chasm of Old", "Memory of Jeigh", 
    "Memory of Orro", "Memory of Vammar", "Dragon Memories", "Memory of the King", "Shulva, Sanctum City", "Dragon's Sanctum", 
    "Dragon's Rest", "Cave of the Dead", "Brume Tower", "Iron Passage", "Memory of the Old Iron King#", "Frozen Eleum Loyce", 
    "Grand Cathedral", "The Old Chaos", "Frigid Outskirts"];
    
    // Q: is "things" or "betwixt" the prefix/suffix or location? 
    // A: Yes.
var locations2 = ["things", "betwixt" ,"majula","forest", "tower of flame", "cathedral", "wharf", "bastille", "belfry", "rise", "copse", "purgatory",
    "valley", "peak", "keep", "woods", "doors", "cove", "tseldora", "chamber", "pit", "grave", "gutter", "gulch", "shrine", "castle",
    "passage", "crypt", "throne", "aerie", "chasm", "memory", "memories", "sanctum city", "sanctum", "rest", "cave", "tower", "passage",
    "Eleum Loyce", "chaos", "outskirts"];
    
    // shulva
var shulva = [ "Shulva, " ];	
    
var prefixes2  = [ "Heide's", "No-Man's", "the lost", "Sinner's", "Huntsman's", "Undead", "Harvest", "Earthen", "Iron",
    "Shaded", "Brightstone", "Brightstone cove", "Lord's private", "black", "drangleic", "king's", "Aldia's", "Dragon", "Dark", 
    "Dragon's", "Brume", "Frozen", "Eleum", "Grand", "Old", "Frigid"];
    
var suffixes2  = [ "Betwixt", "of Fallen Giants", "of Flame", "of Blue", "Luna", "Sol", "of Pharros", "of Saints", "of Winter", "of Amana",
    "of Want", "of Old", "of Jeigh", "of Orro", "of Vammar", "of the King", "Tseldora", "of the Dead", "of the Old Iron King", "Loyce", "Outskirts"];
    
    
// Dark Souls 3

    // Area names professionally scrubbed from the wiki
var areas3 = [ "Cemetery of Ash", "Lothric Castle", "Anor Londo", "Catacombs of Carthus", "Profaned Capital", 
    "Untended Graves", "High Wall of Lothric", "Farron Keep", "Irithyll of the Boreal Valley", "Cathedral of the Deep", 
    "Road of Sacrifices", "Smouldering Lake", "Kiln of the First Flame", "Consumed King's Garden", "Undead Settlement", 
    "Grand Archives", "Irithyll Dungeon", "Firelink Shrine", "Church of Yorshka", "Archdragon Peak", "Painted World of Ariandel", 
    "The Dreg Heap", "The Ringed City"];
    
var locations3 = [ "cemetery", "castle", "londo", "catacombs", "capital", "graves", "wall", "high wall", "keep", "irithyll", "valley",
    "cathedral", "road", "lake", "kiln", "garden", "settlement", "archives", "dungeon", "shrine", "church", "peak", "world", "heap", "city"];
    
var prefixes3  = [ "Lothric", "anor", "profaned", "untended", "high", "farron", "smouldering", "consumed king's", "undead",
    "grand", "irithyll", "firelink", "archdragon", "boreal", "painted", "dreg", "ringed"];
    
var suffixes3  = ["of Ash", "of Carthus", "of Lothric", "of the Boreal Valley", "of the Deep", "of Sacrifices", "of the First Flame", 
    "Dungeon", "Shrine", "of Yorshka", "of Ariandel"];
    
// Demon's Souls

    // There aren't a lot of area names in this game
var areas0 = [ "The Nexus", "Boletarian Palace", "Tower of Latria", "Valley of Defilement", "Stonefang Tunnel", "Shrine of Storms"];

var locations0 = [ "Nexus", "Palace", "Tower", "Valley", "Tunnel", "Shrine"];

var prefixes0 = [ "Boletarian", "Stonefang"];

var suffixes0 = [ "of Latria", "of Defilement", "of Storms"];

// Bloodborne

var areasbb = [ "Hunter's Dream", "Central Yharnam", "Iosefka's Clinic", "Cathedral Ward", "Old Yharnam", "Healing Church Workshop", 
    "Upper Cathedral Ward", "Altar of Despair", "Forbidden Woods", "Byrgenwerth", "Moonside Lake", "Hemwick Charnel Lane", 
    "Abandoned Old Workshop", "Yahar'gul, Unseen Village", "Forsaken Cainhurst Castle", "Lecture Building", "Nightmare Frontier", 
    "Nightmare of Mensis", "Hunter's Nightmare", "Fishing Hamlet"];

var locationsbb = [ "Dream", "Yharnam", "Clinic", "Ward", "Church", "Workshop", "Cathedral", "Altar", "Woods", "werth", "Lake", "Lane",
    "Village", "Castle", "Building", "Frontier", "Nightmare", "Hamlet"];

var prefixesbb = [ "Hunter's", "Central", "Iosefka's", "Old", "Healing Church", "Upper", "Forbidden", "Byrgen|", "Moonside", "Hemwick Charnel",
    "Abandoned", "Yahar'gul,", "Forsaken", "Cainhurst", "Lecture", "Nightmare", "Fishing"];

var suffixesbb = [ "Ward", "of Despair", "of Mensis"];

// Custom

var locationscustom = [];
var suffixescustom = [];
var prefixescustom = [];

// (to be) Compiled pools

var areas = areas0.concat(areas1).concat(areas2).concat(areas3).concat(areasbb);
var locations = [];
var prefixes  = [];
var suffixes  = [];

function playSound(a){
    if(muted) return;
    a.currentTime = 0;
    a.play();
}

// this one needs a special function since it's gotta cycle
function playNewAreaSound(){
    playSound(soundArray[index]);
    index = (index+1)%maxSounds;
}

function pauseAllSounds(){
    for(var i = 0; i < maxSounds; i++)
        soundArray[i].pause();
}

function mute(){
    pauseAllSounds();
    muted = !muted;
    document.getElementById("muteButton").innerHTML = muted? "unmute" : "mute";
}

function greenToggle(){
    green = !green;
    if(green)
        $("#main").addClass("greenscreen");
    else
        $("#main").removeClass("greenscreen");
    $("#greenButton").text(green? "no green" : "green")
}

function chance( x, outof){
    return (Math.random()*outof <= x);
}

function choose(list){
    i = Math.floor( Math.random() * list.length);
    return list[i];
}

// Functions shamelessly ripped from StackOverflow, thanks!
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function arrayContains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function refreshTooltips(){
    $('[data-toggle="tooltip"]').tooltip(); 
}
    
function compileCustom(){
    locationscustom = $("#custom-places").val().split(";").slice(0,-1);
    prefixescustom = $("#custom-prefixes").val().split(";").slice(0,-1);
    suffixescustom = $("#custom-suffixes").val().split(";").slice(0,-1);
}

function compilePools(){
// clear pools
    locations = [];
    prefixes  = [];	
    suffixes  = [];

// this part is idiotic forgive me lord
    if($("#check1" ).prop("checked")){
        locations.push(locations1);
        prefixes.push(prefixes1);
        suffixes.push(suffixes1);
    }
    
    if($("#check2" ).prop("checked")){
        locations.push(locations2);
        prefixes.push(prefixes2);
        suffixes.push(suffixes2);
    }
    
    if($("#check3" ).prop("checked")){
        locations.push(locations3);
        prefixes.push(prefixes3);
        suffixes.push(suffixes3);
    }
    
    if($("#check0" ).prop("checked")){
        locations.push(locations0);
        prefixes.push(prefixes0);
        suffixes.push(suffixes0);
    }
    
    if($("#checkbb" ).prop("checked")){
        locations.push(locationsbb);
        prefixes.push(prefixesbb);
        suffixes.push(suffixesbb);
    }
    
    if($("#checkcustom" ).prop("checked")){
        compileCustom();
        if(locationscustom.length > 0)
            locations.push(locationscustom);
        if(prefixescustom.length > 0)
            prefixes.push(prefixescustom);
        if(suffixescustom.length > 0)
            suffixes.push(suffixescustom);
    }
}

function getPrefix(){
    var prefix = choose(choose(prefixes));
    // Add a space if the prefix doesn't end with the special | character
    if (prefix[prefix.length-1] == '|')
        return prefix.slice(0, prefix.length-1);
    return prefix + ' ';
}

function generateName(){
    name = "";
    
    compilePools();
    
    // if no checkboxes are checked, tell the user to do so
    if(!(	$("#check1" ).prop("checked") || $("#check2" ).prop("checked") ||
            $("#check3" ).prop("checked") || $("#check0" ).prop("checked") ||
            $("#checkbb").prop("checked") || $("#checkcustom").prop("checked") ) )
    {
        return "Click one of the Checkboxes";
    }
    
    // double choose because the parts are hidden in lists within lists
    
    // 3 in 4 chance of adding an area prefix, 1 in 4 chance of adding an additional prefix
    if( chance(3,4) ){
        name += getPrefix();
        if( chance(1,4) && name.slice(0,3) != "the") name = getPrefix() + name;
    }
    
    // if Dark Souls 2 is enabled, 1 in 40 chance of prepending "Shulva, "
    if($("#check2" ).prop("checked") && chance (1,40)) name = choose(shulva) + name;
    
    // 100% chance of adding a main "location" piece
    name+= choose(choose(locations));
    
    // Fix the case so "BlightTown" turns into "Blighttown"
    name = name.toProperCase();
    
    // 1 in 15 chance to add an area suffix if the name is longer than 15 characters
    // 1 in 5 chance to add an area suffix if the name is shorter than 15 characters
    if( chance( 1, 15 ) || (chance(4,15) && name.length < 15) )
        name += " " + choose(choose(suffixes));
    
    // If it isn't already there: 
    // 1/6 chance to prefix "The" if longer than 10 characters
    // 5/6 chance to prefix "The" if shorter than 10 characters
    if( name.slice(0,3) != "The" && ( chance(1,6) || (chance(4,5) && name.length < 10))) 
        name = "The " + name;
    
    // If it generated an existing name: reward the user with a star and a sound, at a slight delay
    if( arrayContains(areas, name)){
        setTimeout( function(name){ 	// javascript was a mistake
            return function(){			// why can't i just capture the value of 'name' like in a sane language 
                $("#stars").prepend("<span class=\"area\" data-toggle=\"tooltip\" title=\"" + name + "\">★</span>");
                refreshTooltips();
                playSound(itemGetSound);
            }
        }(name), 800);
    }

    // Easter egg: if it generated "The Wall": reward the user with a clip from Another Brick in the Wall Pt. 2
    if( name === "The Wall" ){
        pauseAllSounds();
        playSound(theWallSound);
        $("#stars").prepend("<span class=\"easter-egg\" data-toggle=\"tooltip\" title=\"" + name + "\">★</span>");
        refreshTooltips();
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
    // default to 6 seconds if fadeOutTime could not be parsed or is negative
    fadeOutTime = fadeOutTime > 0? fadeOutTime * 1000 : 5000; 
    setTimeout(	
        function(){ 
            if(this == fadeOutID && $("#fade-out-check").prop("checked"))
                $("#name-underline-wrapper").addClass("faded-out"); 
        }.bind(++fadeOutID)
        , fadeOutTime);
}

function generate(){
    playNewAreaSound();
    $("#name-underline-wrapper").removeClass("faded-out");
    $("#name").html(generateName());
    smartFadeOut();
}

function customGenerate(){
    playNewAreaSound();
    $("#name-underline-wrapper").removeClass("faded-out");
    $("#name").html($("#custom-text").val());
    smartFadeOut();
}
