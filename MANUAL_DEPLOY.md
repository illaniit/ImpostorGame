# Deploying Manually via Vercel CLI

If the automatic GitHub deployment is stuck or failing to trigger, you can deploy directly from your computer.

1.  **Open Terminal** in this folder (`c:\Users\illan\Desktop\ProyectoImpostor`).
2.  Run the command:
    ```bash
    npx vercel --prod
    ```
3.  Follow the prompts:
    - If asked to log in, follow the link.
    - If asked to link to an existing project, say **Y** (Yes).
    - Select the scope (likely your username).
    - Select the existing project `impostor-game` (or similar).

This bypasses GitHub and uploads your local code directly. Since your local code is fixed (we verified it thoroughly), this should succeed.

**Important:** Ensure your Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.) are set correctly in the Vercel Project Settings on the website!
