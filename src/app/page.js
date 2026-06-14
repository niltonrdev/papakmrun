import { redirect } from "next/navigation";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const code = params?.code;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(String(code))}`);
  }
  redirect("/login");
}
