/**
 * MJ Programming Language - Unicode & Arabic-Aware Lexer
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import { Token, TokenType, SourceLocation, KEYWORDS, ARABIC_KEYWORDS, ENGLISH_ALIASES } from './tokens';

export class Lexer {
  private source: string;
  private filename: string;
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private lineStartOffset: number = 0;
  private tokens: Token[] = [];
  private errors: string[] = [];
  private arabicOnly: boolean;

  constructor(source: string, filename: string = 'main.mj', options?: { arabicOnly?: boolean }) {
    this.source = source;
    this.filename = filename;
    this.arabicOnly = options?.arabicOnly ?? false;
  }

  public tokenize(): { tokens: Token[]; errors: string[] } {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: '',
      loc: this.makeLocation(this.current, 0),
    });

    return { tokens: this.tokens, errors: this.errors };
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case '(': this.addToken(TokenType.LPAREN); break;
      case ')': this.addToken(TokenType.RPAREN); break;
      case '{': this.addToken(TokenType.LBRACE); break;
      case '}': this.addToken(TokenType.RBRACE); break;
      case '[': this.addToken(TokenType.LBRACKET); break;
      case ']': this.addToken(TokenType.RBRACKET); break;

      // Commas: Standard ',' and Arabic comma '،' (U+060C)
      case ',':
      case '،':
      case '\u060C':
        this.addToken(TokenType.COMMA);
        break;

      case '.': this.addToken(TokenType.DOT); break;
      case ':': this.addToken(TokenType.COLON); break;

      // Semicolons: Standard ';' and Arabic semicolon '؛' (U+061B)
      case ';':
      case '؛':
      case '\u061B':
        this.addToken(TokenType.SEMICOLON);
        break;

      case '#': this.addToken(TokenType.HASH); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case '*': this.addToken(TokenType.STAR); break;
      case '%': this.addToken(TokenType.PERCENT); break;

      case '-':
        if (this.match('>')) {
          this.addToken(TokenType.ARROW);
        } else {
          this.addToken(TokenType.MINUS);
        }
        break;

      case '=':
        if (this.match('=')) {
          this.addToken(TokenType.EQUAL_EQUAL);
        } else if (this.match('>')) {
          this.addToken(TokenType.FAT_ARROW);
        } else {
          this.addToken(TokenType.EQUAL);
        }
        break;

      case '!':
        if (this.match('=')) {
          this.addToken(TokenType.BANG_EQUAL);
        } else {
          this.addToken(TokenType.BANG);
        }
        break;

      case '<':
        if (this.match('=')) {
          this.addToken(TokenType.LESS_EQUAL);
        } else {
          this.addToken(TokenType.LESS);
        }
        break;

      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.GREATER_EQUAL);
        } else {
          this.addToken(TokenType.GREATER);
        }
        break;

      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.AND);
        } else {
          this.error(`رمز غير متوقع '&'. هل قصدت '&&' أو 'و'؟`);
        }
        break;

      case '|':
        if (this.match('|')) {
          this.addToken(TokenType.OR);
        } else {
          this.error(`رمز غير متوقع '|'. هل قصدت '||' أو 'أو'؟`);
        }
        break;

      case '/':
        if (this.match('/')) {
          // Single-line comment
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match('*')) {
          // Multi-line comment
          this.blockComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case ' ':
      case '\r':
      case '\t':
        // Whitespace ignored
        break;

      case '\n':
        this.line++;
        this.lineStartOffset = this.current;
        break;

      case '"':
      case "'":
        this.string(c);
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isIdentifierStart(c)) {
          this.identifier();
        } else {
          this.error(`رمز غير متوقع '${c}'.`);
        }
        break;
    }
  }

  private blockComment(): void {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance(); // skip *
        this.advance(); // skip /
        return;
      }
      if (this.peek() === '\n') {
        this.line++;
        this.lineStartOffset = this.current + 1;
      }
      this.advance();
    }
    this.error('تعليق متعدد الأسطر غير مغلق /* ... */');
  }

  private string(quote: string): void {
    let strValue = '';
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.lineStartOffset = this.current + 1;
      }
      if (this.peek() === '\\') {
        this.advance(); // skip backslash
        const esc = this.advance();
        switch (esc) {
          case 'n': strValue += '\n'; break;
          case 't': strValue += '\t'; break;
          case 'r': strValue += '\r'; break;
          case '"': strValue += '"'; break;
          case "'": strValue += "'"; break;
          case '\\': strValue += '\\'; break;
          default: strValue += esc; break;
        }
      } else {
        strValue += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error('نص غير مغلق: ينقص علامة تنصيص.');
      return;
    }

    // The closing quote
    this.advance();
    this.addToken(TokenType.STRING, strValue);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Fractional part
    let isFloat = false;
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      isFloat = true;
      this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const rawText = this.source.substring(this.start, this.current);
    // Normalize Arabic-Indic numerals (٠-٩) to standard ASCII (0-9)
    const normalizedText = this.normalizeDigits(rawText);

    if (isFloat) {
      this.addToken(TokenType.FLOAT, parseFloat(normalizedText));
    } else {
      this.addToken(TokenType.INT, parseInt(normalizedText, 10));
    }
  }

  private identifier(): void {
    while (this.isIdentifierPart(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    // NFC normalization for identifier consistency
    const normalizedText = text.normalize('NFC');

    // Check Arabic-only restriction if enabled
    if (this.arabicOnly && ENGLISH_ALIASES[text]) {
      this.error(
        `الكلمة المفتاحية اللاتينية '${text}' غير مسموح بها في الوضع العربي الخالص. استخدم '${ENGLISH_ALIASES[text].arabicEquivalent}' بدلاً منها.`
      );
    }

    const type = KEYWORDS[normalizedText] || KEYWORDS[text] || TokenType.IDENTIFIER;

    let literal: any = undefined;
    if (type === TokenType.TRUE) literal = true;
    if (type === TokenType.FALSE) literal = false;
    if (type === TokenType.NIL) literal = null;

    this.addToken(type, literal);
  }

  private addToken(type: TokenType, literal?: any): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme: text,
      literal,
      loc: this.makeLocation(this.start, this.current - this.start),
    });
  }

  private makeLocation(offset: number, length: number): SourceLocation {
    const col = offset - this.lineStartOffset + 1;
    return {
      file: this.filename,
      line: this.line,
      column: col > 0 ? col : 1,
      offset,
      length: length > 0 ? length : 1,
    };
  }

  private isDigit(c: string): boolean {
    if (!c || c === '\0') return false;
    if (c >= '0' && c <= '9') return true;
    const code = c.charCodeAt(0);
    if (code >= 0x0660 && code <= 0x0669) return true;
    if (code >= 0x06f0 && code <= 0x06f9) return true;
    return false;
  }

  private normalizeDigits(str: string): string {
    return str.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
      const code = d.charCodeAt(0);
      if (code >= 0x0660 && code <= 0x0669) {
        return String(code - 0x0660);
      }
      if (code >= 0x06f0 && code <= 0x06f9) {
        return String(code - 0x06f0);
      }
      return d;
    });
  }

  private isIdentifierStart(c: string): boolean {
    if (!c || c === '\0') return false;
    if (c === '_') return true;
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) return true;

    const code = c.charCodeAt(0);
    if (code >= 0x0621 && code <= 0x064a) return true;
    if (code >= 0x066e && code <= 0x06d3) return true;
    if ((code >= 0x0750 && code <= 0x077f) || (code >= 0x08a0 && code <= 0x08ff)) return true;
    if ((code >= 0xfb50 && code <= 0xfdff) || (code >= 0xfe70 && code <= 0xfeff)) return true;

    try {
      return /^\p{L}$/u.test(c);
    } catch {
      return false;
    }
  }

  private isIdentifierPart(c: string): boolean {
    if (this.isIdentifierStart(c)) return true;
    if (this.isDigit(c)) return true;

    // Tashkeel / Combining marks
    const code = c.charCodeAt(0);
    if ((code >= 0x064b && code <= 0x065f) || code === 0x0670) return true;

    try {
      return /^\p{M}$/u.test(c);
    } catch {
      return false;
    }
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;
    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private error(message: string): void {
    const col = this.current - this.lineStartOffset;
    this.errors.push(`[${this.filename}:${this.line}:${col > 0 ? col : 1}] خطأ معجمي: ${message}`);
  }
}
