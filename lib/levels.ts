export type Level = {
  name: string;
  minPoints: number;
  maxPoints: number;
};

export const LEVELS: Level[] = [
  { name: 'Aprendiz', minPoints: 0, maxPoints: 50 },
  { name: 'Ayudante', minPoints: 51, maxPoints: 200 },
  { name: 'Experto', minPoints: 201, maxPoints: 500 },
  { name: 'Maestro', minPoints: 501, maxPoints: 1000 },
  { name: 'Leyenda', minPoints: 1001, maxPoints: Infinity },
];

export function getLevelFromPoints(points: number): Level {
  return LEVELS.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0];
}
