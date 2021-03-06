// Gets a random integer inclusively between the given two numbers, doesn't matter which is larger
randInt = (a, b=0) => Math.floor(Math.random()*(Math.abs(a-b)+1)) + Math.min(a,b)

// Choose a random element
choose = indexable => indexable[Math.floor(Math.random()*indexable.length)]

// Chance p out of o to return true
chance = (p,o=1) => Math.random()*o < p;

// Remove and return a random element
popRandom = arr => arr.splice(randInt(arr.length-1), 1)[0]

// Sleep
sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// Format a number as a percentage
percentFormat = num => num*100 + '%'

// A function x → y : ℝ → [0, ymax[ that produces a triangle wave, like so:
//
//    y↑
//     |
// ymax|    /\         /\        /\        /\
//     |   /  \       /  \      /  \      /  \
//     |  /    \     /    \    /    \    /    \
//     | /      \   /      \  /      \  /
//     |/        \ /        \/        \/
//     ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾ x
// Useful for making something bounce back and forth between two things without
// having to worry about any kind of state or "collission" logic.
bounceMod = (x, ymax) => Math.abs(Math.floor((x%(2*(ymax=ymax-1)))/ymax)*ymax-(x%ymax))

// Returns whether or not x is in [xmin, xmax]
bounded = (x, xmin, xmax) => x >= xmin && x <= xmax