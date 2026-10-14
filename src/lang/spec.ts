/**
 * MJ Programming Language - Arabic Formal Specification & Architecture
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

export const MJ_FORMAL_SPECIFICATION = {
  name: "لغة إم جي البرمجية (MJ Programming Language)",
  shortName: "إم جي (MJ)",
  version: "1.0.0 (عربي)",
  creator: "محمد خميس (Mohamed Khamis)",
  tagline: "فكر بما وراء الصيغة البرمجية. (Think Beyond Syntax.)",
  fileExtension: ".mj",

  ebnfGrammar: `
/* ==========================================================================
   لغة إم جي البرمجية — قواعد الصياغة الرسمية EBNF (الإصدار 1.0)
   الابتكار والتصميم: محمد خميس
   الشعار: "فكر بما وراء الصيغة البرمجية."
   ========================================================================== */

Program         ::= Statement* EOF ;

Statement       ::= VarDecl
                  | FunctionDecl
                  | BlockStmt
                  | WhenStmt
                  | WhileStmt
                  | ForInStmt
                  | RepeatStmt
                  | ReturnStmt
                  | BreakStmt
                  | ContinueStmt
                  | ImportStmt
                  | ExprStmt ;

/* الإعلانات */
VarDecl         ::= ( "متغير" | "ثابت" ) IDENTIFIER ( ":" TypeAnnotation )? "=" Expression ( ";" | "؛" )? ;
FunctionDecl    ::= "دالة" IDENTIFIER "(" ParameterList? ")" ( "->" TypeAnnotation )? ( ":" )? BlockStmt ;
ParameterList   ::= Parameter ( ( "،" | "," ) Parameter )* ;
Parameter       ::= IDENTIFIER ( ":" TypeAnnotation )? ;
TypeAnnotation  ::= IDENTIFIER ( "[" TypeAnnotation "]" )? ;

/* كتل الأوامر والتحكم */
BlockStmt       ::= "{" Statement* "}" | IndentedBlock ;
WhenStmt        ::= "إذا" ( "(" Expression ")" | Expression ) ( ":" )? Statement ( "وإلا" ( ":" )? Statement )? ;
WhileStmt       ::= "طالما" ( "(" Expression ")" | Expression ) ( ":" )? Statement ;
ForInStmt       ::= "لكل" ( "(" IDENTIFIER "في" Expression ")" | IDENTIFIER "في" Expression ) ( ":" )? Statement ;
RepeatStmt      ::= "كرر" ( "(" Expression ")" | Expression ) ( ":" )? Statement ;
ReturnStmt      ::= "أرجع" Expression? ( ";" | "؛" )? ;
BreakStmt       ::= "توقف" ( ";" | "؛" )? ;
ContinueStmt    ::= "استمر" ( ";" | "؛" )? ;
ImportStmt      ::= "استورد" STRING ( "باسم" IDENTIFIER )? ( ";" | "؛" )? ;

/* التعبيرات */
Expression      ::= Assignment ;
Assignment      ::= ( Target "=" )? LogicalOr ;
Target          ::= IDENTIFIER | PostfixExpr ;

LogicalOr       ::= LogicalAnd ( ( "أو" | "||" ) LogicalAnd )* ;
LogicalAnd      ::= Equality ( ( "و" | "&&" ) Equality )* ;
Equality        ::= Comparison ( ( "==" | "!=" ) Comparison )* ;
Comparison      ::= Term ( ( "<" | "<=" | ">" | ">=" ) Term )* ;
Term            ::= Factor ( ( "+" | "-" ) Factor )* ;
Factor          ::= Unary ( ( "*" | "/" | "%" ) Unary )* ;
Unary           ::= ( "ليس" | "!" | "-" ) Unary | PostfixExpr ;
PostfixExpr     ::= Primary ( "(" ArgumentList? ")" | "." IDENTIFIER | "[" Expression "]" )* ;

ArgumentList    ::= Expression ( ( "،" | "," ) Expression )* ;

Primary         ::= INT | FLOAT | STRING
                  | "صحيح" | "خطأ" | "فارغ"
                  | IDENTIFIER
                  | "(" Expression ")"
                  | ListLiteral
                  | MapLiteral
                  | MatchExpr
                  | FunctionExpr ;

ListLiteral     ::= "[" ( Expression ( ( "،" | "," ) Expression )* )? "]" ;
MapLiteral      ::= "#{" ( MapEntry ( ( "،" | "," ) MapEntry )* )? "}" ;
MapEntry        ::= Expression ":" Expression ;

MatchExpr       ::= "طابق" Expression "{" MatchArm* "}" ;
MatchArm        ::= ( Expression | "_" | "افتراضي" ) "=>" ( BlockStmt | Expression ) ( "،" | "," )? ;
`,

  roadmap: `
## خارطة طريق لغة إم جي نحو التجميع الأصيل والتوليد الذاتي
### المرحلة 1: البيئة المرجعية المكتملة (الحالية)
- محلل معجمي متقدم يدعم ترميز اليونيكود والحروف والأرقام العربية والمشرقية.
- محلل نحوي يدعم الأسبقية والكتل النقطية والأقواس.
- مفسر شجرة البناء (AST Interpreter) مع تتبع كامل للاستدعاءات.
- آلة افتراضية للبايت كود (MJ-VM) مع شفرة تجميعية (Bytecode Chunks) وفك تجميع مباشر.
- حزمة اختبارات مؤتمتة متكاملة.

### المرحلة 2: توليد الشفرة الوسيطة لـ LLVM (AOT Native Compilation)
- تصميم مولد LLVM IR (.ll) مباشر من شجرة إم جي (AST).
- التجميع المباشر عبر Clang/LLVM إلى ملفات تنفيذية ثنائية لأنظمة:
  - Linux (ELF x86_64 / aarch64)
  - Windows (PE-COFF)
  - macOS (Mach-O ARM64)
- إدارة الذاكرة: العد المرجعي الآلي (Automatic Reference Counting) مع جامع الحلقات المتشابكة لهياكل إم جي.

### المرحلة 3: هدف WebAssembly (Wasm) المستقل
- تصدير ملفات .wasm ثنائية مباشرة دون الحاجة لأي محركات وسيطة.

### المرحلة 4: الاستضافة الذاتية الكاملة (Self-Hosting)
- إعادة كتابة مترجم إم جي بالكامل بلغة إم جي نفسها في ملف compiler.mj.
- إقلاع المترجم ذاتياً بالاعتماد على الثنائيات المولدة في المرحلة 2.
`,
};
