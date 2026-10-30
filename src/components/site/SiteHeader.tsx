import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, X, LogOut, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import { getMyRoles, signOutEverywhere } from "@/lib/account-data";
import { fetchInbox } from "@/lib/enquiries";
import { supabase } from "@/integrations/supabase/client";

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span aria-label={`${count} unread messages`} className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
      {count}
    </span>
  );
}
import logoUrl from "@/assets/logo.png";

export const navLinks = [
  { label: "Find Tutors", href: "/tutors" },
  { label: "Learning Materials", href: "/#materials" },
  { label: "Freelancers", href: "/freelancers" },
  { label: "Membership", href: "/membership" },
];

export function Logo() {
  return (
    <a href="/" aria-label="PUPUK Academy home" className="flex items-center">
      <img src={logoUrl} alt="PUPUK Academy" className="h-8 w-auto sm:h-9" />
    </a>
  );
}

function useAccountNav() {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const rolesQuery = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => getMyRoles(user!.id),
    enabled: !!user,
  });
  const roles = rolesQuery.data ?? [];

  const unreadQuery = useQuery({
    queryKey: ["inbox", "header-unread", user?.id, roles.join(",")],
    enabled: !!user && roles.length > 0,
    refetchInterval: 30000,
    queryFn: async () => {
      const out = { student: 0, teacher: 0 };
      if (roles.includes("student")) out.student = (await fetchInbox(user!.id, "student")).filter((t) => t.unread).length;
      if (roles.includes("teacher")) {
        const { data: tp } = await supabase.from("teacher_profiles").select("id").eq("user_id", user!.id).maybeSingle();
        if (tp) out.teacher = (await fetchInbox(user!.id, "teacher", tp.id)).filter((t) => t.unread).length;
      }
      return out;
    },
  });
  const unread = unreadQuery.data ?? { student: 0, teacher: 0 };

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutEverywhere();
    navigate({ to: "/auth", replace: true });
  }

  return { user, loading, roles, signOut, unread };
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading, roles, signOut, unread } = useAccountNav();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {loading ? null : user ? (
            <>
              {roles.includes("student") && (
                <Button variant="ghost" className="rounded-full font-semibold" asChild>
                  <Link to="/account/student">
                    <GraduationCap /> Student area <UnreadBadge count={unread.student} />
                  </Link>
                </Button>
              )}
              {roles.includes("teacher") && (
                <Button variant="ghost" className="rounded-full font-semibold" asChild>
                  <Link to="/account/teacher">
                    <BookOpen /> Teacher dashboard <UnreadBadge count={unread.teacher} />
                  </Link>
                </Button>
              )}
              {(roles as string[]).includes("admin") && (
                <Button variant="ghost" className="rounded-full font-semibold" asChild>
                  <Link to="/account/admin">Approvals</Link>
                </Button>
              )}
              <Button variant="pill-outline" className="font-semibold" onClick={signOut}>
                <LogOut /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full font-semibold" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button variant="pill" className="font-semibold" asChild>
                <Link to="/auth">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
        <button className="rounded-full p-2 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-2 lg:hidden">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-semibold hover:bg-secondary">
              {l.label}
            </a>
          ))}
          {!loading &&
            (user ? (
              <div className="mt-3 space-y-2">
                {roles.includes("student") && (
                  <Button variant="pill-outline" className="w-full" asChild>
                    <Link to="/account/student" onClick={() => setOpen(false)}>
                      <GraduationCap /> Student area <UnreadBadge count={unread.student} />
                    </Link>
                  </Button>
                )}
                {roles.includes("teacher") && (
                  <Button variant="pill-outline" className="w-full" asChild>
                    <Link to="/account/teacher" onClick={() => setOpen(false)}>
                      <BookOpen /> Teacher dashboard <UnreadBadge count={unread.teacher} />
                    </Link>
                  </Button>
                )}
                <Button variant="pill" className="w-full" onClick={signOut}>
                  <LogOut /> Sign out
                </Button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="pill-outline" asChild>
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button variant="pill" asChild>
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            ))}
        </div>
      )}
    </header>
  );
}
