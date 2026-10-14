/**
 * MJ Programming Language - Token Definitions & Unicode Vocabulary
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

export enum TokenType {
  // Literals
  INT = 'INT',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NIL = 'NIL',
  IDENTIFIER = 'IDENTIFIER',

  // Keywords (Arabic primary, with legacy English aliases)
  VAL = 'VAL',           // ثابت / val (immutable binding)
  VAR = 'VAR',           // متغير / var (mutable binding)
  FUNC = 'FUNC',         // دالة / func
  RETURN = 'RETURN',     // أرجع / return
  WHEN = 'WHEN',         // إذا / when / if
  ELSE = 'ELSE',         // وإلا / else
  WHILE = 'WHILE',       // طالما / while
  FOR = 'FOR',           // لكل / for
  IN = 'IN',             // في / in
  REPEAT = 'REPEAT',     // كرر / repeat
  MATCH = 'MATCH',       // طابق / match
  BREAK = 'BREAK',       // توقف / break
  CONTINUE = 'CONTINUE', // استمر / continue
  IMPORT = 'IMPORT',     // استورد / import
  AS = 'AS',             // باسم / كنوع / as
  TYPE = 'TYPE',         // نوع / type
  TRUE = 'TRUE',         // صحيح / true
  FALSE = 'FALSE',       // خطأ / false

  // Operators
  PLUS = 'PLUS',         // +
  MINUS = 'MINUS',       // -
  STAR = 'STAR',         // *
  SLASH = 'SLASH',       // /
  PERCENT = 'PERCENT',   // %
  ARROW = 'ARROW',       // ->
  FAT_ARROW = 'FAT_ARROW', // =>
  EQUAL = 'EQUAL',       // =
  EQUAL_EQUAL = 'EQUAL_EQUAL', // ==
  BANG_EQUAL = 'BANG_EQUAL',   // !=
  LESS = 'LESS',         // <
  LESS_EQUAL = 'LESS_EQUAL',   // <=
  GREATER = 'GREATER',   // >
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  AND = 'AND',           // و / and / &&
  OR = 'OR',             // أو / or / ||
  BANG = 'BANG',         // ليس / not / !

  // Delimiters & Punctuation
  LPAREN = 'LPAREN',     // (
  RPAREN = 'RPAREN',     // )
  LBRACE = 'LBRACE',     // {
  RBRACE = 'RBRACE',     // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  COMMA = 'COMMA',       // , and Arabic comma ،
  COLON = 'COLON',       // :
  SEMICOLON = 'SEMICOLON', // ; and Arabic semicolon ؛
  DOT = 'DOT',           // .
  HASH = 'HASH',         // #

  // Special
  EOF = 'EOF',
  ERROR = 'ERROR'
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
  offset: number;
  length: number;
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: any;
  loc: SourceLocation;
}

/**
 * Official Arabic keywords map for MJ language
 * Canonical spellings in Arabic as primary.
 */
export const ARABIC_KEYWORDS: Record<string, TokenType> = {
  'متغير': TokenType.VAR,
  'ثابت': TokenType.VAL,
  'دالة': TokenType.FUNC,
  'أرجع': TokenType.RETURN,
  'ارجع': TokenType.RETURN, // Tolerant hamza variant
  'إذا': TokenType.WHEN,
  'اذا': TokenType.WHEN,   // Tolerant hamza variant
  'لو': TokenType.WHEN,
  'وإلا': TokenType.ELSE,
  'والا': TokenType.ELSE,   // Tolerant hamza variant
  'طالما': TokenType.WHILE,
  'بينما': TokenType.WHILE,
  'لكل': TokenType.FOR,
  'في': TokenType.IN,
  'كرر': TokenType.REPEAT,
  'طابق': TokenType.MATCH,
  'اختر': TokenType.MATCH,
  'توقف': TokenType.BREAK,
  'استمر': TokenType.CONTINUE,
  'استورد': TokenType.IMPORT,
  'باسم': TokenType.AS,
  'كنوع': TokenType.AS,
  'نوع': TokenType.TYPE,
  'صحيح': TokenType.TRUE,
  'خطأ': TokenType.FALSE,
  'خطا': TokenType.FALSE,
  'فارغ': TokenType.NIL,
  'عدم': TokenType.NIL,
  'لا_شيء': TokenType.NIL,
  'و': TokenType.AND,
  'أو': TokenType.OR,
  'او': TokenType.OR,
  'ليس': TokenType.BANG,
};

/**
 * English aliases and their Arabic equivalents for diagnostics in strict mode
 */
export const ENGLISH_ALIASES: Record<string, { token: TokenType; arabicEquivalent: string }> = {
  'val': { token: TokenType.VAL, arabicEquivalent: 'ثابت' },
  'var': { token: TokenType.VAR, arabicEquivalent: 'متغير' },
  'func': { token: TokenType.FUNC, arabicEquivalent: 'دالة' },
  'def': { token: TokenType.FUNC, arabicEquivalent: 'دالة' },
  'return': { token: TokenType.RETURN, arabicEquivalent: 'أرجع' },
  'when': { token: TokenType.WHEN, arabicEquivalent: 'إذا' },
  'if': { token: TokenType.WHEN, arabicEquivalent: 'إذا' },
  'else': { token: TokenType.ELSE, arabicEquivalent: 'وإلا' },
  'while': { token: TokenType.WHILE, arabicEquivalent: 'طالما' },
  'for': { token: TokenType.FOR, arabicEquivalent: 'لكل' },
  'in': { token: TokenType.IN, arabicEquivalent: 'في' },
  'repeat': { token: TokenType.REPEAT, arabicEquivalent: 'كرر' },
  'match': { token: TokenType.MATCH, arabicEquivalent: 'طابق' },
  'break': { token: TokenType.BREAK, arabicEquivalent: 'توقف' },
  'continue': { token: TokenType.CONTINUE, arabicEquivalent: 'استمر' },
  'import': { token: TokenType.IMPORT, arabicEquivalent: 'استورد' },
  'as': { token: TokenType.AS, arabicEquivalent: 'باسم' },
  'type': { token: TokenType.TYPE, arabicEquivalent: 'نوع' },
  'true': { token: TokenType.TRUE, arabicEquivalent: 'صحيح' },
  'false': { token: TokenType.FALSE, arabicEquivalent: 'خطأ' },
  'nil': { token: TokenType.NIL, arabicEquivalent: 'فارغ' },
  'null': { token: TokenType.NIL, arabicEquivalent: 'فارغ' },
  'and': { token: TokenType.AND, arabicEquivalent: 'و' },
  'or': { token: TokenType.OR, arabicEquivalent: 'أو' },
  'not': { token: TokenType.BANG, arabicEquivalent: 'ليس' },
};

export const KEYWORDS: Record<string, TokenType> = {
  ...ARABIC_KEYWORDS,
  ...Object.fromEntries(
    Object.entries(ENGLISH_ALIASES).map(([k, v]) => [k, v.token])
  ),
};
