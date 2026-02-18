"use client";

import { createWordPack } from "@/lib/actions/words";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Loader2 } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-50"
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Word Pack"}
        </button>
    );
}

export default function WordsPage() {
    const [message, setMessage] = useState("");

    async function clientAction(formData: FormData) {
        try {
            await createWordPack(formData);
            setMessage("Word pack added successfully!");
            // Reset form by reloading or controlled inputs (simple reload for MVP)
            const form = document.getElementById("word-form") as HTMLFormElement;
            form?.reset();
        } catch (e) {
            setMessage("Error adding word pack.");
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-8 flex flex-col items-center">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h1 className="text-2xl font-bold mb-6 text-purple-400">Add Game Words</h1>

                <form id="word-form" action={clientAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                        <input
                            name="category"
                            required
                            placeholder="e.g. Animals"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Civilian Word</label>
                        <input
                            name="civilian_word"
                            required
                            placeholder="e.g. Dog"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Impostor Word</label>
                        <input
                            name="impostor_word"
                            required
                            placeholder="e.g. Cat"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    {message && (
                        <p className={`text-sm text-center ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                            {message}
                        </p>
                    )}

                    <SubmitButton />
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                    <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">Back to Home</a>
                </div>
            </div>
        </div>
    );
}
