/*

    This is a big file containing objects containing all the different Soulsborne areas, split up into "grammatical" pieces.

*/

const AREA_PROPS = ['properLocations', 'primaryLocations', 'secondaryLocations', 'properNames', 'adjectives', 'appendices', 'possessives', 'prefixes', 'positionals']

//// Dark Souls 1
var Dark1 = {}

// I'm not sure how I originally got these
Dark1.areas = ["The Abyss", "Anor Londo", "Ash Lake", "Battle of Stoicism", "Undead Parish", "Blighttown", "Chasm of the Abyss",
    "Crystal Cave", "Darkroot Basin", "Darkroot Garden", "Demon Ruins", "Depths", "Firelink Altar", "Firelink Shrine",
    "Kiln of the First Flame", "Lost Izalith", "New Londo Ruins", "Northern Undead Asylum", "Oolacile Sanctuary", "Undead Burg",
    "Oolacile Township", "Oolacile Township Dungeon", "Painted World of Ariamis", "Quelaag's Domain", "Royal Wood",
    "Sanctuary Garden", "Sen's Fortress", "The Catacombs", "The Duke's Archives", "The Great Hollow", "Tomb of the Giants", "Valley of Drakes"]

/// Split up:

// Proper location names
Dark1.properLocations = ["Anor Londo", "New Londo", "Izalith", "Oolacile", "Firelink", "Darkroot", "Blighttown"]

// Words describing a kind of location
Dark1.primaryLocations = ["Abyss", "Lake", "Town", "Chasm", "Cave", "Basin", "Garden", "Ruins", "Depths", "Altar", "Shrine", "Kiln", "Hollow",
"Asylum", "Sanctuary", "Township", "Dungeon", "World", "Domain", "Wood", "Fortress", "Catacombs", "Archives", "Tomb", "Burg", "Valley", "Parish"]

// Words describing a kind of location and which may resonably be used to describe a "sub-location" of a larger location.
//      e.g. "Firelink Shrine Cave" works, while "Firelink Shrine World" does not, so "World" is excluded
Dark1.secondaryLocations = ["Abyss", "Lake", "Chasm", "Cave", "Basin", "Garden", "Ruins", "Depths", "Altar", "Shrine",
"Asylum", "Sanctuary", "Township", "Dungeon", "Domain", "Wood", "Fortress", "Catacombs", "Archives", "Tomb", "Valley"]

// Names of people
Dark1.properNames = ["Quelaag", "Sen", "Ariamis"]

// Possessives not tied to specific people
Dark1.possessives = ["The Duke's"]

// Word piece that's prefixed to a location piece e.g. "Blighttown"
Dark1.prefixes = ["Blight"]

// Positional adjectives
Dark1.positionals = ["Northern"]

// Adjectives not derived from proper names, locations, possessives or positional
Dark1.adjectives = ["Anor", "Ash", "Crystal", "Demon", "Lost", "New", "Undead", "Painted", "Royal", "Great"]

// Suffixes not derived from proper names or locations
Dark1.appendices = ["of the Abyss", "of the First Flame", "of the Giants", "of Drakes"]



// Dark Souls 2
var Dark2 = {}

// Area names professionally scrubbed from the wiki
Dark2.areas = ["Things Betwixt", "Majula", "Forest of Fallen Giants", "Heide's Tower of Flame", "Cathedral of Blue", "No-man's Wharf",
    "The Lost Bastille", "Belfry Luna", "Sinner's Rise", "Huntsman's Copse", "Undead Purgatory", "Harvest Valley", "Earthen Peak",
    "Iron Keep", "Belfry Sol", "Shaded Woods", "Doors of Pharros", "Brightstone Cove Tseldora", "Lord's Private Chamber", "The Pit",
    "Grave of Saints", "The Gutter", "Black Gulch", "Shrine of Winter", "Drangleic Castle", "King's Passage", "Shrine of Amana",
    "Undead Crypt", "Throne of Want", "Aldia's Keep", "Dragon Aerie", "Dragon Shrine", "Dark Chasm of Old", "Memory of Jeigh",
    "Memory of Orro", "Memory of Vammar", "Dragon Memories", "Memory of the King", "Shulva, Sanctum City", "Dragon's Sanctum",
    "Dragon's Rest", "Cave of the Dead", "Brume Tower", "Iron Passage", "Memory of the Old Iron King", "Frozen Eleum Loyce",
    "Grand Cathedral", "The Old Chaos", "Frigid Outskirts"]


Dark2.properLocations = ["Majula", "Tseldora", "Eleum Loyce", "Heide", "Amana", "Drangleic", "Shulva", "Brume"]

Dark2.primaryLocations = ["Things", "Forest", "Tower", "Cathedral", "Wharf", "Bastille", "Belfry", "Rise", "Copse", "Purgatory",
    "Valley", "Peak", "Keep", "Woods", "Doors", "Cove", "Chamber", "Pit", "Grave", "Gutter", "Gulch", "Shrine", "Castle",
    "Passage", "Crypt", "Throne", "Aerie", "Chasm", "Memory", "Memories", "Sanctum", "City", "Rest", "Cave", "Chaos", "Outskirts"]

Dark2.secondaryLocations = ["Forest", "Tower", "Cathedral", "Wharf", "Bastille", "Belfry", "Valley", "Peak", "Keep", "Woods", "Cove", "Chamber", "Pit", "Grave", "Gutter", "Gulch", "Shrine", "Castle",
"Passage", "Crypt", "Throne", "Chasm", "Memory", "Memories", "Sanctum", "City", "Cave", "Outskirts"]

Dark2.properNames = ["Aldia", "Pharros", "Vammar", "Jeigh", "Orro"]

Dark2.possessives = ["Heide's", "No-Man's", "Sinner's", "Huntsman's", "Lord's Private", "Dragon's", "King's"]
Dark2.prefixes = []
Dark2.positionals = []
Dark2.adjectives = ["Lost", "Undead", "Harvest", "Earthen", "Iron", "Shaded", "Black", "Dragon", "Dark", "Frozen", "Grand", "Old", "Frigid", "Brightstone"]

Dark2.appendices = ["Betwixt", "of Fallen Giants", "of Flame", "of Blue", "Luna", "Sol", "of Saints", "of Winter", "of Amana",
    "of Want", "of Old", "of the King", "of the Dead", "of the Old Iron King"]



// Dark Souls 3
var Dark3 = {}

// Area names professionally scrubbed from the wiki
Dark3.areas = ["Cemetery of Ash", "Lothric Castle", "Anor Londo", "Catacombs of Carthus", "Profaned Capital",
    "Untended Graves", "High Wall of Lothric", "Farron Keep", "Irithyll of the Boreal Valley", "Cathedral of the Deep",
    "Road of Sacrifices", "Smouldering Lake", "Kiln of the First Flame", "Consumed King's Garden", "Undead Settlement",
    "Grand Archives", "Irithyll Dungeon", "Firelink Shrine", "Church of Yorshka", "Archdragon Peak", "Painted World of Ariandel",
    "The Dreg Heap", "The Ringed City"]


Dark3.properLocations = ["Lothric", "Irithyll", "Anor Londo", "Carthus", "Farron", "Firelink"]

Dark3.primaryLocations =  ["Cemetery", "Castle", "Catacombs", "Capital", "Graves", "Wall", "High Wall", "Keep", "Valley",
    "Cathedral", "Road", "Lake", "Kiln", "Garden", "Settlement", "Archives", "Dungeon", "Shrine", "Church", "Peak", "World", "Heap", "City"]

Dark3.secondaryLocations = ["Cemetery", "Castle", "Catacombs", "Graves", "Wall", "High Wall", "Keep", "Valley",
    "Cathedral", "Road", "Lake", "Garden", "Settlement", "Archives", "Dungeon", "Shrine", "Church", "Peak", "City"]

Dark3.properNames = ["Ariandel", "Yorshka"]

Dark3.possessives = ["Consumed King's"]
Dark3.prefixes = []
Dark3.positionals = []
Dark3.adjectives = ["Profaned", "Untended", "High", "Smouldering", "Undead", "Grand", "Archdragon", "Boreal", "Painted", "Dreg", "Ringed"]

Dark3.appendices = ["of Ash", "of the Boreal Valley", "of the Deep", "of Sacrifices", "of the First Flame", "of Yorshka", "of Ariandel"]


// Demon's Souls
var Demons = {}

// There aren't a lot of area names in this game
Demons.areas = ["Outpost Passage", "Forlorn Outpost", "Unknown Egress", "The Nexus", "Boletarian Palace", "Tower of Latria", "Valley of Defilement", "Stonefang Tunnel", 
    "Shrine of Storms", "Gates of Boletaria", "The Lord's Path", "Inner Ward", "The King's Tower", "Throne of the False King", "Smithing Grounds",
    "The Tunnel City", "Underground Temple", "Shrine of the Dragon God", "Prison of Hope", "Upper Latria", "The Ivory Tower", "Throne Room of Yormedaar",
    "Island's Edge", "The Ritual Path", "Altar of Storms", "The Monolith Forest", "Depraved Chasm", "Swamp of Sorrow", "Rotting Haven", "Sanctuary of the Lost"]


Demons.properLocations = ["Boletaria", "Latria", "Stonefang", "Yormedaar"]

Demons.primaryLocations =  ["Outpost", "Passage", "Egress", "Nexus", "Palace", "Tower", "Valley", "Tunnel", "Shrine", "Gates", "Path", "Ward", "Throne", 
    "Grounds", "City", "Temple", "Prison", "Throne Room", "Edge", "Altar", "Forest", "Chasm", "Swamp", "Haven", "Sanctuary"]

Demons.secondaryLocations = ["Outpost", "Passage", "Egress", "Nexus", "Palace", "Tower", "Valley", "Tunnel", "Shrine", "Gates", "Path", "Ward", "City", "Temple",
"Prison", "Throne Room", "Edge", "Altar", "Forest", "Chasm", "Swamp", "Haven", "Sanctuary"]

Demons.properNames = []

Demons.possessives = ["The Lord's", "The King's"]
Demons.prefixes = []
Demons.positionals = ["Inner", "Upper"]
Demons.adjectives = ["Forlorn", "Unknown", "Smithing", "Underground", "Ivory", "Island's", "Monolith", "Depraved", "Rotting"]

Demons.appendices = ["of Defilement", "of Storms", "of the False King", "of the Dragon God", "of Hope", "of Sorrow", "of the Lost"]



// Bloodborne
var Blood = {}

Blood.areas = ["Hunter's Dream", "Central Yharnam", "Iosefka's Clinic", "Cathedral Ward", "Old Yharnam", "Healing Church Workshop",
    "Upper Cathedral Ward", "Altar of Despair", "Forbidden Woods", "Byrgenwerth", "Moonside Lake", "Hemwick Charnel Lane",
    "Abandoned Old Workshop", "Yahar'gul, Unseen Village", "Forsaken Cainhurst Castle", "Lecture Building", "Nightmare Frontier",
    "Nightmare of Mensis", "Hunter's Nightmare", "Fishing Hamlet"]


Blood.properLocations = ["Yharnam", "Byrgenwerth", "Hemwick", "Yahar'gul", "Cainhurst"]

Blood.primaryLocations =  ["Dream", "Clinic", "Ward", "Church", "Workshop", "Cathedral", "Altar", "Woods", "Werth", "Lake", "Charnel", "Lane",
    "Village", "Castle", "Building", "Frontier", "Nightmare", "Hamlet"]

Blood.secondaryLocations = ["Dream", "Clinic", "Ward", "Church", "Workshop", "Cathedral", "Altar", "Woods", "Lake", "Charnel", "Lane",
    "Village", "Castle", "Building", "Frontier", "Nightmare", "Hamlet"]

Blood.properNames = ["Iosefka", "Mensis"]

Blood.possessives = ["Hunter's"]
Blood.prefixes = ["Byrgen"]
Blood.positionals = ["Upper"]
Blood.adjectives = ["Central", "Old", "Healing Church", "Forbidden", "Moonside", "Abandoned", "Forsaken", "Lecture", "Nightmare", "Fishing"]

Blood.appendices = ["of Despair"]



// Sekiro: Shadows Die Twice
var Sekiro = {}

Sekiro.areas = ["Ashina Reservoir", "Dilapidated Temple", "Ashina Outskirts", "Hirata Estate", "Ashina Castle", "Abandoned Dungeon",
    "Senpou Temple, Mt. Kongo", "Sunken Valley", "Sunken Valley Passage", "Ashina Depths", "Mibu Village", "Fountainhead Palace"]


Sekiro.properLocations = ["Ashina", "Mibu", "Mt. Kongo"]

Sekiro.primaryLocations =  ["Reservoir", "Outskirts", "Estate", "Castle", "Dungeon", "Temple", "Valley", "Passage", "Depths", "Village", "Palace"]

Sekiro.secondaryLocations = ["Reservoir", "Outskirts", "Castle", "Dungeon", "Temple", "Valley", "Passage", "Depths", "Village", "Palace"]

Sekiro.properNames = ["Hirata"]

Sekiro.possessives = []
Sekiro.prefixes = []
Sekiro.positionals = []
Sekiro.adjectives = ["Dilapidated", "Abandoned", "Sunken", "Fountainhead", "Senpou"]

Sekiro.appendices = []



/// Generic

var Generic = {}
Generic.areas = []

Generic.properLocations = []
Generic.primaryLocations = []
Generic.secondaryLocations = []

Generic.properNames = []
Generic.possessives = []
Generic.prefixes = []
Generic.positionals = ["Upper", "Lower", "Inner", "Outer", "Northern", "Eastern", "Southern", "Western"]
Generic.adjectives = []

Generic.appendices = []