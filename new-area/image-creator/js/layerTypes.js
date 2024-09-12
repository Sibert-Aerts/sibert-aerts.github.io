
// Artisanal enum-type things

const MacroType = {
    nounVerbed: 'nounVerbed',
    youDied: 'youDied',
    areaName: 'areaName',
    boss: 'boss',
    itemPickupBox: 'itemPickupBox',
    interactBox: 'interactBox',
    poison: 'poison',

    special: 'special'
}
const macroTypeName = {
    nounVerbed: '🏆 Noun Verbed',
    youDied: '💀 Death',
    areaName: '📍 Area name',
    boss: '👹 Boss health bar',
    itemPickupBox: '🎁 Item pickup',
    interactBox: '📋 Interact box',
    poison: '🩸 Poison bar',

    special: '✨ Non-FromSoft',
}

const Game = {
    des: 'des', ds1: 'ds1', ds2: 'ds2', ds3: 'ds3', bb: 'bb', se: 'se', er: 'er',
}
const gameName = {
    des: "Demon's Souls",
    ds1: 'Dark Souls',
    ds2: 'Dark Souls II',
    ds3: 'Dark Souls III',
    bb:  'Bloodborne',
    se:  'Sekiro',
    er:  'Elden Ring',
}

/**
 * @typedef {Object} DrawableLayer
 *
 * @prop {string} id
 * @prop {keyof MacroType} type
 * @prop {keyof Game} game
 * @prop {string} preset
 * @prop {bool} preventAsRandomDefault
 *
 * @prop {'all caps' | 'title case' | undefined} preferCase
 * @prop {object} sliders
 *
 * @prop {drawFun} draw()
 */

/** @type {DrawableLayer[]} */
const layerTypes = []

/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// DEFINE EACH LAYERTYPE ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

//////// NOUN VERBED

//// DEMON'S SOULS

layerTypes.push({
    id: 'des:demon-destroyed',
    type: MacroType.nounVerbed,
    game: Game.des,
    preset: 'THE DEMON WAS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.007, scale: 1
        },
        font: {
            fontSize: 100, fontFamily: 'Cormorant Garamond',
            vScale: 1.38, charSpacing: 6,
            fontWeight: 500, textColor: [210, 181, 86]
        },
        subCaption: {
            subCaption: 'You shall obtain the Demon Soul... and a power\nthat is beyond human imagination.'
        },
        shadow: {
            shadowSize: 1.14, shadowOpacity: .7,
            shadowOffset: .028, shadowSoftness: .95,
        }
    },
    draw: drawDeSNounVerbed
})

layerTypes.push({
    id: 'des:regained',
    type: MacroType.nounVerbed,
    game: Game.des,
    preset: 'YOU REGAINED LOST SOUL',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.007, scale: 1
        },
        font: {
            fontSize: 110, fontFamily: 'Cormorant Garamond',
            vScale: 1.40, charSpacing: 6,
            fontWeight: 600, textColor: [61, 102, 118]
        },
        subCaption: {
            subCaption: 'You\'ve touched the mark of death itself.\nBring more souls, slayer of demons.'
        },
        shadow: {
            shadowSize: 1.14, shadowOpacity: .7,
            shadowOffset: .028, shadowSoftness: .95,
        }
    },
    draw: drawDeSNounVerbed
})

layerTypes.push({
    id: 'des:revived',
    type: MacroType.nounVerbed,
    game: Game.des,
    preset: 'YOU REVIVED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.007, scale: 1
        },
        font: {
            fontSize: 117, fontFamily: 'Cormorant Garamond',
            vScale: 1.40, charSpacing: 6,
            fontWeight: 600, textColor: [61, 119, 81]
        },
        subCaption: {
            subCaption: 'You have regained your body.\nBring more souls, slayer of demons.'
        },
        shadow: {
            shadowSize: 1.14, shadowOpacity: .7,
            shadowOffset: .028, shadowSoftness: .95,
        }
    },
    draw: drawDeSNounVerbed
})

layerTypes.push({
    id: 'des:target-destroyed',
    type: MacroType.nounVerbed,
    game: Game.des,
    preset: 'TARGET WAS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.007, scale: 1
        },
        font: {
            fontSize: 115, fontFamily: 'Cormorant Garamond',
            vScale: 1.38, charSpacing: 6,
            fontWeight: 500, textColor: [252, 140, 66]
        },
        subCaption: {
            subCaption: 'You\'ve taken a human\'s Soul.\nWhat a superb demon!'
        },
        shadow: {
            shadowSize: 1.14, shadowOpacity: .7,
            shadowOffset: .028, shadowSoftness: .95,
        }
    },
    draw: drawDeSNounVerbed
})

//// DARK SOULS 1

layerTypes.push({
    id: 'ds1:victory',
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'VICTORY ACHIEVED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .002, yOffset: 0.032, scale: 1
        },
        font: {
            fontSize: 92, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 8,
            fontWeight: 400, textColor: [255, 255, 107]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 178, 153],
            blurSize: 1.1, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.002, shadowSoftness: 1,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds1:humanity',
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'HUMANITY RESTORED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.001, yOffset: 0.038, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 0,
            fontWeight: 400, textColor: [129, 187, 153]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [187, 201, 192],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.006, shadowSoftness: 1,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds1:bonfire',
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: 0.037, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 1,
            fontWeight: 400, textColor: [255, 228, 92]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [251, 149, 131],
            blurSize: 1.14, blurOpacity: 0.1,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.004, shadowSoftness: 1,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds1:retrieval',
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'RETRIEVAL',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: 0.037, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 6,
            fontWeight: 400, textColor: [161, 217, 226]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [154, 158, 167],
            blurSize: 1.16, blurOpacity: 0.1,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.004, shadowSoftness: 1,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds1:target-destroyed',
    type: MacroType.nounVerbed,
    game: Game.ds1,
    preset: 'TARGET DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: 0.037, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 5,
            fontWeight: 400, textColor: [250, 201, 91]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [231, 133, 115],
            blurSize: 1.1, blurOpacity: 0.1,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .7,
            shadowOffset: -.004, shadowSoftness: 1,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

//// DARK SOULS 2

layerTypes.push({
    id: 'ds2:great-soul',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'GREAT SOUL EMBRACED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.007, yOffset: 0.216, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 0,
            fontWeight: 400, textColor: [255, 248, 85],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 163, 77],
            blurSize: 1.05, blurOpacity: 0.06,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds2:bonfire',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.003, yOffset: 0.217, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 1,
            fontWeight: 400, textColor: [255, 177, 68]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 198, 168],
            blurSize: 1.07, blurOpacity: 0.02,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds2:primal-bonfire',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'PRIMAL BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.005, yOffset: 0.219, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 214, 67]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 172, 128],
            blurSize: 1.05, blurOpacity: 0.07,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds2:humanity',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'HUMANITY RESTORED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.009, yOffset: 0.217, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 1,
            fontWeight: 400, textColor: [169, 254, 236]
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [102, 255, 166],
            blurSize: 1.07, blurOpacity: 0.05,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds2:retrieval',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'RETRIEVAL',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.005, yOffset: 0.220, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 5,
            fontWeight: 400, textColor: [169, 240, 254],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [159, 213, 254],
            blurSize: 1.16, blurOpacity: 0.05,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds2:target-destroyed',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'TARGET WAS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.004, yOffset: 0.225, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 5,
            fontWeight: 400, textColor: [255, 210, 87],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [254, 132, 118],
            blurSize: 1.12, blurOpacity: 0.05,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds2:invader-banished',
    type: MacroType.nounVerbed,
    game: Game.ds2,
    preset: 'INVADER BANISHED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.013, yOffset: 0.221, scale: 1
        },
        font: {
            fontSize: 104, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 255, 98],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 176, 102],
            blurSize: 1.08, blurOpacity: 0.12,
        },
        shadow: {
            shadowSize: 1.4, shadowOpacity: .9,
            shadowOffset: -.004, shadowSoftness: 1.2,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

//// DARK SOULS 3

layerTypes.push({
    id: 'ds3:heir-of-fire',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'HEIR OF FIRE DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.317, charSpacing: 1,
            fontWeight: 400, textColor: [255, 255, 100],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [240, 190, 254],
            blurSize: 1.18, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds3:lord-of-cinder',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'LORD OF CINDER FALLEN',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.002, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 3,
            fontWeight: 400, textColor: [255, 75, 12],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [206, 202, 211],
            blurSize: 1.19, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds3:ember',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'EMBER RESTORED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.001, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 3,
            fontWeight: 400, textColor: [251, 82, 19],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [206, 202, 211],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds3:hollowing',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'HOLLOWING REVERSED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -0.001, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 7,
            fontWeight: 600, textColor: [207, 254, 255],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [176, 203, 216],
            blurSize: 1.2, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds3:bonfire',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'BONFIRE LIT',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 206, 86],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [227, 166, 146],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .72,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds3:host-of-embers-destroyed',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'HOST OF EMBERS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.001, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 107, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 2,
            fontWeight: 400, textColor: [255, 187, 92],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [255, 184, 184],
            blurSize: 1.20, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

layerTypes.push({
    id: 'ds3:dark-spirit-destroyed',
    type: MacroType.nounVerbed,
    game: Game.ds3,
    preset: 'DARK SPIRIT DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.012, scale: 1
        },
        font: {
            fontSize: 102, fontFamily: 'adobe-garamond-pro',
            vScale: 1.5, charSpacing: 3,
            fontWeight: 400, textColor: [254, 252, 150],
        },
        zoomBlur: {
            textOpacity: 0.9, blurTint: [254, 227, 190],
            blurSize: 1.16, blurOpacity: 0.08,
        },
        shadow: {
            shadowSize: 0.8, shadowOpacity: .66,
            shadowOffset: -.008, shadowSoftness: 1.24,
        },
        gradient: {},
    },
    draw: drawNounVerbed
})

//// BLOODBORNE

layerTypes.push({
    id: 'bb:prey',
    type: MacroType.nounVerbed,
    game: Game.bb,
    preset: 'PREY SLAUGHTERED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: -.258, scale: 1
        },
        font: {
            fontSize: 139, fontFamily: 'Kozuka Mincho Pro, Yu Mincho, Georgia',
            vScale: 0.922, charSpacing: 6,
            fontWeight: 500, textColor: [144, 208, 166]
        },
        glowy: {
            textOpacity: .5, glowColor: [144, 208, 166],
            glowSize: 17, glowOpacity: 1.1,
        },
        gradient: {},
    },
    draw: drawGlowyText
})

layerTypes.push({
    id: 'bb:nightmare',
    type: MacroType.nounVerbed,
    game: Game.bb,
    preset: 'NIGHTMARE SLAIN',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.003, yOffset: -.265, scale: 1
        },
        font: {
            fontSize: 115, fontFamily: 'Kozuka Mincho Pro, Yu Mincho, Georgia',
            vScale: 1.12, charSpacing: 2,
            fontWeight: 500, textColor: [255, 51, 0]
        },
        glowy: {
            textOpacity: .26, glowColor: [156, 45, 17],
            glowSize: 12, glowOpacity: 1,
        },
        gradient: {},
    },
    draw: drawGlowyText
})

//// SEKIRO

layerTypes.push({
    id: 'se:shinobi-execution',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'SHINOBI EXECUTION',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .001, yOffset: -.097, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 12,
            fontWeight: 400, textColor: [255, 255, 255]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '忍殺', symbolSize: 154,
            symbolPos: 76, symbolSpace: 34,
        },
        glowy: {
            textOpacity: .8, glowColor: [255, 255, 255],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:immortality-severed',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'IMMORTALITY SEVERED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .001, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [255, 255, 255]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '不死斬り', symbolSize: 114,
            symbolPos: 96, symbolSpace: 21,
        },
        glowy: {
            textOpacity: .9, glowColor: [255, 255, 255],
            glowSize: 23, glowOpacity: 0.5,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:idol',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'SCULPTOR\'S IDOL FOUND',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: .016, scale: 1
        },
        font: {
            fontSize: 35, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [253, 237, 182]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '鬼仏見出', symbolSize: 114,
            symbolPos: 70, symbolSpace: 28,
        },
        glowy: {
            textOpacity: .7, glowColor: [253, 237, 182],
            glowSize: 31, glowOpacity: 0.8,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:unseen-aid',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'UNSEEN AID',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .001, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [160, 200, 254]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '冥助あり', symbolSize: 114,
            symbolPos: 104, symbolSpace: 21,
        },
        glowy: {
            textOpacity: .9, glowColor: [160, 200, 254],
            glowSize: 23, glowOpacity: 0.5,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:dragonrot-healed',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'DRAGONROT HEALED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .001, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [222, 186, 184]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '竜咳快復', symbolSize: 114,
            symbolPos: 88, symbolSpace: 21,
        },
        glowy: {
            textOpacity: 1, glowColor: [222, 186, 184],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:gift-of-tears',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'GRACIOUS GIFT OF TEARS',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .002, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 13,
            fontWeight: 400, textColor: [251, 220, 218]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '拝涙', symbolSize: 152,
            symbolPos: -18, symbolSpace: 34,
        },
        glowy: {
            textOpacity: .9, glowColor: [251, 220, 218],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:sinister-burden',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'SINISTER BURDEN',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 12,
            fontWeight: 400, textColor: [109, 0, 31]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '厄憑', symbolSize: 154,
            symbolPos: -14, symbolSpace: 34,
        },
        glowy: {
            textOpacity: .9, glowColor: [109, 0, 31],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:burden-dispelled',
    type: MacroType.nounVerbed,
    game: Game.se,
    preset: 'BURDEN DISPELLED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: -.006, scale: 1
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 12,
            fontWeight: 400, textColor: [255, 255, 255]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '厄払', symbolSize: 154,
            symbolPos: -14, symbolSpace: 34,
        },
        glowy: {
            textOpacity: .8, glowColor: [255, 255, 255],
            glowSize: 30, glowOpacity: 0.4,
        }
    },
    draw: drawSekiroText
})

//// ELDEN RING

layerTypes.push({
    id: 'er:victory',
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'Victory',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro',
            vScale: 1, charSpacing: 0,
            fontWeight: 300, textColor: [220, 175, 45]
        },
        zoomBlur: {
            textOpacity: 1, blurTint: [255, 208, 66],
            blurSize: 1.11, blurOpacity: 0.18,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        },
        gradient: {},
    },
    draw: drawEldenNounVerbed
})

layerTypes.push({
    id: 'er:lost-grace',
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'LOST GRACE DISCOVERED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro',
            vScale: 1, charSpacing: 0,
            fontWeight: 300, textColor: [220, 135, 56]
        },
        zoomBlur: {
            textOpacity: 1, blurTint: [237, 140, 29],
            blurSize: 1.11, blurOpacity: 0.18,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        },
        gradient: {},
    },
    draw: drawEldenNounVerbed
})

layerTypes.push({
    id: 'er:host-vanquished',
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'HOST VANQUISHED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro',
            vScale: 1, charSpacing: 0,
            fontWeight: 300, textColor: [230, 140, 65]
        },
        zoomBlur: {
            textOpacity: 1, blurTint: [230, 140, 65],
            blurSize: 1.11, blurOpacity: 0.18,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        },
        gradient: {},
    },
    draw: drawEldenNounVerbed
})

//////// YOU DIED

layerTypes.push({
    id: 'des:died-human',
    type: MacroType.youDied,
    game: Game.des,
    preset: 'YOU DIED (human form)',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.007, scale: 1
        },
        font: {
            fontSize: 115, fontFamily: 'Cormorant Garamond',
            vScale: 1.38, charSpacing: 8,
            fontWeight: 600, textColor: [123, 20, 20]
        },
        subCaption: {
            subCaption: 'However, the Nexus traps you. You shall remain\nin this world as a Soul, forever.'
        },
        shadow: {
            shadowSize: 1.14, shadowOpacity: 1,
            shadowOffset: .028, shadowSoftness: .95,
        }
    },
    draw: drawDeSNounVerbed
})

layerTypes.push({
    id: 'des:died-soul',
    type: MacroType.youDied,
    game: Game.des,
    preset: 'YOU DIED (phantom form)',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.007, scale: 1
        },
        font: {
            fontSize: 115, fontFamily: 'Cormorant Garamond',
            vScale: 1.38, charSpacing: 8,
            fontWeight: 600, textColor: [123, 20, 20]
        },
        subCaption: {
            subCaption: 'Phantom, you were not able to achieve your goal.\nYou must leave this world.'
        },
        shadow: {
            shadowSize: 1.14, shadowOpacity: 1,
            shadowOffset: .028, shadowSoftness: .95,
        }
    },
    draw: drawDeSNounVerbed
})

layerTypes.push({
    id: 'ds1:died',
    type: MacroType.youDied,
    game: Game.ds1,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .003, yOffset: .036, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [100, 10, 10],
            fontSize: 148, fontWeight: 400,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: 1, shadowOpacity: .6,
            shadowOffset: -0.015, shadowSoftness: 1,
        },
        gradient: {},
    },
    draw: drawYouDied
})

layerTypes.push({
    id: 'ds2:died',
    type: MacroType.youDied,
    game: Game.ds2,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.005, yOffset: .229, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [100, 16, 16],
            fontSize: 148, fontWeight: 400,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: 1.26, shadowOpacity: .9,
            shadowOffset: -.006, shadowSoftness: 1.16,
        },
        gradient: {},
    },
    draw: drawYouDied
})

layerTypes.push({
    id: 'ds3:died',
    type: MacroType.youDied,
    game: Game.ds3,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: .004, yOffset: .018, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [100, 10, 10],
            fontSize: 150, fontWeight: 400,
            vScale: 1.3, charSpacing: 0,
        },
        shadow: {
            shadowSize: .66, shadowOpacity: .6,
            shadowOffset: -0.015, shadowSoftness: 1.24,
        },
        gradient: {},
    },

    draw: drawYouDied
})

layerTypes.push({
    id: 'bb:died',
    type: MacroType.youDied,
    game: Game.bb,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: -.265, scale: 1
        },
        font: {
            fontSize: 139, fontFamily: 'Kozuka Mincho Pro, Yu Mincho, Georgia',
            vScale: 0.922, charSpacing: 6,
            fontWeight: 500, textColor: [255, 0, 0]
        },
        glowy: {
            textOpacity: .3, glowColor: [149, 24, 24],
            glowSize: 22, glowOpacity: 1.2,
        },
        gradient: {},
    },
    draw: drawGlowyText
})

layerTypes.push({
    id: 'se:death',
    type: MacroType.youDied,
    game: Game.se,
    preset: 'DEATH',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: -.065
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 23,
            fontWeight: 400, textColor: [183, 48, 44]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '死', symbolSize: 345,
            symbolPos: 0, symbolSpace: 0
        },
        glowy: {
            textOpacity: .5, glowColor: [168, 41, 41],
            glowSize: 30, glowOpacity: 1,
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'se:death-fake',
    type: MacroType.youDied,
    game: Game.se,
    preset: 'DEATH (fake)',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: -.065
        },
        font: {
            fontSize: 37, fontFamily: 'adobe-garamond-pro',
            vScale: 1, charSpacing: 23,
            fontWeight: 400, textColor: [109, 104, 101]
        },
        sekiro: {
            symbolFont: 'hot-gfkaishokk, MS Gothic, Meiryo',
            symbol: '死', symbolSize: 345,
            symbolPos: 0, symbolSpace: 0
        },
        glowy: {
            textOpacity: .9, glowColor: [0, 0, 0],
            glowSize: 30, glowOpacity: 0.9,
            blendMode: 'source-over', secretFactor: 3
        }
    },
    draw: drawSekiroText
})

layerTypes.push({
    id: 'er:death',
    type: MacroType.youDied,
    game: Game.er,
    preset: 'YOU DIED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [130, 16, 29],
            fontSize: 88, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        shadow: {
            shadowSize: .7, shadowOpacity: .65,
            shadowOffset: -0.006, shadowSoftness: 1.05,
        },
        gradient: {},
    },

    draw: drawYouDied
})

//////// Area Name

layerTypes.push({
    id: 'ds1:area',
    type: MacroType.areaName,
    game: Game.ds1,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: .001, yOffset: .006, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [227, 226, 224],
            fontSize: 105, fontWeight: 400,
            vScale: 1, charSpacing: -3,
        },
        area: {
            ulLength: .31, ulWidth: 4, ulPos: 4, contrast: 0
        }
    },
    draw: drawAreaName
})

layerTypes.push({
    id: 'ds2:area',
    type: MacroType.areaName,
    game: Game.ds2,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: -.007, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [200, 200, 200],
            fontSize: 89, fontWeight: 400,
            vScale: 1, charSpacing: 2,
        },
        outline: {
            lineWidth: 4, lineColor: [0, 0, 0]
        },
        area: {
            ulLength: .3, ulWidth: 4, ulPos: 19, contrast: 2
        }
    },
    draw: drawDS2AreaName
})

layerTypes.push({
    id: 'ds3:area',
    type: MacroType.areaName,
    game: Game.ds3,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: 0.008, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [248, 248, 248],
            fontSize: 96, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        area: {
            ulLength: .33, ulWidth: 6, ulPos: 5, contrast: 1
        }
    },
    draw: drawAreaName
})

layerTypes.push({
    id: 'bb:area-safe',
    type: MacroType.areaName,
    game: Game.bb,
    preset: 'Safe',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0.398, yOffset: 0.386, scale: 1
        },
        font: {
            fontFamily: 'Spectral', textColor: [202, 203, 202],
            fontSize: 42, fontWeight: 300,
            vScale: 1.058, charSpacing: 0,
        },
        bbArea: {
            blotOpacity: 1, mode: 'transparency'
        }
    },
    draw: drawBloodborneAreaName
})

layerTypes.push({
    id: 'bb:area-faithful',
    type: MacroType.areaName,
    game: Game.bb,
    preset: 'Faithful (use with background)',

    preferCase: 'title case',
    sliders: {
        position: layerTypes.at(-1).sliders.position,
        font: layerTypes.at(-1).sliders.font,
        bbArea: {
            blotOpacity: .3, mode: 'blend'
        }
    },
    draw: drawBloodborneAreaName
})

layerTypes.push({
    id: 'se:area',
    type: MacroType.areaName,
    game: Game.se,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0.001, yOffset: -0.013, scale: 1
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [202, 204, 203],
            fontSize: 85, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        sekiroFrame: {}
    },
    draw: drawSekiroAreaName
})

layerTypes.push({
    id: 'er:area',
    type: MacroType.areaName,
    game: Game.er,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0.023, scale: 1
        },
        font: {
            fontFamily: 'Agmena Pro', textColor: [255, 255, 255],
            fontSize: 90, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        erFrame: {
            opacity: .4, frameWidth: .8, frameHeight: .1
        }
    },
    draw: drawEldenAreaName
})

layerTypes.push({
    id: 'er:sub-area',
    type: MacroType.areaName,
    game: Game.er,
    preset: 'Sub-area Name',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: -.002, yOffset: -.086, scale: 1
        },
        font: {
            fontFamily: 'Agmena Pro', textColor: [255, 255, 255],
            fontSize: 51, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        erFrame: {
            opacity: .4, frameWidth: .55, frameHeight: .065
        }
    },
    draw: drawEldenAreaName
})

//////// Boss

layerTypes.push({
    id: 'ds1:boss-wide',
    type: MacroType.boss,
    game: Game.ds1,
    preset: 'Wide',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: .320
        },
        font: {
            fontFamily: 'Georgia', textColor: [227, 226, 224],
            fontSize: 41, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        boss: {}
    },
    draw: drawDS1Boss
})

layerTypes.push({
    id: 'ds1:boss-faithful',
    type: MacroType.boss,
    game: Game.ds1,
    preset: 'Faithful',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: .068, yOffset: .318, scale: .75
        },
        font: layerTypes.at(-1).sliders.font,
        boss: {}
    },
    draw: drawDS1Boss
})

layerTypes.push({
    id: 'ds2:boss-wide',
    type: MacroType.boss,
    game: Game.ds2,
    preset: 'Wide',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: .358, scale: 2
        },
        font: {
            fontFamily: 'Georgia', textColor: [185, 185, 185],
            fontSize: 19, fontWeight: 400,
            vScale: 1, charSpacing: 1,
        },
        boss: {}
    },
    draw: drawDS2Boss
})

layerTypes.push({
    id: 'ds2:boss-faithful',
    type: MacroType.boss,
    game: Game.ds2,
    preset: 'Faithful',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0.049, yOffset: .358, scale: 1.5
        },
        font: layerTypes.at(-1).sliders.font,
        boss: {}
    },
    draw: drawDS2Boss
})

layerTypes.push({
    id: 'ds3:boss-wide',
    type: MacroType.boss,
    game: Game.ds3,
    preset: 'Wide',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: .343, scale: 1.5
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [194, 194, 192],
            fontSize: 29, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        boss: {}
    },
    draw: drawDS3Boss
})

layerTypes.push({
    id: 'ds3:boss-faithful',
    type: MacroType.boss,
    game: Game.ds3,
    preset: 'Faithful',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0.052, yOffset: .343
        },
        font: layerTypes.at(-1).sliders.font,
        boss: {}
    },
    draw: drawDS3Boss
})

layerTypes.push({
    id: 'se:boss-big',
    type: MacroType.boss,
    game: Game.se,
    preset: 'Big',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: -.45, yOffset: -.4, scale: 1.5
        },
        font: {
            fontFamily: 'Georgia', textColor: [190, 190, 197],
            fontSize: 28, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        sekiroBoss: {}
    },
    draw: drawSekiroBoss
})

layerTypes.push({
    id: 'se:boss-faithful',
    type: MacroType.boss,
    game: Game.se,
    preset: 'Faithful',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: -.45, yOffset: -.426
        },
        font: layerTypes.at(-1).sliders.font,
        sekiroBoss: {}
    },
    draw: drawSekiroBoss
})

layerTypes.push({
    id: 'bb:boss',
    type: MacroType.boss,
    game: Game.bb,
    preset: 'Boss',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: .001, yOffset: .363
        },
        font: {
            fontFamily: 'Spectral', textColor: [192, 192, 189],
            fontSize: 28, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        boss: {}
    },
    draw: drawBloodborneBoss
})

layerTypes.push({
    id: 'er:boss-wide',
    type: MacroType.boss,
    game: Game.er,
    preset: 'Wide',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0, yOffset: .308, scale: 1.4
        },
        font: {
            fontFamily: 'Agmena Pro', textColor: [185, 190, 185],
            fontSize: 24, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        boss: {}
    },
    draw: drawEldenRingBoss
})

layerTypes.push({
    id: 'er:boss-faithful',
    type: MacroType.boss,
    game: Game.er,
    preset: 'Faithful',

    preferCase: 'title case',
    sliders: {
        position: {
            xOffset: 0.002, yOffset: .308
        },
        font: layerTypes.at(-1).sliders.font,
        boss: {}
    },
    draw: drawEldenRingBoss
})

//////// Poison

layerTypes.push({
    id: 'ds1:poison-big',
    type: MacroType.poison,
    game: Game.ds1,
    preset: 'Big',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.082, yOffset: .237, scale: 1.5
        },
        // font: {
        //     fontFamily: 'Georgia', textColor: [255, 0, 0],
        //     fontSize: 40, fontWeight: 400,
        //     vScale: 1, charSpacing: 0,
        // },
        ds1Poison: {}
    },
    draw: drawDS1Poison
})

layerTypes.push({
    id: 'ds1:poison-faithful',
    type: MacroType.poison,
    game: Game.ds1,
    preset: 'Faithful',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.053, yOffset: .142
        },
        ds1Poison: {}
    },
    draw: drawDS1Poison
})

layerTypes.push({
    id: 'er:poison-big',
    type: MacroType.poison,
    game: Game.er,
    preset: 'Big (WIP)',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.115, yOffset: .23, scale: 1.5
        },
        // font: {
        //     fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [249, 233, 233],
        //     fontSize: 40, fontWeight: 400,
        //     vScale: 1, charSpacing: 0,
        // },
        erPoison: {}
    },
    draw: drawERPoison
})

layerTypes.push({
    id: 'er:poison-faithful',
    type: MacroType.poison,
    game: Game.er,
    preset: 'Faithful (WIP)',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: -.077, yOffset: .164, scale: 1
        },
        erPoison: {}
    },
    draw: drawERPoison
})


//////// Interact Box

layerTypes.push({
    id: 'ds1:interact-yn',
    type: MacroType.interactBox,
    game: Game.ds1,
    preset: 'Yes / No',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0.345
        },
        font: {
            fontFamily: 'Georgia', textColor: [242, 242, 242],
            fontSize: 39, fontWeight: 400,
            vScale: 1, charSpacing: 2,
        },
        interactBox: { option1: 'YES', option2: 'NO' }
    },
    draw: drawDS1InteractBox
})

layerTypes.push({
    id: 'ds1:interact-ok',
    type: MacroType.interactBox,
    game: Game.ds1,
    preset: 'OK',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0.345
        },
        font: layerTypes.at(-1).sliders.font,
        interactBox: { option1: 'OK', option2: '' }
    },
    draw: drawDS1InteractBox
})

layerTypes.push({
    id: 'ds2:interact-yn',
    type: MacroType.interactBox,
    game: Game.ds2,
    preset: 'Yes / No',

    sliders: {
        position: {
            xOffset: 0.005, yOffset: 0.02
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [200, 200, 200],
            fontSize: 29, fontWeight: 400,
            vScale: 1, charSpacing: 2,
        },
        interactBox: { option1: 'YES', option2: 'NO' }
    },
    draw: drawDS2InteractBox
})

layerTypes.push({
    id: 'ds2:interact-ok',
    type: MacroType.interactBox,
    game: Game.ds2,
    preset: 'OK',

    sliders: {
        position: {
            xOffset: 0.005, yOffset: 0.02
        },
        font: layerTypes.at(-1).sliders.font,
        interactBox: { option1: 'OK', option2: '' }
    },
    draw: drawDS2InteractBox
})


//////// Item Pickup Box

layerTypes.push({
    id: 'ds1:pickup',
    type: MacroType.itemPickupBox,
    game: Game.ds1,
    preset: 'Item pickup',
    preferCase: 'title case',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0.21,
        },
        font: {
            fontFamily: 'Georgia', textColor: [242, 242, 242],
            fontSize: 39, fontWeight: 400,
            vScale: 1, charSpacing: 2,
        },
        itemPickupDS1DS3: {},
        itemPickupImage: {
            imageSize: 160,
            image: {'select': '/ds1/items/annex key.png'},
        }
    },
    draw: drawDS1ItemPickupBox
})

layerTypes.push({
    id: 'ds3:pickup',
    type: MacroType.itemPickupBox,
    game: Game.ds3,
    preset: 'Item pickup',
    preferCase: 'title case',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0.28,
        },
        font: {
            fontFamily: 'adobe-garamond-pro', textColor: [194, 194, 192],
            fontSize: 29, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        itemPickupDS1DS3: {},
        itemPickupImage: {
            imageSize: 90,
            image: {'select': '/ds3/items/estus flask.png'},
        }
    },
    draw: drawDS3ItemPickupBox
})

layerTypes.push({
    id: 'er:pickup',
    type: MacroType.itemPickupBox,
    game: Game.er,
    preset: 'Item pickup',
    preferCase: 'title case',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0.192,
        },
        font: {
            fontFamily: 'Agmena Pro', textColor: [185, 190, 185],
            fontSize: 24, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        itemPickupER: {},
        itemPickupImage: {
            imageSize: 160,
            image: {'select': '/eldenRing/items/red flask.png'},
        }
    },
    draw: drawERItemPickupBox
})


//////// Special

layerTypes.push({
    id: 'sp:ssbm',
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Super Smash Bros. Melee',

    preferCase: 'title case',
    sliders: {
        position: {},
        font: {
            fontFamily: 'Arial Black', fontFamilyFallback: 'Noto Sans JP', textColor: [100, 60, 230],
            fontSize: 120, fontWeight: 900,
            vScale: 1.2, charSpacing: 0,
        },
        melee: {
            lineWidth: 10, shadowOpacity: .5
        },
        gradient: {},
    },
    draw: drawMelee
})

layerTypes.push({
    id: 'sp:lethal-loot',
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Lethal Company Loot',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontFamily: '_3270 Regular', fontFamilyFallback: 'Noto Sans JP', textColor: [80, 255, 0],
            fontSize: 40, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        lethalCompany: {},
    },
    draw: drawLethalCompanyLoot,
})

layerTypes.push({
    id: 'sp:lethal-enemy',
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Lethal Company Enemy',

    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontFamily: '_3270 Regular', fontFamilyFallback: 'Noto Sans JP', textColor: [0, 0, 0],
            fontSize: 40, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        lethalCompany: {
            subCaption: ' ', tint: [255, 0, 0],
            circleRadius: 0.5, hiddenTint: [255, 255, 255],
        },
    },
    draw: drawLethalCompanyLoot,
})

layerTypes.push({
    id: 'sp:snapchat',
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Snapchat',
    preventAsRandomDefault: true,

    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontFamily: 'Helvetica, Arial, sans-serif', fontFamilyFallback: 'Noto Sans JP', textColor: [255, 255, 255],
            fontSize: 60, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        shadow: {
            shadowSize: .4, shadowOpacity: .5,
            shadowOffset: 0, shadowSoftness: 0,
        },
        gradient: {},
    },
    draw: drawYouDied
})

layerTypes.push({
    id: 'sp:impact',
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Impact macro',
    preventAsRandomDefault: true,

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontFamily: 'Impact, "Arial Black"', fontFamilyFallback: 'Noto Sans JP', textColor: [255, 255, 255],
            fontSize: 140, fontWeight: 500,
            vScale: 1, charSpacing: 0,
        },
        outline: {
            lineWidth: 20, lineColor: [0, 0, 0]
        },
        gradient: {},
    },
    draw: drawOutlined
})

layerTypes.push({
    id: 'sp:image',
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Just an image',
    preventAsRandomDefault: true,

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        simpleImage: {},
    },
    draw: drawImage
})


//// Populate objects storing the different layers.

/**
 * Object containing all types of drawable layers, indexed by type > game > preset
 * @type { {[type in keyof MacroType] : {[type in keyof Game]: {[preset: string]: DrawableLayer }? }} }
 */
const layerTypesMap = {}

/**
 * Object containing all types of drawable layers, indexed by id
 * @type { {[id: string] : DrawableLayer }
 */
const layerIdMap = {}

for (const type in MacroType) for (const game in Game)
    layerTypesMap[type] = { [game]: null }
for (const layer of layerTypes) {
    if (!layerTypesMap[layer.type][layer.game])
        layerTypesMap[layer.type][layer.game] = {}
    layerTypesMap[layer.type][layer.game][layer.preset] = layer
    layerIdMap[layer.id] = layer
}
