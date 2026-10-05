import { redirect } from "next/navigation";

// The home address "/" has nothing of its own: send people to the Food tab.
export default function Home() {
  redirect("/food");
}
