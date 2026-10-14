/**
 * MJ Programming Language - Arabic-First Parser
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import { Token, TokenType, SourceLocation } from './tokens';
import { Lexer } from './lexer';
import {
  Program,
  Stmt,
  Expr,
  LiteralExpr,
  IdentifierExpr,
  BinaryExpr,
  UnaryExpr,
  CallExpr,
  MemberExpr,
  IndexExpr,
  AssignExpr,
  ListLiteralExpr,
  MapLiteralExpr,
  FunctionExpr,
  MatchExpr,
  MatchArm,
  VarDeclStmt,
  FunctionDeclStmt,
  BlockStmt,
  WhenStmt,
  WhileStmt,
  ForInStmt,
  RepeatStmt,
  ReturnStmt,
  BreakStmt,
  ContinueStmt,
  ImportStmt,
  ExprStmt,
} from './ast';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private filename: string;
  private errors: string[] = [];

  constructor(tokens: Token[], filename: string = 'main.mj') {
    this.tokens = tokens;
    this.filename = filename;
  }

  public parse(): { program: Program; errors: string[] } {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {
      try {
        if (this.match(TokenType.SEMICOLON)) continue;

        const stmt = this.declaration();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (err: any) {
        this.synchronize();
      }
    }

    const loc: SourceLocation = {
      file: this.filename,
      line: 1,
      column: 1,
      offset: 0,
      length: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].loc.offset : 0,
    };

    return {
      program: {
        type: 'Program',
        statements,
        filename: this.filename,
        loc,
      },
      errors: this.errors,
    };
  }

  // ---------------------------------------------------------------------------
  // Declarations & Statements
  // ---------------------------------------------------------------------------

  private declaration(): Stmt | null {
    if (this.match(TokenType.VAL)) return this.varDeclaration(false);
    if (this.match(TokenType.VAR)) return this.varDeclaration(true);
    if (this.match(TokenType.FUNC)) return this.functionDeclaration();
    if (this.match(TokenType.IMPORT)) return this.importStatement();

    return this.statement();
  }

  private varDeclaration(isMutable: boolean): VarDeclStmt {
    const startToken = this.previous();
    const nameToken = this.consume(TokenType.IDENTIFIER, "ينقص اسم المتغير بعد 'متغير' أو 'ثابت'.");

    let typeAnnotation: string | undefined = undefined;
    if (this.match(TokenType.COLON)) {
      const typeToken = this.consume(TokenType.IDENTIFIER, "ينقص اسم النوع بعد النقطتين ':'.");
      typeAnnotation = typeToken.lexeme;
      if (this.match(TokenType.LBRACKET)) {
        const innerType = this.consume(TokenType.IDENTIFIER, "ينقص اسم النوع الداخلي للقائمة.");
        this.consume(TokenType.RBRACKET, "ينقص قوس إغلاق ']' بعد نوع القائمة.");
        typeAnnotation = `${typeAnnotation}[${innerType.lexeme}]`;
      }
    }

    this.consume(TokenType.EQUAL, "ينقص علامة '=' في تعريف المتغير.");
    const initializer = this.expression();
    this.optionalSemicolon();

    return {
      type: 'VarDeclStmt',
      isMutable,
      name: nameToken.lexeme,
      typeAnnotation,
      initializer,
      loc: this.mergeLoc(startToken.loc, initializer.loc),
    };
  }

  private functionDeclaration(): FunctionDeclStmt {
    const startToken = this.previous();
    const nameToken = this.consume(TokenType.IDENTIFIER, "ينقص اسم الدالة بعد 'دالة'.");
    this.consume(TokenType.LPAREN, "ينقص '(' بعد اسم الدالة.");

    const params: { name: string; type?: string }[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const paramName = this.consume(TokenType.IDENTIFIER, "ينقص اسم المعامل.");
        let paramType: string | undefined = undefined;
        if (this.match(TokenType.COLON)) {
          const typeTok = this.consume(TokenType.IDENTIFIER, "ينقص نوع المعامل.");
          paramType = typeTok.lexeme;
        }
        params.push({ name: paramName.lexeme, type: paramType });
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "ينقص ')' بعد معاملات الدالة.");

    let returnType: string | undefined = undefined;
    if (this.match(TokenType.ARROW)) {
      const retToken = this.consume(TokenType.IDENTIFIER, "ينقص نوع الإرجاع بعد '->'.");
      returnType = retToken.lexeme;
    }

    // Optional colon after function signature
    this.match(TokenType.COLON);

    const body = this.blockStatement(startToken.loc.column);

    return {
      type: 'FunctionDeclStmt',
      name: nameToken.lexeme,
      params,
      returnType,
      body,
      loc: this.mergeLoc(startToken.loc, body.loc),
    };
  }

  private importStatement(): ImportStmt {
    const startToken = this.previous();
    const pathToken = this.consume(TokenType.STRING, "ينقص مسار الملف النصي بعد 'استورد'.");

    let alias: string | undefined = undefined;
    if (this.match(TokenType.AS)) {
      const aliasToken = this.consume(TokenType.IDENTIFIER, "ينقص الاسم المستعار بعد 'باسم'.");
      alias = aliasToken.lexeme;
    }

    this.optionalSemicolon();

    return {
      type: 'ImportStmt',
      path: pathToken.literal || pathToken.lexeme,
      alias,
      loc: this.mergeLoc(startToken.loc, this.previous().loc),
    };
  }

  private statement(): Stmt {
    if (this.match(TokenType.WHEN)) return this.whenStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forInStatement();
    if (this.match(TokenType.REPEAT)) return this.repeatStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.BREAK)) return this.breakStatement();
    if (this.match(TokenType.CONTINUE)) return this.continueStatement();
    if (this.check(TokenType.LBRACE)) return this.blockStatement();

    return this.expressionStatement();
  }

  private whenStatement(): WhenStmt {
    const startToken = this.previous();

    let condition: Expr;
    if (this.match(TokenType.LPAREN)) {
      condition = this.expression();
      this.consume(TokenType.RPAREN, "ينقص قوس إغلاق ')' بعد شرط إذا.");
    } else {
      condition = this.expression();
    }

    // Optional colon after condition: e.g. إذا العدد > 5:
    this.match(TokenType.COLON);

    const thenBranch = this.statementOrBlock(startToken.loc.column);
    let elseBranch: Stmt | undefined = undefined;

    if (this.match(TokenType.ELSE)) {
      // Optional colon after else / وإلا:
      this.match(TokenType.COLON);
      elseBranch = this.statementOrBlock(startToken.loc.column);
    }

    return {
      type: 'WhenStmt',
      condition,
      thenBranch,
      elseBranch,
      loc: this.mergeLoc(startToken.loc, (elseBranch || thenBranch).loc),
    };
  }

  private whileStatement(): WhileStmt {
    const startToken = this.previous();

    let condition: Expr;
    if (this.match(TokenType.LPAREN)) {
      condition = this.expression();
      this.consume(TokenType.RPAREN, "ينقص ')' بعد شرط طالما.");
    } else {
      condition = this.expression();
    }

    this.match(TokenType.COLON);
    const body = this.statementOrBlock(startToken.loc.column);

    return {
      type: 'WhileStmt',
      condition,
      body,
      loc: this.mergeLoc(startToken.loc, body.loc),
    };
  }

  private forInStatement(): ForInStmt {
    const startToken = this.previous();
    const hasParen = this.match(TokenType.LPAREN);

    const varToken = this.consume(TokenType.IDENTIFIER, "ينقص اسم متغير الدوران بعد 'لكل'.");
    this.consume(TokenType.IN, "ينقص كلمة 'في' بعد متغير الدوران.");
    const iterable = this.expression();

    if (hasParen) {
      this.consume(TokenType.RPAREN, "ينقص ')' بعد جملة لكل.");
    }

    this.match(TokenType.COLON);
    const body = this.statementOrBlock(startToken.loc.column);

    return {
      type: 'ForInStmt',
      variable: varToken.lexeme,
      iterable,
      body,
      loc: this.mergeLoc(startToken.loc, body.loc),
    };
  }

  private repeatStatement(): RepeatStmt {
    const startToken = this.previous();
    const hasParen = this.match(TokenType.LPAREN);

    const count = this.expression();
    if (hasParen) {
      this.consume(TokenType.RPAREN, "ينقص ')' بعد عدد مرات التكرار.");
    }

    this.match(TokenType.COLON);
    const body = this.statementOrBlock(startToken.loc.column);

    return {
      type: 'RepeatStmt',
      count,
      body,
      loc: this.mergeLoc(startToken.loc, body.loc),
    };
  }

  private returnStatement(): ReturnStmt {
    const startToken = this.previous();
    let value: Expr | undefined = undefined;

    // A return expression is present if not on a semicolon, closing brace, or newline/EOF
    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Check if next token is on the same line as return
      const next = this.peek();
      if (next.loc.line === startToken.loc.line) {
        value = this.expression();
      }
    }

    this.optionalSemicolon();

    return {
      type: 'ReturnStmt',
      value,
      loc: this.mergeLoc(startToken.loc, value ? value.loc : startToken.loc),
    };
  }

  private breakStatement(): BreakStmt {
    const token = this.previous();
    this.optionalSemicolon();
    return {
      type: 'BreakStmt',
      loc: token.loc,
    };
  }

  private continueStatement(): ContinueStmt {
    const token = this.previous();
    this.optionalSemicolon();
    return {
      type: 'ContinueStmt',
      loc: token.loc,
    };
  }

  /**
   * Helper that parses either a brace block `{ ... }`, an indentation-based block,
   * or a single statement.
   */
  private statementOrBlock(parentCol?: number): Stmt {
    if (this.check(TokenType.LBRACE)) {
      return this.blockStatement();
    }
    return this.blockStatement(parentCol);
  }

  /**
   * Parses a block of statements.
   * Supports:
   * 1. Standard curly brace blocks `{ ... }`
   * 2. Python-style indentation blocks when parentCol is provided
   */
  private blockStatement(parentCol?: number): BlockStmt {
    if (this.match(TokenType.LBRACE)) {
      const startLoc = this.previous().loc;
      const statements: Stmt[] = [];

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        if (this.match(TokenType.SEMICOLON)) continue;
        const stmt = this.declaration();
        if (stmt) statements.push(stmt);
      }

      const endToken = this.consume(TokenType.RBRACE, "ينقص '}' لإغلاق الكتلة البرمجية.");
      return {
        type: 'BlockStmt',
        statements,
        loc: this.mergeLoc(startLoc, endToken.loc),
      };
    }

    // Indentation-based block without braces
    const statements: Stmt[] = [];
    const minCol = parentCol !== undefined ? parentCol : 1;
    const startLoc = this.peek().loc;

    while (!this.isAtEnd()) {
      if (this.match(TokenType.SEMICOLON)) continue;

      // Stop if next token is else/وإلا
      if (this.check(TokenType.ELSE)) break;

      // Check if indentation of next statement is greater than parentCol
      const nextTok = this.peek();
      if (parentCol !== undefined && nextTok.loc.column <= minCol) {
        break;
      }

      const stmt = this.declaration();
      if (stmt) {
        statements.push(stmt);
      } else {
        break;
      }

      // If we didn't have an indentation guard, stop after 1 statement
      if (parentCol === undefined) {
        break;
      }
    }

    const endLoc = statements.length > 0 ? statements[statements.length - 1].loc : startLoc;
    return {
      type: 'BlockStmt',
      statements,
      loc: this.mergeLoc(startLoc, endLoc),
    };
  }

  private expressionStatement(): ExprStmt {
    const expr = this.expression();
    this.optionalSemicolon();
    return {
      type: 'ExprStmt',
      expression: expr,
      loc: expr.loc,
    };
  }

  // ---------------------------------------------------------------------------
  // Expressions
  // ---------------------------------------------------------------------------

  public expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr.type === 'IdentifierExpr' || expr.type === 'MemberExpr' || expr.type === 'IndexExpr') {
        return {
          type: 'AssignExpr',
          target: expr,
          value,
          loc: this.mergeLoc(expr.loc, value.loc),
        };
      }

      this.error(equals, 'هدف الإسناد غير صالح.');
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = {
        type: 'BinaryExpr',
        left: expr,
        operator,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = {
        type: 'BinaryExpr',
        left: expr,
        operator,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = {
        type: 'BinaryExpr',
        left: expr,
        operator,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = {
        type: 'BinaryExpr',
        left: expr,
        operator,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = {
        type: 'BinaryExpr',
        left: expr,
        operator,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.previous();
      const right = this.unary();
      expr = {
        type: 'BinaryExpr',
        left: expr,
        operator,
        right,
        loc: this.mergeLoc(expr.loc, right.loc),
      };
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return {
        type: 'UnaryExpr',
        operator,
        right,
        loc: this.mergeLoc(operator.loc, right.loc),
      };
    }

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, "ينقص اسم الخاصية بعد '.'.");
        expr = {
          type: 'MemberExpr',
          object: expr,
          property: name.lexeme,
          loc: this.mergeLoc(expr.loc, name.loc),
        };
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.expression();
        const close = this.consume(TokenType.RBRACKET, "ينقص ']' بعد فهرس المصفوفة.");
        expr = {
          type: 'IndexExpr',
          object: expr,
          index,
          loc: this.mergeLoc(expr.loc, close.loc),
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): CallExpr {
    const args: Expr[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(TokenType.RPAREN, "ينقص ')' بعد معاملات الاستدعاء.");

    return {
      type: 'CallExpr',
      callee,
      args,
      loc: this.mergeLoc(callee.loc, paren.loc),
    };
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return { type: 'LiteralExpr', value: false, raw: 'خطأ', loc: this.previous().loc };
    }
    if (this.match(TokenType.TRUE)) {
      return { type: 'LiteralExpr', value: true, raw: 'صحيح', loc: this.previous().loc };
    }
    if (this.match(TokenType.NIL)) {
      return { type: 'LiteralExpr', value: null, raw: 'فارغ', loc: this.previous().loc };
    }

    if (this.match(TokenType.INT, TokenType.FLOAT)) {
      const tok = this.previous();
      return { type: 'LiteralExpr', value: tok.literal, raw: tok.lexeme, loc: tok.loc };
    }

    if (this.match(TokenType.STRING)) {
      const tok = this.previous();
      return this.parseStringWithInterpolation(tok);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const tok = this.previous();
      return { type: 'IdentifierExpr', name: tok.lexeme, loc: tok.loc };
    }

    // List Literal [1, 2, 3]
    if (this.match(TokenType.LBRACKET)) {
      const startTok = this.previous();
      const elements: Expr[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      const endTok = this.consume(TokenType.RBRACKET, "ينقص ']' لإغلاق القائمة.");
      return {
        type: 'ListLiteralExpr',
        elements,
        loc: this.mergeLoc(startTok.loc, endTok.loc),
      };
    }

    // Map Literal #{ "مفتاح": قيمة }
    if (this.match(TokenType.HASH) && this.match(TokenType.LBRACE)) {
      return this.parseMapLiteral(this.previous());
    }

    // Match expression: طابق هدف { نمط => تعبير }
    if (this.match(TokenType.MATCH)) {
      return this.parseMatchExpr(this.previous());
    }

    // Lambda expression: دالة(س) { ... }
    if (this.match(TokenType.FUNC)) {
      return this.parseFunctionExpr(this.previous());
    }

    // Parentheses grouping: ( تعبير )
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "ينقص ')' بعد التعبير.");
      return expr;
    }

    throw this.error(this.peek(), `رمز غير متوقع '${this.peek().lexeme || this.peek().type}' في التعبير.`);
  }

  private parseStringWithInterpolation(tok: Token): Expr {
    const rawVal: string = tok.literal !== undefined ? String(tok.literal) : tok.lexeme;

    if (!rawVal.includes('@{')) {
      return { type: 'LiteralExpr', value: rawVal, raw: `"${rawVal}"`, loc: tok.loc };
    }

    const segments: Expr[] = [];
    let i = 0;
    while (i < rawVal.length) {
      const interpStart = rawVal.indexOf('@{', i);
      if (interpStart === -1) {
        const text = rawVal.substring(i);
        if (text.length > 0) {
          segments.push({ type: 'LiteralExpr', value: text, raw: `"${text}"`, loc: tok.loc });
        }
        break;
      }

      if (interpStart > i) {
        const text = rawVal.substring(i, interpStart);
        segments.push({ type: 'LiteralExpr', value: text, raw: `"${text}"`, loc: tok.loc });
      }

      let depth = 1;
      let j = interpStart + 2;
      while (j < rawVal.length && depth > 0) {
        if (rawVal[j] === '{') depth++;
        else if (rawVal[j] === '}') depth--;
        j++;
      }

      if (depth !== 0) {
        this.error(tok, 'تضمين نصي غير مغلق @{...}.');
        return { type: 'LiteralExpr', value: rawVal, raw: `"${rawVal}"`, loc: tok.loc };
      }

      const innerExprStr = rawVal.substring(interpStart + 2, j - 1).trim();
      if (innerExprStr.length > 0) {
        try {
          const subLexer = new Lexer(innerExprStr, this.filename);
          const subTokens = subLexer.tokenize().tokens;
          const subParser = new Parser(subTokens, this.filename);
          const innerAst = subParser.expression();
          segments.push(innerAst);
        } catch {
          segments.push({ type: 'IdentifierExpr', name: innerExprStr, loc: tok.loc });
        }
      }

      i = j;
    }

    if (segments.length === 0) {
      return { type: 'LiteralExpr', value: '', raw: '""', loc: tok.loc };
    }

    let result = segments[0];
    const plusToken: Token = {
      type: TokenType.PLUS,
      lexeme: '+',
      loc: tok.loc,
    };
    for (let s = 1; s < segments.length; s++) {
      result = {
        type: 'BinaryExpr',
        left: result,
        operator: plusToken,
        right: segments[s],
        loc: tok.loc,
      };
    }
    return result;
  }

  private parseMapLiteral(startTok: Token): MapLiteralExpr {
    const entries: { key: Expr; value: Expr }[] = [];
    if (!this.check(TokenType.RBRACE)) {
      do {
        const key = this.expression();
        this.consume(TokenType.COLON, "ينقص ':' بعد مفتاح القاموس.");
        const value = this.expression();
        entries.push({ key, value });
      } while (this.match(TokenType.COMMA));
    }
    const endTok = this.consume(TokenType.RBRACE, "ينقص '}' لإغلاق القاموس.");
    return {
      type: 'MapLiteralExpr',
      entries,
      loc: this.mergeLoc(startTok.loc, endTok.loc),
    };
  }

  private parseMatchExpr(startTok: Token): MatchExpr {
    const subject = this.expression();
    const hasBraces = this.match(TokenType.LBRACE);
    if (!hasBraces) {
      this.match(TokenType.COLON);
    }

    const arms: MatchArm[] = [];
    while (!this.isAtEnd()) {
      if (hasBraces && this.check(TokenType.RBRACE)) break;

      let pattern: Expr | null = null;
      let isDefault = false;

      if (this.check(TokenType.IDENTIFIER) && (this.peek().lexeme === '_' || this.peek().lexeme === 'افتراضي')) {
        this.advance();
        isDefault = true;
      } else {
        try {
          pattern = this.expression();
        } catch {
          break;
        }
      }

      if (!this.match(TokenType.FAT_ARROW)) {
        if (!hasBraces) break;
        this.consume(TokenType.FAT_ARROW, "ينقص '=>' بعد نمط المطابقة.");
      }

      let body: Stmt[] | Expr;
      if (this.check(TokenType.LBRACE)) {
        const block = this.blockStatement();
        body = block.statements;
      } else {
        body = this.expression();
      }

      arms.push({ pattern, isDefault, body });
      this.match(TokenType.COMMA);

      if (!hasBraces && this.check(TokenType.SEMICOLON)) {
        this.advance();
      }
    }

    let endLoc = startTok.loc;
    if (hasBraces) {
      const endTok = this.consume(TokenType.RBRACE, "ينقص '}' بعد حالات المطابقة.");
      endLoc = endTok.loc;
    } else if (arms.length > 0) {
      endLoc = (arms[arms.length - 1].body as any).loc || startTok.loc;
    }

    return {
      type: 'MatchExpr',
      subject,
      arms,
      loc: this.mergeLoc(startTok.loc, endLoc),
    };
  }

  private parseFunctionExpr(startTok: Token): FunctionExpr {
    this.consume(TokenType.LPAREN, "ينقص '(' بعد 'دالة'.");
    const params: { name: string; type?: string }[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const paramName = this.consume(TokenType.IDENTIFIER, "ينقص اسم المعامل.");
        let paramType: string | undefined = undefined;
        if (this.match(TokenType.COLON)) {
          const typeTok = this.consume(TokenType.IDENTIFIER, "ينقص نوع المعامل.");
          paramType = typeTok.lexeme;
        }
        params.push({ name: paramName.lexeme, type: paramType });
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "ينقص ')' بعد معاملات الدالة.");

    let returnType: string | undefined = undefined;
    if (this.match(TokenType.ARROW)) {
      const retToken = this.consume(TokenType.IDENTIFIER, "ينقص نوع الإرجاع بعد '->'.");
      returnType = retToken.lexeme;
    }

    if (this.match(TokenType.FAT_ARROW)) {
      const expr = this.expression();
      return {
        type: 'FunctionExpr',
        params,
        returnType,
        body: {
          type: 'BlockStmt',
          statements: [{
            type: 'ReturnStmt',
            value: expr,
            loc: expr.loc,
          }],
          loc: expr.loc,
        },
        loc: this.mergeLoc(startTok.loc, expr.loc),
      };
    }

    if (this.check(TokenType.LBRACE)) {
      const body = this.blockStatement();
      return {
        type: 'FunctionExpr',
        params,
        returnType,
        body,
        loc: this.mergeLoc(startTok.loc, body.loc),
      };
    }

    this.match(TokenType.COLON);
    const body = this.blockStatement(startTok.loc.column);

    return {
      type: 'FunctionExpr',
      params,
      returnType,
      body,
      loc: this.mergeLoc(startTok.loc, body.loc),
    };
  }

  // ---------------------------------------------------------------------------
  // Helper methods
  // ---------------------------------------------------------------------------

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private optionalSemicolon(): void {
    if (this.match(TokenType.SEMICOLON)) {
      // Semicolon consumed
    }
  }

  private error(token: Token, message: string): Error {
    const loc = token.loc || { file: this.filename, line: 1, column: 1 };
    const err = `[${loc.file}:${loc.line}:${loc.column}] خطأ نحوي: ${message}`;
    this.errors.push(err);
    return new Error(err);
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.VAL:
        case TokenType.VAR:
        case TokenType.FUNC:
        case TokenType.WHEN:
        case TokenType.WHILE:
        case TokenType.FOR:
        case TokenType.REPEAT:
        case TokenType.RETURN:
        case TokenType.IMPORT:
          return;
      }

      this.advance();
    }
  }

  private mergeLoc(start: SourceLocation, end: SourceLocation): SourceLocation {
    return {
      file: start.file,
      line: start.line,
      column: start.column,
      offset: start.offset,
      length: (end.offset + end.length) - start.offset,
    };
  }
}
