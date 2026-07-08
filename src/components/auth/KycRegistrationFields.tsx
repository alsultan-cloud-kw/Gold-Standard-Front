import { useTranslation } from 'react-i18next';

export type KycQuestion = {
  id: string;
  question_key: string;
  label_en: string;
  label_ar: string;
  help_text_en?: string | null;
  help_text_ar?: string | null;
  input_type: 'text' | 'textarea' | 'boolean' | 'single_select';
  options_json?: Array<{ value: string; label_en: string; label_ar: string }>;
  is_required: boolean;
  sort_order: number;
};

type Props = {
  questions: KycQuestion[];
  answers: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  errors?: Record<string, string>;
};

export default function KycRegistrationFields({ questions, answers, onChange, errors }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith('ar');

  if (questions.length === 0) return null;

  return (
    <div className="space-y-4 pt-2 border-t border-gold-500/20">
      <p className="text-sm font-medium text-gold-100">{isAr ? 'أسئلة التحقق' : 'Verification questions'}</p>
      {questions.map((q) => {
        const label = isAr ? q.label_ar : q.label_en;
        const help = isAr ? q.help_text_ar : q.help_text_en;
        const err = errors?.[q.question_key];
        const value = answers[q.question_key];

        return (
          <div key={q.id}>
            <label className="block text-sm font-medium text-gold-100 mb-2">
              {label}
              {q.is_required ? ' *' : ''}
            </label>
            {help ? <p className="text-xs text-gold-100/50 mb-2">{help}</p> : null}

            {q.input_type === 'textarea' ? (
              <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(q.question_key, e.target.value)}
                className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 min-h-[88px]"
              />
            ) : q.input_type === 'boolean' ? (
              <fieldset className="space-y-0">
                <legend className="sr-only">{label}</legend>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(
                    [
                      { val: true as const, text: isAr ? 'نعم' : 'Yes' },
                      { val: false as const, text: isAr ? 'لا' : 'No' },
                    ] as const
                  ).map((opt) => {
                    const selected = value === opt.val;
                    return (
                      <label
                        key={String(opt.val)}
                        className={`flex flex-1 items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                          selected
                            ? 'border-gold-500 bg-gold-500/15 text-gold-100'
                            : 'border-gold-500/30 bg-charcoal-800 text-gold-100/80 hover:border-gold-500/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.question_key}
                          checked={selected}
                          onChange={() => onChange(q.question_key, opt.val)}
                          className="h-4 w-4 shrink-0 accent-amber-500"
                        />
                        <span className="text-sm font-medium">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : q.input_type === 'single_select' ? (
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(q.question_key, e.target.value)}
                className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
              >
                <option value="">{isAr ? 'اختر…' : 'Select…'}</option>
                {(q.options_json ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.label_ar : opt.label_en}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(q.question_key, e.target.value)}
                className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
              />
            )}

            {err ? <p className="text-xs text-red-400 mt-1">{err}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
