/** Single-page legal text: terms (customer-provided) + WhatsApp / Meta (business messaging). */

export type NumberedClause = {
  /** Optional subheading (e.g. WhatsApp / Meta block). */
  title?: string
  text: string
}

const WHATSAPP_META_EN = `WhatsApp and Meta (business messaging)

If you contact us or agree to receive messages through WhatsApp (including WhatsApp Business), you consent to receive service-related communications such as account, order, delivery, payment, and security updates. Promotional or marketing messages are sent only where permitted by applicable law and Meta’s WhatsApp Business policies, with appropriate consent or opt-in when required. Standard message and data rates may apply according to your mobile operator. You must not use our WhatsApp channels for unlawful, abusive, fraudulent, harmful, or spam activity. You may opt out of non-essential messages using instructions in the chat or by contacting customer service at 220950001. WhatsApp is provided by Meta Platforms; your use of WhatsApp is also subject to Meta’s Terms of Service and Privacy Policy. If we use WhatsApp Business Platform APIs or authorized business solution providers, your information may be processed by those providers as described in their notices.`

const WHATSAPP_META_AR = `واتساب وميتا (رسائل الأعمال)

إذا تواصلت معنا أو وافقت على استلام الرسائل عبر واتساب (بما في ذلك واتساب أعمال)، فإنك توافق على تلقي رسائل متعلقة بالخدمة مثل الحساب والطلب والتوصيل والدفع والأمن. تُرسل الرسائل الترويجية أو التسويقية فقط حيث يسمح القانون المعمول به وسياسات واتساب أعمال ميتا، وبموافقة أو اشتراك مناسب عند الاقتضاء. قد تنطبق رسوم الرسائل والبيانات وفق مشغل شبكتك. يجب عدم استخدام قنوات واتساب لدينا لأي نشاط غير قانوني أو مسيء أو احتيالي أو ضار أو بريد مزعج. يمكنك إلغاء الرسائل غير الضرورية باتباع التعليمات في المحادثة أو بالاتصال بخدمة العملاء 220950001. تقدّم شركة ميتا منصّات واتساب؛ ويخضع استخدامك لواتساب أيضًا لشروط ميتا وسياسة الخصوصية. إذا استخدمنا واجهات برمجة تطبيقات واتساب أعمال أو مزوّدي حلول أعمال معتمدين، فقد تُعالج معلوماتك لدى هؤلاء المزوّدين وفق إشعاراتهم.`

const TERMS_EN = `The Gold Standard website and application (hereinafter referred to as the "Company" or "Gold Standard") is owned and operated by Gold Standard Jewellers and Precious Metals Company. It aims to enable users to browse and purchase gold, jewelry, and related services. Your use of the website or application in any form, whether for browsing or making purchases, constitutes express agreement to be bound by all the terms and conditions set forth below, in addition to all related policies. The Company reserves the right to modify or update these terms at any time without prior notice. Amendments shall be effective immediately upon posting, and it is the user's responsibility to review them periodically. Continued use of the website constitutes full acceptance of any modifications.

To benefit from the site's services, the user must create a personal account, be at least 18 years old, and provide correct, accurate, and up-to-date information, including name, personal data, and contact information. The company may also request official documents to verify identity, such as a civil ID card. The user is fully responsible for protecting their account data and password, and bears responsibility for all transactions that take place through their account. In case of any suspected unauthorized use, the company must be notified immediately.

Gold Standard adheres to the provisions of Islamic Sharia in all its dealings related to the sale and purchase of gold, and operates according to the principle of constructive exchange, whereby ownership of the gold is transferred to the customer immediately upon completion of the payment process. The company remains an agent and trustee in preserving the gold for the benefit of the customer until its actual receipt. The gold is stored in secure and designated places and registered in the name of the customer, in a manner that fulfills the conditions of a valid Sharia sale.

All prices displayed on the website are linked to the global price of gold and the exchange rate of currencies against the Kuwaiti dinar, and are subject to change at any time. The price displayed at the time of order completion is considered the approved price. Once payment is completed, the order cannot be canceled or returned, except by reselling the product at the new global price. Also, in the event of any technical error in displaying prices or during the purchase process, the company reserves the right to modify or cancel the order and take the appropriate decision in the best interest of the business.

Payments are made only through the KNET system, and the bank card used must be owned by the same account holder. The company bears no responsibility for fraudulent transactions or errors resulting from the use of unauthorized cards or any electronic breaches that are outside its control. The responsibility for verifying the validity of payment transactions lies with the payment gateway and the card-issuing bank.

If the customer has a financial balance as a result of sales or refunds, he must enter his bank account number (IBAN) correctly and attach an official bank certificate bearing his name. No amounts will be transferred to an account that does not match the account holder's data. The customer bears full responsibility for the accuracy of the data provided. In the event of a transfer by mistake for any reason, the customer is obligated to return the amount immediately, and the company has the right to take the necessary legal measures to recover it.

The company provides an automatic buy and sell order service, where the user can specify a certain price to execute the transaction when it is reached. The order is executed automatically when the price is reached. These orders are final and cannot be cancelled or modified, and the user bears full responsibility for his investment decisions and market fluctuations.

An approximate time for order readiness is determined after the purchase process is completed. This time may vary depending on operating conditions, and the company makes every effort to adhere to it. Delivery service is provided within the State of Kuwait for a specific fee of 5 Kuwaiti Dinars. Delivery is made through companies specializing in the transfer of money and gold. Once the shipment is handed over to the transport company, the responsibility is transferred to it in full, and the company does not bear any responsibility for delays or damages resulting from the transport process.

Due to the nature of the products, which include gold, jewelry, and precious metals, returns or exchanges are only permitted within 24 hours of the purchase date, and only if there is a proven manufacturing defect. No requests will be accepted after this period.

All content on the website, including text, designs, logos and trademarks, is the exclusive property of Gold Standard and may not be used, republished or exploited in any way without the company's prior written consent.

The company does not guarantee that the site or services will be free from errors or interruptions, and does not accept any liability for any losses that may result from the use of the site or the inability to use it, nor does it accept any liability for delays or non-performance of obligations in the event of circumstances beyond its control such as natural disasters or force majeure events.

These terms and conditions shall be governed by and construed in accordance with the laws of the State of Kuwait, and the Kuwaiti courts shall have full jurisdiction to adjudicate any dispute arising therefrom. If any provision of these terms is deemed invalid or unenforceable, such invalidity or unenforceability shall not affect the validity of the remaining provisions.

For any inquiries or comments, you can contact customer service via 220950001. Your use of the website or application constitutes explicit acceptance of all terms and conditions.`

const TERMS_AR = `الشروط والأحكام – Gold Standard

إن موقع وتطبيق Gold Standard (ويُشار إليها فيما بعد بـ "الشركة" أو "Gold Standard") مملوك ومدار من قبل شركة Gold Standard للمجوهرات والمعادن الثمينة، ويهدف إلى تمكين المستخدمين من تصفح وشراء الذهب والمجوهرات والخدمات ذات الصلة، ويُعد استخدامك للموقع أو التطبيق بأي شكل، سواء للتصفح أو لإجراء عمليات الشراء، موافقة صريحة على الالتزام بكافة الشروط والأحكام الواردة أدناه، بالإضافة إلى جميع السياسات المرتبطة بها، وتحتفظ الشركة بحق تعديل أو تحديث هذه الشروط في أي وقت دون إشعار مسبق، وتُعتبر التعديلات سارية فور نشرها، ويقع على عاتق المستخدم مراجعتها بشكل دوري، كما أن استمرار استخدام الموقع يُعد قبولًا كاملاً لأي تعديلات.

للاستفادة من خدمات الموقع، يجب على المستخدم إنشاء حساب شخصي خاص به، ويُشترط ألا يقل عمره عن 18 سنة، وأن يقوم بتقديم معلومات صحيحة ودقيقة ومحدثة، بما في ذلك الاسم والبيانات الشخصية ووسائل التواصل، كما قد تطلب الشركة مستندات رسمية للتحقق من الهوية مثل البطاقة المدنية، ويكون المستخدم مسؤولًا بشكل كامل عن حماية بيانات حسابه وكلمة المرور الخاصة به، ويتحمل جميع العمليات التي تتم من خلال حسابه، وفي حال الاشتباه بأي استخدام غير مصرح به يجب إبلاغ الشركة فورًا.

تلتزم Gold Standard بأحكام الشريعة الإسلامية في جميع تعاملاتها المتعلقة ببيع وشراء الذهب، وتعمل وفق مبدأ التقابض الحكمي المعتمد، حيث تنتقل ملكية الذهب إلى العميل فور إتمام عملية الدفع، وتبقى الشركة وكيلًا وأمينًا في حفظ الذهب لصالح العميل إلى حين استلامه الفعلي، ويتم تخزين الذهب في أماكن مؤمنة ومخصصة مع تسجيله باسم العميل، بما يحقق شروط البيع الشرعي الصحيح.

جميع الأسعار المعروضة على الموقع مرتبطة بالسعر العالمي للذهب وسعر صرف العملات مقابل الدينار الكويتي، وهي قابلة للتغيير في أي وقت، ويُعتبر السعر المعروض وقت إتمام الطلب هو السعر المعتمد، وبمجرد إتمام الدفع لا يمكن إلغاء الطلب أو استرجاعه، إلا من خلال إعادة بيع المنتج بالسعر العالمي الجديد، كما أنه في حال حدوث أي خطأ تقني في عرض الأسعار أو أثناء عملية الشراء، تحتفظ الشركة بحق تعديل الطلب أو إلغائه واتخاذ القرار المناسب بما يخدم مصلحة العمل.

تتم عمليات الدفع من خلال نظام KNET فقط، ويجب أن تكون البطاقة البنكية المستخدمة مملوكة لنفس صاحب الحساب، ولا تتحمل الشركة أي مسؤولية عن العمليات الاحتيالية أو الأخطاء الناتجة عن استخدام بطاقات غير مصرح بها أو أي اختراقات إلكترونية تقع خارج نطاق سيطرتها، كما أن مسؤولية التحقق من صحة عمليات الدفع تقع على بوابة الدفع والبنك المُصدر للبطاقة.

في حال وجود رصيد مالي للعميل نتيجة عمليات بيع أو استرجاع، يتوجب عليه إدخال رقم الحساب البنكي (IBAN) الخاص به بشكل صحيح وإرفاق شهادة بنكية رسمية تحمل اسمه، ولن يتم تحويل أي مبالغ إلى حساب لا يطابق بيانات صاحب الحساب، ويتحمل العميل المسؤولية الكاملة عن صحة البيانات المقدمة، وفي حال حدوث تحويل بالخطأ لأي سبب، يلتزم العميل بإعادة المبلغ فورًا ويحق للشركة اتخاذ الإجراءات القانونية اللازمة لاسترداده.

توفر الشركة خدمة الأوامر التلقائية للشراء والبيع، حيث يمكن للمستخدم تحديد سعر معين لتنفيذ العملية عند الوصول إليه، ويتم تنفيذ الأمر تلقائيًا عند تحقق السعر، وتُعد هذه الأوامر نهائية وغير قابلة للإلغاء أو التعديل، ويتحمل المستخدم كامل المسؤولية عن قراراته الاستثمارية وتقلبات السوق.

يتم تحديد وقت تقريبي لجهوزية الطلب بعد إتمام عملية الشراء، وقد يختلف هذا الوقت حسب ظروف التشغيل، وتبذل الشركة جهدها للالتزام به، كما توفر خدمة التوصيل داخل دولة الكويت مقابل رسوم محددة قدرها 5 دنانير كويتية، ويتم التوصيل عبر شركات متخصصة في نقل الأموال والذهب، وبمجرد تسليم الشحنة لشركة النقل تنتقل المسؤولية إليها بالكامل، ولا تتحمل الشركة أي مسؤولية عن التأخير أو الأضرار الناتجة عن عملية النقل.

نظرًا لطبيعة المنتجات التي تشمل الذهب والمجوهرات والمعادن الثمينة، لا يُسمح بالاسترجاع أو الاستبدال إلا خلال مدة لا تتجاوز 24 ساعة من تاريخ الشراء، وبشرط وجود عيب مصنعي مثبت، ولا يتم قبول أي طلبات بعد هذه المدة.

جميع المحتويات الموجودة على الموقع، بما في ذلك النصوص والتصاميم والشعارات والعلامات التجارية، هي ملك حصري لشركة Gold Standard، ولا يجوز استخدامها أو إعادة نشرها أو استغلالها بأي شكل دون الحصول على موافقة كتابية مسبقة من الشركة.

لا تضمن الشركة أن يكون الموقع أو الخدمات خالية من الأخطاء أو الانقطاع، ولا تتحمل أي مسؤولية عن أي خسائر قد تنتج عن استخدام الموقع أو عدم القدرة على استخدامه، كما لا تتحمل أي مسؤولية عن التأخير أو عدم تنفيذ الالتزامات في حال وجود ظروف خارجة عن السيطرة مثل الكوارث الطبيعية أو الأحداث القهرية.

تخضع هذه الشروط والأحكام وتُفسر وفقًا لقوانين دولة الكويت، ويكون للمحاكم الكويتية الاختصاص الكامل في الفصل بأي نزاع ينشأ عنها، وفي حال اعتبار أي بند من هذه الشروط غير صالح أو غير قابل للتنفيذ، فإن ذلك لا يؤثر على بقية البنود.

لأي استفسارات أو ملاحظات، يمكنكم التواصل مع خدمة العملاء عبر الرقم 220950001، ويُعد استخدامك للموقع أو التطبيق موافقة صريحة على جميع ما ورد في هذه الشروط والأحكام، مع احتفاظ الشركة بحق تعديلها في أي وقت دون إشعار مسبق.`

function pickLang(lang: string | undefined): 'en' | 'ar' {
  return lang?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

function splitWhatsAppBlock(raw: string): { title: string; text: string } {
  const nl = raw.indexOf('\n')
  if (nl === -1) return { title: '', text: raw.trim() }
  return { title: raw.slice(0, nl).trim(), text: raw.slice(nl + 1).trim() }
}

function buildEnglishClauses(): NumberedClause[] {
  const parts = TERMS_EN.trim().split(/\n\n+/)
  if (parts.length !== 13) {
    throw new Error(`TERMS_EN: expected 13 paragraphs, got ${parts.length}`)
  }
  const w = splitWhatsAppBlock(WHATSAPP_META_EN)
  return [
    ...parts.slice(0, 11).map((text) => ({ text })),
    { title: w.title, text: w.text },
    { text: parts[11] },
    { text: parts[12] },
  ]
}

function buildArabicClauses(): NumberedClause[] {
  const parts = TERMS_AR.trim().split(/\n\n+/)
  if (parts.length !== 14) {
    throw new Error(`TERMS_AR: expected 14 paragraphs (title split), got ${parts.length}`)
  }
  const merged = [parts[0] + '\n\n' + parts[1], ...parts.slice(2)]
  if (merged.length !== 13) {
    throw new Error(`TERMS_AR: merged length expected 13, got ${merged.length}`)
  }
  const w = splitWhatsAppBlock(WHATSAPP_META_AR)
  return [
    ...merged.slice(0, 11).map((text) => ({ text })),
    { title: w.title, text: w.text },
    { text: merged[11] },
    { text: merged[12] },
  ]
}

const clausesByLang: Record<'en' | 'ar', NumberedClause[]> = {
  en: buildEnglishClauses(),
  ar: buildArabicClauses(),
}

export function getCombinedLegalClauses(lang: string | undefined): NumberedClause[] {
  return clausesByLang[pickLang(lang)]
}
