export type StepRow = {
  step: number;
  where: string;
  directive: string;
  ideas?: string;
};

export type LineSeg = { type: 'line'; waypoints: string[]; label?: string; step: number };
export type CircleSeg = { type: 'circle'; at: string; direction: 'left' | 'right'; label?: string; step: number };
export type Segment = LineSeg | CircleSeg;

export type DressageTest = {
  id: string;
  name: string;
  rows: StepRow[];
  segments: Segment[];
};

const line = (step: number, ...waypoints: string[]): LineSeg => ({ type: 'line', step, waypoints });
const circle = (step: number, at: string, direction: 'left' | 'right'): CircleSeg => ({
  type: 'circle',
  step,
  at,
  direction,
});

export const TESTS = {
  introA: {
    id: 'introA',
    name: 'USDF 2023 Introductory Level, Test A (20m x 40m)',
    rows: [
      {
        step: 1,
        where: 'A',
        directive: 'Enter, working trot rising',
        ideas: 'Regularity, quality of trot; straightness, willing, calm transition',
      },
      {
        step: 1,
        where: 'Between X & C',
        directive: 'Medium walk',
        ideas: 'Regularity, quality of walk',
      },

      {
        step: 2,
        where: 'C',
        directive: 'Track right',
        ideas: 'Bend and balance; willing, calm transition',
      },
      {
        step: 2,
        where: 'M',
        directive: 'Working trot rising',
      },

      {
        step: 3,
        where: 'A',
        directive: 'Circle right 20 meters, working trot rising',
        ideas: 'Regularity; shape and size of circle; bend; balance',
      },

      {
        step: 4,
        where: 'K - X - M',
        directive: 'Change rein, working trot rising',
        ideas: 'Regularity of trot; straightness; bend and balance in corner',
      },

      {
        step: 5,
        where: 'C',
        directive: 'Circle left 20 meters, working trot rising',
        ideas: 'Regularity; shape and size of circle; bend; balance',
      },

      {
        step: 6,
        where: 'Between C & H',
        directive: 'Medium walk',
        ideas: 'Willing, calm transition; regularity, quality',
      },

      {
        step: 7,
        where: 'H - X - F',
        directive: 'Free walk',
        ideas:
          'Regularity, reach and ground cover with over track of free walk allowing complete freedom to stretch the neck forward and downward',
      },

      {
        step: 8,
        where: 'F - A',
        directive: 'Medium walk',
        ideas: 'Regularity, quality, willing, calm transition, bend and balance in turn straightness on centerline.',
      },
      {
        step: 8,
        where: 'A',
        directive: 'Down centerline',
      },

      {
        step: 9,
        where: 'X',
        directive: 'Halt and salute',
        ideas: 'Straightness; attentiveness; immobility (min. 3 seconds)',
      },
    ],
    segments: [
      line(1, 'A', 'X', 'C'),
      line(2, 'C', 'M'),
      circle(3, 'B', 'right'),
      line(4, 'K', 'X', 'M'),
      circle(5, 'E', 'left'),
      line(6, 'E', 'C', 'H'),
      line(7, 'H', 'X', 'F'),
      line(8, 'F', 'A', 'X'),
    ],
  },
} as const satisfies Record<string, DressageTest>;


