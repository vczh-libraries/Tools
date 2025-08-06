# Using VlppRegex

## Syntax

The regular expression here is pretty much the same as the .NET regular expression, but there are several important differences:
  - Both `/` and `\` do escaping. This is because C++ also do escaping using `\`, using `\` results in too many `\` in the code. Always prefer `/` if possible.
  - Unlike other regular expression, here `.` accept the actual '.' character, while `/.` or `\.` accepts all characters.
  - Using DFA incompatible features significantly slow down the performance, avoid that if possible.
  - Detailed description is included in the comment of class `Regex_<T>`.

## Executing a Regular Expression

The definition and the string to match could be in different UTF encoding.
`Regex_<T>` accepts `ObjectString<T>` as the definition.
`MatchHead<U>`, `Match<U>`, `TestHead<U>`, `Test<U>`, `Search<U>`, `Split<U>` and `Cut<U>` accepts `ObjectString<U>` to match with the regular expression.

- `MatchHead` finds the longest prefix of the string which matches the regular expression.
  - `TestHeader` performs a similar action, but it only returns `bool` without detailed information.
- `Match` finds the eariest substring which matches the regular expression.
  - `Test` performs a similar action, but it only returns `bool` without detailed information.
- `Search` finds all substrings which match the regular expression. All results do not overlap with each other.
- `Split` use the regular expression as a splitter, finding all remaining substrings.
- `Cut` combines both `Search` and `Split`, finding all substrings in order, regardless if one matches or not.

## Aliases

- `RegexString` -> `RegexString_<wchar_t>`
- `RegexMatch` -> `RegexMatch_<wchar_t>`
- `Regex` -> `Regex_<wchar_t>`
- `RegexToken` -> `RegexToken_<wchar_t>`
- `RegexProc` -> `RegexProc_<wchar_t>`
- `RegexTokens` -> `RegexTokens_<wchar_t>`
- `RegexLexerWalker` -> `RegexLexerWalker_<wchar_t>`
- `RegexLexerColorizer` -> `RegexLexerColorizer_<wchar_t>`
- `RegexLexer` -> `RegexLexer_<wchar_t>`
