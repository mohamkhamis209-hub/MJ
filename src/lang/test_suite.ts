/**
 * MJ Programming Language - Comprehensive Automated Test Suite (Arabic-First)
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { SemanticAnalyzer } from './semantics';
import { Interpreter } from './interpreter';
import { BytecodeCompiler } from './compiler';
import { VirtualMachine } from './vm';
import { TokenType } from './tokens';
import { ModuleResolver } from './module_resolver';
import { CODE_EXAMPLES } from '../data/examples';

export interface TestCaseResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  expected?: string;
  actual?: string;
  errorMessage?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestCaseResult[];
}

interface TestCaseDef {
  id: string;
  category: string;
  name: string;
  fn: () => void | Promise<void>;
}

export class MJTestSuite {
  public static async runAll(): Promise<TestSuiteSummary> {
    const startTime = performance.now();
    const results: TestCaseResult[] = [];
    const testCases: TestCaseDef[] = [];

    const test = (
      id: string,
      category: string,
      name: string,
      fn: () => void | Promise<void>
    ) => {
      testCases.push({ id, category, name, fn });
    };

    // -------------------------------------------------------------------------
    // 1. Arabic Lexer & Unicode Tests
    // -------------------------------------------------------------------------
    test('AR-LEX-01', 'محلل الرموز (Lexer)', 'التعرف على الكلمات المفتاحية العربية', () => {
      const src = 'متغير الاسم = "محمد"\nثابت العمر = 25\nدالة اختبار()';
      const lexer = new Lexer(src, 'test.mj');
      const { tokens, errors } = lexer.tokenize();
      if (errors.length > 0) throw new Error(errors[0]);
      if (tokens[0].type !== TokenType.VAR) throw new Error(`متوقع VAR، لكن تم استلام ${tokens[0].type}`);
      if (tokens[1].lexeme !== 'الاسم') throw new Error('فشل قراءة المعرف العربي الاسم');
      if (tokens[4].type !== TokenType.VAL) throw new Error(`متوقع VAL، لكن تم استلام ${tokens[4].type}`);
      if (tokens[8].type !== TokenType.FUNC) throw new Error(`متوقع FUNC، لكن تم استلام ${tokens[8].type}`);
    });

    test('AR-LEX-02', 'محلل الرموز (Lexer)', 'دعم الفواصل العربية (،) والمنقوطة (؛)', () => {
      const src = '[1، 2، 3]؛ متغير س = 5؛';
      const lexer = new Lexer(src, 'test.mj');
      const { tokens, errors } = lexer.tokenize();
      if (errors.length > 0) throw new Error(errors[0]);
      if (tokens[2].type !== TokenType.COMMA) throw new Error('فشل التعرف على الفاصلة العربية (،)');
      if (tokens[7].type !== TokenType.SEMICOLON) throw new Error('فشل التعرف على الفاصلة المنقوطة العربية (؛)');
    });

    test('AR-LEX-03', 'محلل الرموز (Lexer)', 'دعم وتطبيع الأرقام المشرقية (٠-٩) إلى قيم عددية', () => {
      const src = '١٠٠ ٣.١٤ ٠';
      const lexer = new Lexer(src, 'test.mj');
      const { tokens } = lexer.tokenize();
      if (tokens[0].literal !== 100) throw new Error(`فشل تحويل ١٠٠ إلى 100 (تم استلام ${tokens[0].literal})`);
      if (Math.abs(tokens[1].literal - 3.14) > 0.001) throw new Error('فشل تحويل ٣.١٤');
      if (tokens[2].literal !== 0) throw new Error('فشل تحويل ٠');
    });

    test('AR-LEX-04', 'محلل الرموز (Lexer)', 'التعرف على التشكيل والحركات على الحروف العربية', () => {
      const src = 'متغير مُحَمَّد = 1';
      const lexer = new Lexer(src, 'test.mj');
      const { tokens, errors } = lexer.tokenize();
      if (errors.length > 0) throw new Error(errors[0]);
      if (tokens[1].type !== TokenType.IDENTIFIER) throw new Error('فشل قراءة المعرف المشكّل');
    });

    test('AR-LEX-05', 'محلل الرموز (Lexer)', 'الوضع العربي الصارم يرفض الكلمات المفتاحية اللاتينية', () => {
      const src = 'val x = 10';
      const lexer = new Lexer(src, 'test.mj', { arabicOnly: true });
      const { errors } = lexer.tokenize();
      if (errors.length === 0) throw new Error('كان يجب رفض الكلمة المفتاحية اللاتينية في الوضع العربي الصارم');
      if (!errors[0].includes('غير مسموح بها في الوضع العربي')) {
        throw new Error('رسالة الخطأ يجب أن توضح حظر الكلمات اللاتينية');
      }
    });

    // -------------------------------------------------------------------------
    // 2. Arabic Parser & AST Tests
    // -------------------------------------------------------------------------
    test('AR-PAR-01', 'المحلل النحوي (Parser)', 'الإعلان عن متغيرات وثوابت باللغة العربية', () => {
      const src = 'متغير س = 10\nثابت ص = 20';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program, errors } = parser.parse();
      if (errors.length > 0) throw new Error(errors[0]);
      if (program.statements.length !== 2) throw new Error('متوقع جملتين');
      const s1 = program.statements[0] as any;
      const s2 = program.statements[1] as any;
      if (!s1.isMutable) throw new Error('متغير يجب أن يكون قابلاً للتعديل (isMutable = true)');
      if (s2.isMutable) throw new Error('ثابت يجب أن يكون غير قابل للتعديل (isMutable = false)');
    });

    test('AR-PAR-02', 'المحلل النحوي (Parser)', 'تعريف دالة بالصيغة العربية مع النقطتين', () => {
      const src = `دالة جمع(أ، ب):
    أرجع أ + ب`;
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program, errors } = parser.parse();
      if (errors.length > 0) throw new Error(errors[0]);
      const fn = program.statements[0] as any;
      if (fn.name !== 'جمع') throw new Error('اسم الدالة غير صحيح');
      if (fn.params.length !== 2) throw new Error('عدد المعاملات غير صحيح');
    });

    test('AR-PAR-03', 'المحلل النحوي (Parser)', 'أسبقية العمليات الحسابية (* قبل +)', () => {
      const src = 'متغير ن = 2 + 3 * 4';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const v = program.statements[0] as any;
      if (v.initializer.operator.type !== TokenType.PLUS) {
        throw new Error('العملية الرئيسية يجب أن تكون جمع');
      }
      if (v.initializer.right.operator.type !== TokenType.STAR) {
        throw new Error('الطرف الأيمن يجب أن يكون ضرب');
      }
    });

    // -------------------------------------------------------------------------
    // 3. Arabic Semantic Analysis Tests
    // -------------------------------------------------------------------------
    test('AR-SEM-01', 'التحليل الدلالي (Semantics)', 'منع تعديل الثوابت (ثابت)', () => {
      const src = 'ثابت قيمة = 10\nقيمة = 20';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const sem = new SemanticAnalyzer();
      const { errors } = sem.analyze(program);
      if (errors.length === 0) throw new Error('متوقع خطأ دلالي عند محاولة تعديل ثابت');
      if (!errors[0].includes('ثابت')) throw new Error('الخطأ يجب أن يوضح أن المتغير ثابت');
    });

    test('AR-SEM-02', 'التحليل الدلالي (Semantics)', 'السماح بتعديل المتغيرات (متغير)', () => {
      const src = 'متغير رصيد = 100\nرصيد = 200';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const sem = new SemanticAnalyzer();
      const { errors } = sem.analyze(program);
      if (errors.length > 0) throw new Error(`خطأ غير متوقع: ${errors[0]}`);
    });

    test('AR-SEM-03', 'التحليل الدلالي (Semantics)', 'اكتشاف المتغيرات غير المعرفة باللغة العربية', () => {
      const src = 'متغير ن = متغير_مجهول + 1';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const sem = new SemanticAnalyzer();
      const { errors } = sem.analyze(program);
      if (errors.length === 0) throw new Error('متوقع خطأ دلالي لمتغير غير معرف');
      if (!errors[0].includes('غير معرف')) throw new Error('رسالة الخطأ يجب أن تكون بالعربية');
    });

    // -------------------------------------------------------------------------
    // 4. Required Arabic Acceptance Programs (Section 15 & Master)
    // -------------------------------------------------------------------------
    test('AR-ACC-01', 'اختبار القبول الرسمي (Section 15)', 'تنفيذ برنامج القبول الإلزامي في القسم 15 مع الأقواس', () => {
      const src = `متغير الاسم = "محمد"
متغير الأول = 10
متغير الثاني = 5

اطبع("مرحبًا " + الاسم)
اطبع(الأول + الثاني)
اطبع(الأول * الثاني)

إذا (الأول > الثاني) {
    اطبع("الأول أكبر")
} وإلا {
    اطبع("الثاني أكبر أو يساوي")
}
`;
      const lexer = new Lexer(src, 'section15.mj');
      const { tokens, errors: lexErr } = lexer.tokenize();
      if (lexErr.length > 0) throw new Error(lexErr[0]);

      const parser = new Parser(tokens, 'section15.mj');
      const { program, errors: parseErr } = parser.parse();
      if (parseErr.length > 0) throw new Error(parseErr[0]);

      const sem = new SemanticAnalyzer();
      const { errors: semErr } = sem.analyze(program);
      if (semErr.length > 0) throw new Error(semErr[0]);

      const interp = new Interpreter();
      const res = interp.interpret(program);
      if (!res.success) throw new Error(res.stderr[0]);

      const expected = "مرحبًا محمد\n15\n50\nالأول أكبر\n";
      const actual = res.stdout.join('');
      if (actual !== expected) {
        throw new Error(`المخرجات غير متطابقة!\nالمتوقع:\n${expected}\nالفعلي:\n${actual}`);
      }
    });

    test('AR-ACC-02', 'اختبار القبول الرسمي (Section 15)', 'تطابق تنفيذ الآلة الافتراضية MJ-VM لبرنامج القسم 15', () => {
      const src = `متغير الاسم = "محمد"
متغير الأول = 10
متغير الثاني = 5

اطبع("مرحبًا " + الاسم)
اطبع(الأول + الثاني)
اطبع(الأول * الثاني)

إذا (الأول > الثاني) {
    اطبع("الأول أكبر")
} وإلا {
    اطبع("الثاني أكبر أو يساوي")
}
`;
      const lexer = new Lexer(src, 'section15.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'section15.mj');
      const { program } = parser.parse();

      const compiler = new BytecodeCompiler();
      const { chunk, errors: compErr } = compiler.compile(program);
      if (compErr.length > 0) throw new Error(compErr[0]);

      const vm = new VirtualMachine();
      const res = vm.run(chunk, 'section15.mj');
      if (!res.success) throw new Error(res.stderr[0]);

      const expected = "مرحبًا محمد\n15\n50\nالأول أكبر\n";
      const actual = res.stdout.join('');
      if (actual !== expected) {
        throw new Error(`مخرجات VM غير متطابقة!\nالمتوقع:\n${expected}\nالفعلي:\n${actual}`);
      }
    });

    test('AR-ACC-03', 'اختبار القبول الرئيسي', 'تنفيذ دالة مربع والشروط بأسلوب النقطتين والمحاذاة', () => {
      const src = `متغير الاسم = "محمد"
متغير العدد = 10

دالة مربع(س):
    أرجع س * س

إذا العدد > 5:
    اطبع("أهلاً يا " + الاسم)
    اطبع(مربع(العدد))
وإلا:
    اطبع("العدد صغير")
`;
      const lexer = new Lexer(src, 'master.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'master.mj');
      const { program } = parser.parse();

      const interp = new Interpreter();
      const res = interp.interpret(program);
      if (!res.success) throw new Error(res.stderr[0]);

      const expected = "أهلاً يا محمد\n100\n";
      const actual = res.stdout.join('');
      if (actual !== expected) {
        throw new Error(`المخرجات غير متطابقة!\nالمتوقع:\n${expected}\nالفعلي:\n${actual}`);
      }
    });

    test('AR-ACC-04', 'اختبار القبول الرئيسي', 'تطابق الآلة الافتراضية MJ-VM مع المفسر لدالة مربع', () => {
      const src = `متغير الاسم = "محمد"
متغير العدد = 10

دالة مربع(س):
    أرجع س * س

إذا العدد > 5:
    اطبع("أهلاً يا " + الاسم)
    اطبع(مربع(العدد))
وإلا:
    اطبع("العدد صغير")
`;
      const lexer = new Lexer(src, 'master.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'master.mj');
      const { program } = parser.parse();

      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);

      const vm = new VirtualMachine();
      const res = vm.run(chunk, 'master.mj');
      if (!res.success) throw new Error(res.stderr[0]);

      const expected = "أهلاً يا محمد\n100\n";
      const actual = res.stdout.join('');
      if (actual !== expected) {
        throw new Error(`مخرجات الآلة الافتراضية غير متطابقة!\nالمتوقع:\n${expected}\nالفعلي:\n${actual}`);
      }
    });

    // -------------------------------------------------------------------------
    // 5. Conformance: Interpreter & VM Edge Cases
    // -------------------------------------------------------------------------
    test('CONF-01', 'تطابق المحركين (Conformance)', 'تطابق القسمة على صفر في المفسر والآلة الافتراضية', () => {
      const src = 'متغير س = 10 / 0';
      const lexer = new Lexer(src, 'div.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'div.mj');
      const { program } = parser.parse();

      // Test Interpreter
      const interp = new Interpreter();
      const intRes = interp.interpret(program);
      if (intRes.success) throw new Error('المفسر كان يجب أن يرمي خطأ القسمة على صفر');
      if (!intRes.stderr[0].includes('صفر')) throw new Error('رسالة المفسر يجب أن تذكر القسمة على صفر');

      // Test VM
      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);
      const vm = new VirtualMachine();
      const vmRes = vm.run(chunk, 'div.mj');
      if (vmRes.success) throw new Error('الآلة الافتراضية كان يجب أن ترمي خطأ القسمة على صفر');
      if (!vmRes.stderr[0].includes('صفر')) throw new Error('رسالة VM يجب أن تذكر القسمة على صفر');
    });

    test('CONF-02', 'تطابق المحركين (Conformance)', 'تطابق المنطق البولياني (و، أو، ليس) في المحركين', () => {
      const src = `
        ثابت ص = صحيح
        ثابت خ = خطأ
        متغير ن1 = ص و خ
        متغير ن2 = ص أو خ
        متغير ن3 = ليس خ
        اطبع(ن1)
        اطبع(ن2)
        اطبع(ن3)
      `;
      const lexer = new Lexer(src, 'bool.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'bool.mj');
      const { program } = parser.parse();

      const interp = new Interpreter();
      const intRes = interp.interpret(program);

      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);
      const vm = new VirtualMachine();
      const vmRes = vm.run(chunk, 'bool.mj');

      if (!intRes.success) throw new Error(intRes.stderr[0]);
      if (!vmRes.success) throw new Error(vmRes.stderr[0]);

      if (intRes.stdout.join('') !== vmRes.stdout.join('')) {
        throw new Error('عدم تطابق النتائج المنطقية بين المفسر والآلة الافتراضية');
      }
    });

    // -------------------------------------------------------------------------
    // 6. Runtime, I/O, Async & Cancellation Tests
    // -------------------------------------------------------------------------
    test('ASYNC-01', 'حزمة الاختبارات (Test Runner)', 'انتظار الوعود غير المتزامنة والإبلاغ عن الفشل بعد الاستقرار', async () => {
      let settled = false;
      const delayedPromise = new Promise((_, reject) => {
        setTimeout(() => {
          settled = true;
          reject(new Error('فشل متعمد لاختبار انتظار الوعود'));
        }, 15);
      });

      try {
        await delayedPromise;
        throw new Error('كان يجب رفض الوعد');
      } catch (err: any) {
        if (!settled) throw new Error('تم فحص الوعد قبل استقراره!');
        if (!err.message.includes('فشل متعمد')) throw err;
      }
    });

    test('IO-01', 'إدخال المستخدم (اقرأ)', 'قراءة مدخلات المستخدم من طابور المدخلات بدقة', async () => {
      const src = `
        متغير اسم = اقرأ("الاسم:")
        اطبع("مرحباً " + اسم)
      `;
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();

      const interp = new Interpreter({ inputQueue: ['محمد'] });
      const res = await interp.interpretAsync(program);
      if (!res.success) throw new Error(res.stderr[0]);
      if (res.stdout.join('') !== 'مرحباً محمد\n') {
        throw new Error(`مخرجات غير صحيحة: ${res.stdout.join('')}`);
      }
    });

    test('CANCEL-01', 'إلغاء التشغيل (Cancellation)', 'إلغاء التنفيذ يدوياً يوقف المفسر فوراً', () => {
      const interp = new Interpreter();
      interp.cancel();
      const src = 'متغير س = 1';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const res = interp.interpret(program);
      if (res.success) throw new Error('كان يجب إلغاء التنفيذ');
      if (!res.stderr[0].includes('إلغاء')) throw new Error('رسالة الخطأ يجب أن توضح الإلغاء');
    });

    test('CANCEL-02', 'إلغاء التشغيل (Cancellation)', 'إلغاء التنفيذ يدوياً يوقف الآلة الافتراضية فوراً', () => {
      const vm = new VirtualMachine();
      vm.cancel();
      const src = 'متغير س = 1';
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);
      const res = vm.run(chunk);
      if (res.success) throw new Error('كان يجب إلغاء الآلة الافتراضية');
      if (!res.stderr[0].includes('إلغاء')) throw new Error('رسالة الخطأ يجب أن توضح الإلغاء');
    });

    test('IO-02', 'إدخال الآلة الافتراضية (MJ-VM Input)', 'قراءة مدخلات المستخدم وسلسلة فارغة في الآلة الافتراضية عبر inputQueue', async () => {
      const src = `
        متغير نص1 = اقرأ()
        متغير نص2 = اقرأ()
        اطبع("الأول: " + نص1)
        اطبع("الثاني: " + نص2)
      `;
      const lexer = new Lexer(src, 'test_vm_io.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);

      // Provide two inputs: non-empty string and explicit empty string ""
      const vm = new VirtualMachine({ inputQueue: ['القاهرة', ''] });
      const res = await vm.runAsync(chunk);
      if (!res.success) throw new Error(res.stderr[0]);
      if (res.stdout.join('') !== 'الأول: القاهرة\nالثاني: \n') {
        throw new Error(`مخرجات غير صحيحة للآلة الافتراضية: ${JSON.stringify(res.stdout)}`);
      }
    });

    test('IO-03', 'إدخال المستخدم التفاعلي غير المتزامن (Async onInputRequest)', 'استجابة المفسر والآلة الافتراضية لطلب المدخلات غير المتزامن', async () => {
      const src = `
        متغير عمر = اقرأ("كم عمرك؟ ")
        اطبع("العمر المسجل: " + عمر)
      `;
      const lexer = new Lexer(src, 'test_async_io.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);

      let interpPrompt = '';
      const interp = new Interpreter({
        onInputRequest: async (p) => {
          interpPrompt = p || '';
          await new Promise((r) => setTimeout(r, 10));
          return '25';
        },
      });
      const interpRes = await interp.interpretAsync(program);
      if (!interpRes.success) throw new Error(interpRes.stderr[0]);
      if (interpPrompt !== 'كم عمرك؟ ' || interpRes.stdout.join('') !== 'العمر المسجل: 25\n') {
        throw new Error('فشل إدخال المفسر غير المتزامن');
      }

      let vmPrompt = '';
      const vm = new VirtualMachine({
        onInputRequest: async (p) => {
          vmPrompt = p || '';
          await new Promise((r) => setTimeout(r, 10));
          return '25';
        },
      });
      const vmRes = await vm.runAsync(chunk);
      if (!vmRes.success) throw new Error(vmRes.stderr[0]);
      if (vmPrompt !== 'كم عمرك؟ ' || vmRes.stdout.join('') !== 'العمر المسجل: 25\n') {
        throw new Error('فشل إدخال الآلة الافتراضية غير المتزامن');
      }
    });

    test('IO-04', 'التعامل مع غياب المدخلات (Missing Input)', 'رمي خطأ صريح عند استدعاء اقرأ دون توفير مصدر مدخلات وعدم تعويضها بصمت', async () => {
      const src = `متغير س = اقرأ()`;
      const lexer = new Lexer(src, 'test_missing_io.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);

      // Interpreter without inputQueue or onInputRequest
      const interp = new Interpreter();
      const intRes = await interp.interpretAsync(program);
      if (intRes.success) throw new Error('كان يجب أن يفشل المفسر عند غياب المدخلات');
      if (!intRes.stderr[0].includes('لا توجد مدخلات')) {
        throw new Error(`رسالة خطأ المفسر غير متوقعة: ${intRes.stderr[0]}`);
      }

      // VM without inputQueue or onInputRequest
      const vm = new VirtualMachine();
      const vmRes = await vm.runAsync(chunk);
      if (vmRes.success) throw new Error('كان يجب أن تفشل الآلة الافتراضية عند غياب المدخلات');
      if (!vmRes.stderr[0].includes('لا توجد مدخلات')) {
        throw new Error(`رسالة خطأ الآلة الافتراضية غير متوقعة: ${vmRes.stderr[0]}`);
      }
    });

    test('CANCEL-03', 'إلغاء التشغيل أثناء التنفيذ (Cancellation During Execution)', 'إلغاء التنفيذ بنجاح أثناء تشغيل حلقة مستمرة وإيقاف المخرجات', async () => {
      const src = `
        متغير ع = 0
        طالما صحيح {
          ع = ع + 1
          اطبع("دورة " + ع)
        }
      `;
      const lexer = new Lexer(src, 'test_cancel_loop.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const compiler = new BytecodeCompiler();
      const { chunk } = compiler.compile(program);

      // Cancel Interpreter while running
      const interp = new Interpreter();
      const interpPromise = interp.interpretAsync(program);
      await new Promise((r) => setTimeout(r, 15));
      interp.cancel();
      const interpRes = await interpPromise;
      if (interpRes.success) throw new Error('كان يجب إيقاف المفسر أثناء التشغيل');
      if (!interpRes.stderr[0].includes('إلغاء')) {
        throw new Error(`رسالة الإلغاء غير واضحة في المفسر: ${interpRes.stderr[0]}`);
      }

      // Cancel VM while running
      const vm = new VirtualMachine();
      const vmPromise = vm.runAsync(chunk);
      await new Promise((r) => setTimeout(r, 15));
      vm.cancel();
      const vmRes = await vmPromise;
      if (vmRes.success) throw new Error('كان يجب إيقاف الآلة الافتراضية أثناء التشغيل');
      if (!vmRes.stderr[0].includes('إلغاء')) {
        throw new Error(`رسالة الإلغاء غير واضحة في الآلة: ${vmRes.stderr[0]}`);
      }
      const outputAtCancellation = vmRes.stdout.join('');
      await new Promise((r) => setTimeout(r, 20));
      if (vmRes.stdout.join('') !== outputAtCancellation) {
        throw new Error('استمرت مخرجات الآلة الافتراضية بعد اكتمال الإلغاء');
      }

      // Reuse the same VM after cancellation: the next run must start cleanly.
      const nextProgram = new Parser(new Lexer('اطبع(200)', 'after_cancel.mj').tokenize().tokens).parse().program;
      const nextChunk = new BytecodeCompiler().compile(nextProgram).chunk;
      const nextResult = await vm.runAsync(nextChunk, 'after_cancel.mj');
      if (!nextResult.success || nextResult.stdout.join('') !== '200\n') {
        throw new Error(`لم تبدأ الآلة من حالة نظيفة بعد الإلغاء: ${nextResult.stdout.join('')} ${nextResult.stderr.join('')}`);
      }
    });

    test('STATE-01', 'عزل حالة التشغيل المتكرر (State Isolation & Reuse)', 'التشغيل المتتالي لبرامج مختلفة مع ضمان عدم تلوث الحالة السابقة', async () => {
      const src1 = `
        متغير س = 100
        اطبع(س)
      `;
      const src2 = `
        متغير ص = 200
        اطبع(ص)
      `;

      // Run 1 in Interp & VM
      const lex1 = new Lexer(src1, 'run1.mj');
      const p1 = new Parser(lex1.tokenize().tokens).parse().program;
      const c1 = new BytecodeCompiler().compile(p1).chunk;

      const int1 = new Interpreter();
      const resInt1 = await int1.interpretAsync(p1);
      const vm1 = new VirtualMachine();
      const resVm1 = await vm1.runAsync(c1);

      if (resInt1.stdout.join('') !== '100\n' || resVm1.stdout.join('') !== '100\n') {
        throw new Error('فشل التشغيل الأول');
      }

      // Run 2 in fresh instances - verify variables from run 1 are not leaked
      const lex2 = new Lexer(src2, 'run2.mj');
      const p2 = new Parser(lex2.tokenize().tokens).parse().program;
      const c2 = new BytecodeCompiler().compile(p2).chunk;

      const int2 = new Interpreter();
      const resInt2 = await int2.interpretAsync(p2);
      const vm2 = new VirtualMachine();
      const resVm2 = await vm2.runAsync(c2);

      if (resInt2.stdout.join('') !== '200\n' || resVm2.stdout.join('') !== '200\n') {
        throw new Error('فشل التشغيل الثاني أو تداخلت الحالات');
      }
    });

    test('PARITY-01', 'تطابق المخرجات بين المفسر والآلة (Interp & VM Parity)', 'التحقق من تطابق سلوك ومخرجات البرامج العربية بين المفسر والآلة الافتراضية', async () => {
      const src = `
        دالة حساب(أ، ب):
          متغير م = أ * ب + 10
          إذا (م > 50) {
            أرجع م * 2
          } وإلا {
            أرجع م
          }

        اطبع(حساب(5، 10))
        اطبع(حساب(2، 3))
      `;
      const lex = new Lexer(src, 'parity.mj');
      const p = new Parser(lex.tokenize().tokens).parse().program;
      const c = new BytecodeCompiler().compile(p).chunk;

      const int = new Interpreter();
      const intRes = await int.interpretAsync(p);

      const vm = new VirtualMachine();
      const vmRes = await vm.runAsync(c);

      if (!intRes.success || !vmRes.success) {
        throw new Error(`فشل التنفيذ في أحد المحركين: Interp=${intRes.success}, VM=${vmRes.success}`);
      }
      if (intRes.stdout.join('') !== vmRes.stdout.join('')) {
        throw new Error(`المخرجات غير متطابقة! Interp: ${intRes.stdout.join('')} vs VM: ${vmRes.stdout.join('')}`);
      }
      if (intRes.stdout.join('') !== '120\n16\n') {
        throw new Error(`مخرجات غير صحيحة للحساب: ${intRes.stdout.join('')}`);
      }
    });

    test('SEC-01', 'الأمان وحصة الطاقة (Security)', 'إيقاف الحلقات اللانهائية بحصة الطاقة بأمان', () => {
      const src = `
        طالما صحيح:
            // حلقة لانهائية
      `;
      const lexer = new Lexer(src, 'test.mj');
      const parser = new Parser(lexer.tokenize().tokens);
      const { program } = parser.parse();
      const interp = new Interpreter({ maxFuel: 2000 });
      const res = interp.interpret(program);
      if (res.success) throw new Error('كان يجب إيقاف الحلقة اللانهائية');
      if (!res.stderr[0].includes('تم استهلاك الحد الأقصى')) {
        throw new Error('رسالة الخطأ يجب أن توضح استهلاك الطاقة');
      }
    });

    test('MATCH-01', 'مطابقة الأنماط (Pattern Matching)', 'تنفيذ جملة طابق مع الحالات المختلفة والحالة الافتراضية', () => {
      const src = `
        دالة تقييم(درجة):
            أرجع طابق درجة {
                100 => "ممتاز جداً"،
                90 => "ممتاز"،
                80 => "جيد جداً"،
                _ => "يحتاج تحسين"
            }
        اطبع(تقييم(100))
        اطبع(تقييم(75))
      `;
      const lexer = new Lexer(src, 'match.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'match.mj');
      const { program, errors } = parser.parse();
      if (errors.length > 0) throw new Error(errors[0]);

      const interp = new Interpreter();
      const res = interp.interpret(program);
      if (!res.success) throw new Error(res.stderr[0]);
      if (res.stdout.join('') !== "ممتاز جداً\nيحتاج تحسين\n") {
        throw new Error(`مخرجات غير متوقعة لمطابقة الأنماط: ${res.stdout.join('')}`);
      }
    });

    test('LAMBDA-01', 'الدوال المجهولة (Lambdas)', 'دعم الدوال السهمية والمجهولة مع دوال القوائم العليا', () => {
      const src = `
        ثابت أرقام = [1، 2، 3، 4]
        ثابت زوجي = القوائم.رشح(أرقام، دالة(س) => س % 2 == 0)
        اطبع(زوجي)
      `;
      const lexer = new Lexer(src, 'lambda.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'lambda.mj');
      const { program, errors } = parser.parse();
      if (errors.length > 0) throw new Error(errors[0]);

      const interp = new Interpreter();
      const res = interp.interpret(program);
      if (!res.success) throw new Error(res.stderr[0]);
      if (res.stdout.join('') !== "[2، 4]\n") {
        throw new Error(`مخرجات غير صحيحة للدالة السهمية: ${res.stdout.join('')}`);
      }
    });

    test('MOD-01', 'الوحدات النمطية المتعددة (Modules)', 'استيراد وفصل الوحدات النمطية واكتشاف الاستيراد الدائري', () => {
      const files = new Map<string, string>();
      files.set('math_helper.mj', `
        دالة مضاعف(س):
            أرجع س * 2
      `);
      files.set('app.mj', `
        استورد "./math_helper.mj" باسم مساعد
        متغير ن = مساعد.مضاعف(21)
        اطبع(ن)
      `);

      const resolver = new ModuleResolver(files);
      const { moduleEnvs, errors } = resolver.resolveAll();
      if (errors.length > 0) throw new Error(errors[0]);

      const appSource = files.get('app.mj')!;
      const lexer = new Lexer(appSource, 'app.mj');
      const parser = new Parser(lexer.tokenize().tokens, 'app.mj');
      const { program } = parser.parse();

      const interp = new Interpreter({ customModules: moduleEnvs });
      const res = interp.interpret(program);
      if (!res.success) throw new Error(res.stderr[0]);
      if (res.stdout.join('') !== '42\n') {
        throw new Error(`مخرجات غير صحيحة للوحدات: ${res.stdout.join('')}`);
      }
    });

    test('EXAMPLES-01', 'أمثلة المشاريع الرسمية (Showcase)', 'التحقق من صحة وتنفيذ جميع الأمثلة النموذجية العشرة', async () => {
      for (const eg of CODE_EXAMPLES) {
        const lexer = new Lexer(eg.code, eg.filename);
        const { tokens, errors: lexErr } = lexer.tokenize();
        if (lexErr.length > 0) throw new Error(`خطأ معجمي في ${eg.id}: ${lexErr[0]}`);

        const parser = new Parser(tokens, eg.filename);
        const { program, errors: parseErr } = parser.parse();
        if (parseErr.length > 0) throw new Error(`خطأ نحوي في ${eg.id}: ${parseErr[0]}`);

        const sem = new SemanticAnalyzer();
        const { errors: semErr } = sem.analyze(program);
        if (semErr.length > 0) throw new Error(`خطأ دلالي في ${eg.id}: ${semErr[0]}`);

        const interp = new Interpreter({ inputQueue: ['طالب مجتهد'] });
        const intRes = await interp.interpretAsync(program);
        if (!intRes.success) throw new Error(`خطأ تشغيل المفسر في ${eg.id}: ${intRes.stderr[0]}`);

        const compiler = new BytecodeCompiler();
        const { chunk, errors: compErr } = compiler.compile(program);
        if (compErr.length > 0) throw new Error(`خطأ المترجم في ${eg.id}: ${compErr[0]}`);

        const vm = new VirtualMachine({ inputQueue: ['طالب مجتهد'] });
        const vmRes = vm.run(chunk, eg.filename);
        if (!vmRes.success) throw new Error(`خطأ تشغيل الآلة في ${eg.id}: ${vmRes.stderr[0]}`);
      }
    });

    // Execute test cases sequentially, properly awaiting each asynchronous test!
    for (const tc of testCases) {
      const t0 = performance.now();
      try {
        await tc.fn();
        results.push({
          id: tc.id,
          category: tc.category,
          name: tc.name,
          passed: true,
          durationMs: performance.now() - t0,
        });
      } catch (err: any) {
        results.push({
          id: tc.id,
          category: tc.category,
          name: tc.name,
          passed: false,
          durationMs: performance.now() - t0,
          errorMessage: err.message || String(err),
        });
      }
    }

    const durationMs = performance.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return {
      total: results.length,
      passed,
      failed,
      durationMs,
      results,
    };
  }
}
