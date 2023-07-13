import { CanvasRenderingContext2D } from 'canvas';

CanvasRenderingContext2D.prototype.measureText = function(text: string) {
    return measureText(this, text);
};

CanvasRenderingContext2D.prototype.fillText = function(text: string, x: number, y: number) {
    fillText(this, text, x, y)
};

function fillText(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
    text = singleLineText(text);

    const pixelSize = getPixelSize(context);
    const metrics = measureText(context, text);

    let cx = x + metrics.actualBoundingBoxLeft + pixelSize / 2;
    const cy = y - metrics.fontBoundingBoxAscent;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const pixels = MOCK_FONT[char] ?? MOCK_FONT.undefined;

        for (let j = 0; j < pixels.length; j++) {
            const line = pixels[j];
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '#') {
                    context.fillRect(cx + i * pixelSize, cy + j * pixelSize, pixelSize, pixelSize);
                }
            }
        }

        cx += (pixels[0].length + 1) * pixelSize;
    }
}

function measureText(context: CanvasRenderingContext2D, text: string): TextMetrics {
    text = singleLineText(text);

    const { textAlign, textBaseline } = context;
    const pixelSize = getPixelSize(context);

    let width = 0;
    let ascent = 0;
    let descent = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const pixels = MOCK_FONT[char] ?? MOCK_FONT.undefined;

        const charAscent = MOCK_ASCENT - Math.max(0, pixels.findIndex((line) => line.includes('#')));
        const charDescent = pixels.length - MOCK_ASCENT;
        if (charAscent > ascent) ascent = charAscent;
        if (charDescent > descent) descent = charDescent;

        const charWidth = (pixels[0].length + 1) * pixelSize;
        width += charWidth;
    }

    const actualBoundingBoxLeft = textAlign === 'right' || textAlign === 'end' ? -width : textAlign === 'center' ? -width / 2 : 0;
    const actualBoundingBoxRight = textAlign === 'right' || textAlign === 'end' ? 0 : textAlign === 'center' ? width / 2 : width;

    const fontBoundingBoxAscent = (textBaseline === 'top' || textBaseline === 'hanging' ? 0 : textBaseline === 'bottom' || textBaseline === 'ideographic' ? MOCK_FONT_SIZE : textBaseline === 'middle' ? MOCK_FONT_SIZE / 2 : MOCK_ASCENT) * pixelSize;
    const fontBoundingBoxDescent = (textBaseline === 'top' || textBaseline === 'hanging' ? MOCK_FONT_SIZE : textBaseline === 'bottom' || textBaseline === 'ideographic' ? 0 : textBaseline === 'middle' ? MOCK_FONT_SIZE / 2 : MOCK_DESCENT) * pixelSize;
    const actualBoundingBoxAscent = fontBoundingBoxAscent - (MOCK_ASCENT - ascent) * pixelSize;
    const actualBoundingBoxDescent = fontBoundingBoxDescent - (MOCK_DESCENT - descent) * pixelSize;

    const alphabeticBaseline = fontBoundingBoxAscent - MOCK_ASCENT * pixelSize;

    return {
        actualBoundingBoxAscent,
        actualBoundingBoxDescent,
        actualBoundingBoxLeft,
        actualBoundingBoxRight,
        alphabeticBaseline,
        fontBoundingBoxAscent,
        fontBoundingBoxDescent,
        emHeightAscent: fontBoundingBoxAscent,
        emHeightDescent: fontBoundingBoxDescent,
        width,
    } as any;
}

function getFontSize(context: CanvasRenderingContext2D) {
    return parseFloat(context.font);
}

function getPixelSize(context: CanvasRenderingContext2D) {
    return getFontSize(context) / MOCK_FONT_SIZE;
}

function singleLineText(text: string) {
    return text.replace(/\s/g, ' ');
}

const MOCK_ASCENT = 7;
const MOCK_DESCENT = 2;
const MOCK_FONT_SIZE = MOCK_ASCENT + MOCK_DESCENT;

const MOCK_FONT: Record<string, string[]> = {
    undefined: [
        ' ### ',
        '#   #',
        '   # ',
        '  #  ',
        '  #  ',
        '     ',
        '  #  ',
    ],
    0: [
        ' ## ',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
        ' ## ',
    ],
    1: [
        '  #',
        ' ##',
        '# #',
        '  #',
        '  #',
        '  #',
        '  #',
    ],
    2: [
        ' ### ',
        '#   #',
        '   # ',
        '  #  ',
        ' #   ',
        '#    ',
        '#####',
    ],
    3: [
        ' ### ',
        '#   #',
        '    #',
        '  ## ',
        '    #',
        '#   #',
        ' ### ',
    ],
    4: [
        '    #',
        '   ##',
        '  # #',
        ' #  #',
        '#####',
        '    #',
        '    #',
    ],
    5: [
        '#####',
        '#    ',
        '#    ',
        '#### ',
        '    #',
        '#   #',
        ' ### ',
    ],
    6: [
        ' ### ',
        '#   #',
        '#    ',
        '#### ',
        '#   #',
        '#   #',
        ' ### ',
    ],
    7: [
        '#####',
        '    #',
        '   # ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
    ],
    8: [
        ' ### ',
        '#   #',
        '#   #',
        ' ### ',
        '#   #',
        '#   #',
        ' ### ',
    ],
    9: [
        ' ### ',
        '#   #',
        '#   #',
        ' ####',
        '    #',
        '    #',
        ' ### ',
    ],
    A: [
        '  #  ',
        ' # # ',
        '#   #',
        '#   #',
        '#####',
        '#   #',
        '#   #',
    ],
    B: [
        '#### ',
        '#   #',
        '#   #',
        '#### ',
        '#   #',
        '#   #',
        '#### ',
    ],
    C: [
        ' ### ',
        '#   #',
        '#    ',
        '#    ',
        '#    ',
        '#   #',
        ' ### ',
    ],
    D: [
        '###  ',
        '#  # ',
        '#   #',
        '#   #',
        '#   #',
        '#  # ',
        '###  ',
    ],
    E: [
        '#####',
        '#    ',
        '#    ',
        '#### ',
        '#    ',
        '#    ',
        '#####',
    ],
    F: [
        '#####',
        '#    ',
        '#    ',
        '#### ',
        '#    ',
        '#    ',
        '#    ',
    ],
    G: [
        ' ### ',
        '#   #',
        '#    ',
        '# ###',
        '#   #',
        '#   #',
        ' ### ',
    ],
    H: [
        '#   #',
        '#   #',
        '#   #',
        '#####',
        '#   #',
        '#   #',
        '#   #',
    ],
    I: [
        '###',
        ' # ',
        ' # ',
        ' # ',
        ' # ',
        ' # ',
        '###',
    ],
    J: [
        '####',
        '   #',
        '   #',
        '   #',
        '   #',
        '#  #',
        ' ## ',
    ],
    K: [
        '#   #',
        '#   #',
        '#  # ',
        '###  ',
        '#  # ',
        '#   #',
        '#   #',
    ],
    L: [
        '#   ',
        '#   ',
        '#   ',
        '#   ',
        '#   ',
        '#   ',
        '####',
    ],
    M: [
        '#     #',
        '##   ##',
        '# # # #',
        '#  #  #',
        '#     #',
        '#     #',
        '#     #',
    ],
    N: [
        '#   #',
        '##  #',
        '# # #',
        '#  ##',
        '#   #',
        '#   #',
        '#   #',
    ],
    O: [
        ' ### ',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        ' ### ',
    ],
    P: [
        '#### ',
        '#   #',
        '#   #',
        '#### ',
        '#   ',
        '#   ',
        '#   ',
    ],
    Q: [
        ' ### ',
        '#   #',
        '#   #',
        '#   #',
        '# # #',
        '#  ##',
        ' ####',
    ],
    R: [
        '#### ',
        '#   #',
        '#   #',
        '#### ',
        '#  # ',
        '#   #',
        '#   #',
    ],
    S: [
        ' ### ',
        '#   #',
        '#    ',
        ' ### ',
        '    #',
        '#   #',
        ' ### ',
    ],
    T: [
        '#####',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
    ],
    U: [
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        ' ### ',
    ],
    V: [
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        ' # # ',
        '  #  ',
    ],
    W: [
        '#  #  #',
        '#  #  #',
        '#  #  #',
        '#  #  #',
        '#  #  #',
        '#  #  #',
        ' ## ## ',
    ],
    X: [
        '#   #',
        '#   #',
        ' # #',
        '  #  ',
        ' # # ',
        '#   #',
        '#   #',
    ],
    Y: [
        '#   #',
        '#   #',
        '#   #',
        ' # # ',
        '  #  ',
        '  #  ',
        '  #  ',
    ],
    Z: [
        '#####',
        '    #',
        '   # ',
        '  #  ',
        ' #   ',
        '#    ',
        '#####',
    ],
    a: [
        '    ',
        '    ',
        ' ## ',
        '   #',
        ' ###',
        '#  #',
        ' ###',
    ],
    b: [
        '#   ',
        '#   ',
        '### ',
        '#  #',
        '#  #',
        '#  #',
        '### ',
    ],
    c: [
        '   ',
        '   ',
        ' ##',
        '#  ',
        '#  ',
        '#  ',
        ' ##',
    ],
    d: [
        '   #',
        '   #',
        ' ###',
        '#  #',
        '#  #',
        '#  #',
        ' ###',
    ],
    e: [
        '    ',
        '    ',
        ' ## ',
        '#  #',
        '####',
        '#   ',
        ' ## ',
    ],
    f: [
        '  ##',
        ' #  ',
        '####',
        ' #  ',
        ' #  ',
        ' #  ',
        ' #  ',
    ],
    g: [
        '    ',
        '    ',
        ' ###',
        '#  #',
        '#  #',
        '#  #',
        ' ###',
        '   #',
        ' ## ',
    ],
    h: [
        '#   ',
        '#   ',
        '### ',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
    ],
    i: [
        '#',
        ' ',
        '#',
        '#',
        '#',
        '#',
        '#',
    ],
    j: [
        ' #',
        '  ',
        ' #',
        ' #',
        ' #',
        ' #',
        ' #',
        ' #',
        '#',
    ],
    k: [
        '#   ',
        '#   ',
        '#  #',
        '#  #',
        '### ',
        '#  #',
        '#  #',
    ],
    l: [
        '#',
        '#',
        '#',
        '#',
        '#',
        '#',
        '#',
    ],
    m: [
        '     ',
        '     ',
        '#### ',
        '# # #',
        '# # #',
        '# # #',
        '# # #',
    ],
    n: [
        '    ',
        '    ',
        '### ',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
    ],
    o: [
        '    ',
        '    ',
        ' ## ',
        '#  #',
        '#  #',
        '#  #',
        ' ## ',
    ],
    p: [
        '    ',
        '    ',
        '### ',
        '#  #',
        '#  #',
        '#  #',
        '### ',
        '#   ',
        '#   ',
    ],
    q: [
        '    ',
        '    ',
        ' ###',
        '#  #',
        '#  #',
        '#  #',
        ' ###',
        '   #',
        '   #',
    ],
    r: [
        '   ',
        '   ',
        '###',
        '#  ',
        '#  ',
        '#  ',
        '#  ',
    ],
    s: [
        '    ',
        '    ',
        ' ###',
        '#   ',
        ' ## ',
        '   #',
        '### ',
    ],
    t: [
        ' #  ',
        ' #  ',
        '####',
        ' #  ',
        ' #  ',
        ' #  ',
        '  ##',
    ],
    u: [
        '    ',
        '    ',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
        ' ###',
    ],
    v: [
        '    ',
        '    ',
        '#  #',
        '#  #',
        ' # #',
        '  ##',
        '   #',
    ],
    w: [
        '     ',
        '     ',
        '# # #',
        '# # #',
        '# # #',
        '# # #',
        ' # # ',
    ],
    x: [
        '    ',
        '    ',
        '#  #',
        '#  #',
        ' ## ',
        '#  #',
        '#  #',
    ],
    y: [
        '    ',
        '    ',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
        ' ###',
        '   #',
        ' ## ',
    ],
    z: [
        '    ',
        '    ',
        '####',
        '   #',
        ' ## ',
        '#   ',
        '####',
    ],
    ' ': [
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
    ],
    _: [
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
        '####',
    ],
    '.': [
        ' ',
        ' ',
        ' ',
        ' ',
        ' ',
        ' ',
        '#',
    ],
    ',': [
        '  ',
        '  ',
        '  ',
        '  ',
        '  ',
        '  ',
        ' #',
        '#',
    ],
    ':': [
        ' ',
        ' ',
        '#',
        ' ',
        ' ',
        ' ',
        '#',
    ],
    ';': [
        '  ',
        '  ',
        ' #',
        '  ',
        '  ',
        '  ',
        ' #',
        '#',
    ],
    '-': [
        '   ',
        '   ',
        '   ',
        '###',
        '   ',
        '   ',
        '   ',
    ],
    '+': [
        '     ',
        '     ',
        '  #  ',
        '  #  ',
        '#####',
        '  #  ',
        '  #  ',
    ],
    '=': [
        '    ',
        '    ',
        '####',
        '    ',
        '####',
        '    ',
    ],
    '!': [
        '#',
        '#',
        '#',
        '#',
        '#',
        ' ',
        '#',
    ],
    '?': [
        ' ### ',
        '#   #',
        '   # ',
        '  #  ',
        '  #  ',
        '     ',
        '  #  ',
    ],
    '\u2026': [
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
        '# # #',
    ],
};
