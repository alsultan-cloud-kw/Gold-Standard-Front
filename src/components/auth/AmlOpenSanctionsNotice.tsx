import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  className?: string;
};

export default function AmlOpenSanctionsNotice({ className = '' }: Props) {
  const { t } = useTranslation();

  return (
    <p
      className={`inline-flex items-center gap-2 text-xs text-gold-100/70 bg-charcoal-800/60 border border-gold-500/20 rounded-lg px-3 py-2 ${className}`}
    >
      <ShieldCheck className="w-4 h-4 text-gold-400/80 shrink-0" aria-hidden />
      <span>{t('auth.amlOpenSanctions')}</span>
    </p>
  );
}
