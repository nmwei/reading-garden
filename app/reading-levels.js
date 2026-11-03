// These describe the source's text structure, not a child's age or character count.
const STORYBOOKS_LABELS = ['短句', '多句', '短段落', '段落', '长段落'];

export function readingLevelLabel(sourceLevel) {
  if (sourceLevel?.system !== 'Storybooks Canada' || !Number.isInteger(sourceLevel.value)) return null;
  const description = STORYBOOKS_LABELS[sourceLevel.value - 1];
  return description ? `${sourceLevel.value}级 · ${description}` : null;
}
