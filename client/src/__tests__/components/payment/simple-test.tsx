import { render } from '@testing-library/react'

describe('Simple Test', () => {
  it('should work', () => {
    const { container } = render(<div data-testid="test">Hello</div>)
    expect(container).toBeTruthy()
  })
})