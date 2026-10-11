P = "media/projects/level-up/"
PURPLE, YELLOW, BLACK, WHITE = '#4a1fe0', '#ffe600', '#050505', '#ffffff'
T = 1/3
# logo colourways (cells of the logo sheet), cut fast
full(P + 'image-12.webp',   1,  17, (0, 0, .5, T), 1.0, 1.05)
full(P + 'image-12.webp',  17,  27, (.5, 0, 1, T), 1.05, 1.05)
full(P + 'image-12.webp',  27,  37, (0, T, .5, 2*T), 1.05, 1.05)
full(P + 'image-12.webp',  37,  51, (.5, T, 1, 2*T), 1.05, 1.10)
words(['GEAR UP', 'FOR VICTORY'], 51, 89, YELLOW, PURPLE)
full(P + 'image-1.webp',   89, 127, (.02, .12, .98, .92), 1.0, 1.08)
# icon colourways, three frames each, twice round
for k in range(8):
    c = k % 4
    full(P + 'image-12.webp', 127 + k*3, 130 + k*3, (c*.25, 2*T, c*.25 + .25, 1), 1.0, 1.0)
full(P + 'image-2.webp',  151, 189, (.1, .15, .9, .8), 1.08, 1.0)
words(['WHERE CHAMPIONS', 'GO SHOPPING.'], 189, 227, BLACK, YELLOW)
split(P + 'image-5.webp', P + 'image-6.webp', 227, 263, (.2, .08, .8, .98), (.15, .05, .85, .95))
scroll(P + 'image-3.webp', 263, 301, (.18, .0, .82, 1.0))
words(['RISE TO THE', 'CHALLENGE'], 301, 339, WHITE, BLACK)
full(P + 'image-12.webp', 339, 361, (0, 0, .5, T), 1.0, 1.0)
TOTAL = 360
