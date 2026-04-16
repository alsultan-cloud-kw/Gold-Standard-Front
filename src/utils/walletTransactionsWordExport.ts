import {
  Document,
  HeadingLevel,
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
}): Promise<Blob> {
  const rtl = params.isRtl

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

  const doc = new Document({
    creator: 'Gold Standard',
    title: params.documentTitle,
    sections: [
      {
        children: [
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
