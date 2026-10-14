# مواصفات لغة إم جي البرمجية (MJ Programming Language)
**الاسم الرسمي:** لغة إم جي البرمجية (MJ)  
**المبتكر:** محمد خميس (Mohamed Khamis)  
**الشعار الرسمي:** "فكر بما وراء الصيغة البرمجية." (Think Beyond Syntax.)  
**امتداد الملفات:** `.mj`

---

## 1. الهوية والفلسفة التصميمية
لغة إم جي (MJ) هي لغة برمجة عامة الأغراض، عربية التأسيس ومستقلة التصميم. صُممت لتمكين المبرمجين العرب من التعبير عن الخوارزميات البرمجية وبناء الأنظمة بلغة طبيعية ومنطقية وواضحة، مع احترام كامل لقواعد الصرف وقواعد المعنى، وتوفير بيئة تنفيذية حقيقية تتضمن محللاً معجمياً (Lexer)، ومحللاً نحوياً برات (Pratt Parser)، وتحليلاً دلالياً للنطاقات (Semantic Analyzer)، ومحركي تشغيل:
1. **مفسر شجرة البناء النحوي (Tree-Walk AST Interpreter)**
2. **الآلة الافتراضية للبايت كود (MJ-VM)** مع عارض فك التجميع (Disassembler).

---

## 2. قواعد الصياغة الرسمية (EBNF Grammar)

\`\`\`ebnf
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

/* التحكم والتكرار */
BlockStmt       ::= "{" Statement* "}" | IndentedBlock ;
WhenStmt        ::= "إذا" ( "(" Expression ")" | Expression ) ( ":" )? Statement ( "وإلا" ( ":" )? Statement )? ;
WhileStmt       ::= "طالما" ( "(" Expression ")" | Expression ) ( ":" )? Statement ;
ForInStmt       ::= "لكل" ( "(" IDENTIFIER "في" Expression ")" | IDENTIFIER "في" Expression ) ( ":" )? Statement ;
RepeatStmt      ::= "كرر" ( "(" Expression ")" | Expression ) ( ":" )? Statement ;
ReturnStmt      ::= "أرجع" Expression? ( ";" | "؛" )? ;
BreakStmt       ::= "توقف" ( ";" | "؛" )? ;
ContinueStmt    ::= "استمر" ( ";" | "؛" )? ;
ImportStmt      ::= "استورد" STRING ( "باسم" IDENTIFIER )? ( ";" | "؛" )? ;

/* التعبيرات الحسابية والمنطقية */
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
\`\`\`

---

## 3. محرك الأمان وإدارة الموارد
- **حصة التعليمات (Gas/Fuel Limit):** يحدد المحرك 300,000 خطوة كحد أقصى لمنع تجميد واجهة الاستخدام عند حدوث حلقات لانهائية.
- **حماية مكدس الاستدعاءات:** حد أقصى 500 إطار استدعاء لمنع انهيار الذاكرة بالاستدعاء الذاتي اللانهائي.
- **إمكانية الإلغاء الفوري:** زر التوقف يلغي تنفيذ المحرك فوراً وينظف الموارد.
