/**
 * MJ Programming Language - Arabic Multi-file Module Resolver
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './semantics';
import { Interpreter, Environment } from './interpreter';

export class ModuleResolver {
  private files: Map<string, string>;
  private moduleCache: Map<string, Environment> = new Map();
  private resolvingStack: Set<string> = new Set();

  constructor(files: Map<string, string>) {
    this.files = files;
  }

  public updateFiles(files: Map<string, string>): void {
    this.files = files;
    this.moduleCache.clear();
  }

  public resolveAll(): { moduleEnvs: Map<string, Environment>; errors: string[] } {
    const allErrors: string[] = [];
    this.moduleCache.clear();

    for (const [filename] of this.files.entries()) {
      if (filename.endsWith('.mj')) {
        try {
          this.resolveModule(filename);
        } catch (err: any) {
          allErrors.push(err.message || String(err));
        }
      }
    }

    return { moduleEnvs: this.moduleCache, errors: allErrors };
  }

  public resolveModule(filename: string): Environment {
    const normalized = this.normalizePath(filename);

    if (this.moduleCache.has(normalized)) {
      return this.moduleCache.get(normalized)!;
    }

    if (this.resolvingStack.has(normalized)) {
      throw new Error(`اكتشاف حلقة استيراد دائرية أثناء استيراد الملف '${normalized}'.`);
    }

    const source = this.files.get(normalized);
    if (source === undefined) {
      throw new Error(`تعذر العثور على ملف الوحدة النمطية: '${normalized}'.`);
    }

    this.resolvingStack.add(normalized);

    try {
      const lexer = new Lexer(source, normalized);
      const lexResult = lexer.tokenize();
      if (lexResult.errors.length > 0) {
        throw new Error(lexResult.errors.join('\n'));
      }

      const parser = new Parser(lexResult.tokens, normalized);
      const parseResult = parser.parse();
      if (parseResult.errors.length > 0) {
        throw new Error(parseResult.errors.join('\n'));
      }

      const analyzer = new SemanticAnalyzer();
      const semResult = analyzer.analyze(parseResult.program);
      if (semResult.errors.length > 0) {
        throw new Error(semResult.errors.join('\n'));
      }

      const interpreter = new Interpreter({
        customModules: this.moduleCache,
      });

      const execResult = interpreter.interpret(parseResult.program);
      if (!execResult.success) {
        throw new Error(execResult.stderr.join('\n'));
      }

      const modEnv = (interpreter as any).currentEnv as Environment;
      this.moduleCache.set(normalized, modEnv);
      return modEnv;
    } finally {
      this.resolvingStack.delete(normalized);
    }
  }

  private normalizePath(path: string): string {
    if (path.startsWith('./')) {
      return path.substring(2);
    }
    return path;
  }
}
