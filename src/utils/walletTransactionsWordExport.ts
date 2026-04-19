import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlignTable,
  WidthType,
} from 'docx'

export type WalletTransactionWordRow = {
  date: string
  type: string
  description: string
  amount: string
  balance: string
  reference: string
}

/** Contact / branding block shown above the statement title (matches site footer). */
export type WalletWordBrandHeader = {
  companyName: string
  tagline: string
  websiteLabel: string
  websiteUrl: string
  address: string
  phone: string
  email: string
  hours: string
}

async function loadBundledLogoPng(): Promise<Uint8Array | null> {
  try {
    const href = new URL('../assets/logo.png', import.meta.url).href
    const res = await fetch(href)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

export async function buildWalletTransactionsDocxBlob(params: {
  documentTitle: string
  periodLabel: string
  periodValue: string
  generatedLabel: string
  generatedValue: string
  rowCountLabel: string
  rowCountValue: string
  headers: [string, string, string, string, string, string]
  rows: WalletTransactionWordRow[]
  isRtl: boolean
  brand: WalletWordBrandHeader
}): Promise<Blob> {
  const rtl = params.isRtl
  const logoBytes = await loadBundledLogoPng()

  const textRun = (text: string, bold = false) =>
    new TextRun({
      text,
      bold,
      rightToLeft: rtl,
      font: rtl ? 'Arial' : undefined,
    })

  const metaParagraph = (label: string, value: string) =>
    new Paragraph({
      bidirectional: rtl,
      spacing: { after: 100 },
      children: [textRun(`${label}: `, true), textRun(value)],
    })

  const cell = (text: string, header: boolean) =>
    new TableCell({
      shading: header ? { fill: 'E7E6E6' } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      verticalAlign: VerticalAlignTable.CENTER,
      children: [
        new Paragraph({
          bidirectional: rtl,
          children: [textRun(text, header)],
        }),
      ],
    })

  const headerRow = new TableRow({
    tableHeader: true,
    children: params.headers.map((h) => cell(h, true)),
  })

  const bodyRows = params.rows.map(
    (r) =>
      new TableRow({
        children: [
          cell(r.date, false),
          cell(r.type, false),
          cell(r.description, false),
          cell(r.amount, false),
          cell(r.balance, false),
          cell(r.reference, false),
        ],
      }),
  )

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [1800, 1500, 3000, 1400, 1400, 1200],
    visuallyRightToLeft: rtl,
    rows: [headerRow, ...bodyRows],
  })

  const brand = params.brand
  const brandHeaderChildren: Paragraph[] = []

  if (logoBytes) {
    brandHeaderChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new ImageRun({
            type: 'png',
            data: logoBytes,
            transformation: { width: 200, height: 64 },
          }),
        ],
      }),
    )
  }

  brandHeaderChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: rtl,
      spacing: { after: 80 },
      children: [textRun(brand.companyName, true)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: rtl,
      spacing: { after: 120 },
      children: [textRun(brand.tagline, false)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: rtl,
      spacing: { after: 80 },
      children: [textRun(`${brand.websiteLabel}: ${brand.websiteUrl}`, false)],
    }),
    new Paragraph({
      bidirectional: rtl,
      spacing: { after: 40 },
      children: [textRun(brand.address, false)],
    }),
    new Paragraph({
      bidirectional: rtl,
      spacing: { after: 40 },
      children: [textRun(brand.phone, false)],
    }),
    new Paragraph({
      bidirectional: rtl,
      spacing: { after: 40 },
      children: [textRun(brand.email, false)],
    }),
    new Paragraph({
      bidirectional: rtl,
      spacing: { after: 240 },
      children: [textRun(brand.hours, false)],
    }),
  )

  const doc = new Document({
    creator: brand.companyName,
    title: params.documentTitle,
    sections: [
      {
        children: [
          ...brandHeaderChildren,
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            bidirectional: rtl,
            spacing: { after: 200 },
            children: [textRun(params.documentTitle)],
          }),
          metaParagraph(params.periodLabel, params.periodValue),
          metaParagraph(params.generatedLabel, params.generatedValue),
          metaParagraph(params.rowCountLabel, params.rowCountValue),
          new Paragraph({ text: '', spacing: { after: 160 } }),
          table,
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
