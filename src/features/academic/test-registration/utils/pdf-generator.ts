import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { DateTime } from 'luxon'

// Register fonts
;(pdfMake as any).vfs = pdfFonts.vfs

type TestRegistrationData = {
  student: {
    name: string
    dormitory: {
      name: string
    } | null
  }
  sks: {
    name: string
  }
  scheduledAt: Date | null
  status: string
  test: {
    score: number
  } | null
}

export const generateTestRegistrationPdf = (data: TestRegistrationData[], date: Date) => {
  const formattedDate = DateTime.fromJSDate(date).setLocale('id').toLocaleString(DateTime.DATE_FULL)

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content: [
      // Header
      {
        text: 'PONDOK PESANTREN SIGAP',
        style: 'header',
        alignment: 'center',
      },
      {
        text: 'Alamat: Jl. Pesantren No. 1, Kota Santri',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 10],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }],
      },

      // Title
      {
        text: 'PENGUMUMAN HASIL TES',
        style: 'title',
        alignment: 'center',
        margin: [0, 20, 0, 5],
      },
      {
        text: `Tanggal: ${formattedDate}`,
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },

      // Table
      {
        table: {
          headerRows: 1,
          widths: [20, '*', 80, 80, 80, 40, 60],
          body: [
            // Table Header
            [
              { text: 'No', style: 'tableHeader' },
              { text: 'Nama Santri', style: 'tableHeader' },
              { text: 'Asrama', style: 'tableHeader' },
              { text: 'SKS', style: 'tableHeader' },
              { text: 'Jadwal', style: 'tableHeader' },
              { text: 'Nilai', style: 'tableHeader' },
              { text: 'Status', style: 'tableHeader' },
            ],
            // Table Body
            ...data.map((row, index) => [
              { text: index + 1, alignment: 'center' },
              row.student.name,
              row.student.dormitory?.name || '-',
              row.sks.name,
              row.scheduledAt
                ? DateTime.fromJSDate(new Date(row.scheduledAt)).setLocale('id').toFormat('dd-MM-yyyy')
                : '-',
              { text: row.test?.score || 0, alignment: 'center' },
              {
                text: row.status === 'COMPLETED' ? 'Lulus' : 'Her',
                alignment: 'center',
                color: row.status === 'COMPLETED' ? 'green' : 'red',
              },
            ]),
          ],
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return rowIndex === 0 ? '#f3f4f6' : null
          },
        },
      },

      // Signature Section
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            stack: [
              `Kota Santri, ${formattedDate}`,
              'Bagian Pengajaran',
              '\n\n\n\n',
              '( ....................................... )',
            ],
            alignment: 'center',
            margin: [0, 50, 0, 0],
          },
        ],
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      subheader: {
        fontSize: 10,
        color: 'gray',
      },
      title: {
        fontSize: 14,
        bold: true,
        decoration: 'underline',
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
        fillColor: '#f3f4f6',
        alignment: 'center',
      },
    },
    defaultStyle: {
      fontSize: 10,
    },
  }

  // Generate and open PDF
  pdfMake.createPdf(docDefinition).open()
}
