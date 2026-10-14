/**
 * MJ Programming Language - Arabic-First Semantic Analyzer
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import {
  Program,
  Stmt,
  Expr,
  VarDeclStmt,
  FunctionDeclStmt,
  AssignExpr,
  IdentifierExpr,
  ReturnStmt,
  BreakStmt,
  ContinueStmt,
  CallExpr,
  BinaryExpr,
  UnaryExpr,
  WhenStmt,
  WhileStmt,
  ForInStmt,
  RepeatStmt,
  BlockStmt,
} from './ast';
import { SourceLocation } from './tokens';

export interface SymbolInfo {
  name: string;
  isMutable: boolean; // false = ثابت (val), true = متغير (var)
  type?: string;
  isFunction: boolean;
  paramCount?: number;
  loc: SourceLocation;
}

export class Scope {
  public symbols: Map<string, SymbolInfo> = new Map();
  public parent: Scope | null;
  public isFunctionScope: boolean;
  public isLoopScope: boolean;

  constructor(parent: Scope | null = null, isFunctionScope = false, isLoopScope = false) {
    this.parent = parent;
    this.isFunctionScope = isFunctionScope || (parent ? parent.isFunctionScope : false);
    this.isLoopScope = isLoopScope || (parent ? parent.isLoopScope : false);
  }

  public define(symbol: SymbolInfo): boolean {
    if (this.symbols.has(symbol.name)) {
      return false;
    }
    this.symbols.set(symbol.name, symbol);
    return true;
  }

  public resolve(name: string): SymbolInfo | null {
    if (this.symbols.has(name)) {
      return this.symbols.get(name)!;
    }
    if (this.parent) {
      return this.parent.resolve(name);
    }
    return null;
  }

  public isInLoop(): boolean {
    let curr: Scope | null = this;
    while (curr) {
      if (curr.isLoopScope) return true;
      if (curr.isFunctionScope) return false;
      curr = curr.parent;
    }
    return false;
  }

  public isInFunction(): boolean {
    let curr: Scope | null = this;
    while (curr) {
      if (curr.isFunctionScope) return true;
      curr = curr.parent;
    }
    return false;
  }
}

export class SemanticAnalyzer {
  private errors: string[] = [];
  private warnings: string[] = [];
  private currentScope: Scope;

  constructor() {
    this.currentScope = new Scope(null);
    this.installBuiltins();
  }

  private installBuiltins(): void {
    const dummyLoc: SourceLocation = { file: '<المكتبة_القياسية>', line: 1, column: 1, offset: 0, length: 0 };

    const builtins = [
      // Arabic built-in names
      { name: 'اطبع', isFunction: true, isMutable: false },
      { name: 'اقرأ', isFunction: true, isMutable: false },
      { name: 'نوع', isFunction: true, isMutable: false, paramCount: 1 },
      { name: 'تأكد', isFunction: true, isMutable: false },
      { name: 'الطباعة', isFunction: false, isMutable: false },
      { name: 'الرياضيات', isFunction: false, isMutable: false },
      { name: 'النصوص', isFunction: false, isMutable: false },
      { name: 'القوائم', isFunction: false, isMutable: false },
      { name: 'النظام', isFunction: false, isMutable: false },

      // Compatibility English built-in names
      { name: 'io', isFunction: false, isMutable: false },
      { name: 'math', isFunction: false, isMutable: false },
      { name: 'str', isFunction: false, isMutable: false },
      { name: 'list', isFunction: false, isMutable: false },
      { name: 'sys', isFunction: false, isMutable: false },
      { name: 'typeOf', isFunction: true, isMutable: false, paramCount: 1 },
      { name: 'assert', isFunction: true, isMutable: false, paramCount: 2 },
    ];

    for (const b of builtins) {
      this.currentScope.define({
        name: b.name,
        isMutable: b.isMutable,
        isFunction: b.isFunction,
        paramCount: b.paramCount,
        loc: dummyLoc,
      });
    }
  }

  public analyze(program: Program): { errors: string[]; warnings: string[] } {
    this.errors = [];
    this.warnings = [];

    for (const stmt of program.statements) {
      this.analyzeStmt(stmt);
    }

    return { errors: this.errors, warnings: this.warnings };
  }

  private analyzeStmt(stmt: Stmt): void {
    switch (stmt.type) {
      case 'VarDeclStmt':
        this.analyzeVarDecl(stmt);
        break;

      case 'FunctionDeclStmt':
        this.analyzeFunctionDecl(stmt);
        break;

      case 'ExprStmt':
        this.analyzeExpr(stmt.expression);
        break;

      case 'BlockStmt':
        this.analyzeBlock(stmt);
        break;

      case 'WhenStmt':
        this.analyzeWhen(stmt);
        break;

      case 'WhileStmt':
        this.analyzeWhile(stmt);
        break;

      case 'ForInStmt':
        this.analyzeForIn(stmt);
        break;

      case 'RepeatStmt':
        this.analyzeRepeat(stmt);
        break;

      case 'ReturnStmt':
        this.analyzeReturn(stmt);
        break;

      case 'BreakStmt':
        this.analyzeBreak(stmt);
        break;

      case 'ContinueStmt':
        this.analyzeContinue(stmt);
        break;

      case 'ImportStmt':
        if (stmt.alias) {
          this.currentScope.define({
            name: stmt.alias,
            isMutable: false,
            isFunction: false,
            loc: stmt.loc,
          });
        }
        break;
    }
  }

  private analyzeVarDecl(stmt: VarDeclStmt): void {
    this.analyzeExpr(stmt.initializer);

    const existing = this.currentScope.symbols.get(stmt.name);
    if (existing) {
      this.addError(
        stmt.loc,
        `المعرف '${stmt.name}' تم تعريفه مسبقاً في هذا النطاق (التعريف السابق في السطر ${existing.loc.line}).`
      );
      return;
    }

    if (stmt.typeAnnotation && stmt.initializer.type === 'LiteralExpr') {
      const litType = this.getLiteralTypeName(stmt.initializer.value);
      if (litType && !this.typesCompatible(stmt.typeAnnotation, litType)) {
        this.addError(
          stmt.loc,
          `عدم تطابق في النوع: المتغير '${stmt.name}' معرف كنوع '${stmt.typeAnnotation}' ولكن تم إسناد قيمة من نوع '${litType}'.`
        );
      }
    }

    this.currentScope.define({
      name: stmt.name,
      isMutable: stmt.isMutable,
      type: stmt.typeAnnotation,
      isFunction: false,
      loc: stmt.loc,
    });
  }

  private analyzeFunctionDecl(stmt: FunctionDeclStmt): void {
    const defined = this.currentScope.define({
      name: stmt.name,
      isMutable: false,
      isFunction: true,
      paramCount: stmt.params.length,
      type: stmt.returnType,
      loc: stmt.loc,
    });

    if (!defined) {
      this.addError(stmt.loc, `الدالة '${stmt.name}' تم تعريفها مسبقاً في هذا النطاق.`);
    }

    const previousScope = this.currentScope;
    this.currentScope = new Scope(previousScope, true, false);

    for (const param of stmt.params) {
      this.currentScope.define({
        name: param.name,
        isMutable: false,
        type: param.type,
        isFunction: false,
        loc: stmt.loc,
      });
    }

    for (const s of stmt.body.statements) {
      this.analyzeStmt(s);
    }

    this.currentScope = previousScope;
  }

  private analyzeBlock(stmt: BlockStmt): void {
    const previousScope = this.currentScope;
    this.currentScope = new Scope(previousScope, false, false);

    for (const s of stmt.statements) {
      this.analyzeStmt(s);
    }

    this.currentScope = previousScope;
  }

  private analyzeWhen(stmt: WhenStmt): void {
    this.analyzeExpr(stmt.condition);
    this.analyzeStmt(stmt.thenBranch);
    if (stmt.elseBranch) {
      this.analyzeStmt(stmt.elseBranch);
    }
  }

  private analyzeWhile(stmt: WhileStmt): void {
    this.analyzeExpr(stmt.condition);

    const previousScope = this.currentScope;
    this.currentScope = new Scope(previousScope, false, true);
    this.analyzeStmt(stmt.body);
    this.currentScope = previousScope;
  }

  private analyzeForIn(stmt: ForInStmt): void {
    this.analyzeExpr(stmt.iterable);

    const previousScope = this.currentScope;
    this.currentScope = new Scope(previousScope, false, true);

    this.currentScope.define({
      name: stmt.variable,
      isMutable: false,
      isFunction: false,
      loc: stmt.loc,
    });

    this.analyzeStmt(stmt.body);
    this.currentScope = previousScope;
  }

  private analyzeRepeat(stmt: RepeatStmt): void {
    this.analyzeExpr(stmt.count);

    const previousScope = this.currentScope;
    this.currentScope = new Scope(previousScope, false, true);
    this.analyzeStmt(stmt.body);
    this.currentScope = previousScope;
  }

  private analyzeReturn(stmt: ReturnStmt): void {
    if (!this.currentScope.isInFunction()) {
      this.addError(stmt.loc, "لا يمكن استخدام 'أرجع' خارج نطاق دالة.");
    }
    if (stmt.value) {
      this.analyzeExpr(stmt.value);
    }
  }

  private breakStatement(stmt: BreakStmt): void {
    if (!this.currentScope.isInLoop()) {
      this.addError(stmt.loc, "لا يمكن استخدام 'توقف' خارج حلقة تكرارية.");
    }
  }

  private continueStatement(stmt: ContinueStmt): void {
    if (!this.currentScope.isInLoop()) {
      this.addError(stmt.loc, "لا يمكن استخدام 'استمر' خارج حلقة تكرارية.");
    }
  }

  private analyzeBreak(stmt: BreakStmt): void {
    this.breakStatement(stmt);
  }

  private analyzeContinue(stmt: ContinueStmt): void {
    this.continueStatement(stmt);
  }

  private analyzeExpr(expr: Expr): void {
    switch (expr.type) {
      case 'IdentifierExpr': {
        const symbol = this.currentScope.resolve(expr.name);
        if (!symbol) {
          this.addError(
            expr.loc,
            `المتغير '${expr.name}' غير معرف. هل نسيت تعريفه باستخدام 'متغير' أو 'ثابت'؟`
          );
        }
        break;
      }

      case 'AssignExpr': {
        if (expr.target.type === 'IdentifierExpr') {
          const symbol = this.currentScope.resolve(expr.target.name);
          if (!symbol) {
            this.addError(expr.target.loc, `لا يمكن الإسناد إلى معرف غير معلن عنه '${expr.target.name}'.`);
          } else if (!symbol.isMutable) {
            this.addError(
              expr.target.loc,
              `لا يمكن إعادة تعيين قيمة الثابت '${expr.target.name}'. استخدم 'متغير' بدلاً من 'ثابت' إذا كنت بحاجة لتعديله.`
            );
          }
        } else if (expr.target.type === 'IndexExpr') {
          this.analyzeExpr(expr.target.object);
          this.analyzeExpr(expr.target.index);
        } else if (expr.target.type === 'MemberExpr') {
          this.analyzeExpr(expr.target.object);
        }
        this.analyzeExpr(expr.value);
        break;
      }

      case 'BinaryExpr':
        this.analyzeExpr(expr.left);
        this.analyzeExpr(expr.right);
        break;

      case 'UnaryExpr':
        this.analyzeExpr(expr.right);
        break;

      case 'CallExpr': {
        this.analyzeExpr(expr.callee);
        for (const arg of expr.args) {
          this.analyzeExpr(arg);
        }

        if (expr.callee.type === 'IdentifierExpr') {
          const symbol = this.currentScope.resolve(expr.callee.name);
          if (symbol && symbol.paramCount !== undefined) {
            if (expr.args.length !== symbol.paramCount) {
              this.addError(
                expr.loc,
                `الدالة '${symbol.name}' تتوقع ${symbol.paramCount} معامل(ات)، ولكن تم تمرير ${expr.args.length}.`
              );
            }
          }
        }
        break;
      }

      case 'MemberExpr':
        this.analyzeExpr(expr.object);
        break;

      case 'IndexExpr':
        this.analyzeExpr(expr.object);
        this.analyzeExpr(expr.index);
        break;

      case 'ListLiteralExpr':
        for (const el of expr.elements) {
          this.analyzeExpr(el);
        }
        break;

      case 'MapLiteralExpr':
        for (const entry of expr.entries) {
          this.analyzeExpr(entry.key);
          this.analyzeExpr(entry.value);
        }
        break;

      case 'FunctionExpr': {
        const previousScope = this.currentScope;
        this.currentScope = new Scope(previousScope, true, false);
        for (const param of expr.params) {
          this.currentScope.define({
            name: param.name,
            isMutable: false,
            type: param.type,
            isFunction: false,
            loc: expr.loc,
          });
        }
        for (const s of expr.body.statements) {
          this.analyzeStmt(s);
        }
        this.currentScope = previousScope;
        break;
      }

      case 'MatchExpr': {
        this.analyzeExpr(expr.subject);
        for (const arm of expr.arms) {
          if (arm.pattern) {
            this.analyzeExpr(arm.pattern);
          }
          if (Array.isArray(arm.body)) {
            for (const s of arm.body) this.analyzeStmt(s);
          } else {
            this.analyzeExpr(arm.body);
          }
        }
        break;
      }

      case 'LiteralExpr':
        break;
    }
  }

  private getLiteralTypeName(val: any): string | null {
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'عدد' : 'عدد_عشري';
    }
    if (typeof val === 'string') return 'نص';
    if (typeof val === 'boolean') return 'منطقي';
    if (val === null) return 'فارغ';
    return null;
  }

  private typesCompatible(expected: string, actual: string): boolean {
    const normalize = (t: string) => {
      switch (t) {
        case 'Int': return 'عدد';
        case 'Float': return 'عدد_عشري';
        case 'Str': return 'نص';
        case 'Bool': return 'منطقي';
        case 'List': return 'قائمة';
        case 'Map': return 'قاموس';
        default: return t;
      }
    };

    const exp = normalize(expected);
    const act = normalize(actual);

    if (exp === act) return true;
    if (exp === 'عدد_عشري' && act === 'عدد') return true;
    if (exp === 'أي' || exp === 'Any') return true;
    return false;
  }

  private addError(loc: SourceLocation, message: string): void {
    this.errors.push(`[${loc.file}:${loc.line}:${loc.column}] خطأ دلالي: ${message}`);
  }
}
