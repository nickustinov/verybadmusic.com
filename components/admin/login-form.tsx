"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="terminal-caret lowercase">admin</CardTitle>
        <CardDescription className="font-mono">
          restricted area. sign in to manage the crate.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <input type="hidden" name="from" value={from} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error ? (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Spinner /> : null}
            sign in
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
