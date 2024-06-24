/*
 * Highlights individual keywords and quoted phrases
*/

const highlightedClass = 'highlight';
const normalClass = 'no-light';

export const highlightSearchTerms = (text: string, searchText: string) => {
  if (searchText.length === 0) return;

  let i = 0;
  const parts = [];
  const pattern = buildPattern(searchText);
  if (!pattern.test(text)) {
    return [{ text, className: '' }];
  }
  pattern.lastIndex = 0;
  let matches: RegExpExecArray | null = null;
  while ((matches = pattern.exec(text)) !== null) {
    if (matches === null) break;
    if (i++ > 5) break;
    const matchIndex = matches.index;
    const endIndex = matchIndex + matches[0].length
    if (matchIndex !== 0) {
      parts.push({
        text: text.substring(0, matchIndex),
        className: normalClass
      });
    }

    if (matches.length === 1) {
      parts.push({
        text: matches[0],
        className: highlightedClass
      });
    } else {
      for (let n = 1; n < matches.length; n++) {
        parts.push({
          text: matches[n],
          className: n % 2 === 0 ? normalClass : highlightedClass
        });
      }
    }

    if (endIndex >= text.length - 1) {
      text = '';
    } else {
      text = text.substring(endIndex);
    }
    pattern.lastIndex = 0;
  }
  if (text.length !== 0) {
    parts.push({
      text,
      className: normalClass
    });
  }
  return parts;
}

const buildPattern = (searchText: string) => {
  let encoded = searchText
    // regex encoding
    .replaceAll(/([[.*+?^$`()\\\]])/g, '\\$1')
    // quotes
    .replaceAll(/"([^"]*?)"/g, (substring: string, ...args: any) => {
      // remove quotes and
      // prevent space from being 
      // turned into wildcard later
      return args[0].replaceAll(' ', '\\s');
    });
  if (encoded.includes(' ')) {
    // group spaces
    encoded = '(' + encoded.replaceAll(/[% ]/g, ')(.*)(') + ')';
  }
  return new RegExp(encoded, 'gi');
}