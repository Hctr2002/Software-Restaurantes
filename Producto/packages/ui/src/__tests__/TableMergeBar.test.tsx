import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TableMergeBar } from '../components/terminal/TableMergeBar'

const defaultProps = {
  mergeMode: false,
  selectedCount: 0,
  merging: false,
  mergeResult: null,
  onToggleMode: vi.fn(),
  onConfirmMerge: vi.fn(),
}

describe('TableMergeBar — modo inactivo', () => {
  it('no muestra botón de fusión cuando mergeMode=false', () => {
    render(<TableMergeBar {...defaultProps} />)
    expect(screen.queryByText(/Fusionar/)).not.toBeInTheDocument()
  })

  it('no muestra resultado cuando mergeResult es null', () => {
    render(<TableMergeBar {...defaultProps} />)
    expect(screen.queryByText(/fusionado/i)).not.toBeInTheDocument()
  })
})

describe('TableMergeBar — modo fusión activo', () => {
  it('muestra botón de fusión cuando mergeMode=true y selectedCount>=2', () => {
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={2} />)
    expect(screen.getByText(/Fusionar 2 mesas seleccionadas/i)).toBeInTheDocument()
  })

  it('no muestra botón de fusión con menos de 2 mesas', () => {
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={1} />)
    expect(screen.queryByText(/Fusionar/)).not.toBeInTheDocument()
  })

  it('muestra "Mesas ya fusionadas" cuando isAlreadyMerged=true', () => {
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={2} isAlreadyMerged />)
    expect(screen.getByText('Mesas ya fusionadas')).toBeInTheDocument()
  })

  it('deshabilita el botón cuando merging=true', () => {
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={2} merging />)
    const btn = screen.getByText(/Fusionar/i).closest('button') as HTMLButtonElement
    expect(btn).toBeDisabled()
  })

  it('muestra botón desvincular cuando canUnlink=true y selectedCount=1', () => {
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={1} canUnlink />)
    expect(screen.getByText(/Desvincular/i)).toBeInTheDocument()
  })
})

describe('TableMergeBar — resultados', () => {
  it('muestra el resultado de fusión cuando mergeResult tiene valor', () => {
    render(<TableMergeBar {...defaultProps} mergeResult="Mesas fusionadas correctamente" />)
    expect(screen.getByText('Mesas fusionadas correctamente')).toBeInTheDocument()
  })
})

describe('TableMergeBar — callbacks', () => {
  it('llama onConfirmMerge al hacer clic en Fusionar', () => {
    const onConfirmMerge = vi.fn()
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={2} onConfirmMerge={onConfirmMerge} />)
    fireEvent.click(screen.getByText(/Fusionar 2 mesas seleccionadas/i))
    expect(onConfirmMerge).toHaveBeenCalledTimes(1)
  })

  it('llama onConfirmUnlink al hacer clic en Desvincular', () => {
    const onConfirmUnlink = vi.fn()
    render(<TableMergeBar {...defaultProps} mergeMode selectedCount={1} canUnlink onConfirmUnlink={onConfirmUnlink} />)
    fireEvent.click(screen.getByText(/Desvincular/i))
    expect(onConfirmUnlink).toHaveBeenCalledTimes(1)
  })
})
