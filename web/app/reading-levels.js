// Levels belong to their source system; equal numbers are not interchangeable.
const SYSTEM_LEVELS = new Map([['Storybooks Canada', 5], ['StoryWeaver', 4]]);

export function readingLevelLabel(sourceLevel) {
  if (!Number.isInteger(sourceLevel?.value) || sourceLevel.value < 1 || sourceLevel.value > (SYSTEM_LEVELS.get(sourceLevel.system) || 0)) return null;
  return `${sourceLevel.system} · ${sourceLevel.value}级`;
}

export function readingLevelKey(sourceLevel) {
  return readingLevelLabel(sourceLevel) ? `${sourceLevel.system}:${sourceLevel.value}` : null;
}

export function readingLevelOptions(books) {
  return [...new Map(books.map(book => [readingLevelKey(book.sourceLevel), book.sourceLevel])).values()]
    .filter(level => readingLevelLabel(level))
    .sort((a, b) => a.system.localeCompare(b.system) || a.value - b.value);
}
