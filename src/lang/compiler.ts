/**
 * MJ Programming Language - Bytecode Compiler
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
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
  ExprStmt,
} from './ast';
import { TokenType } from './tokens';
import { OpCode, Chunk, createChunk, writeChunk, addConstant } from './bytecode';

export interface CompiledFunction {
  name: string;
  arity: number;
  chunk: Chunk;
  __isCompiledFunction: true;
}

interface Local {
  name: string;
  depth: number;
}

export class BytecodeCompiler {
  private chunk: Chunk;
  private locals: Local[] = [];
  private scopeDepth: number = 0;
  private loopStartOffsets: number[] = [];
  private loopBreakJumps: number[][] = [];
  public errors: string[] = [];

  constructor(chunk?: Chunk) {
    this.chunk = chunk || createChunk();
  }

  public compile(program: Program): { chunk: Chunk; errors: string[] } {
    this.errors = [];
    this.locals = [];
    this.scopeDepth = 0;

    for (const stmt of program.statements) {
      this.compileStmt(stmt);
    }

    // Halt instruction at end of main program
    this.emitByte(OpCode.OP_HALT, program.loc.line);

    return { chunk: this.chunk, errors: this.errors };
  }

  public compileFunction(fnStmt: FunctionDeclStmt | FunctionExpr): CompiledFunction {
    const fnCompiler = new BytecodeCompiler();
    fnCompiler.scopeDepth = 1;

    // Slot 0 is reserved for function self
    fnCompiler.locals.push({ name: '', depth: 0 });

    // Parameter locals
    for (const p of fnStmt.params) {
      fnCompiler.locals.push({ name: p.name, depth: 1 });
    }

    // Compile body
    for (const s of fnStmt.body.statements) {
      fnCompiler.compileStmt(s);
    }

    // Default return nil if function reaches end without return
    fnCompiler.emitByte(OpCode.OP_NIL, fnStmt.loc.line);
    fnCompiler.emitByte(OpCode.OP_RETURN, fnStmt.loc.line);

    return {
      name: 'name' in fnStmt ? fnStmt.name : '<lambda>',
      arity: fnStmt.params.length,
      chunk: fnCompiler.chunk,
      __isCompiledFunction: true,
    };
  }

  private compileStmt(stmt: Stmt): void {
    const line = stmt.loc.line;

    switch (stmt.type) {
      case 'VarDeclStmt': {
        this.compileExpr(stmt.initializer);
        if (this.scopeDepth > 0) {
          // Local variable
          this.locals.push({ name: stmt.name, depth: this.scopeDepth });
        } else {
          // Global variable
          const nameConst = addConstant(this.chunk, stmt.name);
          this.emitByte(OpCode.OP_DEF_GLOBAL, line);
          this.emitByte(nameConst, line);
        }
        break;
      }

      case 'FunctionDeclStmt': {
        const compiledFn = this.compileFunction(stmt);
        const constIdx = addConstant(this.chunk, compiledFn);
        this.emitByte(OpCode.OP_CONSTANT, line);
        this.emitByte(constIdx, line);

        if (this.scopeDepth > 0) {
          this.locals.push({ name: stmt.name, depth: this.scopeDepth });
        } else {
          const nameConst = addConstant(this.chunk, stmt.name);
          this.emitByte(OpCode.OP_DEF_GLOBAL, line);
          this.emitByte(nameConst, line);
        }
        break;
      }

      case 'ExprStmt':
        this.compileExpr(stmt.expression);
        this.emitByte(OpCode.OP_POP, line);
        break;

      case 'BlockStmt':
        this.beginScope();
        for (const s of stmt.statements) {
          this.compileStmt(s);
        }
        this.endScope(line);
        break;

      case 'WhenStmt': {
        this.compileExpr(stmt.condition);
        const thenJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
        this.emitByte(OpCode.OP_POP, line); // Pop condition result

        this.compileStmt(stmt.thenBranch);

        const elseJump = this.emitJump(OpCode.OP_JUMP, line);
        this.patchJump(thenJump);
        this.emitByte(OpCode.OP_POP, line); // Pop condition result on false branch

        if (stmt.elseBranch) {
          this.compileStmt(stmt.elseBranch);
        }
        this.patchJump(elseJump);
        break;
      }

      case 'WhileStmt': {
        const loopStart = this.chunk.code.length;
        this.loopStartOffsets.push(loopStart);
        this.loopBreakJumps.push([]);

        this.compileExpr(stmt.condition);
        const exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
        this.emitByte(OpCode.OP_POP, line); // Pop condition

        this.compileStmt(stmt.body);

        this.emitLoop(loopStart, line);
        this.patchJump(exitJump);
        this.emitByte(OpCode.OP_POP, line); // Pop condition on exit

        // Patch breaks
        const breaks = this.loopBreakJumps.pop() || [];
        for (const brk of breaks) {
          this.patchJump(brk);
        }
        this.loopStartOffsets.pop();
        break;
      }

      case 'ForInStmt': {
        // Compile iterable to list
        this.compileExpr(stmt.iterable);
        this.beginScope();

        // Slot for iterable: index 0 in scope
        this.locals.push({ name: '__iterable', depth: this.scopeDepth });
        // Slot for counter: index 1 in scope
        this.emitConstant(0, line);
        this.locals.push({ name: '__counter', depth: this.scopeDepth });

        const loopStart = this.chunk.code.length;
        this.loopStartOffsets.push(loopStart);
        this.loopBreakJumps.push([]);

        // Condition: counter < list.len(iterable)
        const iterSlot = this.resolveLocal('__iterable');
        const countSlot = this.resolveLocal('__counter');

        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(countSlot, line);
        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(iterSlot, line);
        // Get length and compare
        const lenConst = addConstant(this.chunk, 'length');
        this.emitByte(OpCode.OP_GET_PROP, line);
        this.emitByte(lenConst, line);
        this.emitByte(OpCode.OP_LESS, line);

        const exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
        this.emitByte(OpCode.OP_POP, line);

        // Fetch element: loopVar = iterable[counter]
        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(iterSlot, line);
        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(countSlot, line);
        this.emitByte(OpCode.OP_GET_INDEX, line);
        this.locals.push({ name: stmt.variable, depth: this.scopeDepth + 1 });

        this.compileStmt(stmt.body);

        // Pop loopVar
        this.emitByte(OpCode.OP_POP, line);
        this.locals.pop();

        // Increment counter
        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(countSlot, line);
        this.emitConstant(1, line);
        this.emitByte(OpCode.OP_ADD, line);
        this.emitByte(OpCode.OP_SET_LOCAL, line);
        this.emitByte(countSlot, line);
        this.emitByte(OpCode.OP_POP, line);

        this.emitLoop(loopStart, line);
        this.patchJump(exitJump);
        this.emitByte(OpCode.OP_POP, line);

        const breaks = this.loopBreakJumps.pop() || [];
        for (const brk of breaks) {
          this.patchJump(brk);
        }
        this.loopStartOffsets.pop();
        this.endScope(line);
        break;
      }

      case 'RepeatStmt': {
        this.compileExpr(stmt.count);
        this.beginScope();

        this.locals.push({ name: '__max_repeat', depth: this.scopeDepth });
        this.emitConstant(0, line);
        this.locals.push({ name: '__repeat_i', depth: this.scopeDepth });

        const loopStart = this.chunk.code.length;
        this.loopStartOffsets.push(loopStart);
        this.loopBreakJumps.push([]);

        const maxSlot = this.resolveLocal('__max_repeat');
        const iSlot = this.resolveLocal('__repeat_i');

        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(iSlot, line);
        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(maxSlot, line);
        this.emitByte(OpCode.OP_LESS, line);

        const exitJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
        this.emitByte(OpCode.OP_POP, line);

        this.compileStmt(stmt.body);

        // Increment i
        this.emitByte(OpCode.OP_GET_LOCAL, line);
        this.emitByte(iSlot, line);
        this.emitConstant(1, line);
        this.emitByte(OpCode.OP_ADD, line);
        this.emitByte(OpCode.OP_SET_LOCAL, line);
        this.emitByte(iSlot, line);
        this.emitByte(OpCode.OP_POP, line);

        this.emitLoop(loopStart, line);
        this.patchJump(exitJump);
        this.emitByte(OpCode.OP_POP, line);

        const breaks = this.loopBreakJumps.pop() || [];
        for (const brk of breaks) {
          this.patchJump(brk);
        }
        this.loopStartOffsets.pop();
        this.endScope(line);
        break;
      }

      case 'ReturnStmt':
        if (stmt.value) {
          this.compileExpr(stmt.value);
        } else {
          this.emitByte(OpCode.OP_NIL, line);
        }
        this.emitByte(OpCode.OP_RETURN, line);
        break;

      case 'BreakStmt': {
        const jump = this.emitJump(OpCode.OP_JUMP, line);
        if (this.loopBreakJumps.length > 0) {
          this.loopBreakJumps[this.loopBreakJumps.length - 1].push(jump);
        }
        break;
      }

      case 'ContinueStmt': {
        if (this.loopStartOffsets.length > 0) {
          const start = this.loopStartOffsets[this.loopStartOffsets.length - 1];
          this.emitLoop(start, line);
        }
        break;
      }

      case 'ImportStmt':
        // Standard or user module placeholder
        break;
    }
  }

  private compileExpr(expr: Expr): void {
    const line = expr.loc.line;

    switch (expr.type) {
      case 'LiteralExpr':
        if (expr.value === null) {
          this.emitByte(OpCode.OP_NIL, line);
        } else if (expr.value === true) {
          this.emitByte(OpCode.OP_TRUE, line);
        } else if (expr.value === false) {
          this.emitByte(OpCode.OP_FALSE, line);
        } else {
          this.emitConstant(expr.value, line);
        }
        break;

      case 'IdentifierExpr': {
        const localSlot = this.resolveLocal(expr.name);
        if (localSlot !== -1) {
          this.emitByte(OpCode.OP_GET_LOCAL, line);
          this.emitByte(localSlot, line);
        } else {
          const constIdx = addConstant(this.chunk, expr.name);
          this.emitByte(OpCode.OP_GET_GLOBAL, line);
          this.emitByte(constIdx, line);
        }
        break;
      }

      case 'AssignExpr': {
        this.compileExpr(expr.value);
        if (expr.target.type === 'IdentifierExpr') {
          const localSlot = this.resolveLocal(expr.target.name);
          if (localSlot !== -1) {
            this.emitByte(OpCode.OP_SET_LOCAL, line);
            this.emitByte(localSlot, line);
          } else {
            const constIdx = addConstant(this.chunk, expr.target.name);
            this.emitByte(OpCode.OP_SET_GLOBAL, line);
            this.emitByte(constIdx, line);
          }
        } else if (expr.target.type === 'IndexExpr') {
          this.compileExpr(expr.target.object);
          this.compileExpr(expr.target.index);
          this.emitByte(OpCode.OP_SET_INDEX, line);
        } else if (expr.target.type === 'MemberExpr') {
          this.compileExpr(expr.target.object);
          const propConst = addConstant(this.chunk, expr.target.property);
          this.emitByte(OpCode.OP_SET_PROP, line);
          this.emitByte(propConst, line);
        }
        break;
      }

      case 'BinaryExpr': {
        if (expr.operator.type === TokenType.AND) {
          this.compileExpr(expr.left);
          const endJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
          this.emitByte(OpCode.OP_POP, line);
          this.compileExpr(expr.right);
          this.patchJump(endJump);
          break;
        }

        if (expr.operator.type === TokenType.OR) {
          this.compileExpr(expr.left);
          const elseJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
          const endJump = this.emitJump(OpCode.OP_JUMP, line);
          this.patchJump(elseJump);
          this.emitByte(OpCode.OP_POP, line);
          this.compileExpr(expr.right);
          this.patchJump(endJump);
          break;
        }

        this.compileExpr(expr.left);
        this.compileExpr(expr.right);

        switch (expr.operator.type) {
          case TokenType.PLUS: this.emitByte(OpCode.OP_ADD, line); break;
          case TokenType.MINUS: this.emitByte(OpCode.OP_SUB, line); break;
          case TokenType.STAR: this.emitByte(OpCode.OP_MUL, line); break;
          case TokenType.SLASH: this.emitByte(OpCode.OP_DIV, line); break;
          case TokenType.PERCENT: this.emitByte(OpCode.OP_MOD, line); break;
          case TokenType.EQUAL_EQUAL: this.emitByte(OpCode.OP_EQUAL, line); break;
          case TokenType.BANG_EQUAL:
            this.emitByte(OpCode.OP_EQUAL, line);
            this.emitByte(OpCode.OP_NOT, line);
            break;
          case TokenType.LESS: this.emitByte(OpCode.OP_LESS, line); break;
          case TokenType.GREATER: this.emitByte(OpCode.OP_GREATER, line); break;
          case TokenType.LESS_EQUAL:
            this.emitByte(OpCode.OP_GREATER, line);
            this.emitByte(OpCode.OP_NOT, line);
            break;
          case TokenType.GREATER_EQUAL:
            this.emitByte(OpCode.OP_LESS, line);
            this.emitByte(OpCode.OP_NOT, line);
            break;
          default:
            this.errors.push(`Unsupported binary operator in bytecode: ${expr.operator.lexeme}`);
            break;
        }
        break;
      }

      case 'UnaryExpr':
        this.compileExpr(expr.right);
        switch (expr.operator.type) {
          case TokenType.MINUS: this.emitByte(OpCode.OP_NEGATE, line); break;
          case TokenType.BANG: this.emitByte(OpCode.OP_NOT, line); break;
        }
        break;

      case 'CallExpr': {
        this.compileExpr(expr.callee);
        for (const arg of expr.args) {
          this.compileExpr(arg);
        }
        this.emitByte(OpCode.OP_CALL, line);
        this.emitByte(expr.args.length, line);
        break;
      }

      case 'MemberExpr': {
        this.compileExpr(expr.object);
        const constIdx = addConstant(this.chunk, expr.property);
        this.emitByte(OpCode.OP_GET_PROP, line);
        this.emitByte(constIdx, line);
        break;
      }

      case 'IndexExpr':
        this.compileExpr(expr.object);
        this.compileExpr(expr.index);
        this.emitByte(OpCode.OP_GET_INDEX, line);
        break;

      case 'ListLiteralExpr':
        for (const el of expr.elements) {
          this.compileExpr(el);
        }
        this.emitByte(OpCode.OP_BUILD_LIST, line);
        this.emitByte(expr.elements.length, line);
        break;

      case 'MapLiteralExpr':
        for (const entry of expr.entries) {
          this.compileExpr(entry.key);
          this.compileExpr(entry.value);
        }
        this.emitByte(OpCode.OP_BUILD_MAP, line);
        this.emitByte(expr.entries.length, line);
        break;

      case 'FunctionExpr': {
        const compiled = this.compileFunction(expr);
        const constIdx = addConstant(this.chunk, compiled);
        this.emitByte(OpCode.OP_CONSTANT, line);
        this.emitByte(constIdx, line);
        break;
      }

      case 'MatchExpr': {
        // Compile match as chained conditional jumps
        this.compileExpr(expr.subject);
        const endJumps: number[] = [];

        for (const arm of expr.arms) {
          if (arm.isDefault) {
            this.emitByte(OpCode.OP_POP, line); // Pop subject
            if (Array.isArray(arm.body)) {
              for (const s of arm.body) this.compileStmt(s);
            } else {
              this.compileExpr(arm.body);
            }
            break;
          }

          if (arm.pattern) {
            // Duplicate subject on top of stack or compare
            this.compileExpr(arm.pattern);
            this.emitByte(OpCode.OP_EQUAL, line);
            const nextArmJump = this.emitJump(OpCode.OP_JUMP_IF_FALSE, line);
            this.emitByte(OpCode.OP_POP, line);

            if (Array.isArray(arm.body)) {
              for (const s of arm.body) this.compileStmt(s);
            } else {
              this.compileExpr(arm.body);
            }

            endJumps.push(this.emitJump(OpCode.OP_JUMP, line));
            this.patchJump(nextArmJump);
            this.emitByte(OpCode.OP_POP, line);
          }
        }

        for (const j of endJumps) {
          this.patchJump(j);
        }
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Scope and Local variable helpers
  // ---------------------------------------------------------------------------

  private beginScope(): void {
    this.scopeDepth++;
  }

  private endScope(line: number): void {
    this.scopeDepth--;
    while (this.locals.length > 0 && this.locals[this.locals.length - 1].depth > this.scopeDepth) {
      this.emitByte(OpCode.OP_POP, line);
      this.locals.pop();
    }
  }

  private resolveLocal(name: string): number {
    for (let i = this.locals.length - 1; i >= 0; i--) {
      if (this.locals[i].name === name) {
        return i;
      }
    }
    return -1;
  }

  // ---------------------------------------------------------------------------
  // Emission helpers
  // ---------------------------------------------------------------------------

  private emitByte(byte: number, line: number): void {
    writeChunk(this.chunk, byte, line);
  }

  private emitConstant(value: any, line: number): void {
    const constIdx = addConstant(this.chunk, value);
    this.emitByte(OpCode.OP_CONSTANT, line);
    this.emitByte(constIdx, line);
  }

  private emitJump(instruction: OpCode, line: number): number {
    this.emitByte(instruction, line);
    this.emitByte(0xff, line);
    this.emitByte(0xff, line);
    return this.chunk.code.length - 2;
  }

  private patchJump(offset: number): void {
    const jump = this.chunk.code.length - offset - 2;
    if (jump > 0xffff) {
      this.errors.push('Jump distance too large to fit in 16-bit offset.');
    }
    this.chunk.code[offset] = (jump >> 8) & 0xff;
    this.chunk.code[offset + 1] = jump & 0xff;
  }

  private emitLoop(loopStart: number, line: number): void {
    this.emitByte(OpCode.OP_LOOP, line);
    const offset = this.chunk.code.length - loopStart + 2;
    if (offset > 0xffff) {
      this.errors.push('Loop distance too large to fit in 16-bit offset.');
    }
    this.emitByte((offset >> 8) & 0xff, this.chunk.lines[this.chunk.lines.length - 1]);
    this.emitByte(offset & 0xff, this.chunk.lines[this.chunk.lines.length - 1]);
  }
}
