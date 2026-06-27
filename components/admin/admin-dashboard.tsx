"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, LogOut, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { logoutAction, reorderMixesAction } from "@/app/vbm-admin/actions";
import { CoverArt } from "@/components/catalog/cover-art";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Mix } from "@/lib/catalog/schema";
import { formatTime } from "@/lib/format";

import { DeleteMixButton } from "./delete-mix-button";

export function AdminDashboard({ mixes }: { mixes: Mix[] }) {
  const [pending, startTransition] = React.useTransition();

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= mixes.length) return;
    const ids = mixes.map((m) => m.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    startTransition(async () => {
      try {
        await reorderMixesAction(ids);
      } catch {
        toast.error("could not reorder");
      }
    });
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-3 pt-6 pb-28 sm:px-4">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="terminal-caret font-mono text-lg font-semibold lowercase">
            admin
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {mixes.length} mix{mixes.length === 1 ? "" : "es"} in the crate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            view site
          </Link>
          <Link href="/vbm-admin/new" className={buttonVariants({ size: "sm" })}>
            <Plus /> add mix
          </Link>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Log out"
            >
              <LogOut />
            </Button>
          </form>
        </div>
      </header>

      {mixes.length === 0 ? (
        <div className="border border-dashed py-16 text-center font-mono text-sm text-muted-foreground">
          no mixes yet. add the first one.
        </div>
      ) : (
        <div className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>mix</TableHead>
                <TableHead className="hidden sm:table-cell">tags</TableHead>
                <TableHead className="w-16 text-right">len</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mixes.map((mix, index) => (
                <TableRow key={mix.id}>
                  <TableCell>
                    <span className="flex size-9 items-center justify-center overflow-hidden border">
                      <CoverArt src={mix.coverUrl || undefined} />
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{mix.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {mix.artist || "–"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[16rem] align-top sm:table-cell">
                    {mix.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {mix.tags.map((tag) => (
                          <span
                            key={tag}
                            className="border px-1 font-mono text-[10px] lowercase text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        –
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {mix.durationSec ? formatTime(mix.durationSec) : "··:··"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move up"
                        disabled={index === 0 || pending}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move down"
                        disabled={index === mixes.length - 1 || pending}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Link
                        href={`/vbm-admin/${mix.id}/edit`}
                        aria-label={`Edit ${mix.title}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <Pencil />
                      </Link>
                      <DeleteMixButton id={mix.id} title={mix.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
