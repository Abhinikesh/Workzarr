/**
 * Utility to export JSON data to CSV
 */
export const exportToCSV = (data, filename, columns) => {
  if (!data || !data.length) return;

  const header = columns.map(col => col.label).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      
      // Handle nested objects if key contains dot
      if (col.key.includes('.')) {
        val = col.key.split('.').reduce((obj, k) => (obj ? obj[k] : ''), row);
      }

      // Escape quotes and wrap in quotes
      const cell = val === null || val === undefined ? '' : String(val).replace(/"/g, '""');
      return \`"\${cell}"\`;
    }).join(',');
  });

  const csvContent = [header, ...rows].join('\\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', \`\${filename}_\${new Date().toISOString().split('T')[0]}.csv\`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
