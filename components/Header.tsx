import { createClient } from "@/lib/supabase/server";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Header() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const signOut = async () => {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/login");
    };

    return (
        <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">IMPOSTOR</span>
                </Link>

                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
                                <UserIcon className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">{user.email?.split("@")[0]}</span>
                            </div>
                            <form action={signOut}>
                                <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white" title="Sign Out">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
