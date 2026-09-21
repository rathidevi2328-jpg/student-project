import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportRow {
  studentName: string;
  registerNumber: string;
  subjectName: string;
  className?: string;
  totalClasses: number;
  present: number;
  absent: number;
  late?: number;
  percentage: number;
  statusRisk?: string;
}

/**
 * Exports data array to a standard CSV file and triggers client-side download
 */
export function exportToCSV(filename: string, rows: ReportRow[]): void {
  const headers = [
    'Student Name',
    'Register Number',
    'Subject',
    'Class',
    'Total Classes',
    'Present',
    'Absent',
    'Late',
    'Attendance %',
    'Status Risk',
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      [
        `"${(row.studentName || '').replace(/"/g, '""')}"`,
        `"${(row.registerNumber || '').replace(/"/g, '""')}"`,
        `"${(row.subjectName || '').replace(/"/g, '""')}"`,
        `"${(row.className || 'N/A').replace(/"/g, '""')}"`,
        row.totalClasses,
        row.present,
        row.absent,
        row.late || 0,
        `${row.percentage}%`,
        `"${row.statusRisk || (row.percentage >= 75 ? 'Satisfactory' : 'Low Attendance')}"`,
      ].join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/i, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a clean, professional PDF report for college attendance
 */
export function exportToPDF(
  title: string,
  subtitle: string,
  rows: ReportRow[]
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Header branding
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 595.28, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SmartAttend – Student Attendance Report', 40, 36);

  // Subtitle / Filters
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 85);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 40, 102);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Minimum Threshold: 75%`, 40, 118);

  // AutoTable data
  const tableData = rows.map((r, idx) => [
    idx + 1,
    r.studentName,
    r.registerNumber,
    r.subjectName,
    r.totalClasses,
    r.present,
    r.absent,
    `${r.percentage}%`,
    r.percentage >= 75 ? 'Pass' : 'Low (<75%)',
  ]);

  autoTable(doc, {
    startY: 135,
    head: [
      [
        '#',
        'Student Name',
        'Reg No',
        'Subject',
        'Total',
        'Present',
        'Absent',
        'Att %',
        'Status',
      ],
    ],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    didParseCell: (data) => {
      // Highlight row if attendance < 75%
      if (data.section === 'body' && data.column.index === 7) {
        const val = parseFloat(String(data.cell.raw));
        if (val < 75) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose 600
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald 500
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 40, right: 40 },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount} — SmartAttend Management System`,
      40,
      820
    );
  }

  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
