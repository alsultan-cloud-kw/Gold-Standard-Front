import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'

const FAQ_ITEMS = [
  'certified',
  'livePricing',
  'buyback',
  'insuredDelivery',
  'storage',
  'payments',
] as const

export function HomeFaqSection() {
  const { t } = useTranslation()

  return (
    <section className="home-section scroll-mt-[calc(var(--nav-offset)+1rem)]" id="faq">
      <div className="home-section-inner">
        <HomeSectionHeader
          kicker={t('home.faq.kicker')}
          title={t('home.faq.title')}
          align="center"
        />

        <Accordion
          type="single"
          collapsible
          defaultValue="certified"
          className="mx-auto flex w-full max-w-3xl flex-col gap-3"
        >
          {FAQ_ITEMS.map((id) => (
            <AccordionItem
              key={id}
              value={id}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white px-4 sm:px-5 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="group py-4 text-base font-semibold text-[#0B0F19] hover:no-underline sm:py-5 sm:text-[17px] [&>svg]:hidden">
                <span className="min-w-0 flex-1 pe-4 text-start">{t(`home.faq.items.${id}.q`)}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#3F6F00]">
                  <Plus className="h-4 w-4 group-data-[state=open]:hidden" aria-hidden />
                  <Minus className="hidden h-4 w-4 group-data-[state=open]:block" aria-hidden />
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-[#64748B] sm:pb-5 sm:text-[15px]">
                {t(`home.faq.items.${id}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
