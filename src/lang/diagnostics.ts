/**
 * MJ Programming Language - Arabic Diagnostic Engine
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

import { SourceLocation } from './tokens';

export interface FormattedDiagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  codeSnippet?: string;
  suggestion?: string;
}

export class DiagnosticEngine {
  public static parseDiagnosticString(
    rawMessage: string,
    sourceMap: Map<string, string>
  ): FormattedDiagnostic {
    // Pattern: [filename:line:column] Category: Message
    const match = rawMessage.match(/^\[(.*?):(\d+):(\d+)\]\s*(.*?):\s*(.*)$/);
    if (!match) {
      return {
        file: 'main.mj',
        line: 1,
        column: 1,
        severity: rawMessage.toLowerCase().includes('تحذير') ? 'warning' : 'error',
        message: rawMessage,
      };
    }

    const file = match[1];
    const line = parseInt(match[2], 10);
    const column = parseInt(match[3], 10);
    const category = match[4];
    const message = match[5];

    let snippet: string | undefined = undefined;
    const sourceCode = sourceMap.get(file);
    if (sourceCode) {
      snippet = DiagnosticEngine.generateCodeSnippet(sourceCode, line, column);
    }

    const suggestion = DiagnosticEngine.suggestFix(category, message);

    return {
      file,
      line,
      column,
      severity: category.toLowerCase().includes('تحذير') ? 'warning' : 'error',
      message: `${category}: ${message}`,
      codeSnippet: snippet,
      suggestion,
    };
  }

  public static generateCodeSnippet(source: string, line: number, column: number): string {
    const lines = source.split('\n');
    if (line < 1 || line > lines.length) return '';

    const targetLine = lines[line - 1];
    const lineNumStr = String(line).padStart(4, ' ');
    const gutter = `${lineNumStr} | `;
    const indent = ' '.repeat(gutter.length + Math.max(0, column - 1));
    const pointer = indent + '^';

    return `${gutter}${targetLine}\n${pointer}`;
  }

  public static suggestFix(category: string, message: string): string | undefined {
    const msg = message.toLowerCase();

    if (msg.includes('ثابت') || msg.includes('لا يمكن إعادة تعيين')) {
      return "قم بتعريف المتغير باستخدام 'متغير' بدلاً من 'ثابت' إذا كنت تريد تعديل قيمته لاحقاً.";
    }
    if (msg.includes('غير معرف') || msg.includes('undefined')) {
      return "تأكد من كتابة اسم المعرف بشكل صحيح وتعريفه أولاً باستخدام 'متغير اسم = ...' أو 'ثابت اسم = ...'.";
    }
    if (msg.includes('ينقص قوس') || msg.includes("expected ')'")) {
      return "تأكد من إغلاق جميع الأقواس المفتوحة '(' بالأقواس المناسبة ')'.";
    }
    if (msg.includes('ينقص') && msg.includes('}')) {
      return "تأكد من إغلاق جميع الكتل البرمجية المفتوحة بالرمز '}'.";
    }
    if (msg.includes('عدم تطابق في النوع') || msg.includes('type mismatch')) {
      return "تأكد من أن نوع القيمة المسندة يتوافق تماماً مع النوع المصرح عنه.";
    }
    if (msg.includes('مكدس الاستدعاءات') || msg.includes('stack')) {
      return "تحقق من شروط توقف الدوال التكرارية (الاستدعاء الذاتي) لتجنب الحلقات اللانهائية.";
    }
    if (msg.includes('استهلاك الحد الأقصى للطاقة') || msg.includes('حلقة غير منتهية') || msg.includes('quota')) {
      return "تحقق من متغيرات التحكم في الحلقة وتأكد من وصولها لشرط التوقف لتفادي التكرار اللانهائي.";
    }
    if (msg.includes('لا يمكن استخدام \'أرجع\' خارج')) {
      return "ضع جملة 'أرجع' داخل كتلة دالة معرفة باستخدام 'دالة'.";
    }
    return undefined;
  }
}
