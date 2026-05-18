import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, TableRow, TableCell } from '../components/Table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'

describe('Table — renderizado', () => {
  it('muestra los headers', () => {
    render(
      <Table headers={['Nombre', 'Estado', 'Total']}>
        <></>
      </Table>
    )
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('renderiza children en el tbody', () => {
    render(
      <Table headers={['Col']}>
        <TableRow>
          <TableCell>Fila 1</TableCell>
        </TableRow>
      </Table>
    )
    expect(screen.getByText('Fila 1')).toBeInTheDocument()
  })

  it('TableCell acepta colSpan', () => {
    const { container } = render(
      <Table headers={['A', 'B']}>
        <TableRow>
          <TableCell colSpan={2}>Celdas fusionadas</TableCell>
        </TableRow>
      </Table>
    )
    const td = container.querySelector('td[colspan="2"]')
    expect(td).toBeInTheDocument()
  })

  it('TableRow acepta className personalizada', () => {
    const { container } = render(
      <Table headers={['Col']}>
        <TableRow className="bg-red-500">
          <TableCell>dato</TableCell>
        </TableRow>
      </Table>
    )
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
  })
})

describe('Card — sub-componentes', () => {
  it('Card renderiza children', () => {
    render(<Card>Contenido</Card>)
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('CardHeader acepta className', () => {
    const { container } = render(<CardHeader className="custom-header">H</CardHeader>)
    expect(container.querySelector('.custom-header')).toBeInTheDocument()
  })

  it('CardTitle renderiza texto', () => {
    render(<CardTitle>Mi Título</CardTitle>)
    expect(screen.getByText('Mi Título')).toBeInTheDocument()
  })

  it('CardDescription renderiza texto', () => {
    render(<CardDescription>Una descripción</CardDescription>)
    expect(screen.getByText('Una descripción')).toBeInTheDocument()
  })

  it('CardContent renderiza children', () => {
    render(<CardContent><p>Cuerpo</p></CardContent>)
    expect(screen.getByText('Cuerpo')).toBeInTheDocument()
  })

  it('CardFooter renderiza children', () => {
    render(<CardFooter><button>OK</button></CardFooter>)
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  })
})
