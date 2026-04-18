function escapePdfText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
}

export function buildSimplePdfDocument(params: {
    title: string
    subtitle?: string | null
    lines: string[]
}) {
    const contentLines: string[] = [
        'BT',
        '/F1 20 Tf',
        '50 760 Td',
        `(${escapePdfText(params.title)}) Tj`,
    ]

    if (params.subtitle) {
        contentLines.push('0 -24 Td')
        contentLines.push('/F1 11 Tf')
        contentLines.push(`(${escapePdfText(params.subtitle)}) Tj`)
    } else {
        contentLines.push('/F1 11 Tf')
    }

    params.lines.slice(0, 40).forEach((line) => {
        if (!line.trim()) {
            contentLines.push('0 -10 Td')
            return
        }

        contentLines.push('0 -16 Td')
        contentLines.push(`(${escapePdfText(line)}) Tj`)
    })

    contentLines.push('ET')

    const content = contentLines.join('\n')
    const objects = [
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
        '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        `5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream\nendobj`,
    ]

    let pdf = '%PDF-1.4\n'
    const offsets = [0]

    objects.forEach((object) => {
        offsets.push(Buffer.byteLength(pdf, 'utf8'))
        pdf += `${object}\n`
    })

    const xrefOffset = Buffer.byteLength(pdf, 'utf8')
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += '0000000000 65535 f \n'
    offsets.slice(1).forEach((offset) => {
        pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
    })
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`
    pdf += `startxref\n${xrefOffset}\n%%EOF`

    return Buffer.from(pdf, 'utf8')
}
