/*
* Creates a SQL LIKE pattern based off of search keywords and phrases
*
* Pattern can match anywhere
* Search: Cat
* Matches: He had a cat named Sally
* 
* Treats all words as allowing any content between them
* Search: Hello Friend
* Matches: Hello my friend
* 
* Can search for quoted phrases
* Search: "Hello Friend"
* Skips: Hello my friend
* Matches: And said Hello Friend
* 
* Can mix quoted phrases with keywords
* Search "Hello Friend" Tom
* Matches: Hello friend, my name is Tom
* 
* Wildcards _ and % escaped
* Search: 5%
* Matches: The discount was 5%
* Skips: The price was $5.00
* Search: _at
* Matches: created_at = time();
* Skips: created = time();
*
* Order matters
* Search: Hello world
* Matches: And he said hello to the world
* Skip: The world replied Hello
*/

export const sqlLike = (search: string) => {
  if (search.trim() === '') return '';
  search = escape(search);
  search = search.includes('"') ? withPhrases(search) : withKeywords(search);
  return anywhere(search);
}

const escape = (search: string) => search.replaceAll(/([%_])/g, '\\$1');
const anywhere = (search: string) => `%${search}%`;

const withKeywords = (search: string) => search
  // white-space as space
  .replaceAll(/\s+/g, ' ')
  // double-space as single
  .replaceAll('  ', ' ')
  .trim()
  // space as wildcard
  .replaceAll(' ', '%');

const withPhrases = (search: string) => {
  let like = '';

  // non-quoted + quoted
  const pattern = /([^"]*)"([^"]*)"/g;
  const matches = search.matchAll(pattern);

  for (const match of matches) {
    const keywords = match[1].trim();
    const phrase = match[2].trim();

    if (keywords !== '') {
      if (like.length !== 0) like += '%';
      like += withKeywords(keywords);
    }

    if (phrase !== '') {
      if (like.length !== 0) like += '%';
      like += phrase;
    }
  }
  return like;
}