import { WelcomeForm } from "@/components/Account";

export const metadata = { title: "Welcome · perpy" };

// New members land here right after signing up to pick their @handle.
export default async function Welcome({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  return (
    <div className="learn-h" style={{ maxWidth: 520, margin: "20px auto" }}>
      <small className="kick">{edit ? "EDIT PLAYER" : "NEW PLAYER"}</small>
      <h1>{edit ? <>EDIT <em>PROFILE</em></> : <>CHOOSE YOUR <em>NAME</em></>}</h1>
      <p>{edit ? "Change how you show up in the Pit." : "This is how you'll show up in the Pit. Your wallet was created for you, and only you control it."}</p>
      <div style={{ marginTop: 22 }}><WelcomeForm edit={!!edit} /></div>
    </div>
  );
}
