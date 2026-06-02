/**
 * Utilidades para exportar datos a CSV
 */

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  // Obtener las columnas del primer objeto
  const columns = Object.keys(data[0])

  // Crear el encabezado CSV
  const header = columns.map(col => `"${col}"`).join(';')

  // Crear las filas CSV
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col]
      if (value === null || value === undefined) return '""'
      
      let stringValue = ''
      if (typeof value === 'number') {
        // Reemplazar punto por coma para decimales en Excel (español)
        stringValue = String(value).replace('.', ',')
      } else {
        stringValue = String(value)
      }
      
      // Escapar comillas y envolver en comillas
      stringValue = stringValue.replace(/"/g, '""')
      return `"${stringValue}"`
    }).join(';')
  })

  // Combinar header y rows
  const csvContent = [header, ...rows].join('\n')

  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function exportTableToCSV(
  data: Record<string, unknown>[],
  columns: Array<{ key: string; label: string }>,
  filename: string
): void {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  // Crear el encabezado CSV con las etiquetas de las columnas
  const header = columns.map(col => `"${col.label}"`).join(';')

  // Crear las filas CSV usando las keys de las columnas
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      if (value === null || value === undefined) return '""'
      
      let stringValue = ''
      if (typeof value === 'number') {
        // Reemplazar punto por coma para decimales en Excel (español)
        stringValue = String(value).replace('.', ',')
      } else {
        stringValue = String(value)
      }
      
      // Escapar comillas y envolver en comillas
      stringValue = stringValue.replace(/"/g, '""')
      return `"${stringValue}"`
    }).join(';')
  })

  // Combinar header y rows
  const csvContent = [header, ...rows].join('\n')

  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

