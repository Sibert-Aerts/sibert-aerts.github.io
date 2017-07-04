/*

    This is a rather big file containing objects containing all the different Soulsborne areas, split up into "grammatical" pieces.
    The general idea is that each area consists of a core location, with optional suffixes and prefixes, and optionally "The" before it.
    For example:

        Sen's Fortress          Valley of Drakes            Blighttown          Painted World of Ariamis
        ----- ¯¯¯¯¯¯¯¯          ¯¯¯¯¯¯ ---------            ------¯¯¯¯          ------- ¯¯¯¯¯ ----------
        prefx location          locatn  postfix             prefixlocation      prefix  loctn   postfix

*/

// Dark Souls 1
var Dark1 = {}

// I'm not sure how I originally got these
Dark1.areas = ["The Abyss", "Anor Londo", "Ash Lake", "Battle of Stoicism", "Undead Parish", "Blighttown", "Chasm of the Abyss",
    "Crystal Cave", "Darkroot Basin", "Darkroot Garden", "Demon Ruins", "The Depths", "Firelink Altar", "Firelink Shrine",
    "Kiln of the First Flame", "Lost Izalith", "New Londo Ruins", "Northern Undead Asylum", "Oolacile Sanctuary", "Undead Burg",
    "Oolacile Township", "Oolacile Township Dungeon", "Painted World of Ariamis", "Quelaag's Domain", "Royal Wood",
    "Sanctuary Garden", "Sen's Fortress", "The Catacombs", "The Duke's Archives", "The Great Hollow", "Tomb of the Giants", "Valley of Drakes"];

// pieces, minced from the above list by hand

// Capitalization doesn't matter in locations
Dark1.locations = ["abyss", "londo", "lake", "town", "chasm", "cave", "basin", "garden", "ruins", "depths", "altar", "shrine", "kiln", "ruins",
    "asylum", "sanctuary", "township", "dungeon", "world", "domain", "wood", "fortress", "catacombs", "archives", "tomb", "burg", "valley", "parish"];

// Capitalization doesn't matter in prefixes
// Notice "blight|", this is a special character for when you want the prefix to attach directly to the following word (e.g. "blighttown" instead of "blight town")
Dark1.prefixes = ["anor", "ash", "blight|", "crystal", "darkroot", "demon", "firelink", "lost", "new londo", "new",
    "northern", "undead", "oolacile", "painted", "quelaag's", "royal", "sanctuary", "sen's", "duke's", "great"];

// Capitalization matters in suffixes
Dark1.suffixes = ["ruins", "of the Abyss", "of the First Flame", "Dungeon", "of Ariamis", "of the Giants", "of Drakes"];


// Dark Souls 2
var Dark2 = {};

// Area names professionally scrubbed from the wiki
Dark2.areas = ["Things Betwixt", "Majula", "Forest of Fallen Giants", "Heide's Tower of Flame", "Cathedral of Blue", "No-man's Wharf",
    "The Lost Bastille", "Belfry Luna", "Sinner's Rise", "Huntsman's Copse", "Undead Purgatory", "Harvest Valley", "Earthen Peak",
    "Iron Keep", "Belfry Sol", "Shaded Woods", "Doors of Pharros", "Brightstone Cove Tseldora", "Lord's Private Chamber", "The Pit",
    "Grave of Saints", "The Gutter", "Black Gulch", "Shrine of Winter", "Drangleic Castle", "King's Passage", "Shrine of Amana",
    "Undead Crypt", "Throne of Want", "Aldia's Keep", "Dragon Aerie", "Dragon Shrine", "Dark Chasm of Old", "Memory of Jeigh",
    "Memory of Orro", "Memory of Vammar", "Dragon Memories", "Memory of the King", "Shulva, Sanctum City", "Dragon's Sanctum",
    "Dragon's Rest", "Cave of the Dead", "Brume Tower", "Iron Passage", "Memory of the Old Iron King#", "Frozen Eleum Loyce",
    "Grand Cathedral", "The Old Chaos", "Frigid Outskirts"];

// Q: is "things" or "betwixt" the prefix/suffix or location? 
// A: Yes.
Dark2.locations = ["things", "betwixt", "majula", "forest", "tower of flame", "cathedral", "wharf", "bastille", "belfry", "rise", "copse", "purgatory",
    "valley", "peak", "keep", "woods", "doors", "cove", "tseldora", "chamber", "pit", "grave", "gutter", "gulch", "shrine", "castle",
    "passage", "crypt", "throne", "aerie", "chasm", "memory", "memories", "sanctum city", "sanctum", "rest", "cave", "tower", "passage",
    "Eleum Loyce", "chaos", "outskirts"];

// shulva
var shulva = ["Shulva, "];

Dark2.prefixes = ["Heide's", "No-Man's", "lost", "Sinner's", "Huntsman's", "Undead", "Harvest", "Earthen", "Iron",
    "Shaded", "Brightstone", "Brightstone cove", "Lord's private", "black", "drangleic", "king's", "Aldia's", "Dragon", "Dark",
    "Dragon's", "Brume", "Frozen", "Eleum", "Grand", "Old", "Frigid"];

Dark2.suffixes = ["Betwixt", "of Fallen Giants", "of Flame", "of Blue", "Luna", "Sol", "of Pharros", "of Saints", "of Winter", "of Amana",
    "of Want", "of Old", "of Jeigh", "of Orro", "of Vammar", "of the King", "Tseldora", "of the Dead", "of the Old Iron King", "Loyce", "Outskirts"];


// Dark Souls 3
var Dark3 = {};

// Area names professionally scrubbed from the wiki
Dark3.areas = ["Cemetery of Ash", "Lothric Castle", "Anor Londo", "Catacombs of Carthus", "Profaned Capital",
    "Untended Graves", "High Wall of Lothric", "Farron Keep", "Irithyll of the Boreal Valley", "Cathedral of the Deep",
    "Road of Sacrifices", "Smouldering Lake", "Kiln of the First Flame", "Consumed King's Garden", "Undead Settlement",
    "Grand Archives", "Irithyll Dungeon", "Firelink Shrine", "Church of Yorshka", "Archdragon Peak", "Painted World of Ariandel",
    "The Dreg Heap", "The Ringed City"];

Dark3.locations = ["cemetery", "castle", "londo", "catacombs", "capital", "graves", "wall", "high wall", "keep", "irithyll", "valley",
    "cathedral", "road", "lake", "kiln", "garden", "settlement", "archives", "dungeon", "shrine", "church", "peak", "world", "heap", "city"];

Dark3.prefixes = ["Lothric", "anor", "profaned", "untended", "high", "farron", "smouldering", "consumed king's", "undead",
    "grand", "irithyll", "firelink", "archdragon", "boreal", "painted", "dreg", "ringed"];

Dark3.suffixes = ["of Ash", "of Carthus", "of Lothric", "of the Boreal Valley", "of the Deep", "of Sacrifices", "of the First Flame",
    "Dungeon", "Shrine", "of Yorshka", "of Ariandel"];

// Demon's Souls
var Demons = {};

// There aren't a lot of area names in this game
Demons.areas = ["The Nexus", "Boletarian Palace", "Tower of Latria", "Valley of Defilement", "Stonefang Tunnel", "Shrine of Storms"];

Demons.locations = ["Nexus", "Palace", "Tower", "Valley", "Tunnel", "Shrine"];

Demons.prefixes = ["Boletarian", "Stonefang"];

Demons.suffixes = ["of Latria", "of Defilement", "of Storms"];

// Bloodborne
var Blood = {};

Blood.areas = ["Hunter's Dream", "Central Yharnam", "Iosefka's Clinic", "Cathedral Ward", "Old Yharnam", "Healing Church Workshop",
    "Upper Cathedral Ward", "Altar of Despair", "Forbidden Woods", "Byrgenwerth", "Moonside Lake", "Hemwick Charnel Lane",
    "Abandoned Old Workshop", "Yahar'gul, Unseen Village", "Forsaken Cainhurst Castle", "Lecture Building", "Nightmare Frontier",
    "Nightmare of Mensis", "Hunter's Nightmare", "Fishing Hamlet"];

Blood.locations = ["Dream", "Yharnam", "Clinic", "Ward", "Church", "Workshop", "Cathedral", "Altar", "Woods", "werth", "Lake", "Lane",
    "Village", "Castle", "Building", "Frontier", "Nightmare", "Hamlet"];

Blood.prefixes = ["Hunter's", "Central", "Iosefka's", "Old", "Healing Church", "Upper", "Forbidden", "Byrgen|", "Moonside", "Hemwick Charnel",
    "Abandoned", "Yahar'gul,", "Forsaken", "Cainhurst", "Lecture", "Nightmare", "Fishing"];

Blood.suffixes = ["Ward", "of Despair", "of Mensis"];