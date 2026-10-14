/**
 * MJ Programming Language - Bytecode Instruction Set & Disassembler
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

export enum OpCode {
  OP_CONSTANT = 0,
  OP_NIL = 1,
  OP_TRUE = 2,
  OP_FALSE = 3,
  OP_POP = 4,

  // Variable operations
  OP_DEF_GLOBAL = 10,
  OP_GET_GLOBAL = 11,
  OP_SET_GLOBAL = 12,
  OP_GET_LOCAL = 13,
  OP_SET_LOCAL = 14,

  // Arithmetic & Logic
  OP_ADD = 20,
  OP_SUB = 21,
  OP_MUL = 22,
  OP_DIV = 23,
  OP_MOD = 24,
  OP_NEGATE = 25,
  OP_NOT = 26,
  OP_EQUAL = 27,
  OP_GREATER = 28,
  OP_LESS = 29,

  // Control Flow
  OP_JUMP = 40,
  OP_JUMP_IF_FALSE = 41,
  OP_LOOP = 42,
  OP_CALL = 43,
  OP_RETURN = 44,

  // Collections
  OP_BUILD_LIST = 50,
  OP_BUILD_MAP = 51,
  OP_GET_INDEX = 52,
  OP_SET_INDEX = 53,
  OP_GET_PROP = 54,
  OP_SET_PROP = 55,

  // Built-in output
  OP_PRINT = 60,
  OP_PRINTLN = 61,

  OP_HALT = 99,
}

export interface Chunk {
  code: number[];
  constants: any[];
  lines: number[];
}

export function createChunk(): Chunk {
  return {
    code: [],
    constants: [],
    lines: [],
  };
}

export function writeChunk(chunk: Chunk, byte: number, line: number): void {
  chunk.code.push(byte);
  chunk.lines.push(line);
}

export function addConstant(chunk: Chunk, value: any): number {
  chunk.constants.push(value);
  return chunk.constants.length - 1;
}

export function disassembleChunk(chunk: Chunk, name: string): string {
  let output = `== Bytecode Disassembly: ${name} ==\n`;
  output += `Offset  Line  Opcode               Operand\n`;
  output += `------  ----  -------------------  -------------------\n`;

  let offset = 0;
  while (offset < chunk.code.length) {
    const res = disassembleInstruction(chunk, offset);
    output += res.line + '\n';
    offset = res.nextOffset;
  }
  return output;
}

export function disassembleInstruction(chunk: Chunk, offset: number): { line: string; nextOffset: number } {
  const lineNum = chunk.lines[offset];
  const sameLine = offset > 0 && chunk.lines[offset] === chunk.lines[offset - 1];
  const lineStr = sameLine ? '   |' : String(lineNum).padStart(4, ' ');
  const offsetStr = String(offset).padStart(4, '0');

  const opcode: OpCode = chunk.code[offset];

  switch (opcode) {
    case OpCode.OP_CONSTANT: {
      const constIndex = chunk.code[offset + 1];
      const val = chunk.constants[constIndex];
      const valRepr = typeof val === 'string' ? `"${val}"` : String(val);
      return {
        line: `${offsetStr}  ${lineStr}  OP_CONSTANT          idx:${constIndex} (${valRepr})`,
        nextOffset: offset + 2,
      };
    }

    case OpCode.OP_NIL:
      return { line: `${offsetStr}  ${lineStr}  OP_NIL`, nextOffset: offset + 1 };
    case OpCode.OP_TRUE:
      return { line: `${offsetStr}  ${lineStr}  OP_TRUE`, nextOffset: offset + 1 };
    case OpCode.OP_FALSE:
      return { line: `${offsetStr}  ${lineStr}  OP_FALSE`, nextOffset: offset + 1 };
    case OpCode.OP_POP:
      return { line: `${offsetStr}  ${lineStr}  OP_POP`, nextOffset: offset + 1 };

    case OpCode.OP_DEF_GLOBAL: {
      const idx = chunk.code[offset + 1];
      const name = chunk.constants[idx];
      return { line: `${offsetStr}  ${lineStr}  OP_DEF_GLOBAL        ${name}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_GET_GLOBAL: {
      const idx = chunk.code[offset + 1];
      const name = chunk.constants[idx];
      return { line: `${offsetStr}  ${lineStr}  OP_GET_GLOBAL        ${name}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_SET_GLOBAL: {
      const idx = chunk.code[offset + 1];
      const name = chunk.constants[idx];
      return { line: `${offsetStr}  ${lineStr}  OP_SET_GLOBAL        ${name}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_GET_LOCAL: {
      const slot = chunk.code[offset + 1];
      return { line: `${offsetStr}  ${lineStr}  OP_GET_LOCAL         slot:${slot}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_SET_LOCAL: {
      const slot = chunk.code[offset + 1];
      return { line: `${offsetStr}  ${lineStr}  OP_SET_LOCAL         slot:${slot}`, nextOffset: offset + 2 };
    }

    case OpCode.OP_ADD:
      return { line: `${offsetStr}  ${lineStr}  OP_ADD`, nextOffset: offset + 1 };
    case OpCode.OP_SUB:
      return { line: `${offsetStr}  ${lineStr}  OP_SUB`, nextOffset: offset + 1 };
    case OpCode.OP_MUL:
      return { line: `${offsetStr}  ${lineStr}  OP_MUL`, nextOffset: offset + 1 };
    case OpCode.OP_DIV:
      return { line: `${offsetStr}  ${lineStr}  OP_DIV`, nextOffset: offset + 1 };
    case OpCode.OP_MOD:
      return { line: `${offsetStr}  ${lineStr}  OP_MOD`, nextOffset: offset + 1 };
    case OpCode.OP_NOT:
      return { line: `${offsetStr}  ${lineStr}  OP_NOT`, nextOffset: offset + 1 };
    case OpCode.OP_NEGATE:
      return { line: `${offsetStr}  ${lineStr}  OP_NEGATE`, nextOffset: offset + 1 };
    case OpCode.OP_EQUAL:
      return { line: `${offsetStr}  ${lineStr}  OP_EQUAL`, nextOffset: offset + 1 };
    case OpCode.OP_GREATER:
      return { line: `${offsetStr}  ${lineStr}  OP_GREATER`, nextOffset: offset + 1 };
    case OpCode.OP_LESS:
      return { line: `${offsetStr}  ${lineStr}  OP_LESS`, nextOffset: offset + 1 };

    case OpCode.OP_JUMP: {
      const jump = (chunk.code[offset + 1] << 8) | chunk.code[offset + 2];
      return { line: `${offsetStr}  ${lineStr}  OP_JUMP              -> ${offset + 3 + jump}`, nextOffset: offset + 3 };
    }
    case OpCode.OP_JUMP_IF_FALSE: {
      const jump = (chunk.code[offset + 1] << 8) | chunk.code[offset + 2];
      return { line: `${offsetStr}  ${lineStr}  OP_JUMP_IF_FALSE     -> ${offset + 3 + jump}`, nextOffset: offset + 3 };
    }
    case OpCode.OP_LOOP: {
      const jump = (chunk.code[offset + 1] << 8) | chunk.code[offset + 2];
      return { line: `${offsetStr}  ${lineStr}  OP_LOOP              -> ${offset + 3 - jump}`, nextOffset: offset + 3 };
    }

    case OpCode.OP_CALL: {
      const argCount = chunk.code[offset + 1];
      return { line: `${offsetStr}  ${lineStr}  OP_CALL              args:${argCount}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_RETURN:
      return { line: `${offsetStr}  ${lineStr}  OP_RETURN`, nextOffset: offset + 1 };

    case OpCode.OP_BUILD_LIST: {
      const count = chunk.code[offset + 1];
      return { line: `${offsetStr}  ${lineStr}  OP_BUILD_LIST        count:${count}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_BUILD_MAP: {
      const count = chunk.code[offset + 1];
      return { line: `${offsetStr}  ${lineStr}  OP_BUILD_MAP         pairs:${count}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_GET_INDEX:
      return { line: `${offsetStr}  ${lineStr}  OP_GET_INDEX`, nextOffset: offset + 1 };
    case OpCode.OP_SET_INDEX:
      return { line: `${offsetStr}  ${lineStr}  OP_SET_INDEX`, nextOffset: offset + 1 };
    case OpCode.OP_GET_PROP: {
      const idx = chunk.code[offset + 1];
      const prop = chunk.constants[idx];
      return { line: `${offsetStr}  ${lineStr}  OP_GET_PROP          prop:${prop}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_SET_PROP: {
      const idx = chunk.code[offset + 1];
      const prop = chunk.constants[idx];
      return { line: `${offsetStr}  ${lineStr}  OP_SET_PROP          prop:${prop}`, nextOffset: offset + 2 };
    }
    case OpCode.OP_PRINT:
      return { line: `${offsetStr}  ${lineStr}  OP_PRINT`, nextOffset: offset + 1 };
    case OpCode.OP_PRINTLN:
      return { line: `${offsetStr}  ${lineStr}  OP_PRINTLN`, nextOffset: offset + 1 };
    case OpCode.OP_HALT:
      return { line: `${offsetStr}  ${lineStr}  OP_HALT`, nextOffset: offset + 1 };

    default:
      return { line: `${offsetStr}  ${lineStr}  UNKNOWN_OPCODE_${opcode}`, nextOffset: offset + 1 };
  }
}
