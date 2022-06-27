
// Artisanal enum-type things

const MacroType = {
    nounVerbed: 'nounVerbed', areaName: 'areaName', youDied: 'youDied', special: 'special'
}
const macroTypeName = {
    nounVerbed: 'Noun Verbed',
    areaName: 'Area Name',
    youDied: 'Death',
    special: 'Non-FromSoft',
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
 * @prop {keyof MacroType} type
 * @prop {keyof Game} game
 * @prop {string} preset
 * 
 * @prop {'all caps' | 'title case'} preferCase
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
    type: MacroType.nounVerbed,
    game: Game.des,
    preset: 'THE DEMON WAS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0.007, scale: 1 
        },
        font: {
            fontSize: 93, fontFamily: 'adobe-garamond-pro',
            vScale: 1.45, charSpacing: 8,
            fontWeight: 400, textColor: [210, 181, 86]
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
    type: MacroType.nounVerbed,
    game: Game.des,
    preset: 'TARGET WAS DESTROYED',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0.007, scale: 1 
        },
        font: {
            fontSize: 109, fontFamily: 'adobe-garamond-pro',
            vScale: 1.45, charSpacing: 8,
            fontWeight: 400, textColor: [252, 140, 66]
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

//// DARK SOULS 2

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

//// DARK SOULS 3

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

layerTypes.push({
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
        }
    },
    draw: drawNounVerbed
})

//// BLOODBORNE

layerTypes.push({
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
        }
    },
    draw: drawGlowyText
})

layerTypes.push({
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
        }
    },
    draw: drawGlowyText
})

//// SEKIRO

layerTypes.push({
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
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'Default',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro, adobe-garamond-pro',
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
        }
    },
    draw: drawEldenNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'LOST GRACE DISCOVERED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro, adobe-garamond-pro',
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
        }
    },
    draw: drawEldenNounVerbed
})

layerTypes.push({
    type: MacroType.nounVerbed,
    game: Game.er,
    preset: 'HOST VANQUISHED',

    preferCase: 'all caps',
    sliders: {
        position: {
            xOffset: 0, yOffset: 0, scale: 1
        },
        font: {
            fontSize: 88, fontFamily: 'Agmena Pro, adobe-garamond-pro',
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
        }
    },
    draw: drawEldenNounVerbed
})

//////// YOU DIED

layerTypes.push({
    type: MacroType.youDied,
    game: Game.des,
    preset: 'YOU DIED (human form)',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0.007, scale: 1 
        },
        font: {
            fontSize: 109, fontFamily: 'adobe-garamond-pro',
            vScale: 1.45, charSpacing: 8,
            fontWeight: 400, textColor: [123, 20, 20]
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
    type: MacroType.youDied,
    game: Game.des,
    preset: 'YOU DIED (phantom form)',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0.007, scale: 1 
        },
        font: {
            fontSize: 109, fontFamily: 'adobe-garamond-pro',
            vScale: 1.45, charSpacing: 8,
            fontWeight: 400, textColor: [123, 20, 20]
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
        }
    },
    draw: drawYouDied
})

layerTypes.push({
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
        }
    },
    draw: drawYouDied
})

layerTypes.push({
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
        }
    },

    draw: drawYouDied
})

layerTypes.push({
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
        }
    },
    draw: drawGlowyText
})

layerTypes.push({
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
        }
    },

    draw: drawYouDied
})

//////// Area Name

layerTypes.push({
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
    type: MacroType.areaName,
    game: Game.bb,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0.389, yOffset: 0.373, scale: 1 
        },
        font: {
            fontFamily: 'Spectral', textColor: [202, 203, 202],
            fontSize: 42, fontWeight: 300,
            vScale: 1.058, charSpacing: 0,
        },
        backImage: {
            opacity: .8
        }
    },
    // TODO: this needs a back image ofc
    draw: drawBloodborneAreaName
})

layerTypes.push({
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
        area: {
            ulLength: 0, ulWidth: 4, ulPos: 10,  contrast: 1
        }
    },
    // TODO: this needs a back image ofc
    draw: drawAreaName
})

layerTypes.push({
    type: MacroType.areaName,
    game: Game.er,
    preset: 'Area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0.023, scale: 1 
        },
        font: {
            fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [255, 255, 255],
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
    type: MacroType.areaName,
    game: Game.er,
    preset: 'Sub-area Name',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: -.002, yOffset: -.086, scale: 1 
        },
        font: {
            fontFamily: 'Agmena Pro, adobe-garamond-pro', textColor: [255, 255, 255],
            fontSize: 51, fontWeight: 300,
            vScale: 1, charSpacing: 0,
        },
        erFrame: {
            opacity: .4, frameWidth: .55, frameHeight: .065
        }
    },
    draw: drawEldenAreaName
})

//////// Special

layerTypes.push({
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Super Smash Bros. Melee',

    preferCase: 'title case',
    sliders: {
        position: { },
        font: {
            fontFamily: 'Arial Black', textColor: [100, 60, 230],
            fontSize: 120, fontWeight: 900,
            vScale: 1.2, charSpacing: 0,
        },
        melee: {
            lineWidth: 10, shadowOpacity: .5
        }
    },
    draw: drawMelee
})

layerTypes.push({
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Snapchat',

    preferCase: 'title case',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0, scale: 1 
        },
        font: {
            fontFamily: 'Helvetica, Arial, sans-serif', textColor: [255, 255, 255],
            fontSize: 60, fontWeight: 400,
            vScale: 1, charSpacing: 0,
        },
        shadow: {
            shadowSize: .4, shadowOpacity: .5,
            shadowOffset: 0, shadowSoftness: 0,
        }
    },
    draw: drawYouDied
})

layerTypes.push({
    type: MacroType.special,
    game: Game.ds1,
    preset: 'Image macro',

    preferCase: 'all caps',
    sliders: {
        position: { 
            xOffset: 0, yOffset: 0, scale: 1 
        },
        font: {
            fontFamily: 'Impact, "Arial Black"', textColor: [255, 255, 255],
            fontSize: 140, fontWeight: 500,
            vScale: 1, charSpacing: 0,
        },
        outline: {
            lineWidth: 20, lineColor: [0, 0, 0]
        }
    },
    draw: drawOutlined
})




/** 
 * Object containing all types of drawable layers, indexed by type > game > preset
 * @type { {[type in keyof MacroType] : {[type in keyof Game]: {[preset: string]: DrawableLayer }? }} } } 
 */
const layerTypesMap = {}

for( const type in MacroType ) for( const game in Game )
    layerTypesMap[type] = {[game]: null}
for( const layer of layerTypes ) {
    layerTypesMap[layer.type][layer.game] ??= {}
    layerTypesMap[layer.type][layer.game][layer.preset] = layer
}

// Hack: Put the desired "default macro type" somewhere...

let randomDefault

while( true ) {
    randomDefault = layerTypes[ Math.floor(Math.random()*layerTypes.length) ]
    if( randomDefault.preset !== 'Snapchat' && randomDefault.preset !== 'Image Macro' ) break
}

window.MACROGEN_DEFAULTS = {
    macroType: randomDefault.type,
    game: randomDefault.game,
    preset: randomDefault.preset,
}