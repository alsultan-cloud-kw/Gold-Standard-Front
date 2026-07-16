/**
 * Built-in MOCI KYC questions (Gold Standard storefront).
 * Mirrors backend `accounts/default_kyc_questions.py` so the modal works
 * even when the API has not been redeployed yet.
 */
import type { KycQuestion } from '@/components/auth/KycRegistrationFields'

export const DEFAULT_MOCI_KYC_QUESTIONS: KycQuestion[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    question_key: 'purchase_purpose',
    label_en: 'Select the purpose(s) of your purchases on our platform',
    label_ar: 'حدد الغرض/الأغراض من مشترياتك على منصتنا',
    input_type: 'multi_select',
    options_json: [
      { value: 'investment', label_en: 'Investment', label_ar: 'استثمار' },
      { value: 'savings', label_en: 'Savings', label_ar: 'ادخار' },
      { value: 'personal', label_en: 'Personal', label_ar: 'شخصي' },
      { value: 'other', label_en: 'Other', label_ar: 'أخرى' },
    ],
    is_required: true,
    sort_order: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    question_key: 'source_of_funds',
    label_en: 'Please clarify the source of funds used for this purchase.',
    label_ar: 'يرجى توضيح مصدر الأموال المستخدمة في هذا الشراء.',
    input_type: 'single_select',
    options_json: [
      { value: 'salary', label_en: 'Salary', label_ar: 'راتب' },
      { value: 'business_income', label_en: 'Business income', label_ar: 'دخل تجاري' },
      { value: 'bank_financing', label_en: 'Bank financing', label_ar: 'تمويل بنكي' },
      { value: 'inheritance_gift', label_en: 'Inheritance / Gift', label_ar: 'ميراث / هبة' },
      { value: 'other', label_en: 'Other', label_ar: 'أخرى' },
    ],
    is_required: true,
    sort_order: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    question_key: 'monthly_income',
    label_en: 'Please select your approximate average monthly income',
    label_ar: 'يرجى اختيار متوسط دخلك الشهري التقريبي',
    input_type: 'single_select',
    options_json: [
      { value: 'lt_1000', label_en: 'Less than 1,000 KWD', label_ar: 'أقل من 1,000 د.ك' },
      { value: '1000_2999', label_en: 'From 1,000 to 2,999 KWD', label_ar: 'من 1,000 إلى 2,999 د.ك' },
      { value: '3000_4999', label_en: 'From 3,000 to 4,999 KWD', label_ar: 'من 3,000 إلى 4,999 د.ك' },
      { value: '5000_9999', label_en: 'From 5,000 to 9,999 KWD', label_ar: 'من 5,000 إلى 9,999 د.ك' },
      { value: 'gt_10000', label_en: 'More than 10,000 KWD', label_ar: 'أكثر من 10,000 د.ك' },
    ],
    is_required: true,
    sort_order: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    question_key: 'pep_status',
    label_en:
      'Are any of the owners or ultimate beneficial owners politically exposed persons (PEP)?',
    label_ar: 'هل أحد من الملاك أو المستفيدين الفعليين من الأشخاص المعرضين سياسياً؟',
    input_type: 'single_select',
    options_json: [
      {
        value: 'yes_self_or_relative',
        label_en: 'Yes – me or a relative',
        label_ar: 'نعم - أنا أو أحد الأقارب',
      },
      { value: 'no', label_en: 'No', label_ar: 'لا' },
    ],
    is_required: true,
    sort_order: 4,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    question_key: 'employment_sector',
    label_en: 'Employment sector',
    label_ar: 'جهة العمل',
    input_type: 'single_select',
    options_json: [
      { value: 'government', label_en: 'Government sector', label_ar: 'قطاع حكومي' },
      { value: 'private', label_en: 'Private sector', label_ar: 'قطاع خاص' },
      { value: 'self_employed', label_en: 'Self-employed', label_ar: 'أعمال حرة' },
      { value: 'retired', label_en: 'Retired', label_ar: 'متقاعد' },
      { value: 'student', label_en: 'Student', label_ar: 'طالب' },
      { value: 'other', label_en: 'Other', label_ar: 'أخرى' },
    ],
    is_required: true,
    sort_order: 5,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    question_key: 'job_title',
    label_en: 'Profession or job title',
    label_ar: 'المهنة أو المسمى الوظيفي',
    input_type: 'textarea',
    options_json: [],
    is_required: true,
    sort_order: 6,
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    question_key: 'accuracy_declaration',
    label_en: 'I confirm that all information provided is true and accurate.',
    label_ar: 'أقرّ بأن جميع المعلومات المقدّمة صحيحة ودقيقة.',
    input_type: 'boolean',
    options_json: [],
    is_required: true,
    sort_order: 7,
  },
]
