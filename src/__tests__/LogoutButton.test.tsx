import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LogoutButton from '@/components/LogoutButton'

// fetch is called on click — stub it so the test doesn't make real requests
global.fetch = vi.fn().mockResolvedValue({ ok: true })

describe('LogoutButton', () => {
  it('renders a button with the text Odhlásit', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /odhlásit/i })).toBeInTheDocument()
  })
})
