import fs from "node:fs";

const out = new URL(
  "../public/lottie/settle-ticket-drop.json",
  import.meta.url,
);
const duration = 150;

const hex = (value, alpha = 1) => {
  const raw = value.replace("#", "");
  return [
    Number.parseInt(raw.slice(0, 2), 16) / 255,
    Number.parseInt(raw.slice(2, 4), 16) / 255,
    Number.parseInt(raw.slice(4, 6), 16) / 255,
    alpha,
  ];
};

const prop = (value) => ({ a: 0, k: value });
const ease = { i: { x: [0.28], y: [1] }, o: { x: [0.18], y: [0] } };

const keyframes = (frames) => ({
  a: 1,
  k: frames.map((frame, index) => {
    const next = frames[index + 1];
    return next
      ? { t: frame.t, s: frame.v, e: next.v, ...ease }
      : { t: frame.t, s: frame.v };
  }),
});

const ks = ({
  p = [0, 0, 0],
  s = [100, 100, 100],
  r = 0,
  o = 100,
  a = [0, 0, 0],
} = {}) => ({
  o: Array.isArray(o) ? keyframes(o) : prop(o),
  r: Array.isArray(r) ? keyframes(r) : prop(r),
  a: prop(a),
  s: Array.isArray(s[0]) || typeof s[0] === "object" ? keyframes(s) : prop(s),
  p: Array.isArray(p[0]) || typeof p[0] === "object" ? keyframes(p) : prop(p),
});

const tr = ({ p = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) => ({
  ty: "tr",
  p: prop(p),
  a: prop([0, 0]),
  s: prop(s),
  r: prop(r),
  o: prop(o),
  sk: prop(0),
  sa: prop(0),
});

const fill = (color, opacity = 100) => ({
  ty: "fl",
  c: prop(color),
  o: prop(opacity),
  r: 1,
});

const stroke = (color, width, opacity = 100) => ({
  ty: "st",
  c: prop(color),
  o: prop(opacity),
  w: prop(width),
  lc: 2,
  lj: 2,
  ml: 4,
});

const rect = (name, size, radius, color, options = {}) => ({
  ty: "gr",
  nm: name,
  it: [
    { ty: "rc", p: prop([0, 0]), s: prop(size), r: prop(radius) },
    fill(color, options.opacity ?? 100),
    ...(options.border
      ? [stroke(options.border, options.borderWidth ?? 2)]
      : []),
    tr(options),
  ],
});

const ellipse = (name, size, color, options = {}) => ({
  ty: "gr",
  nm: name,
  it: [
    { ty: "el", p: prop([0, 0]), s: prop(size) },
    fill(color, options.opacity ?? 100),
    ...(options.border
      ? [stroke(options.border, options.borderWidth ?? 2)]
      : []),
    tr(options),
  ],
});

const line = (name, points, color, width, options = {}) => ({
  ty: "gr",
  nm: name,
  it: [
    {
      ty: "sh",
      ks: prop({
        i: points.map(() => [0, 0]),
        o: points.map(() => [0, 0]),
        v: points,
        c: false,
      }),
    },
    stroke(color, width, options.opacity ?? 100),
    tr(options),
  ],
});

const layer = (name, shapes, transform = {}) => ({
  ddd: 0,
  ty: 4,
  nm: name,
  ip: 0,
  op: duration,
  st: 0,
  bm: 0,
  ks: ks(transform),
  shapes,
});

const wonMark = (color) => [
  line(
    "won-left",
    [
      [-22, -16],
      [-8, 18],
    ],
    color,
    9,
  ),
  line(
    "won-right",
    [
      [22, -16],
      [8, 18],
    ],
    color,
    9,
  ),
  line(
    "won-top",
    [
      [-24, -2],
      [24, -2],
    ],
    color,
    8,
  ),
  line(
    "won-bottom",
    [
      [-22, 12],
      [22, 12],
    ],
    color,
    8,
  ),
];

const bowlingPin = [
  ellipse("pin-body", [38, 70], hex("#FFF7EA"), { p: [0, 18] }),
  rect("pin-neck", [22, 52], 11, hex("#FFF7EA"), { p: [0, -20] }),
  ellipse("pin-head", [31, 31], hex("#FFF7EA"), { p: [0, -54] }),
  rect("pin-red-top", [29, 8], 4, hex("#EF463C"), { p: [0, -31] }),
  rect("pin-red-bottom", [30, 8], 4, hex("#EF463C"), { p: [0, -20] }),
];

const ball = [
  ellipse("ball", [52, 52], hex("#2F7D6D")),
  ellipse("ball-highlight", [20, 12], hex("#75C8B8"), {
    p: [-13, -14],
    r: -24,
    opacity: 48,
  }),
  ellipse("hole-one", [8, 8], hex("#121110"), { p: [9, -13] }),
  ellipse("hole-two", [7, 7], hex("#121110"), { p: [20, -3] }),
  ellipse("hole-three", [6, 6], hex("#121110"), { p: [6, 2] }),
];

const baseball = [
  ellipse("baseball", [42, 42], hex("#FFF7EA")),
  line(
    "seam-one",
    [
      [-14, -12],
      [-19, 0],
      [-13, 13],
    ],
    hex("#EF463C"),
    4,
  ),
  line(
    "seam-two",
    [
      [14, -12],
      [19, 0],
      [13, 13],
    ],
    hex("#EF463C"),
    4,
  ),
];

const paddle = [
  ellipse("paddle-face", [46, 46], hex("#E84D3D")),
  rect("paddle-handle", [17, 42], 8, hex("#C79A64"), {
    p: [17, 30],
    r: -35,
  }),
  ellipse("paddle-ball", [14, 14], hex("#FEE500"), { p: [34, -26] }),
];

const layers = [
  layer("background", [
    rect("stage", [512, 512], 0, hex("#181716")),
    ellipse("spotlight", [360, 300], hex("#2A251F"), {
      p: [256, 260],
      opacity: 50,
    }),
  ]),
  layer(
    "main-shadow",
    [ellipse("shadow", [262, 52], hex("#000000"), { opacity: 28 })],
    {
      p: [256, 390, 0],
      s: [
        { t: 0, v: [96, 96, 100] },
        { t: 75, v: [106, 90, 100] },
        { t: 150, v: [96, 96, 100] },
      ],
    },
  ),
  layer(
    "settlement-card-back",
    [
      rect("card-depth", [286, 226], 34, hex("#D9D1C4"), {
        p: [0, 14],
        opacity: 100,
      }),
      rect("card", [292, 228], 34, hex("#F8F2E8")),
    ],
    {
      p: [
        { t: 0, v: [256, 306, 0] },
        { t: 42, v: [256, 284, 0] },
        { t: 90, v: [256, 296, 0] },
        { t: 150, v: [256, 306, 0] },
      ],
      r: [
        { t: 0, v: -2 },
        { t: 52, v: 1.5 },
        { t: 100, v: -1 },
        { t: 150, v: -2 },
      ],
      s: [
        { t: 0, v: [94, 94, 100] },
        { t: 42, v: [101, 101, 100] },
        { t: 90, v: [98, 98, 100] },
        { t: 150, v: [94, 94, 100] },
      ],
    },
  ),
  layer(
    "settlement-card-details",
    [
      rect("total-pill", [118, 48], 24, hex("#181716"), { p: [66, -76] }),
      rect("total-highlight", [70, 8], 4, hex("#FEE500"), {
        p: [64, -83],
      }),
      rect("total-amount", [52, 11], 6, hex("#FEE500"), { p: [66, -69] }),
      ellipse("won-badge", [58, 58], hex("#FEE500"), { p: [-93, -70] }),
      ...wonMark(hex("#181716")).map((shape) => ({
        ...shape,
        it: [...shape.it.slice(0, -1), tr({ p: [-93, -70], s: [54, 54] })],
      })),
      rect("title-line", [94, 12], 6, hex("#181716"), {
        p: [-22, -82],
        opacity: 90,
      }),
      rect("title-line-small", [52, 10], 5, hex("#B9B0A3"), {
        p: [10, -56],
      }),
      rect("row-one", [238, 42], 21, hex("#FFFFFF"), { p: [0, 6] }),
      ellipse("avatar-one", [28, 28], hex("#FEE500"), { p: [-98, 6] }),
      rect("name-one", [72, 9], 5, hex("#181716"), { p: [-38, 1] }),
      rect("stack-one", [34, 7], 4, hex("#B9B0A3"), { p: [-56, 14] }),
      rect("amount-one", [58, 18], 9, hex("#FEE500"), { p: [76, 6] }),
      rect("row-two", [238, 42], 21, hex("#FFFFFF"), { p: [0, 56] }),
      ellipse("avatar-two", [28, 28], hex("#2F7D6D"), { p: [-98, 56] }),
      rect("name-two", [88, 9], 5, hex("#181716"), { p: [-30, 51] }),
      rect("stack-two", [46, 7], 4, hex("#B9B0A3"), { p: [-50, 64] }),
      rect("amount-two", [50, 18], 9, hex("#F0E9DF"), { p: [80, 56] }),
      rect("row-three", [196, 13], 6, hex("#DED5C9"), {
        p: [-3, 99],
        opacity: 75,
      }),
      line(
        "send-arrow",
        [
          [80, -12],
          [104, -12],
          [94, -22],
        ],
        hex("#181716"),
        7,
        {
          opacity: 72,
        },
      ),
    ],
    {
      p: [
        { t: 0, v: [256, 306, 0] },
        { t: 42, v: [256, 284, 0] },
        { t: 90, v: [256, 296, 0] },
        { t: 150, v: [256, 306, 0] },
      ],
      r: [
        { t: 0, v: -2 },
        { t: 52, v: 1.5 },
        { t: 100, v: -1 },
        { t: 150, v: -2 },
      ],
      s: [
        { t: 0, v: [94, 94, 100] },
        { t: 42, v: [101, 101, 100] },
        { t: 90, v: [98, 98, 100] },
        { t: 150, v: [94, 94, 100] },
      ],
    },
  ),
  layer("bowling-ball", ball, {
    p: [
      { t: 0, v: [126, 330, 0] },
      { t: 70, v: [117, 314, 0] },
      { t: 150, v: [126, 330, 0] },
    ],
    r: [
      { t: 0, v: -10 },
      { t: 75, v: 18 },
      { t: 150, v: -10 },
    ],
  }),
  layer("bowling-pin", bowlingPin, {
    p: [
      { t: 0, v: [389, 320, 0] },
      { t: 70, v: [397, 301, 0] },
      { t: 150, v: [389, 320, 0] },
    ],
    r: [
      { t: 0, v: 10 },
      { t: 70, v: -7 },
      { t: 150, v: 10 },
    ],
    s: [88, 88, 100],
  }),
  layer("baseball", baseball, {
    p: [
      { t: 0, v: [134, 166, 0] },
      { t: 65, v: [154, 148, 0] },
      { t: 150, v: [134, 166, 0] },
    ],
    r: [
      { t: 0, v: -14 },
      { t: 75, v: 22 },
      { t: 150, v: -14 },
    ],
  }),
  layer("paddle", paddle, {
    p: [
      { t: 0, v: [373, 156, 0] },
      { t: 75, v: [390, 140, 0] },
      { t: 150, v: [373, 156, 0] },
    ],
    r: [
      { t: 0, v: -22 },
      { t: 75, v: 4 },
      { t: 150, v: -22 },
    ],
  }),
  layer("small-sparks", [
    ellipse("spark-yellow", [10, 10], hex("#FEE500"), { p: [408, 232] }),
    ellipse("spark-red", [8, 8], hex("#E84D3D"), { p: [107, 247] }),
    rect("mini-stack", [34, 14], 7, hex("#FEE500"), {
      p: [248, 132],
      r: -8,
      opacity: 76,
    }),
  ]),
];

const lottie = {
  v: "5.7.0",
  fr: 60,
  ip: 0,
  op: duration,
  w: 512,
  h: 512,
  nm: "Payloser Settlement Card Hero",
  ddd: 0,
  assets: [],
  slots: {
    bgColor: { p: prop(hex("#181716")) },
  },
  layers: layers.reverse(),
};

fs.writeFileSync(out, `${JSON.stringify(lottie, null, 2)}\n`);
console.log(`Wrote ${out.pathname}`);
