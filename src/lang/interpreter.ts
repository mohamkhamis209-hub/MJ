/**
 * MJ Programming Language - Arabic-First AST Tree-Walk Interpreter
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

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
} from './ast';
import { TokenType, SourceLocation } from './tokens';
import { ExecutionContext, createStandardLibrary, formatMJValue } from './stdlib';

export class ReturnSignal {
  public value: any;
  constructor(value: any) {
    this.value = value;
  }
}

export class BreakSignal {}
export class ContinueSignal {}

export interface RuntimeTraceItem {
  functionName: string;
  loc: SourceLocation;
}

export class Environment {
  private values: Map<string, any> = new Map();
  private mutables: Set<string> = new Set();
  public parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  public define(name: string, value: any, isMutable: boolean = false): void {
    this.values.set(name, value);
    if (isMutable) {
      this.mutables.add(name);
    }
  }

  public assign(name: string, value: any, loc: SourceLocation): void {
    if (this.values.has(name)) {
      if (!this.mutables.has(name)) {
        throw new Error(
          `[${loc.file}:${loc.line}:${loc.column}] خطأ تشغيلي: لا يمكن إعادة تعيين قيمة الثابت '${name}'. استخدم 'متغير' بدلاً من 'ثابت' إذا كنت تريد تعديله.`
        );
      }
      this.values.set(name, value);
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value, loc);
      return;
    }

    throw new Error(
      `[${loc.file}:${loc.line}:${loc.column}] خطأ تشغيلي: المتغير '${name}' غير معرف.`
    );
  }

  public get(name: string, loc?: SourceLocation): any {
    if (this.values.has(name)) {
      return this.values.get(name);
    }

    if (this.parent) {
      return this.parent.get(name, loc);
    }

    const locStr = loc ? `[${loc.file}:${loc.line}:${loc.column}] ` : '';
    throw new Error(`${locStr}خطأ تشغيلي: المتغير '${name}' غير معرف.`);
  }
}

export interface MJFunction {
  __isMJFunction: true;
  name: string;
  params: { name: string; type?: string }[];
  body: BlockStmt;
  closure: Environment;
}

export interface InterpreterResult {
  success: boolean;
  instructionsExecuted: number;
  durationMs: number;
  stdout: string[];
  stderr: string[];
  returnValue?: any;
}

export class Interpreter {
  public globalEnv: Environment;
  public currentEnv: Environment;
  private fuel: number;
  private initialFuel: number;
  private instructionsExecuted: number = 0;
  private callStack: RuntimeTraceItem[] = [];
  private stdout: string[] = [];
  private stderr: string[] = [];
  private customModules: Map<string, Environment> = new Map();
  private isCancelled: boolean = false;
  private inputQueue: string[] = [];
  private onInputRequest?: (promptText?: string) => Promise<string> | string;

  constructor(options?: {
    maxFuel?: number;
    customModules?: Map<string, Environment>;
    onPrint?: (text: string) => void;
    onPrintln?: (text: string) => void;
    onInputRequest?: (promptText?: string) => Promise<string> | string;
    inputQueue?: string[];
  }) {
    this.initialFuel = options?.maxFuel ?? 300000;
    this.fuel = this.initialFuel;
    if (options?.customModules) {
      this.customModules = options.customModules;
    }
    if (options?.inputQueue) {
      this.inputQueue = [...options.inputQueue];
    }
    this.onInputRequest = options?.onInputRequest;

    this.globalEnv = new Environment(null);
    this.currentEnv = this.globalEnv;

    const ctx: ExecutionContext = {
      print: (text: string) => {
        if (this.isCancelled) return;
        this.stdout.push(text);
        if (options?.onPrint) options.onPrint(text);
      },
      println: (text: string) => {
        if (this.isCancelled) return;
        this.stdout.push(text + '\n');
        if (options?.onPrintln) options.onPrintln(text);
      },
      read: (promptText?: string) => {
        if (this.inputQueue.length > 0) {
          return this.inputQueue.shift()!;
        }
        if (this.onInputRequest) {
          return this.onInputRequest(promptText);
        }
        throw new Error("خطأ تشغيلي: تم استدعاء دالة 'اقرأ' ولكن لا توجد مدخلات متاحة (لم يتم توفير inputQueue أو onInputRequest).");
      },
      getFuelRemaining: () => this.fuel,
    };

    const stdlib = createStandardLibrary(ctx, (fn, args) =>
      this.callMJFunction(fn, args, {
        file: '<المكتبة_القياسية>',
        line: 1,
        column: 1,
        offset: 0,
        length: 0,
      })
    );

    for (const [key, val] of Object.entries(stdlib)) {
      this.globalEnv.define(key, val, false);
    }
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  public registerModule(name: string, env: Environment): void {
    this.customModules.set(name, env);
  }

  public interpret(program: Program): InterpreterResult {
    const startTime = performance.now();
    this.instructionsExecuted = 0;
    this.fuel = this.initialFuel;
    if (this.isCancelled) {
      return {
        success: false,
        instructionsExecuted: 0,
        durationMs: 0,
        stdout: this.stdout,
        stderr: ["تم إلغاء تنفيذ البرنامج يدوياً."],
      };
    }

    try {
      let lastVal: any = undefined;
      for (const stmt of program.statements) {
        lastVal = this.executeStmt(stmt);
      }

      const durationMs = performance.now() - startTime;
      return {
        success: true,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stdout: this.stdout,
        stderr: this.stderr,
        returnValue: lastVal,
      };
    } catch (err: any) {
      const durationMs = performance.now() - startTime;
      const errorMsg = this.formatRuntimeError(err);
      this.stderr.push(errorMsg);

      return {
        success: false,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stdout: this.stdout,
        stderr: this.stderr,
      };
    }
  }

  public async interpretAsync(program: Program): Promise<InterpreterResult> {
    const startTime = performance.now();
    this.instructionsExecuted = 0;
    this.fuel = this.initialFuel;

    if (this.isCancelled) {
      this.isCancelled = false;
      return {
        success: false,
        instructionsExecuted: 0,
        durationMs: 0,
        stdout: this.stdout,
        stderr: ["تم إلغاء تنفيذ البرنامج يدوياً."],
      };
    }

    try {
      let lastVal: any = undefined;
      for (const stmt of program.statements) {
        if (this.isCancelled) {
          throw new Error("تم إلغاء تنفيذ البرنامج يدوياً.");
        }
        lastVal = await this.executeStmtAsync(stmt);
      }

      const durationMs = performance.now() - startTime;
      return {
        success: true,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stdout: this.stdout,
        stderr: this.stderr,
        returnValue: lastVal,
      };
    } catch (err: any) {
      const durationMs = performance.now() - startTime;
      const errorMsg = this.formatRuntimeError(err);
      this.stderr.push(errorMsg);

      return {
        success: false,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stdout: this.stdout,
        stderr: this.stderr,
      };
    }
  }

  private stepFuel(loc: SourceLocation): void {
    if (this.isCancelled) {
      throw new Error("تم إلغاء تنفيذ البرنامج يدوياً.");
    }
    this.instructionsExecuted++;
    this.fuel--;
    if (this.fuel <= 0) {
      throw new Error(
        `[${loc.file}:${loc.line}:${loc.column}] خطأ أمني: تم استهلاك الحد الأقصى للطاقة (${this.initialFuel} خطوة). احتمال وجود حلقة تكرارية غير منتهية.`
      );
    }
  }

  private executeStmt(stmt: Stmt): any {
    this.stepFuel(stmt.loc);

    switch (stmt.type) {
      case 'VarDeclStmt': {
        const val = this.evaluateExpr(stmt.initializer);
        this.currentEnv.define(stmt.name, val, stmt.isMutable);
        return val;
      }

      case 'FunctionDeclStmt': {
        const fn: MJFunction = {
          __isMJFunction: true,
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: this.currentEnv,
        };
        this.currentEnv.define(stmt.name, fn, false);
        return fn;
      }

      case 'ExprStmt':
        return this.evaluateExpr(stmt.expression);

      case 'BlockStmt':
        return this.executeBlock(stmt.statements, new Environment(this.currentEnv));

      case 'WhenStmt': {
        const conditionVal = this.evaluateExpr(stmt.condition);
        if (this.isTruthy(conditionVal)) {
          return this.executeStmt(stmt.thenBranch);
        } else if (stmt.elseBranch) {
          return this.executeStmt(stmt.elseBranch);
        }
        return null;
      }

      case 'WhileStmt': {
        let lastVal: any = null;
        while (this.isTruthy(this.evaluateExpr(stmt.condition))) {
          try {
            lastVal = this.executeStmt(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return lastVal;
      }

      case 'ForInStmt': {
        const iterable = this.evaluateExpr(stmt.iterable);
        if (!Array.isArray(iterable) && typeof iterable !== 'string') {
          throw new Error(
            `[${stmt.loc.file}:${stmt.loc.line}:${stmt.loc.column}] خطأ تشغيلي: جملة 'لكل' تتوقع قائمة أو نصاً، وليس ${typeof iterable}.`
          );
        }

        let lastVal: any = null;
        for (const item of iterable) {
          const loopEnv = new Environment(this.currentEnv);
          loopEnv.define(stmt.variable, item, false);
          try {
            const prev = this.currentEnv;
            this.currentEnv = loopEnv;
            lastVal = this.executeStmt(stmt.body);
            this.currentEnv = prev;
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return lastVal;
      }

      case 'RepeatStmt': {
        const countVal = this.evaluateExpr(stmt.count);
        const count = Math.max(0, Math.floor(Number(countVal)));
        let lastVal: any = null;
        for (let i = 0; i < count; i++) {
          try {
            lastVal = this.executeStmt(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return lastVal;
      }

      case 'ReturnStmt': {
        const val = stmt.value ? this.evaluateExpr(stmt.value) : null;
        throw new ReturnSignal(val);
      }

      case 'BreakStmt':
        throw new BreakSignal();

      case 'ContinueStmt':
        throw new ContinueSignal();

      case 'ImportStmt': {
        const normalizedPath = stmt.path.startsWith('./') ? stmt.path.substring(2) : stmt.path;
        const modEnv =
          this.customModules.get(stmt.path) ||
          this.customModules.get(normalizedPath) ||
          this.customModules.get('./' + stmt.path);
        if (!modEnv) {
          if (stmt.alias) {
            const stdVal = this.globalEnv.get(stmt.alias);
            if (stdVal) return stdVal;
          }
          throw new Error(
            `[${stmt.loc.file}:${stmt.loc.line}:${stmt.loc.column}] خطأ تشغيلي: تعذر العثور على الملف المستورد '${stmt.path}'.`
          );
        }
        if (stmt.alias) {
          const modObj: Record<string, any> = {};
          (modEnv as any).values.forEach((v: any, k: string) => {
            modObj[k] = v;
          });
          this.currentEnv.define(stmt.alias, modObj, false);
        }
        return null;
      }
    }
  }

  private async executeStmtAsync(stmt: Stmt): Promise<any> {
    this.stepFuel(stmt.loc);

    if ((this.instructionsExecuted & 0x1ff) === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (this.isCancelled) {
        throw new Error("تم إلغاء تنفيذ البرنامج يدوياً.");
      }
    }

    switch (stmt.type) {
      case 'VarDeclStmt': {
        const val = await this.evaluateExprAsync(stmt.initializer);
        this.currentEnv.define(stmt.name, val, stmt.isMutable);
        return val;
      }

      case 'FunctionDeclStmt': {
        const fn: MJFunction = {
          __isMJFunction: true,
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: this.currentEnv,
        };
        this.currentEnv.define(stmt.name, fn, false);
        return fn;
      }

      case 'ExprStmt':
        return await this.evaluateExprAsync(stmt.expression);

      case 'BlockStmt':
        return await this.executeBlockAsync(stmt.statements, new Environment(this.currentEnv));

      case 'WhenStmt': {
        const conditionVal = await this.evaluateExprAsync(stmt.condition);
        if (this.isTruthy(conditionVal)) {
          return await this.executeStmtAsync(stmt.thenBranch);
        } else if (stmt.elseBranch) {
          return await this.executeStmtAsync(stmt.elseBranch);
        }
        return null;
      }

      case 'WhileStmt': {
        let lastVal: any = null;
        while (this.isTruthy(await this.evaluateExprAsync(stmt.condition))) {
          try {
            lastVal = await this.executeStmtAsync(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return lastVal;
      }

      case 'ForInStmt': {
        const iterable = await this.evaluateExprAsync(stmt.iterable);
        if (!Array.isArray(iterable) && typeof iterable !== 'string') {
          throw new Error(
            `[${stmt.loc.file}:${stmt.loc.line}:${stmt.loc.column}] خطأ تشغيلي: جملة 'لكل' تتوقع قائمة أو نصاً، وليس ${typeof iterable}.`
          );
        }

        let lastVal: any = null;
        for (const item of iterable) {
          const loopEnv = new Environment(this.currentEnv);
          loopEnv.define(stmt.variable, item, false);
          try {
            const prev = this.currentEnv;
            this.currentEnv = loopEnv;
            lastVal = await this.executeStmtAsync(stmt.body);
            this.currentEnv = prev;
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return lastVal;
      }

      case 'RepeatStmt': {
        const countVal = await this.evaluateExprAsync(stmt.count);
        const count = Math.max(0, Math.floor(Number(countVal)));
        let lastVal: any = null;
        for (let i = 0; i < count; i++) {
          try {
            lastVal = await this.executeStmtAsync(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return lastVal;
      }

      case 'ReturnStmt': {
        const val = stmt.value ? await this.evaluateExprAsync(stmt.value) : null;
        throw new ReturnSignal(val);
      }

      case 'BreakStmt':
        throw new BreakSignal();

      case 'ContinueStmt':
        throw new ContinueSignal();

      case 'ImportStmt':
        return this.executeStmt(stmt);
    }
  }

  private executeBlock(statements: Stmt[], env: Environment): any {
    const previous = this.currentEnv;
    try {
      this.currentEnv = env;
      let lastVal: any = null;
      for (const statement of statements) {
        lastVal = this.executeStmt(statement);
      }
      return lastVal;
    } finally {
      this.currentEnv = previous;
    }
  }

  private async executeBlockAsync(statements: Stmt[], env: Environment): Promise<any> {
    const previous = this.currentEnv;
    try {
      this.currentEnv = env;
      let lastVal: any = null;
      for (const statement of statements) {
        lastVal = await this.executeStmtAsync(statement);
      }
      return lastVal;
    } finally {
      this.currentEnv = previous;
    }
  }

  private evaluateExpr(expr: Expr): any {
    this.stepFuel(expr.loc);

    switch (expr.type) {
      case 'LiteralExpr':
        return expr.value;

      case 'IdentifierExpr':
        return this.currentEnv.get(expr.name, expr.loc);

      case 'AssignExpr': {
        const val = this.evaluateExpr(expr.value);
        if (expr.target.type === 'IdentifierExpr') {
          this.currentEnv.assign(expr.target.name, val, expr.target.loc);
          return val;
        } else if (expr.target.type === 'IndexExpr') {
          const obj = this.evaluateExpr(expr.target.object);
          const idx = this.evaluateExpr(expr.target.index);
          if (Array.isArray(obj)) {
            const numIdx = Number(idx);
            if (numIdx < 0 || numIdx >= obj.length) {
              throw new Error(
                `[${expr.target.loc.file}:${expr.target.loc.line}:${expr.target.loc.column}] خطأ تشغيلي: الفهرس ${idx} خارج حدود القائمة (طولها ${obj.length}).`
              );
            }
            obj[numIdx] = val;
            return val;
          } else if (typeof obj === 'object' && obj !== null) {
            obj[String(idx)] = val;
            return val;
          }
          throw new Error(
            `[${expr.target.loc.file}:${expr.target.loc.line}:${expr.target.loc.column}] خطأ تشغيلي: هدف الفهرسة غير صالح.`
          );
        } else if (expr.target.type === 'MemberExpr') {
          const obj = this.evaluateExpr(expr.target.object);
          if (typeof obj === 'object' && obj !== null) {
            obj[expr.target.property] = val;
            return val;
          }
          throw new Error(
            `[${expr.target.loc.file}:${expr.target.loc.line}:${expr.target.loc.column}] خطأ تشغيلي: لا يمكن تعيين خاصية '${expr.target.property}'.`
          );
        }
        return val;
      }

      case 'BinaryExpr': {
        const left = this.evaluateExpr(expr.left);
        const op = expr.operator.type;

        if (op === TokenType.AND) {
          return this.isTruthy(left) ? this.evaluateExpr(expr.right) : left;
        }
        if (op === TokenType.OR) {
          return this.isTruthy(left) ? left : this.evaluateExpr(expr.right);
        }

        const right = this.evaluateExpr(expr.right);

        switch (op) {
          case TokenType.PLUS:
            if (typeof left === 'string' || typeof right === 'string') {
              return formatMJValue(left) + formatMJValue(right);
            }
            return Number(left) + Number(right);

          case TokenType.MINUS:
            return Number(left) - Number(right);

          case TokenType.STAR:
            return Number(left) * Number(right);

          case TokenType.SLASH:
            if (Number(right) === 0) {
              throw new Error(
                `[${expr.loc.file}:${expr.loc.line}:${expr.loc.column}] خطأ تشغيلي: لا يمكن القسمة على صفر.`
              );
            }
            return Number(left) / Number(right);

          case TokenType.PERCENT:
            return Number(left) % Number(right);

          case TokenType.EQUAL_EQUAL:
            return this.isEqual(left, right);

          case TokenType.BANG_EQUAL:
            return !this.isEqual(left, right);

          case TokenType.LESS:
            return Number(left) < Number(right);

          case TokenType.LESS_EQUAL:
            return Number(left) <= Number(right);

          case TokenType.GREATER:
            return Number(left) > Number(right);

          case TokenType.GREATER_EQUAL:
            return Number(left) >= Number(right);

          default:
            throw new Error(
              `[${expr.loc.file}:${expr.loc.line}:${expr.loc.column}] خطأ تشغيلي: معامل غير معروف '${expr.operator.lexeme}'.`
            );
        }
      }

      case 'UnaryExpr': {
        const right = this.evaluateExpr(expr.right);
        switch (expr.operator.type) {
          case TokenType.BANG:
            return !this.isTruthy(right);
          case TokenType.MINUS:
            return -Number(right);
          default:
            throw new Error(`معامل أحادي غير معروف '${expr.operator.lexeme}'.`);
        }
      }

      case 'CallExpr': {
        const callee = this.evaluateExpr(expr.callee);
        const args = expr.args.map((a) => this.evaluateExpr(a));
        return this.callMJFunction(callee, args, expr.loc);
      }

      case 'MemberExpr': {
        const obj = this.evaluateExpr(expr.object);
        if (obj === null || obj === undefined) {
          throw new Error(
            `[${expr.loc.file}:${expr.loc.line}:${expr.loc.column}] خطأ تشغيلي: لا يمكن قراءة الخاصية '${expr.property}' من قيمة فارغة.`
          );
        }
        return obj[expr.property];
      }

      case 'IndexExpr': {
        const obj = this.evaluateExpr(expr.object);
        const index = this.evaluateExpr(expr.index);
        if (Array.isArray(obj)) {
          const i = Number(index);
          if (i < 0 || i >= obj.length) return null;
          return obj[i];
        }
        if (typeof obj === 'string') {
          const i = Number(index);
          if (i < 0 || i >= obj.length) return '';
          return obj.charAt(i);
        }
        if (typeof obj === 'object' && obj !== null) {
          return obj[String(index)];
        }
        throw new Error(
          `[${expr.loc.file}:${expr.loc.line}:${expr.loc.column}] خطأ تشغيلي: لا يمكن فهرسة قيمة من نوع '${typeof obj}'.`
        );
      }

      case 'ListLiteralExpr':
        return expr.elements.map((el) => this.evaluateExpr(el));

      case 'MapLiteralExpr': {
        const obj: Record<string, any> = {};
        for (const entry of expr.entries) {
          const key = this.evaluateExpr(entry.key);
          const val = this.evaluateExpr(entry.value);
          obj[String(key)] = val;
        }
        return obj;
      }

      case 'FunctionExpr': {
        const fn: MJFunction = {
          __isMJFunction: true,
          name: '<دالة_مجهولة>',
          params: expr.params,
          body: expr.body,
          closure: this.currentEnv,
        };
        return fn;
      }

      case 'MatchExpr': {
        const subjectVal = this.evaluateExpr(expr.subject);
        for (const arm of expr.arms) {
          if (arm.isDefault) {
            return this.executeArmBody(arm.body);
          }
          if (arm.pattern) {
            const patternVal = this.evaluateExpr(arm.pattern);
            if (this.isEqual(subjectVal, patternVal)) {
              return this.executeArmBody(arm.body);
            }
          }
        }
        return null;
      }
    }
  }

  private async evaluateExprAsync(expr: Expr): Promise<any> {
    this.stepFuel(expr.loc);

    switch (expr.type) {
      case 'LiteralExpr':
      case 'IdentifierExpr':
        return this.evaluateExpr(expr);

      case 'AssignExpr': {
        const val = await this.evaluateExprAsync(expr.value);
        if (expr.target.type === 'IdentifierExpr') {
          this.currentEnv.assign(expr.target.name, val, expr.target.loc);
          return val;
        }
        return this.evaluateExpr(expr);
      }

      case 'BinaryExpr': {
        const op = expr.operator.type;
        if (op === TokenType.AND) {
          const left = await this.evaluateExprAsync(expr.left);
          return this.isTruthy(left) ? await this.evaluateExprAsync(expr.right) : left;
        }
        if (op === TokenType.OR) {
          const left = await this.evaluateExprAsync(expr.left);
          return this.isTruthy(left) ? left : await this.evaluateExprAsync(expr.right);
        }

        const left = await this.evaluateExprAsync(expr.left);
        const right = await this.evaluateExprAsync(expr.right);
        if (op === TokenType.PLUS) {
          if (typeof left === 'string' || typeof right === 'string') {
            return formatMJValue(left) + formatMJValue(right);
          }
          return Number(left) + Number(right);
        }
        if (op === TokenType.MINUS) return Number(left) - Number(right);
        if (op === TokenType.STAR) return Number(left) * Number(right);
        if (op === TokenType.SLASH) {
          if (Number(right) === 0) throw new Error("خطأ تشغيلي: لا يمكن القسمة على صفر.");
          return Number(left) / Number(right);
        }
        return this.evaluateExpr(expr);
      }

      case 'CallExpr': {
        const callee = await this.evaluateExprAsync(expr.callee);
        const args: any[] = [];
        for (const a of expr.args) {
          args.push(await this.evaluateExprAsync(a));
        }
        return await this.callMJFunctionAsync(callee, args, expr.loc);
      }

      default:
        return this.evaluateExpr(expr);
    }
  }

  private executeArmBody(body: Stmt[] | Expr): any {
    if (Array.isArray(body)) {
      return this.executeBlock(body, new Environment(this.currentEnv));
    }
    return this.evaluateExpr(body);
  }

  public async callMJFunctionAsync(callee: any, args: any[], loc: SourceLocation): Promise<any> {
    if (this.callStack.length > 500) {
      throw new Error(
        `[${loc.file}:${loc.line}:${loc.column}] خطأ أمني: تجاوز أقصى عمق لمكدس الاستدعاءات (500 إطار). احتمال وجود استدعاء ذاتي غير منتهٍ.`
      );
    }

    if (callee && callee.__isMJFunction) {
      const fn = callee as MJFunction;
      const fnEnv = new Environment(fn.closure);

      for (let i = 0; i < fn.params.length; i++) {
        const param = fn.params[i];
        const val = i < args.length ? args[i] : null;
        fnEnv.define(param.name, val, false);
      }

      this.callStack.push({ functionName: fn.name, loc });
      try {
        await this.executeBlockAsync(fn.body.statements, fnEnv);
        return null;
      } catch (sig) {
        if (sig instanceof ReturnSignal) {
          return sig.value;
        }
        throw sig;
      } finally {
        this.callStack.pop();
      }
    }

    if (typeof callee === 'function') {
      try {
        const res = callee(...args);
        return res instanceof Promise ? await res : res;
      } catch (err: any) {
        throw new Error(`[${loc.file}:${loc.line}:${loc.column}] خطأ في استدعاء دالة قياسية: ${err.message}`);
      }
    }

    throw new Error(
      `[${loc.file}:${loc.line}:${loc.column}] خطأ تشغيلي: '${formatMJValue(callee)}' ليس دالة قابلة للاستدعاء.`
    );
  }

  public callMJFunction(callee: any, args: any[], loc: SourceLocation): any {
    if (this.callStack.length > 500) {
      throw new Error(
        `[${loc.file}:${loc.line}:${loc.column}] خطأ أمني: تجاوز أقصى عمق لمكدس الاستدعاءات (500 إطار). احتمال وجود استدعاء ذاتي غير منتهٍ.`
      );
    }

    if (callee && callee.__isMJFunction) {
      const fn = callee as MJFunction;
      const fnEnv = new Environment(fn.closure);

      for (let i = 0; i < fn.params.length; i++) {
        const param = fn.params[i];
        const val = i < args.length ? args[i] : null;
        fnEnv.define(param.name, val, false);
      }

      this.callStack.push({ functionName: fn.name, loc });
      try {
        this.executeBlock(fn.body.statements, fnEnv);
        return null;
      } catch (sig) {
        if (sig instanceof ReturnSignal) {
          return sig.value;
        }
        throw sig;
      } finally {
        this.callStack.pop();
      }
    }

    if (typeof callee === 'function') {
      try {
        return callee(...args);
      } catch (err: any) {
        throw new Error(`[${loc.file}:${loc.line}:${loc.column}] خطأ في استدعاء دالة قياسية: ${err.message}`);
      }
    }

    throw new Error(
      `[${loc.file}:${loc.line}:${loc.column}] خطأ تشغيلي: '${formatMJValue(callee)}' ليس دالة قابلة للاستدعاء.`
    );
  }

  private isTruthy(val: any): boolean {
    if (val === null || val === undefined) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') return val.length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }

  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.isEqual(item, b[i]));
    }
    return false;
  }

  private formatRuntimeError(err: any): string {
    let msg = err.message || String(err);
    if (this.callStack.length > 0) {
      msg += '\nتتبع الاستدعاءات (الأحدث أولاً):';
      for (let i = this.callStack.length - 1; i >= 0; i--) {
        const frame = this.callStack[i];
        msg += `\n  في ${frame.functionName} (${frame.loc.file}:${frame.loc.line}:${frame.loc.column})`;
      }
    }
    return msg;
  }
}
