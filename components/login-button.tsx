'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconSpinner, IconGoogle } from '@/components/ui/icons'

interface LoginButtonProps extends ButtonProps {
  provider: 'github' | 'google'
  isLoading?: boolean
}

export function LoginButton({
  provider,
  isLoading = false,
  className,
  ...props
}: LoginButtonProps) {
  const text = `Login with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`

  const Icon = provider === 'github' ? IconGitHub : IconGoogle;

  return (
    <Button
      variant="outline"
      onClick={() => {
        // Your setIsLoading might be handled outside this component, or you can add state here.
        // setIsLoading(true) 
        signIn(provider, { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : (
        <Icon className="mr-2" />
      )}
      {text}
    </Button>
  )
}
