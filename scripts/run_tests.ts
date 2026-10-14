/**
 * CLI Test Runner for MJ Language Test Suite
 * Exits with status code 1 on test failure, 0 on success
 */

import { MJTestSuite } from '../src/lang/test_suite';

async function main() {
  console.log('تشغيل حزمة اختبارات لغة إم جي (MJ Test Suite)...');
  const summary = await MJTestSuite.runAll();

  console.log('\n==================================================');
  console.log(`إجمالي الاختبارات: ${summary.total}`);
  console.log(`الاختبارات الناجحة: ${summary.passed}`);
  console.log(`الاختبارات الفاشلة: ${summary.failed}`);
  console.log(`زمن التشغيل: ${summary.durationMs.toFixed(1)} ms`);
  console.log('==================================================\n');

  if (summary.failed > 0) {
    console.error('فشل في بعض الاختبارات:');
    for (const res of summary.results) {
      if (!res.passed) {
        console.error(`[فشل] ${res.id} - ${res.name} (${res.category}):`);
        console.error(`       ${res.errorMessage}`);
      }
    }
    process.exit(1);
  } else {
    console.log('نجحت جميع الاختبارات بنسبة 100%! ✓');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('خطأ غير متوقع أثناء تشغيل الاختبارات:', err);
  process.exit(1);
});
