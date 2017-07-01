
var episodes = [
    "ANGEL ATTACK",
    "THE BEAST",
    "A transfer",
    "Hedgehog's Dilemma",
    "Rei I",
    "Rei II",
    "A HUMAN WORK",
    "ASUKA STRIKES!",
    "Both of You,|Dance Like You Want to Win!",
    "MAGMADIVER",
    "The Day Tokyo-3 Stood Still",
    "She said, \"Don't make other suffer|for your personal hatred.\"",
    "LILLIPUTIAN HITCHER",
    "WEAVING A STORY",
    "Those women longed for the touch of|other´s lips, and thus invited their kisses.",
    "Splitting of the Breast",
    "FOURTH CHILDREN",
    "AMBIVALENCE",
    "INTROJECTION",
    "WEAVING A STORY 2: oral stage",
    "He was aware that he was still a child.",
    "Don't Be.",
    "Rei III",
    "The Beginning and the End,|or \"Knockin´ on Heaven´s Door\"",
    "Do you love me?",
    "Take care of yourself."
]

var randomFactor = 0.00;

var sameCaps = (a, b) => b == b.toLowerCase() ? a.toLowerCase() : a.toUpperCase();
var chooseIndex = l => Math.floor(Math.random() * l.length);
var choose = l => l[chooseIndex(l)];
var chance = p => Math.random() > p;

var vowelFunc = (s, p) => s.replace(/[aeiou]/gi, c => chance(p) ? c : sameCaps(choose('aeiou'), c));
var consonantFunc = (s, p) => s.replace(/[bcdfgjklmnpqrstvwxz]/gi, c => chance(p) ? c : sameCaps(choose('bbbddnnmmlgh'), c));

var wordFunc = s => vowelFunc(consonantFunc(s, randomFactor), randomFactor *2/3);
var titleFunc = s => vowelFunc(consonantFunc(s, randomFactor/2), randomFactor/3);

function randomize(){
    // Select a random episode and put it
    var epNum = Math.floor(Math.random() * episodes.length);
    var episodeLabel = epNum == 25 ? "FINALE" : "EPISODE:" + (epNum + 1);
    var titles = episodes[epNum].split('|');
    $inputs.filter('[target=episode]').val(wordFunc(episodeLabel));
    $inputs.filter('[target=title-1]').val(titleFunc(titles[0]));
    $inputs.filter('[target=title-2]').val(titleFunc(titles[1] || " "));

    // Put some mildly whacky text
    $inputs.filter('[target=neon]').val(wordFunc('neon'));
    $inputs.filter('[target=genesis]').val(wordFunc('genesis'));
    $inputs.filter('[target=evangelion]').val(wordFunc('evangelion'));

    // Make things a bit more whacky each press
    if (randomFactor < 1)
        randomFactor += 0.01;
    $('#randomness').text(randomFactor.toFixed(2));

    // Trigger all input events to update the view
    $inputs.trigger('input');
}

$(document).ready( function() {
    $inputs = $('#inputs > li > input');
    // Set up input events
    $inputs.on('input', function(){ $('#' + $(this).attr("target")).text($(this).val() || " ") });

    // Put something random to start off
    randomize();
});