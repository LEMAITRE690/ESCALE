export type ExperimentVariant = { id: string; weight: number };

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function assignVariant(experimentId: string, subjectId: string, variants: ExperimentVariant[]) {
  const total = variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0);
  if (!variants.length || total <= 0) return null;
  const bucket = hash(`${experimentId}:${subjectId}`) * total;
  let cursor = 0;
  for (const variant of variants) {
    cursor += Math.max(0, variant.weight);
    if (bucket <= cursor) return variant.id;
  }
  return variants[variants.length - 1].id;
}
