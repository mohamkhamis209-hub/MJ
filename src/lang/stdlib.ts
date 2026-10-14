/**
 * MJ Programming Language - Arabic Standard Library & Value Formatter
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax" / "فكر بما وراء الصيغة البرمجية"
 */

export interface ExecutionContext {
  print: (text: string) => void;
  println: (text: string) => void;
  read: (prompt?: string) => Promise<string> | string;
  getFuelRemaining: () => number;
}

export function createStandardLibrary(
  ctx: ExecutionContext,
  callFn?: (fn: any, args: any[]) => any
): Record<string, any> {
  // Printing & I/O
  const printFn = (...args: any[]) => {
    const output = args.map(formatMJValue).join(' ');
    ctx.println(output);
    return null;
  };

  const printNoNewlineFn = (...args: any[]) => {
    const output = args.map(formatMJValue).join(' ');
    ctx.print(output);
    return null;
  };

  const readFn = (promptText?: string) => {
    return ctx.read(promptText);
  };

  // 1. الطباعة / io Module
  const ioModule = {
    اطبع: printFn,
    اطبع_سطر: printFn,
    اقرأ: readFn,
    print: printNoNewlineFn,
    println: printFn,
    read: readFn,
  };

  // 2. الرياضيات / math Module
  const mathModule = {
    // Constants
    ط: Math.PI,
    هـ: Math.E,
    PI: Math.PI,
    E: Math.E,

    // Operations
    جذر: (x: number) => Math.sqrt(Number(x)),
    قوة: (b: number, e: number) => Math.pow(Number(b), Number(e)),
    مطلق: (x: number) => Math.abs(Number(x)),
    أدنى: (a: number, b: number) => Math.min(Number(a), Number(b)),
    أقصى: (a: number, b: number) => Math.max(Number(a), Number(b)),
    أرضية: (x: number) => Math.floor(Number(x)),
    سقف: (x: number) => Math.ceil(Number(x)),
    تقريب: (x: number) => Math.round(Number(x)),
    عشوائي: () => Math.random(),
    جيب: (x: number) => Math.sin(Number(x)),
    جيب_تمام: (x: number) => Math.cos(Number(x)),
    ظل: (x: number) => Math.tan(Number(x)),

    // Aliases
    sqrt: (x: number) => Math.sqrt(Number(x)),
    pow: (b: number, e: number) => Math.pow(Number(b), Number(e)),
    abs: (x: number) => Math.abs(Number(x)),
    min: (a: number, b: number) => Math.min(Number(a), Number(b)),
    max: (a: number, b: number) => Math.max(Number(a), Number(b)),
    floor: (x: number) => Math.floor(Number(x)),
    ceil: (x: number) => Math.ceil(Number(x)),
    round: (x: number) => Math.round(Number(x)),
    random: () => Math.random(),
  };

  // 3. النصوص / str Module
  const strModule = {
    طول: (s: any) => String(s ?? '').length,
    أحرف_كبيرة: (s: any) => String(s ?? '').toUpperCase(),
    أحرف_صغيرة: (s: any) => String(s ?? '').toLowerCase(),
    تقسيم: (s: any, delim: string = '') => String(s ?? '').split(delim),
    دمج: (list: any[], delim: string = '، ') =>
      Array.isArray(list) ? list.map(formatMJValue).join(delim) : '',
    قص: (s: any, start: number, end?: number) => {
      const str = String(s ?? '');
      return end !== undefined
        ? str.substring(Number(start), Number(end))
        : str.substring(Number(start));
    },
    يحتوي: (s: any, sub: string) => String(s ?? '').includes(String(sub)),
    تشذيب: (s: any) => String(s ?? '').trim(),
    استبدل: (s: any, target: string, replacement: string) =>
      String(s ?? '').replace(target, replacement),
    حرف: (s: any, idx: number) => String(s ?? '').charAt(Number(idx)),

    // Aliases
    len: (s: any) => String(s ?? '').length,
    upper: (s: any) => String(s ?? '').toUpperCase(),
    lower: (s: any) => String(s ?? '').toLowerCase(),
    split: (s: any, delim: string = '') => String(s ?? '').split(delim),
    join: (list: any[], delim: string = ', ') =>
      Array.isArray(list) ? list.map(formatMJValue).join(delim) : '',
    sub: (s: any, start: number, end?: number) => {
      const str = String(s ?? '');
      return end !== undefined
        ? str.substring(Number(start), Number(end))
        : str.substring(Number(start));
    },
    contains: (s: any, sub: string) => String(s ?? '').includes(String(sub)),
    trim: (s: any) => String(s ?? '').trim(),
    replace: (s: any, target: string, replacement: string) =>
      String(s ?? '').replace(target, replacement),
  };

  // 4. القوائم / list Module
  const listModule = {
    طول: (l: any[]) => (Array.isArray(l) ? l.length : 0),
    أضف: (l: any[], item: any) => {
      if (Array.isArray(l)) {
        l.push(item);
        return l.length;
      }
      throw new Error("القوائم.أضف تتوقع قائمة كمعامل أول.");
    },
    احذف: (l: any[]) => {
      if (Array.isArray(l)) {
        return l.pop() ?? null;
      }
      throw new Error("القوائم.احذف تتوقع قائمة كمعامل أول.");
    },
    عنصر: (l: any[], idx: number) => {
      if (Array.isArray(l)) {
        const i = Number(idx);
        return i >= 0 && i < l.length ? l[i] : null;
      }
      return null;
    },
    تعيين: (l: any[], idx: number, val: any) => {
      if (Array.isArray(l)) {
        const i = Number(idx);
        if (i >= 0 && i < l.length) {
          l[i] = val;
          return val;
        }
      }
      throw new Error(`القوائم: الفهرس ${idx} خارج نطاق القائمة.`);
    },
    شريحة: (l: any[], start: number, end?: number) => {
      if (Array.isArray(l)) {
        return end !== undefined
          ? l.slice(Number(start), Number(end))
          : l.slice(Number(start));
      }
      return [];
    },
    يحتوي: (l: any[], item: any) => {
      if (Array.isArray(l)) {
        return l.some((el) => el === item);
      }
      return false;
    },
    اعكس: (l: any[]) => (Array.isArray(l) ? [...l].reverse() : []),
    رتب: (l: any[]) => {
      if (Array.isArray(l)) {
        return [...l].sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b), 'ar');
        });
      }
      return [];
    },
    طبق: (l: any[], fn: any) => {
      if (!Array.isArray(l)) throw new Error("القوائم.طبق تتوقع قائمة.");
      const res: any[] = [];
      for (let i = 0; i < l.length; i++) {
        res.push(callFn ? callFn(fn, [l[i], i]) : fn(l[i], i));
      }
      return res;
    },
    رشح: (l: any[], fn: any) => {
      if (!Array.isArray(l)) throw new Error("القوائم.رشح تتوقع قائمة.");
      const res: any[] = [];
      for (let i = 0; i < l.length; i++) {
        const cond = callFn ? callFn(fn, [l[i], i]) : fn(l[i], i);
        if (Boolean(cond)) {
          res.push(l[i]);
        }
      }
      return res;
    },
    اختزل: (l: any[], fn: any, initial: any) => {
      if (!Array.isArray(l)) throw new Error("القوائم.اختزل تتوقع قائمة.");
      let acc = initial;
      let startIdx = 0;
      if (acc === undefined) {
        if (l.length === 0) return null;
        acc = l[0];
        startIdx = 1;
      }
      for (let i = startIdx; i < l.length; i++) {
        acc = callFn ? callFn(fn, [acc, l[i], i]) : fn(acc, l[i], i);
      }
      return acc;
    },

    // Aliases
    len: (l: any[]) => (Array.isArray(l) ? l.length : 0),
    push: (l: any[], item: any) => {
      if (Array.isArray(l)) {
        l.push(item);
        return l.length;
      }
      throw new Error("list.push expects a List.");
    },
    pop: (l: any[]) => (Array.isArray(l) ? l.pop() ?? null : null),
    slice: (l: any[], start: number, end?: number) =>
      Array.isArray(l)
        ? end !== undefined
          ? l.slice(Number(start), Number(end))
          : l.slice(Number(start))
        : [],
    map: (l: any[], fn: any) => {
      if (!Array.isArray(l)) throw new Error("list.map expects a List.");
      const res: any[] = [];
      for (let i = 0; i < l.length; i++) {
        res.push(callFn ? callFn(fn, [l[i], i]) : fn(l[i], i));
      }
      return res;
    },
    filter: (l: any[], fn: any) => {
      if (!Array.isArray(l)) throw new Error("list.filter expects a List.");
      const res: any[] = [];
      for (let i = 0; i < l.length; i++) {
        const cond = callFn ? callFn(fn, [l[i], i]) : fn(l[i], i);
        if (Boolean(cond)) res.push(l[i]);
      }
      return res;
    },
    reduce: (l: any[], fn: any, initial: any) => {
      if (!Array.isArray(l)) throw new Error("list.reduce expects a List.");
      let acc = initial;
      let startIdx = 0;
      if (acc === undefined) {
        if (l.length === 0) return null;
        acc = l[0];
        startIdx = 1;
      }
      for (let i = startIdx; i < l.length; i++) {
        acc = callFn ? callFn(fn, [acc, l[i], i]) : fn(acc, l[i], i);
      }
      return acc;
    },
  };

  // 5. النظام / sys Module
  const sysModule = {
    إصدار: () => "MJ 1.0.0 (عربي)",
    مؤلف: () => "محمد خميس",
    شعار: () => "فكر بما وراء الصيغة البرمجية.",
    وقت: () => Date.now(),
    طاقة: () => ctx.getFuelRemaining(),
    منصة: () => "بيئة تشغيل إم جي الآمنة (MJ-Runtime)",

    // Aliases
    version: () => "MJ 1.0.0 (Arabic-First)",
    creator: () => "Mohamed Khamis",
    tagline: () => "Think Beyond Syntax.",
    time: () => Date.now(),
    fuel: () => ctx.getFuelRemaining(),
    platform: () => "MJ-Runtime (Sandboxed)",
  };

  // Type inspection
  const typeOfFn = (val: any) => {
    if (val === null || val === undefined) return "فارغ";
    if (Array.isArray(val)) return "قائمة";
    if (typeof val === "number") return Number.isInteger(val) ? "عدد" : "عدد_عشري";
    if (typeof val === "string") return "نص";
    if (typeof val === "boolean") return "منطقي";
    if (typeof val === "function" || (val && val.__isMJFunction)) return "دالة";
    if (typeof val === "object") return "قاموس";
    return "غير_معروف";
  };

  // Assert
  const assertFn = (cond: any, msg?: string) => {
    if (!cond) {
      throw new Error(`فشل التحقق (تأكد): ${msg || 'الشرط لم يتحقق'}`);
    }
    return true;
  };

  return {
    // Global Arabic built-ins
    اطبع: printFn,
    اقرأ: readFn,
    نوع: typeOfFn,
    تأكد: assertFn,

    // Arabic Modules
    الطباعة: ioModule,
    الرياضيات: mathModule,
    النصوص: strModule,
    القوائم: listModule,
    النظام: sysModule,

    // Compatibility English built-ins & Modules
    io: ioModule,
    math: mathModule,
    str: strModule,
    list: listModule,
    sys: sysModule,
    typeOf: typeOfFn,
    assert: assertFn,
  };
}

export function formatMJValue(val: any): string {
  if (val === null || val === undefined) return "فارغ";
  if (typeof val === "boolean") return val ? "صحيح" : "خطأ";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    return `[${val.map(formatMJValue).join("، ")}]`;
  }
  if (typeof val === "object") {
    if (val.__isMJFunction) {
      return `<دالة ${val.name || 'مجهولة'}>`;
    }
    const pairs = Object.entries(val).map(([k, v]) => `"${k}": ${formatMJValue(v)}`);
    return `#{${pairs.join("، ")}}`;
  }
  if (typeof val === "function") {
    return `<دالة أصلية>`;
  }
  return String(val);
}
