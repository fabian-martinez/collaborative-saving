import { ref, type Ref } from 'vue'
import type { Member } from '@/api/members.api'

export function usePrintReceipt(
  selectedMember: Ref<Member | null>,
  viewedOperations: Ref<any[] | null>
) {
  const isPrintModalOpen = ref(false)

  function openPrintModal() {
    isPrintModalOpen.value = true
  }

  function closePrintModal() {
    isPrintModalOpen.value = false
  }

  function printReceipt() {
    if (!selectedMember.value) return

    const receiptElement = document.getElementById('payment-receipt-print-modal')
    if (!receiptElement) return

    const currentDate = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const originalTitle = document.title
    const memberName = selectedMember.value.name.replace(/\s+/g, '_')
    document.title = `Recibo_${memberName}_${currentDate.replace(/\//g, '-')}`

    // Limpiar cualquier contenedor de impresión previo
    const existingContainer = document.getElementById(
      'payment-receipt-print-container'
    )
    if (existingContainer) {
      existingContainer.remove()
    }

    // Crear contenedor temporal para impresión
    const printContainer = document.createElement('div')
    printContainer.id = 'payment-receipt-print-container'
    printContainer.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      min-height: 100vh;
      background: white;
      z-index: 9999;
      visibility: hidden;
    `

    // Clonar el elemento del recibo con todo su contenido (deep clone)
    const clonedReceipt = receiptElement.cloneNode(true) as HTMLElement
    clonedReceipt.id = 'payment-receipt-print'

    // Aplicar estilos directamente al clon
    clonedReceipt.style.cssText = `
      position: relative;
      left: auto;
      top: auto;
      transform: none;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 30px;
      background: white;
      box-shadow: none;
      visibility: visible;
      display: block;
      color: #000;
    `

    // Asegurar que todos los elementos hijos sean visibles y tengan estilos correctos
    const allElements = clonedReceipt.querySelectorAll('*')
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const computedStyle = window.getComputedStyle(el as Element)

      // Si el elemento está oculto, hacerlo visible
      if (
        computedStyle.display === 'none' &&
        !htmlEl.classList.contains('no-print')
      ) {
        htmlEl.style.display = ''
      }
      if (
        computedStyle.visibility === 'hidden' &&
        !htmlEl.classList.contains('no-print')
      ) {
        htmlEl.style.visibility = 'visible'
      }

      // Asegurar que los elementos tengan color
      if (
        computedStyle.color === 'rgba(0, 0, 0, 0)' ||
        computedStyle.color === 'transparent'
      ) {
        htmlEl.style.color = '#000'
      }
    })

    printContainer.appendChild(clonedReceipt)
    document.body.appendChild(printContainer)

    // Forzar renderizado completo antes de imprimir
    void printContainer.offsetHeight
    void clonedReceipt.offsetHeight

    // Asegurar que el contenedor tenga contenido visible
    const hasContent =
      clonedReceipt.textContent &&
      clonedReceipt.textContent.trim().length > 0
    if (!hasContent) {
      console.warn('El recibo está vacío, no se puede imprimir')
      printContainer.remove()
      document.title = originalTitle
      return
    }

    // Hacer el contenedor visible solo para impresión
    printContainer.style.visibility = 'visible'
    printContainer.style.position = 'absolute'
    printContainer.style.top = '0'
    printContainer.style.left = '0'

    // Esperar a que el navegador renderice completamente antes de imprimir
    setTimeout(() => {
      // Forzar otro renderizado
      void printContainer.offsetHeight

      window.print()

      // Limpiar después de imprimir
      setTimeout(() => {
        if (printContainer.parentNode) {
          printContainer.parentNode.removeChild(printContainer)
        }
        document.title = originalTitle
      }, 100)
    }, 200)
  }

  return {
    isPrintModalOpen,
    openPrintModal,
    closePrintModal,
    printReceipt,
  }
}

