export type HalloweenCobwebCoverage = 'quarter' | 'half' | 'three-quarter' | 'full';
export type HalloweenCobwebAnchor = 'top-left' | 'top-right' | 'left-side' | 'right-side' | 'center';

export type HalloweenCobwebLayerItem = {
  id: string;
  anchor: HalloweenCobwebAnchor;
  coverage: HalloweenCobwebCoverage;
  topRatio: number;
  leftRatio: number;
  width: number;
  height: number;
  opacity: number;
  rotateDeg: number;
  driftX: number;
  driftY: number;
};

export type HalloweenFilamentAnchor =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'free';

export type HalloweenFilamentItem = {
  id: string;
  anchor: HalloweenFilamentAnchor;
  leftRatio: number;
  topRatio: number;
  insetX: number;
  insetY: number;
  width: number;
  height: number;
  opacity: number;
  rotateDeg: number;
  curve: number;
  directionBias: number;
  tension: number;
  forkBias: number;
  mirror: boolean;
  swayX: number;
  swayY: number;
};

export type HalloweenCobwebGeometry = {
  viewBox: string;
  radialLines: string[];
  ringLines: string[];
  hangingThread?: string;
  spider?: {
    bodyCx: number;
    bodyCy: number;
    bodyRx: number;
    bodyRy: number;
    headCx: number;
    headCy: number;
    headR: number;
    legsPath: string;
  };
};

type PolarCoordinate = {
  x: number;
  y: number;
};

type CobwebSeedRule = {
  anchor: HalloweenCobwebAnchor;
  coverage: HalloweenCobwebCoverage;
  topRatioRange: [number, number];
  leftRatioRange: [number, number];
  widthRatioRange: [number, number];
  aspectRatioRange: [number, number];
  opacityRange: [number, number];
  rotateRange: [number, number];
  driftXRange: [number, number];
  driftYRange: [number, number];
};

const VIEWPORT_BREAKPOINTS = {
  compact: 768,
  medium: 1280,
} as const;

const PAGE_COBWEB_RULES: Record<'compact' | 'medium' | 'wide', CobwebSeedRule[]> = {
  compact: [
    {
      anchor: 'top-left',
      coverage: 'quarter',
      topRatioRange: [0.09, 0.13],
      leftRatioRange: [-0.02, 0.01],
      widthRatioRange: [0.34, 0.42],
      aspectRatioRange: [0.94, 1.04],
      opacityRange: [0.22, 0.28],
      rotateRange: [-7, -2],
      driftXRange: [-4, 6],
      driftYRange: [-2, 4],
    },
    {
      anchor: 'top-right',
      coverage: 'half',
      topRatioRange: [0.18, 0.25],
      leftRatioRange: [0.65, 0.73],
      widthRatioRange: [0.26, 0.34],
      aspectRatioRange: [0.82, 0.92],
      opacityRange: [0.18, 0.24],
      rotateRange: [4, 9],
      driftXRange: [-6, 4],
      driftYRange: [-2, 4],
    },
    {
      anchor: 'left-side',
      coverage: 'three-quarter',
      topRatioRange: [0.56, 0.68],
      leftRatioRange: [-0.03, 0.0],
      widthRatioRange: [0.2, 0.28],
      aspectRatioRange: [1.1, 1.28],
      opacityRange: [0.15, 0.21],
      rotateRange: [-10, -4],
      driftXRange: [-3, 4],
      driftYRange: [-4, 5],
    },
  ],
  medium: [
    {
      anchor: 'top-left',
      coverage: 'quarter',
      topRatioRange: [0.06, 0.1],
      leftRatioRange: [-0.01, 0.02],
      widthRatioRange: [0.22, 0.28],
      aspectRatioRange: [0.9, 1.02],
      opacityRange: [0.22, 0.29],
      rotateRange: [-8, -3],
      driftXRange: [-5, 7],
      driftYRange: [-3, 4],
    },
    {
      anchor: 'top-right',
      coverage: 'half',
      topRatioRange: [0.14, 0.2],
      leftRatioRange: [0.74, 0.8],
      widthRatioRange: [0.18, 0.24],
      aspectRatioRange: [0.84, 0.96],
      opacityRange: [0.18, 0.25],
      rotateRange: [5, 10],
      driftXRange: [-7, 4],
      driftYRange: [-3, 5],
    },
    {
      anchor: 'right-side',
      coverage: 'three-quarter',
      topRatioRange: [0.32, 0.42],
      leftRatioRange: [0.82, 0.88],
      widthRatioRange: [0.14, 0.18],
      aspectRatioRange: [1.08, 1.24],
      opacityRange: [0.15, 0.22],
      rotateRange: [4, 8],
      driftXRange: [-5, 3],
      driftYRange: [-4, 5],
    },
    {
      anchor: 'left-side',
      coverage: 'half',
      topRatioRange: [0.58, 0.68],
      leftRatioRange: [-0.02, 0.02],
      widthRatioRange: [0.14, 0.18],
      aspectRatioRange: [1.08, 1.24],
      opacityRange: [0.14, 0.19],
      rotateRange: [-9, -4],
      driftXRange: [-3, 5],
      driftYRange: [-5, 4],
    },
  ],
  wide: [
    {
      anchor: 'top-left',
      coverage: 'quarter',
      topRatioRange: [0.05, 0.08],
      leftRatioRange: [-0.01, 0.02],
      widthRatioRange: [0.16, 0.21],
      aspectRatioRange: [0.9, 1.02],
      opacityRange: [0.22, 0.3],
      rotateRange: [-8, -4],
      driftXRange: [-6, 8],
      driftYRange: [-3, 4],
    },
    {
      anchor: 'top-right',
      coverage: 'half',
      topRatioRange: [0.12, 0.18],
      leftRatioRange: [0.8, 0.86],
      widthRatioRange: [0.14, 0.18],
      aspectRatioRange: [0.84, 0.96],
      opacityRange: [0.18, 0.26],
      rotateRange: [6, 10],
      driftXRange: [-8, 5],
      driftYRange: [-3, 4],
    },
    {
      anchor: 'right-side',
      coverage: 'three-quarter',
      topRatioRange: [0.3, 0.38],
      leftRatioRange: [0.87, 0.91],
      widthRatioRange: [0.11, 0.15],
      aspectRatioRange: [1.08, 1.22],
      opacityRange: [0.15, 0.22],
      rotateRange: [4, 9],
      driftXRange: [-5, 2],
      driftYRange: [-4, 5],
    },
    {
      anchor: 'left-side',
      coverage: 'half',
      topRatioRange: [0.56, 0.64],
      leftRatioRange: [-0.01, 0.02],
      widthRatioRange: [0.1, 0.14],
      aspectRatioRange: [1.08, 1.24],
      opacityRange: [0.14, 0.19],
      rotateRange: [-10, -5],
      driftXRange: [-2, 6],
      driftYRange: [-5, 4],
    },
    {
      anchor: 'center',
      coverage: 'full',
      topRatioRange: [0.74, 0.8],
      leftRatioRange: [0.72, 0.8],
      widthRatioRange: [0.08, 0.11],
      aspectRatioRange: [1, 1],
      opacityRange: [0.08, 0.12],
      rotateRange: [-4, 4],
      driftXRange: [-3, 3],
      driftYRange: [-3, 3],
    },
  ],
};

function lerp(range: [number, number], factor: number) {
  return range[0] + (range[1] - range[0]) * factor;
}

function createNoise(index: number, salt: number) {
  const raw = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function polarPoint(radius: number, angleDeg: number, center = 110) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function describeFilament(points: PolarCoordinate[]) {
  if (points.length < 2) return '';

  const [start, ...rest] = points;
  let path = `M ${start.x} ${start.y}`;

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index];
    const previous = index === 0 ? start : rest[index - 1];
    const midX = (previous.x + current.x) / 2;
    const midY = (previous.y + current.y) / 2;
    path += ` Q ${previous.x} ${previous.y} ${midX} ${midY}`;
  }

  const end = rest[rest.length - 1];
  if (end) {
    path += ` T ${end.x} ${end.y}`;
  }

  return path;
}

function buildAngles(coverage: HalloweenCobwebCoverage) {
  if (coverage === 'quarter') return [0, 10, 22, 36, 52, 68, 82, 90];
  if (coverage === 'half') return [0, 10, 22, 34, 48, 64, 80, 98, 116, 134, 150, 166, 180];
  if (coverage === 'three-quarter') return [0, 10, 22, 34, 48, 64, 80, 98, 116, 134, 150, 166, 182, 198, 214, 230, 248, 260, 270];
  return [0, 24, 52, 84, 116, 148, 180, 212, 244, 276, 308, 336];
}

function buildRingRadii(coverage: HalloweenCobwebCoverage) {
  if (coverage === 'quarter') return [18, 34, 50, 68, 86, 104];
  if (coverage === 'half') return [18, 32, 46, 60, 74, 88, 102];
  if (coverage === 'three-quarter') return [16, 28, 42, 56, 70, 84, 98, 112];
  return [18, 34, 52, 70, 88, 106];
}

function describeRing(coverage: HalloweenCobwebCoverage, radius: number, ringIndex: number) {
  if (coverage === 'full') {
    const points = buildAngles(coverage).map((angle, angleIndex) => {
      const offsetRadius = radius + (createNoise(ringIndex + angleIndex, radius * 0.12) * 12 - 6);
      return polarPoint(offsetRadius, angle);
    });
    return describeFilament(points);
  }

  const points = buildAngles(coverage).map((angle, angleIndex) => {
    const offsetRadius = radius + (createNoise(ringIndex + angleIndex, radius * 0.18) * 10 - 5);
    return polarPoint(offsetRadius, angle, 0);
  });
  return describeFilament(points);
}

export function buildHalloweenCobwebGeometry(coverage: HalloweenCobwebCoverage): HalloweenCobwebGeometry {
  const radialLines = buildAngles(coverage).map((angle, index) => {
    if (coverage === 'full') {
      const start = polarPoint(0, angle);
      const bend = polarPoint(48 + createNoise(index, angle * 0.4) * 12, angle + (createNoise(index + 1, angle * 0.6) * 12 - 6));
      const end = polarPoint(108, angle + (createNoise(index + 2, angle * 0.8) * 8 - 4));
      return `M ${start.x} ${start.y} Q ${bend.x} ${bend.y} ${end.x} ${end.y}`;
    }

    const bend = polarPoint(88 + createNoise(index, angle * 0.4) * 12, angle + (createNoise(index + 1, angle * 0.5) * 10 - 5), 0);
    const end = polarPoint(178, angle + (createNoise(index + 2, angle * 0.7) * 8 - 4), 0);
    return `M 0 0 Q ${bend.x} ${bend.y} ${end.x} ${end.y}`;
  });

  const ringLines = buildRingRadii(coverage).map((radius, index) => describeRing(coverage, radius, index));

  if (coverage !== 'half') {
    return {
      viewBox: '0 0 220 220',
      radialLines,
      ringLines,
    };
  }

  return {
    viewBox: '0 0 220 220',
    radialLines,
    ringLines,
    hangingThread: 'M 110 96 C 112 120 114 138 116 154',
    spider: {
      bodyCx: 116,
      bodyCy: 171,
      bodyRx: 6.4,
      bodyRy: 8,
      headCx: 116,
      headCy: 160,
      headR: 4.1,
      legsPath: 'M109 163 L102 158 M109 167 L101 167 M110 172 L103 177 M123 163 L130 158 M123 167 L131 167 M122 172 L129 177',
    },
  };
}

export function buildHalloweenCobwebLayer(viewportWidth: number): HalloweenCobwebLayerItem[] {
  const tier = viewportWidth < VIEWPORT_BREAKPOINTS.compact ? 'compact' : viewportWidth < VIEWPORT_BREAKPOINTS.medium ? 'medium' : 'wide';

  return PAGE_COBWEB_RULES[tier].map((rule, index) => {
    const topFactor = createNoise(index, viewportWidth * 0.001);
    const leftFactor = createNoise(index + 3, viewportWidth * 0.002);
    const visualFactor = createNoise(index + 7, viewportWidth * 0.003);
    const sizeFactor = createNoise(index + 11, viewportWidth * 0.004);
    const motionFactor = createNoise(index + 15, viewportWidth * 0.005);
    const width = Math.round(viewportWidth * lerp(rule.widthRatioRange, sizeFactor));
    const height = Math.round(width * lerp(rule.aspectRatioRange, sizeFactor));

    return {
      id: `${rule.anchor}-${rule.coverage}-${index}`,
      anchor: rule.anchor,
      coverage: rule.coverage,
      topRatio: lerp(rule.topRatioRange, topFactor),
      leftRatio: lerp(rule.leftRatioRange, leftFactor),
      width,
      height,
      opacity: lerp(rule.opacityRange, visualFactor),
      rotateDeg: lerp(rule.rotateRange, visualFactor),
      driftX: lerp(rule.driftXRange, motionFactor),
      driftY: lerp(rule.driftYRange, leftFactor),
    };
  });
}

export function buildHalloweenFilamentLayer(seed: number, viewportWidth: number, countRange: [number, number], zone: 'page' | 'container'): HalloweenFilamentItem[] {
  const countNoise = createNoise(seed, viewportWidth * 0.01);
  const count = Math.max(countRange[0], Math.round(lerp(countRange, countNoise)));
  const compact = viewportWidth < VIEWPORT_BREAKPOINTS.compact;
  const containerInsetBase = 0;

  return Array.from({ length: count }, (_, index) => {
    const base = seed * 11 + index;
    const edgeNoise = createNoise(base, 1.1);
    const anchorNoise = createNoise(base, 1.6);
    const containerAnchors: HalloweenFilamentAnchor[] = ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
    const anchor = zone === 'container'
      ? containerAnchors[Math.min(containerAnchors.length - 1, Math.floor(anchorNoise * containerAnchors.length))]
      : 'free';
    const perimeterRatio = 0.08 + createNoise(base, 1.95) * 0.84;
    const left =
      zone === 'container'
        ? anchor === 'top' || anchor === 'bottom'
          ? perimeterRatio
          : anchor === 'top-right' || anchor === 'right' || anchor === 'bottom-right'
            ? 1
            : 0
        : edgeNoise < 0.28
          ? -0.08 + createNoise(base, 1.3) * 0.1
          : edgeNoise > 0.72
            ? 0.7 + createNoise(base, 1.7) * 0.24
            : 0.06 + createNoise(base, 2.1) * 0.7;
    const top =
      zone === 'container'
        ? anchor === 'left' || anchor === 'right'
          ? perimeterRatio
          : anchor === 'bottom-left' || anchor === 'bottom' || anchor === 'bottom-right'
            ? 1
            : 0
        : edgeNoise > 0.44 && edgeNoise < 0.7
          ? -0.05 + createNoise(base, 2.7) * 0.14
          : 0.04 + createNoise(base, 3.1) * 0.74;
    const insetX = zone === 'container' ? containerInsetBase : 0;
    const insetY = zone === 'container' ? containerInsetBase : 0;
    const width = (compact ? 84 : zone === 'page' ? 92 : 116) + createNoise(base, 3.9) * (compact ? 42 : zone === 'page' ? 86 : 54);
    const height = width * (0.98 + createNoise(base, 4.3) * 0.38);

    return {
      id: `${zone}-${seed}-${index}`,
      anchor,
      leftRatio: left,
      topRatio: top,
      insetX,
      insetY,
      width: Math.round(zone === 'container' ? width * (1.02 + createNoise(base, 3.35) * 0.18) : width),
      height: Math.round(zone === 'container' ? height * (1.04 + createNoise(base, 3.55) * 0.18) : height),
      opacity: (zone === 'page' ? 0.18 : 0.24) + createNoise(base, 4.9) * (zone === 'container' ? 0.14 : 0.18),
      rotateDeg: zone === 'container' ? 0 : -24 + createNoise(base, 5.3) * 48,
      curve: 16 + createNoise(base, 5.7) * 28,
      directionBias: -1 + createNoise(base, 5.95) * 2,
      tension: 0.78 + createNoise(base, 6.02) * 0.62,
      forkBias: -1 + createNoise(base, 6.06) * 2,
      mirror: zone === 'container' ? false : createNoise(base, 6.1) > 0.5,
      swayX: -12 + createNoise(base, 6.7) * 24,
      swayY: -5 + createNoise(base, 7.1) * 10,
    };
  });
}

export function buildHalloweenBrokenFilamentGeometry(anchor: HalloweenFilamentAnchor, curve: number, directionBias = 0, tension = 1, forkBias = 0) {
  const geometryAnchor = anchor === 'free' ? 'top-left' : anchor;
  const originX = geometryAnchor === 'top' || geometryAnchor === 'bottom' ? 60 : geometryAnchor.includes('right') ? 120 : 0;
  const originY = geometryAnchor === 'left' || geometryAnchor === 'right' ? 60 : geometryAnchor.includes('bottom') ? 120 : 0;
  const signX = directionBias >= 0 ? 1 : -1;
  const signY = 1;
  const px = (value: number) => originX + signX * value;
  const py = (value: number) => originY + signY * value;
  const drift = directionBias * (10 + curve * 0.09) + forkBias * 3.4;
  const runA = 10 + curve * (0.08 + tension * 0.03);
  const runB = 18 + curve * (0.12 + tension * 0.04);
  const runC = 28 + curve * (0.14 + tension * 0.05);
  const runD = 40 + curve * (0.16 + tension * 0.06);
  const dropA = 12 + curve * (0.11 + tension * 0.06);
  const dropB = 24 + curve * (0.15 + tension * 0.08);
  const dropC = 38 + curve * (0.19 + tension * 0.1);
  const dropD = 54 + curve * (0.22 + tension * 0.12);
  const s1x = px(runA + drift * 0.14);
  const s1y = py(dropA);
  const s2x = px(runB + drift * 0.34);
  const s2y = py(dropB);
  const s3x = px(runC + drift * 0.62);
  const s3y = py(dropC);
  const s4x = px(runD + drift);
  const s4y = py(dropD);
  const helperX = px(6 + drift * 0.08);
  const helperY = py(4);
  const bridgeLift = 4 + Math.abs(forkBias) * 3;

  return [
    `M ${originX} ${originY} C ${px(4)} ${py(0)} ${px(runA * 0.5 + drift * 0.1)} ${py(dropA * 0.4)} ${s1x} ${s1y}` ,
    `M ${originX} ${originY} C ${helperX} ${helperY} ${px(runB * 0.58 + drift * 0.22)} ${py(dropB * 0.44)} ${s2x} ${s2y}` ,
    `M ${originX} ${originY} C ${px(8 + drift * 0.12)} ${py(2)} ${px(runC * 0.56 + drift * 0.44)} ${py(dropC * 0.42)} ${s3x} ${s3y}` ,
    `M ${px(runB * 0.28 + drift * 0.12)} ${py(dropB * 0.24)} C ${px(runC * 0.44 + drift * 0.4)} ${py(dropC * 0.34)} ${px(runD * 0.74 + drift * 0.82)} ${py(dropD * 0.76)} ${s4x} ${s4y}` ,
    `M ${s1x} ${s1y} C ${px(runA * 1.08 + drift * 0.18)} ${py(dropA + bridgeLift)} ${px(runB * 0.92 + drift * 0.26)} ${py(dropB - bridgeLift)} ${s2x} ${s2y}` ,
    `M ${s2x} ${s2y} C ${px(runB * 1.08 + drift * 0.42)} ${py(dropB + bridgeLift)} ${px(runC * 0.92 + drift * 0.56)} ${py(dropC - bridgeLift)} ${s3x} ${s3y}` ,
    `M ${s3x} ${s3y} C ${px(runC * 1.06 + drift * 0.74)} ${py(dropC + bridgeLift)} ${px(runD * 0.94 + drift * 0.9)} ${py(dropD - bridgeLift)} ${s4x} ${s4y}` ,
  ];
}
export function getHalloweenCobwebTransformOrigin(anchor: HalloweenCobwebAnchor) {
  if (anchor === 'center') return 'center center';
  return anchor.includes('right') ? 'top right' : 'top left';
}

export function getHalloweenCobwebMirrorClass(anchor: HalloweenCobwebAnchor) {
  return anchor.includes('right') ? 'scale-x-[-1]' : '';
}

export function getHalloweenCobwebTopPercent(topRatio: number) {
  return `${Math.max(0, Math.min(90, topRatio * 100))}%`;
}

export function getHalloweenCobwebLeftPercent(leftRatio: number) {
  return `${leftRatio * 100}%`;
}


export const HALLOWEEN_HERO_LIGHTNING_EPISODES = [
  {
    delay: 0.24,
    duration: 7.2,
    pulses: [0.062],
    path: 'M16 0 L12 6 L15 11 L10 18 L13 24 L8 31 L11 37 L7 46 L10 55 L6 65 L9 76 L5 88 L7 100',
    branches: ['M15 11 L22 15 L17 21', 'M11 37 L3 42 L8 49'],
  },
  {
    delay: 4.05,
    duration: 8.6,
    pulses: [0.082, 0.128],
    path: 'M86 0 L81 7 L84 13 L78 20 L82 27 L76 34 L80 42 L74 50 L78 60 L72 71 L76 83 L70 94 L73 100',
    branches: ['M84 13 L92 17 L87 23', 'M80 42 L88 48 L83 55'],
  },
  {
    delay: 8.7,
    duration: 10.1,
    pulses: [0.076],
    path: 'M33 0 L29 7 L32 12 L27 19 L30 25 L24 33 L27 41 L22 50 L26 61 L21 72 L24 84 L20 94 L22 100',
    branches: ['M32 12 L39 16 L34 22', 'M27 41 L18 46 L23 54'],
  },
] as const;






























