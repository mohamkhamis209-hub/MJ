/**
 * MJ Programming Language - Arabic Stack-based Virtual Machine (MJ-VM)
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import { OpCode, Chunk, disassembleChunk } from './bytecode';
import { CompiledFunction } from './compiler';
import { ExecutionContext, createStandardLibrary, formatMJValue } from './stdlib';

export interface CallFrame {
  fn: CompiledFunction | { chunk: Chunk; name: string };
  ip: number;
  slotsOffset: number;
}

export interface VMResult {
  success: boolean;
  instructionsExecuted: number;
  durationMs: number;
  stackPeak: number;
  stdout: string[];
  stderr: string[];
  disassembly: string;
  returnValue?: any;
}

export class VirtualMachine {
  private stack: any[] = [];
  private frames: CallFrame[] = [];
  public globals: Map<string, any> = new Map();
  private fuel: number;
  private initialFuel: number;
  private instructionsExecuted: number = 0;
  private stackPeak: number = 0;
  private lastValue: any = null;
  private stdout: string[] = [];
  private stderr: string[] = [];
  private isCancelled: boolean = false;
  private inputQueue: string[] = [];
  private onInputRequest?: (promptText?: string) => Promise<string> | string;
  private onPrint?: (text: string) => void;
  private onPrintln?: (text: string) => void;

  constructor(options?: {
    maxFuel?: number;
    onPrint?: (text: string) => void;
    onPrintln?: (text: string) => void;
    onInputRequest?: (promptText?: string) => Promise<string> | string;
    inputQueue?: string[];
  }) {
    this.initialFuel = options?.maxFuel ?? 300000;
    this.fuel = this.initialFuel;
    if (options?.inputQueue) {
      this.inputQueue = [...options.inputQueue];
    }
    this.onInputRequest = options?.onInputRequest;
    this.onPrint = options?.onPrint;
    this.onPrintln = options?.onPrintln;

    const ctx: ExecutionContext = {
      print: (text: string) => {
        if (this.isCancelled) return;
        this.stdout.push(text);
        if (this.onPrint) this.onPrint(text);
      },
      println: (text: string) => {
        if (this.isCancelled) return;
        this.stdout.push(text + '\n');
        if (this.onPrintln) this.onPrintln(text);
      },
      read: (promptText?: string) => {
        if (this.inputQueue.length > 0) return this.inputQueue.shift()!;
        if (this.onInputRequest) return this.onInputRequest(promptText);
        throw new Error("خطأ تشغيلي في الآلة الافتراضية MJ-VM: تم استدعاء دالة 'اقرأ' ولكن لا توجد مدخلات متاحة (لم يتم توفير inputQueue أو onInputRequest).");
      },
      getFuelRemaining: () => this.fuel,
    };

    const stdlib = createStandardLibrary(ctx, (fn, args) => this.callCallable(fn, args));
    for (const [key, val] of Object.entries(stdlib)) {
      this.globals.set(key, val);
    }
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  public run(chunk: Chunk, name: string = 'الرئيسي'): VMResult {
    const startTime = performance.now();
    // Every run owns a fresh output buffer so previous runs cannot leak output.
    this.stdout = [];
    this.stderr = [];
    this.instructionsExecuted = 0;
    this.stackPeak = 0;
    this.fuel = this.initialFuel;
    this.stack = [];
    this.frames = [];
    this.lastValue = null;

    const disassembly = disassembleChunk(chunk, name);

    if (this.isCancelled) {
      this.isCancelled = false;
      const durationMs = performance.now() - startTime;
      this.stderr.push("تم إلغاء تنفيذ الآلة الافتراضية MJ-VM يدوياً.");
      return {
        success: false,
        instructionsExecuted: 0,
        durationMs,
        stackPeak: 0,
        stdout: this.stdout,
        stderr: this.stderr,
        disassembly,
      };
    }

    const mainFn = { chunk, name };
    this.frames.push({
      fn: mainFn,
      ip: 0,
      slotsOffset: 0,
    });

    try {
      const retVal = this.execute();
      const durationMs = performance.now() - startTime;
      return {
        success: true,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stackPeak: this.stackPeak,
        stdout: this.stdout,
        stderr: this.stderr,
        disassembly,
        returnValue: retVal,
      };
    } catch (err: any) {
      const durationMs = performance.now() - startTime;
      this.stderr.push(err.message || String(err));
      return {
        success: false,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stackPeak: this.stackPeak,
        stdout: this.stdout,
        stderr: this.stderr,
        disassembly,
      };
    }
  }

  public async runAsync(chunk: Chunk, name: string = 'الرئيسي'): Promise<VMResult> {
    const startTime = performance.now();
    // Reset per-run state. A completed/cancelled run must not contaminate the next run.
    this.stdout = [];
    this.stderr = [];
    this.instructionsExecuted = 0;
    this.stackPeak = 0;
    this.fuel = this.initialFuel;
    this.stack = [];
    this.frames = [];
    this.lastValue = null;

    const disassembly = disassembleChunk(chunk, name);

    if (this.isCancelled) {
      this.isCancelled = false;
      const durationMs = performance.now() - startTime;
      this.stderr.push("تم إلغاء تنفيذ الآلة الافتراضية MJ-VM يدوياً.");
      return {
        success: false,
        instructionsExecuted: 0,
        durationMs,
        stackPeak: 0,
        stdout: this.stdout,
        stderr: this.stderr,
        disassembly,
      };
    }

    const mainFn = { chunk, name };
    this.frames.push({
      fn: mainFn,
      ip: 0,
      slotsOffset: 0,
    });

    try {
      const retVal = await this.executeAsync();
      const durationMs = performance.now() - startTime;
      return {
        success: true,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stackPeak: this.stackPeak,
        stdout: this.stdout,
        stderr: this.stderr,
        disassembly,
        returnValue: retVal,
      };
    } catch (err: any) {
      const durationMs = performance.now() - startTime;
      this.stderr.push(err.message || String(err));
      return {
        success: false,
        instructionsExecuted: this.instructionsExecuted,
        durationMs,
        stackPeak: this.stackPeak,
        stdout: this.stdout,
        stderr: this.stderr,
        disassembly,
      };
    } finally {
      // Cancellation is scoped to this run. The next explicit run starts cleanly.
      this.isCancelled = false;
    }
  }

  private execute(): any {
    while (this.frames.length > 0) {
      if (this.isCancelled) {
        throw new Error("تم إلغاء تنفيذ الآلة الافتراضية يدوياً.");
      }

      const frame = this.frames[this.frames.length - 1];
      const chunk = frame.fn.chunk;

      if (frame.ip >= chunk.code.length) {
        this.frames.pop();
        continue;
      }

      this.instructionsExecuted++;
      this.fuel--;
      if (this.fuel <= 0) {
        throw new Error(
          `خطأ أمني في الآلة الافتراضية MJ-VM: تم استهلاك الحد الأقصى للتعليمات (${this.initialFuel} خطوة). احتمال وجود حلقة غير منتهية.`
        );
      }

      if (this.stack.length > this.stackPeak) {
        this.stackPeak = this.stack.length;
      }

      const instruction: OpCode = chunk.code[frame.ip++];

      switch (instruction) {
        case OpCode.OP_CONSTANT: {
          const constIndex = chunk.code[frame.ip++];
          this.push(chunk.constants[constIndex]);
          break;
        }

        case OpCode.OP_NIL:
          this.push(null);
          break;

        case OpCode.OP_TRUE:
          this.push(true);
          break;

        case OpCode.OP_FALSE:
          this.push(false);
          break;

        case OpCode.OP_POP:
          this.lastValue = this.pop();
          break;

        case OpCode.OP_DEF_GLOBAL: {
          const constIndex = chunk.code[frame.ip++];
          const name = chunk.constants[constIndex];
          const val = this.pop();
          this.lastValue = val;
          this.globals.set(name, val);
          break;
        }

        case OpCode.OP_GET_GLOBAL: {
          const constIndex = chunk.code[frame.ip++];
          const name = chunk.constants[constIndex];
          if (!this.globals.has(name)) {
            throw new Error(`خطأ تشغيلي MJ-VM: المتغير العام '${name}' غير معرف.`);
          }
          this.push(this.globals.get(name));
          break;
        }

        case OpCode.OP_SET_GLOBAL: {
          const constIndex = chunk.code[frame.ip++];
          const name = chunk.constants[constIndex];
          if (!this.globals.has(name)) {
            throw new Error(`خطأ تشغيلي MJ-VM: لا يمكن تعيين متغير عام غير معلن '${name}'.`);
          }
          const val = this.peek(0);
          this.globals.set(name, val);
          break;
        }

        case OpCode.OP_GET_LOCAL: {
          const slot = chunk.code[frame.ip++];
          this.push(this.stack[frame.slotsOffset + slot]);
          break;
        }

        case OpCode.OP_SET_LOCAL: {
          const slot = chunk.code[frame.ip++];
          this.stack[frame.slotsOffset + slot] = this.peek(0);
          break;
        }

        case OpCode.OP_ADD: {
          const b = this.pop();
          const a = this.pop();
          if (typeof a === 'string' || typeof b === 'string') {
            this.push(formatMJValue(a) + formatMJValue(b));
          } else {
            this.push(Number(a) + Number(b));
          }
          break;
        }

        case OpCode.OP_SUB: {
          const b = this.pop();
          const a = this.pop();
          this.push(Number(a) - Number(b));
          break;
        }

        case OpCode.OP_MUL: {
          const b = this.pop();
          const a = this.pop();
          this.push(Number(a) * Number(b));
          break;
        }

        case OpCode.OP_DIV: {
          const b = this.pop();
          const a = this.pop();
          if (Number(b) === 0) {
            throw new Error("خطأ تشغيلي في الآلة الافتراضية MJ-VM: لا يمكن القسمة على صفر.");
          }
          this.push(Number(a) / Number(b));
          break;
        }

        case OpCode.OP_MOD: {
          const b = this.pop();
          const a = this.pop();
          this.push(Number(a) % Number(b));
          break;
        }

        case OpCode.OP_NEGATE: {
          const a = this.pop();
          this.push(-Number(a));
          break;
        }

        case OpCode.OP_NOT: {
          const a = this.pop();
          this.push(!this.isTruthy(a));
          break;
        }

        case OpCode.OP_EQUAL: {
          const b = this.pop();
          const a = this.pop();
          this.push(this.isEqual(a, b));
          break;
        }

        case OpCode.OP_GREATER: {
          const b = this.pop();
          const a = this.pop();
          this.push(Number(a) > Number(b));
          break;
        }

        case OpCode.OP_LESS: {
          const b = this.pop();
          const a = this.pop();
          this.push(Number(a) < Number(b));
          break;
        }

        case OpCode.OP_JUMP: {
          const offset = (chunk.code[frame.ip] << 8) | chunk.code[frame.ip + 1];
          frame.ip += 2 + offset;
          break;
        }

        case OpCode.OP_JUMP_IF_FALSE: {
          const offset = (chunk.code[frame.ip] << 8) | chunk.code[frame.ip + 1];
          frame.ip += 2;
          const condition = this.peek(0);
          if (!this.isTruthy(condition)) {
            frame.ip += offset;
          }
          break;
        }

        case OpCode.OP_LOOP: {
          const offset = (chunk.code[frame.ip] << 8) | chunk.code[frame.ip + 1];
          frame.ip += 2;
          frame.ip -= offset;
          break;
        }

        case OpCode.OP_CALL: {
          const argCount = chunk.code[frame.ip++];
          const args: any[] = [];
          for (let i = 0; i < argCount; i++) {
            args.unshift(this.pop());
          }
          const callee = this.pop();

          if (callee && (callee as CompiledFunction).__isCompiledFunction) {
            const fn = callee as CompiledFunction;
            if (this.frames.length >= 256) {
              throw new Error("خطأ أمني MJ-VM: تجاوز مكدس الاستدعاءات (256 إطار).");
            }
            this.frames.push({
              fn,
              ip: 0,
              slotsOffset: this.stack.length,
            });
            this.push(callee); // Slot 0 is reserved for function self
            for (const arg of args) {
              this.push(arg);
            }
          } else if (typeof callee === 'function') {
            const res = callee(...args);
            this.push(res);
          } else {
            throw new Error(`خطأ تشغيلي MJ-VM: '${formatMJValue(callee)}' ليس دالة قابلة للاستدعاء.`);
          }
          break;
        }

        case OpCode.OP_RETURN: {
          const result = this.pop();
          const finishedFrame = this.frames.pop()!;
          if (this.frames.length === 0) {
            return result;
          }
          while (this.stack.length > finishedFrame.slotsOffset) {
            this.pop();
          }
          this.push(result);
          break;
        }

        case OpCode.OP_BUILD_LIST: {
          const count = chunk.code[frame.ip++];
          const items: any[] = [];
          for (let i = 0; i < count; i++) {
            items.unshift(this.pop());
          }
          this.push(items);
          break;
        }

        case OpCode.OP_BUILD_MAP: {
          const pairs = chunk.code[frame.ip++];
          const map: Record<string, any> = {};
          for (let i = 0; i < pairs; i++) {
            const val = this.pop();
            const key = this.pop();
            map[String(key)] = val;
          }
          this.push(map);
          break;
        }

        case OpCode.OP_GET_INDEX: {
          const idx = this.pop();
          const obj = this.pop();
          if (Array.isArray(obj)) {
            const i = Number(idx);
            this.push(i >= 0 && i < obj.length ? obj[i] : null);
          } else if (typeof obj === 'object' && obj !== null) {
            this.push(obj[String(idx)] ?? null);
          } else {
            this.push(null);
          }
          break;
        }

        case OpCode.OP_SET_INDEX: {
          const val = this.pop();
          const idx = this.pop();
          const obj = this.pop();
          if (Array.isArray(obj)) {
            obj[Number(idx)] = val;
          } else if (typeof obj === 'object' && obj !== null) {
            obj[String(idx)] = val;
          }
          this.push(val);
          break;
        }

        case OpCode.OP_GET_PROP: {
          const constIndex = chunk.code[frame.ip++];
          const prop = chunk.constants[constIndex];
          const obj = this.pop();
          if (obj !== null && obj !== undefined) {
            this.push(obj[prop]);
          } else {
            this.push(null);
          }
          break;
        }

        case OpCode.OP_SET_PROP: {
          const constIndex = chunk.code[frame.ip++];
          const prop = chunk.constants[constIndex];
          const obj = this.pop();
          const val = this.peek(0);
          if (obj !== null && typeof obj === 'object') {
            obj[prop] = val;
          }
          break;
        }

        case OpCode.OP_PRINT: {
          const val = this.pop();
          if (!this.isCancelled) {
            const formatted = formatMJValue(val);
            this.stdout.push(formatted);
            if (this.onPrint) this.onPrint(formatted);
          }
          break;
        }

        case OpCode.OP_PRINTLN: {
          const val = this.pop();
          if (!this.isCancelled) {
            const formatted = formatMJValue(val);
            this.stdout.push(formatted + '\n');
            if (this.onPrintln) this.onPrintln(formatted);
          }
          break;
        }

        case OpCode.OP_HALT:
          return this.stack.length > 0 ? this.peek(0) : this.lastValue;

        default:
          throw new Error(`خطأ فادح في MJ-VM: تعليمة غير معروفة '${instruction}'.`);
      }
    }

    return null;
  }

  private async executeAsync(): Promise<any> {
    while (this.frames.length > 0) {
      if (this.isCancelled) {
        throw new Error("تم إلغاء تنفيذ الآلة الافتراضية يدوياً.");
      }

      const frame = this.frames[this.frames.length - 1];
      const chunk = frame.fn.chunk;

      if (frame.ip >= chunk.code.length) {
        this.frames.pop();
        continue;
      }

      this.instructionsExecuted++;
      this.fuel--;
      if (this.fuel <= 0) {
        throw new Error(
          `خطأ أمني في الآلة الافتراضية MJ-VM: تم استهلاك الحد الأقصى للتعليمات (${this.initialFuel} خطوة). احتمال وجود حلقة غير منتهية.`
        );
      }

      if ((this.instructionsExecuted & 0x1ff) === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        if (this.isCancelled) {
          throw new Error("تم إلغاء تنفيذ الآلة الافتراضية يدوياً.");
        }
      }

      if (this.stack.length > this.stackPeak) {
        this.stackPeak = this.stack.length;
      }

      const instruction: OpCode = chunk.code[frame.ip++];

      if (instruction === OpCode.OP_CALL) {
        const argCount = chunk.code[frame.ip++];
        const args: any[] = [];
        for (let i = 0; i < argCount; i++) {
          args.unshift(this.pop());
        }
        const callee = this.pop();

        if (callee && (callee as CompiledFunction).__isCompiledFunction) {
          const fn = callee as CompiledFunction;
          if (this.frames.length >= 256) {
            throw new Error("خطأ أمني MJ-VM: تجاوز مكدس الاستدعاءات (256 إطار).");
          }
          this.frames.push({
            fn,
            ip: 0,
            slotsOffset: this.stack.length,
          });
          this.push(callee);
          for (const arg of args) {
            this.push(arg);
          }
        } else if (typeof callee === 'function') {
          const res = callee(...args);
          const resolved = res instanceof Promise ? await res : res;
          if (this.isCancelled) {
            throw new Error("تم إلغاء تنفيذ الآلة الافتراضية يدوياً.");
          }
          this.push(resolved);
        } else {
          throw new Error(`خطأ تشغيلي MJ-VM: '${formatMJValue(callee)}' ليس دالة قابلة للاستدعاء.`);
        }
        continue;
      }

      // Decrement ip by 1 and dispatch to standard instruction processor
      frame.ip--;
      // Let's run single non-call instruction using execute() step
      const singleStep = this.executeStep(frame);
      if (singleStep.halted) {
        return singleStep.returnValue;
      }
    }

    return null;
  }

  private executeStep(frame: CallFrame): { halted: boolean; returnValue?: any } {
    const chunk = frame.fn.chunk;
    const instruction: OpCode = chunk.code[frame.ip++];

    switch (instruction) {
      case OpCode.OP_CONSTANT: {
        const constIndex = chunk.code[frame.ip++];
        this.push(chunk.constants[constIndex]);
        break;
      }
      case OpCode.OP_NIL: this.push(null); break;
      case OpCode.OP_TRUE: this.push(true); break;
      case OpCode.OP_FALSE: this.push(false); break;
      case OpCode.OP_POP: this.lastValue = this.pop(); break;

      case OpCode.OP_DEF_GLOBAL: {
        const constIndex = chunk.code[frame.ip++];
        const name = chunk.constants[constIndex];
        const val = this.pop();
        this.lastValue = val;
        this.globals.set(name, val);
        break;
      }

      case OpCode.OP_GET_GLOBAL: {
        const constIndex = chunk.code[frame.ip++];
        const name = chunk.constants[constIndex];
        if (!this.globals.has(name)) {
          throw new Error(`خطأ تشغيلي MJ-VM: المتغير العام '${name}' غير معرف.`);
        }
        this.push(this.globals.get(name));
        break;
      }

      case OpCode.OP_SET_GLOBAL: {
        const constIndex = chunk.code[frame.ip++];
        const name = chunk.constants[constIndex];
        if (!this.globals.has(name)) {
          throw new Error(`خطأ تشغيلي MJ-VM: لا يمكن تعيين متغير عام غير معلن '${name}'.`);
        }
        const val = this.peek(0);
        this.globals.set(name, val);
        break;
      }

      case OpCode.OP_GET_LOCAL: {
        const slot = chunk.code[frame.ip++];
        this.push(this.stack[frame.slotsOffset + slot]);
        break;
      }

      case OpCode.OP_SET_LOCAL: {
        const slot = chunk.code[frame.ip++];
        this.stack[frame.slotsOffset + slot] = this.peek(0);
        break;
      }

      case OpCode.OP_ADD: {
        const b = this.pop();
        const a = this.pop();
        if (typeof a === 'string' || typeof b === 'string') {
          this.push(formatMJValue(a) + formatMJValue(b));
        } else {
          this.push(Number(a) + Number(b));
        }
        break;
      }

      case OpCode.OP_SUB: {
        const b = this.pop();
        const a = this.pop();
        this.push(Number(a) - Number(b));
        break;
      }

      case OpCode.OP_MUL: {
        const b = this.pop();
        const a = this.pop();
        this.push(Number(a) * Number(b));
        break;
      }

      case OpCode.OP_DIV: {
        const b = this.pop();
        const a = this.pop();
        if (Number(b) === 0) {
          throw new Error("خطأ تشغيلي في الآلة الافتراضية MJ-VM: لا يمكن القسمة على صفر.");
        }
        this.push(Number(a) / Number(b));
        break;
      }

      case OpCode.OP_MOD: {
        const b = this.pop();
        const a = this.pop();
        this.push(Number(a) % Number(b));
        break;
      }

      case OpCode.OP_NEGATE: {
        const a = this.pop();
        this.push(-Number(a));
        break;
      }

      case OpCode.OP_NOT: {
        const a = this.pop();
        this.push(!this.isTruthy(a));
        break;
      }

      case OpCode.OP_EQUAL: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.isEqual(a, b));
        break;
      }

      case OpCode.OP_GREATER: {
        const b = this.pop();
        const a = this.pop();
        this.push(Number(a) > Number(b));
        break;
      }

      case OpCode.OP_LESS: {
        const b = this.pop();
        const a = this.pop();
        this.push(Number(a) < Number(b));
        break;
      }

      case OpCode.OP_JUMP: {
        const offset = (chunk.code[frame.ip] << 8) | chunk.code[frame.ip + 1];
        frame.ip += 2 + offset;
        break;
      }

      case OpCode.OP_JUMP_IF_FALSE: {
        const offset = (chunk.code[frame.ip] << 8) | chunk.code[frame.ip + 1];
        frame.ip += 2;
        const condition = this.peek(0);
        if (!this.isTruthy(condition)) {
          frame.ip += offset;
        }
        break;
      }

      case OpCode.OP_LOOP: {
        const offset = (chunk.code[frame.ip] << 8) | chunk.code[frame.ip + 1];
        frame.ip += 2;
        frame.ip -= offset;
        break;
      }

      case OpCode.OP_RETURN: {
        const result = this.pop();
        const finishedFrame = this.frames.pop()!;
        if (this.frames.length === 0) {
          return { halted: true, returnValue: result };
        }
        while (this.stack.length > finishedFrame.slotsOffset) {
          this.pop();
        }
        this.push(result);
        break;
      }

      case OpCode.OP_BUILD_LIST: {
        const count = chunk.code[frame.ip++];
        const items: any[] = [];
        for (let i = 0; i < count; i++) {
          items.unshift(this.pop());
        }
        this.push(items);
        break;
      }

      case OpCode.OP_BUILD_MAP: {
        const pairs = chunk.code[frame.ip++];
        const map: Record<string, any> = {};
        for (let i = 0; i < pairs; i++) {
          const val = this.pop();
          const key = this.pop();
          map[String(key)] = val;
        }
        this.push(map);
        break;
      }

      case OpCode.OP_GET_INDEX: {
        const idx = this.pop();
        const obj = this.pop();
        if (Array.isArray(obj)) {
          const i = Number(idx);
          this.push(i >= 0 && i < obj.length ? obj[i] : null);
        } else if (typeof obj === 'object' && obj !== null) {
          this.push(obj[String(idx)] ?? null);
        } else {
          this.push(null);
        }
        break;
      }

      case OpCode.OP_SET_INDEX: {
        const val = this.pop();
        const idx = this.pop();
        const obj = this.pop();
        if (Array.isArray(obj)) {
          obj[Number(idx)] = val;
        } else if (typeof obj === 'object' && obj !== null) {
          obj[String(idx)] = val;
        }
        this.push(val);
        break;
      }

      case OpCode.OP_GET_PROP: {
        const constIndex = chunk.code[frame.ip++];
        const prop = chunk.constants[constIndex];
        const obj = this.pop();
        if (obj !== null && obj !== undefined) {
          this.push(obj[prop]);
        } else {
          this.push(null);
        }
        break;
      }

      case OpCode.OP_SET_PROP: {
        const constIndex = chunk.code[frame.ip++];
        const prop = chunk.constants[constIndex];
        const obj = this.pop();
        const val = this.peek(0);
        if (obj !== null && typeof obj === 'object') {
          obj[prop] = val;
        }
        break;
      }

      case OpCode.OP_PRINT: {
        const val = this.pop();
        if (!this.isCancelled) {
          const formatted = formatMJValue(val);
          this.stdout.push(formatted);
          if (this.onPrint) this.onPrint(formatted);
        }
        break;
      }

      case OpCode.OP_PRINTLN: {
        const val = this.pop();
        if (!this.isCancelled) {
          const formatted = formatMJValue(val);
          this.stdout.push(formatted + '\n');
          if (this.onPrintln) this.onPrintln(formatted);
        }
        break;
      }

      case OpCode.OP_HALT:
        return { halted: true, returnValue: this.stack.length > 0 ? this.peek(0) : this.lastValue };

      default:
        throw new Error(`خطأ فادح في MJ-VM: تعليمة غير معروفة '${instruction}'.`);
    }

    return { halted: false };
  }

  private callCallable(fn: any, args: any[]): any {
    if (typeof fn === 'function') {
      return fn(...args);
    }
    if (fn && (fn as CompiledFunction).__isCompiledFunction) {
      const subVM = new VirtualMachine({ maxFuel: 50000 });
      this.globals.forEach((v, k) => subVM.globals.set(k, v));
      const res = subVM.run(fn.chunk, fn.name);
      return res.returnValue;
    }
    throw new Error(`خطأ MJ-VM: تم توقع دالة، لكن تم استلام ${typeof fn}`);
  }

  private push(value: any): void {
    this.stack.push(value);
  }

  private pop(): any {
    if (this.stack.length === 0) {
      throw new Error("خطأ فادح في MJ-VM: نفاد المكدس (Stack underflow).");
    }
    return this.stack.pop();
  }

  private peek(distance: number): any {
    return this.stack[this.stack.length - 1 - distance];
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
}
