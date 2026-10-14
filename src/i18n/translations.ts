/**
 * MJ Studio - Bilingual Localization (English & Arabic)
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

export type Language = 'en' | 'ar';

export interface Translations {
  appName: string;
  tagline: string;
  creatorBadge: string;
  run: string;
  stop: string;
  running: string;
  backend: string;
  backendAst: string;
  backendVm: string;
  files: string;
  newFile: string;
  deleteFile: string;
  renameFile: string;
  templates: string;
  examples: string;
  console: string;
  clearConsole: string;
  diagnostics: string;
  noDiagnostics: string;
  astExplorer: string;
  bytecodeViewer: string;
  tokensViewer: string;
  docs: string;
  testSuite: string;
  runTests: string;
  exportProject: string;
  themeDark: string;
  themeLight: string;
  executionMetrics: string;
  steps: string;
  time: string;
  memory: string;
  ready: string;
  error: string;
  success: string;
  suggestion: string;
  fuelLimit: string;
  inputPrompt: string;
  enterInput: string;
  sendInput: string;
  consoleEmpty: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "MJ Studio",
    tagline: "Think Beyond Syntax.",
    creatorBadge: "By Mohamed Khamis",
    run: "Run Program",
    stop: "Stop",
    running: "Executing...",
    backend: "Execution Engine",
    backendAst: "AST Interpreter (Tree-Walk)",
    backendVm: "MJ-VM (Stack Bytecode VM)",
    files: "Project Files",
    newFile: "New .mj File",
    deleteFile: "Delete File",
    renameFile: "Rename File",
    templates: "Example Programs",
    examples: "Examples",
    console: "Console Output",
    clearConsole: "Clear Console",
    diagnostics: "Diagnostics",
    noDiagnostics: "No errors or warnings detected.",
    astExplorer: "AST Visualizer",
    bytecodeViewer: "Bytecode & Disassembly",
    tokensViewer: "Lexer Tokens",
    docs: "Language Docs & EBNF",
    testSuite: "Automated Test Suite",
    runTests: "Run All Tests",
    exportProject: "Export Files",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    executionMetrics: "Execution Telemetry",
    steps: "Instructions Executed",
    time: "Execution Time",
    memory: "Stack Depth",
    ready: "Ready",
    error: "Error",
    success: "Success",
    suggestion: "Actionable Suggestion",
    fuelLimit: "Fuel Quota",
    inputPrompt: "Program Stdin Input",
    enterInput: "Type input and press Enter...",
    sendInput: "Send",
    consoleEmpty: "MJ Console ready. Click 'Run Program' or press Ctrl+Enter.",
  },
  ar: {
    appName: "استوديو إم جي (MJ Studio)",
    tagline: "فكّر بما وراء الصيغة البرمجية.",
    creatorBadge: "ابتكار: محمد خميس",
    run: "تشغيل البرنامج",
    stop: "إيقاف",
    running: "قيد التنفيذ...",
    backend: "محرك التنفيذ",
    backendAst: "مفسر شجرة البناء (AST Interpreter)",
    backendVm: "الآلة الافتراضية للبايت كود (MJ-VM)",
    files: "ملفات المشروع",
    newFile: "ملف mj. جديد",
    deleteFile: "حذف الملف",
    renameFile: "إعادة تسمية",
    templates: "نماذج وبرامج جاهزة",
    examples: "الأمثلة",
    console: "منصة المخرجات (Console)",
    clearConsole: "مسح المخرجات",
    diagnostics: "التشخيص والأخطاء",
    noDiagnostics: "لا توجد أخطاء أو تحذيرات.",
    astExplorer: "شجرة البناء النحوي (AST)",
    bytecodeViewer: "شفرة البايت كود (Bytecode)",
    tokensViewer: "محلل الرموز (Lexer Tokens)",
    docs: "توثيق اللغة وقواعد EBNF",
    testSuite: "حزمة الاختبارات الآلية",
    runTests: "بدء جميع الاختبارات",
    exportProject: "تصدير الملفات",
    themeDark: "الوضع الداكن",
    themeLight: "الوضع الفاتح",
    executionMetrics: "قياسات الأداء والتنفيذ",
    steps: "التعليمات المنفذة",
    time: "زمن التنفيذ",
    memory: "عمق المكدس",
    ready: "جاهز",
    error: "خطأ",
    success: "نجاح",
    suggestion: "اقتراح تصحيحي",
    fuelLimit: "حصة استهلاك المعالج",
    inputPrompt: "مدخلات البرنامج القياسية",
    enterInput: "اكتب المدخلات واضغط إدخال...",
    sendInput: "إرسال",
    consoleEmpty: "منصة إم جي جاهزة. اضغط 'تشغيل البرنامج' أو استخدم اختصار Ctrl+Enter.",
  },
};
