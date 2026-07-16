/** Gold Standard terms + privacy highlights + WhatsApp / Meta (original copy — not third-party text). */

export type NumberedClause = {
  title?: string
  text: string
}

const SITE = 'www.goldstandardkw.com'
const SUPPORT_EMAIL = 'info@goldstandardkw.com'
const SUPPORT_PHONE = '+965 9853 8538'

const CLAUSES_EN: NumberedClause[] = [
  {
    title: 'General',
    text: `The website and mobile application of Gold Standard (the "Platform") are owned and operated by Gold Standard Jewellers and Precious Metals Company ("Gold Standard", "we", "us"). The Platform allows you to browse, request quotes, purchase, sell, store, and receive gold, silver, jewellery, and related services in Kuwait. By accessing ${SITE}, creating an account, or using any service, you agree to these Terms and Conditions and our Privacy Policy, including all policies linked on the Platform. We may update these terms at any time; changes take effect when published on ${SITE}. Continued use after publication means you accept the updated terms. If you do not agree, stop using the Platform.`,
  },
  {
    title: 'Account and registered user',
    text: `Certain features — including checkout, sell-back, wallet balances, and order tracking — require a personal, non-transferable account. You must be at least 18 years old and provide accurate, complete information (full name, email, mobile number, nationality, country of residence, and Civil ID where applicable). You are responsible for safeguarding your password and for all activity under your account. Notify us immediately at ${SUPPORT_EMAIL} if you suspect unauthorised access. We may request identity documents (Civil ID or passport) and Ministry of Commerce customer due-diligence answers before activating trading or high-value transactions. Accounts linked to sanctions, AML alerts, or suspicious activity may be suspended or closed.`,
  },
  {
    title: 'Sharia-compliant constructive possession',
    text: `Gold Standard conducts gold transactions in line with Islamic Sharia principles and recognised constructive possession (tawarruq / hawalah where applicable). Upon successful payment, ownership of the purchased metal transfers to you in a Sharia-valid manner even if physical delivery follows later. Until you collect in person or via an approved carrier, Gold Standard acts as your agent and trustee in safeguarding the metal in insured, access-controlled storage allocated to your account. Internal records evidence ownership and constructive delivery. You may request physical pickup or sell back at prevailing market prices subject to these terms.`,
  },
  {
    title: 'Orders and pricing',
    text: `Displayed prices for bullion, jewellery, and precious metals follow international spot prices and the Kuwaiti Dinar exchange rate and may change without notice. The price confirmed at checkout (or at automatic-order execution) is binding once payment succeeds. After payment, orders cannot be cancelled for a cash refund; exit is by a new sale at the then-current market price unless a manufacturing defect is proven within the return window below. Obvious pricing or system errors may require order correction or cancellation; we will contact you when practicable. Transactions flagged under anti–money-laundering rules may be declined.`,
  },
  {
    title: 'Pure gold (investment grade)',
    text: `"Pure gold" means 24-karat investment metal (e.g. 999.9 fineness) priced per gram without workmanship unless you select a specific bar or coin with a quoted making charge. Pickup of investment products is generally at our authorised branches (including the Central Gold Market where applicable). Serial numbers and weights are recorded at sale. Repeated micro-transactions without legitimate investment purpose may lead to restricted trading privileges.`,
  },
  {
    title: 'Payment',
    text: `Online purchases are processed through approved Kuwait payment channels (including KNET) and any additional methods shown at checkout. Cards and accounts must belong to the registered customer. Verification of cardholder data and successful debit is the responsibility of the payment gateway and issuing bank. Gold Standard is not liable for fraud arising from stolen credentials, phishing, or gateway breaches outside our reasonable control. All amounts are quoted in Kuwaiti Dinars (KWD) unless stated otherwise.`,
  },
  {
    title: 'Withdrawals and bank transfers',
    text: `To withdraw sale proceeds or refundable balances you must enter a valid IBAN in your name and upload an official bank certificate matching your account identity. We transfer only to accounts that match your registered profile. You warrant that banking details are true and accept liability for incorrect instructions. If funds are sent in error, you agree to return them promptly; we may suspend services until recovery. Transfers are executed during Kuwait banking hours via standard local rails; arrival times depend on your bank.`,
  },
  {
    title: 'Automatic buy and sell orders',
    text: `Where enabled, you may place standing orders with target weight and price per gram and an expiry period. Orders execute automatically when market conditions meet your limits (buy below or sell above the prevailing quote, as configured). Filled orders are final and cannot be reversed. You bear full market risk and must maintain sufficient balance or inventory. Unfilled orders expire without obligation.`,
  },
  {
    title: 'Order readiness and pickup',
    text: `After purchase, an estimated readiness time may be shown (e.g. 1–72 hours). Estimates are not guaranteed collection appointments; please attend after you receive a ready notification to avoid queues. We may adjust readiness for operational or security reasons without compensation for minor delays. Orders cannot be cancelled after payment except through a new sale transaction.`,
  },
  {
    title: 'Serial number replacement',
    text: `If a bar, coin, or certificate is damaged, defaced, or has an unreadable serial, Gold Standard may, as your agent, replace it with metal of equivalent weight, fineness, and value at the execution price applicable at replacement, without extra charge unless you request a premium product. Constructive possession continues under Sharia principles throughout replacement.`,
  },
  {
    title: 'Intellectual property',
    text: `All trademarks, logos, product photography, charts, software, and content on ${SITE} are owned by Gold Standard or its licensors. You may use the Platform only for personal, non-commercial purposes. Copying, scraping, reverse engineering, or redistributing content without written consent is prohibited.`,
  },
  {
    title: 'Liability and indemnity',
    text: `The Platform is provided on an "as available" basis. We do not warrant uninterrupted or error-free operation. To the extent permitted by Kuwait law, Gold Standard is not liable for indirect, consequential, or market losses. You agree to indemnify us against claims arising from misuse of your account or breach of these terms. We may refuse service, terminate accounts, or cancel orders at our discretion where required by law or risk policy. Stored inventory is insured against specified perils subject to policy terms.`,
  },
  {
    title: 'Promotions and coupons',
    text: `Promotional codes, loyalty rewards, or coupons are subject to published conditions, validity dates, and one-time use unless stated otherwise. They cannot be exchanged for cash, combined where prohibited, or used outside Kuwait unless explicitly allowed. We may withdraw or amend promotions without prior notice.`,
  },
  {
    title: 'Returns and exchanges',
    text: `Because precious metals and jewellery prices are market-linked, returns are limited. Manufactured items may be returned within 24 hours of purchase with proof of defect in workmanship, subject to inspection. Investment bullion sold at spot-based prices is generally not returnable for cash; resale is at live market bid. Custom or engraved pieces may be excluded.`,
  },
  {
    title: 'Delivery within Kuwait',
    text: `Where delivery is offered, fees and carriers are shown at checkout (insured specialist carriers may apply). Risk transfers to the carrier upon handover; Gold Standard is not responsible for carrier delay or loss thereafter, within the limits of applicable law and insurance. Refused deliveries may incur redelivery fees; repeated refusal may require branch pickup.`,
  },
  {
    title: 'Governing law',
    text: `These terms are governed by the laws of the State of Kuwait. Kuwaiti courts have exclusive jurisdiction unless mandatory consumer rules provide otherwise. If any clause is invalid, the remainder stays in force. Force majeure events excuse delay in performance.`,
  },
  {
    title: 'WhatsApp and Meta (business messaging)',
    text: `If you opt in to WhatsApp (including WhatsApp Business), you may receive service messages such as OTP verification, order updates, receipts, and security alerts. Marketing messages are sent only where permitted by law and Meta policies. Message and data rates may apply. Do not use our channels for abuse or spam. You may opt out of non-essential messages in-chat or by emailing ${SUPPORT_EMAIL}. WhatsApp is operated by Meta; your use is also subject to Meta's terms and privacy notice.`,
  },
  {
    title: 'Contact',
    text: `Questions about these terms or your account: ${SUPPORT_EMAIL} · ${SUPPORT_PHONE} · ${SITE}. Using the Platform constitutes acceptance of this agreement.`,
  },
]

const CLAUSES_AR: NumberedClause[] = [
  {
    title: 'عام',
    text: `يملك موقع وتطبيق Gold Standard وتشغّلهما شركة Gold Standard للمجوهرات والمعادن الثمينة («الشركة» أو «نحن»). يتيح المنصة تصفح وطلب عروض أسعار وشراء وبيع وتخزين واستلام الذهب والفضة والمجوهرات والخدمات ذات الصلة في دولة الكويت. بدخولك ${SITE} أو إنشاء حساب أو استخدام أي خدمة، فإنك توافق على هذه الشروط والأحكام وسياسة الخصوصية وجميع السياسات المرتبطة. يجوز لنا تحديث الشروط في أي وقت، وتسري التعديلات عند نشرها على ${SITE}. استمرار الاستخدام يعني قبول التحديث. إن لم توافق، توقّف عن استخدام المنصة.`,
  },
  {
    title: 'الحساب والمستخدم المسجّل',
    text: `تتطلب بعض الميزات — مثل الدفع وإعادة البيع والأرصدة وتتبع الطلبات — حسابًا شخصيًا غير قابل للتحويل. يشترط ألا يقل عمرك عن 18 سنة وتقديم بيانات صحيحة (الاسم، البريد، الجوال، الجنسية، بلد الإقامة، والرقم المدني عند الاقتضاء). أنت مسؤول عن حماية كلمة المرور وعن كل نشاط يتم عبر حسابك. أبلغنا فورًا على ${SUPPORT_EMAIL} عند الاشتباه باستخدام غير مصرح به. قد نطلب مستندات هوية وإجابات التحقق وفق متطلبات وزارة التجارة قبل تفعيل التداول أو المعاملات ذات القيمة العالية. يجوز تعليق أو إغلاق الحسابات المرتبطة بعقوبات أو تنبيهات مكافحة غسل الأموال.`,
  },
  {
    title: 'التقابض الشرعي',
    text: `تُنفّذ Gold Standard معاملات الذهب بما يتوافق مع أحكام الشريعة الإسلامية ومبدأ التقابض الحكمي المعتمد. عند إتمام الدفع تنتقل ملكية المعدن المشترى إليك شرعًا ولو تأخر الاستلام المادي. إلى حين الاستلام الشخصي أو عبر ناقل معتمد، تعمل الشركة وكيلًا وأمينًا في حفظ المعدن في مخزون مؤمَّن ومخصص لحسابك. تُثبت السجلات الداخلية الملكية والتقابض. يمكنك طلب الاستلام أو إعادة البيع بالأسعار السائدة وفق هذه الشروط.`,
  },
  {
    title: 'الطلبات والتسعير',
    text: `تتبع الأسعار المعروضة للسبائك والمجوهرات والمعادن الأسعار العالمية وسعر صرف الدينار وقد تتغير دون إشعار. السعر المؤكد عند الدفع (أو عند تنفيذ الأمر التلقائي) ملزم بعد نجاح السداد. لا يُلغى الطلب المدفوع استردادًا نقديًا؛ الخروج يكون ببيع جديد بالسعر السائد آنذاك ما لم يثبت عيب مصنعي ضمن مدة الاسترجاع أدناه. قد نصحح أو نلغي الطلبات عند أخطاء تسعير واضحة وسنتواصل معك متى أمكن. قد تُرفض العمليات المشتبه بها وفق قواعد مكافحة غسل الأموال.`,
  },
  {
    title: 'الذهب الصافي (استثماري)',
    text: `«الذهب الصافي» يعني معدن استثماري عيار 24 (مثل نقاوة 999.9) يُسعّر بالجرام دون مصنعية ما لم تختر سبيكة أو عملة بمصنعية محددة. الاستلام غالبًا من فروعنا المعتمدة (بما فيها سوق الذهب المركزي حيث ينطبق). تُسجَّل الأرقام التسلسلية والأوزان عند البيع. قد تُقيَّد صلاحيات التداول عند معاملات متكررة صغيرة بلا غرض استثماري مشروع.`,
  },
  {
    title: 'الدفع',
    text: `تُعالج المشتريات عبر قنوات الدفع المعتمدة في الكويت (بما فيها KNET) وأي وسائل إضافية تظهر عند الدفع. يجب أن تكون البطاقة أو الحساب باسم العميل المسجّل. التحقق من صحة الخصم مسؤولية بوابة الدفع والبنك المصدر. لا تتحمل Gold Standard الاحتيال الناتج عن سرقة بيانات أو اختراقات خارج سيطرتنا المعقولة. الأسعار بالدينار الكويتي ما لم يُذكر غير ذلك.`,
  },
  {
    title: 'السحب والتحويلات البنكية',
    text: `لسحب متحصلات البيع أو الأرصدة المستردة يجب إدخال IBAN صحيح باسمك ورفع شهادة بنكية رسمية مطابقة. لا نحوّل إلا لحساب يطابق ملفك. تتعهد بصحة البيانات وتتحمل مسؤولية الأخطاء. إن حُوّل مبلغ بالخطأ فإنك تلتزم بإعادته فورًا ويجوز تعليق الخدمة حتى الاسترداد. تُنفَّذ التحويلات في أوقات عمل البنوك في الكويت.`,
  },
  {
    title: 'الأوامر التلقائية',
    text: `حيث تتوفر الخدمة، يمكنك وضع أوامر بيع وشراء بسعر ووزن مستهدفين ومدة صلاحية. تُنفَّذ تلقائيًا عند تحقق الشروط. الأوامر المنفذة نهائية. تتحمل مخاطر السوق وتوفير الرصيد أو المخزون. تنتهي الأوامر غير المنفذة دون التزام.`,
  },
  {
    title: 'جاهزية الطلب والاستلام',
    text: `بعد الشراء قد يُعرض وقت تقديري للجاهزية (مثل 1–72 ساعة). التقدير ليس موعد استلام مضمونًا؛ يُفضّل الحضور بعد إشعار الجاهزية. يجوز تعديل الجاهزية لأسباب تشغيلية دون تعويض عن تأخير طفيف. لا يُلغى الطلب بعد الدفع إلا ببيع جديد.`,
  },
  {
    title: 'استبدال الرقم التسلسلي',
    text: `إذا تلفت سبيكة أو عملة أو أصبح الرقم التسلسلي غير مقروء، يجوز للشركة بصفتها وكيلًا استبدالها بمعدن مكافئ بالوزن والعيار وفق السعر المعتمد وقت الاستبدال دون رسوم إضافية ما لم تطلب منتجًا مميزًا. يستمر التقابض الحكمي شرعًا.`,
  },
  {
    title: 'الملكية الفكرية',
    text: `العلامات والشعارات والصور والبرمجيات والمحتوى على ${SITE} مملوكة لـ Gold Standard أو مرخِّصيها. الاستخدام للأغراض الشخصية غير التجارية فقط. يُحظر النسخ أو إعادة النشر أو الاستغلال التجاري دون موافقة خطية.`,
  },
  {
    title: 'المسؤولية والتعويض',
    text: `تُقدَّم المنصة «كما هي». لا نضمن خلوها من الأخطاء أو الانقطاع. في حدود القانون الكويتي لا نتحمل الخسائر غير المباشرة أو تقلبات السوق. توافق على تعويضنا عن إساءة استخدام حسابك. يجوز رفض الخدمة أو إنهاء الحسابات أو إلغاء الطلبات وفق القانون وسياسة المخاطر. المخزون المؤمَّن ضد مخاطر محددة وفق وثائق التأمين.`,
  },
  {
    title: 'العروض والكوبونات',
    text: `الرموز الترويجية وبرامج الولاء تخضع لشروط النشر وتواريخ الصلاحية والاستخدام لمرة واحدة ما لم يُذكر غير ذلك. لا تُصرف نقدًا ولا تُجمع حيث يُمنع ذلك. يجوز سحب العروض دون إشعار مسبق.`,
  },
  {
    title: 'الاسترجاع والاستبدال',
    text: `لطبيعة المعادن المرتبطة بالسوق، الاسترجاع محدود. قد تُسترجع المشغولات خلال 24 ساعة عند إثبات عيب مصنعي. السبائك الاستثمارية عادة لا تُسترد نقدًا؛ إعادة البيع بالسعر المباشر. قد تُستثنى القطع المخصصة أو الم نقشة.`,
  },
  {
    title: 'التوصيل داخل الكويت',
    text: `عند توفر التوصيل تُعرض الرسوم والناقل عند الدفع (قد يُستخدم ناقل متخصص مؤمَّن). تنتقل المسؤولية للناقل عند التسليم له ضمن حدود القانون والتأمين. رفض الاستلام قد يترتب عليه رسوم إعادة توصيل أو الاستلام من الفرع.`,
  },
  {
    title: 'القانون الحاكم',
    text: `تخضع هذه الشروط لقوانين دولة الكويت ولاختصاص محاكمها. إن بطل بندٌ بقي الباقي نافذًا. الأحداث القهرية تعذّر التأخير في الأداء.`,
  },
  {
    title: 'واتساب وميتا (رسائل الأعمال)',
    text: `عند الموافقة على واتساب (بما في ذلك واتساب أعمال) قد تتلقى رسائل خدمة مثل رموز التحقق وتحديثات الطلبات والإيصالات والتنبيهات الأمنية. التسويق فقط حيث يسمح القانون وسياسات ميتا. قد تنطبق رسوم الرسائل والبيانات. لا تُستخدم القنوات للإساءة أو البريد المزعج. يمكن إلغاء الرسائل غير الضرورية من المحادثة أو عبر ${SUPPORT_EMAIL}. واتساب تقدّمه ميتا ويخضع استخدامك لشروطها أيضًا.`,
  },
  {
    title: 'اتصل بنا',
    text: `للاستفسارات: ${SUPPORT_EMAIL} · ${SUPPORT_PHONE} · ${SITE}. استخدام المنصة يُعد قبولًا لهذه الاتفاقية.`,
  },
]

function pickLang(lang: string | undefined): 'en' | 'ar' {
  return lang?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

const clausesByLang: Record<'en' | 'ar', NumberedClause[]> = {
  en: CLAUSES_EN,
  ar: CLAUSES_AR,
}

export function getCombinedLegalClauses(lang: string | undefined): NumberedClause[] {
  return clausesByLang[pickLang(lang)]
}
